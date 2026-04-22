import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MidtransService } from './midtrans.service';
import { PLANS } from './billing.constants';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly midtrans: MidtransService,
  ) {}

  getPlans() {
    return PLANS;
  }

  async getSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    return sub;
  }

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkout(userId: string, planId: string, billingCycle: 'monthly' | 'annual') {
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) throw new BadRequestException('Plan tidak ditemukan');

    const amount = billingCycle === 'annual' ? plan.price_annual : plan.price_monthly;
    if (amount === 0) {
      // Handle Free plan directly
      await this.activateFreePlan(userId);
      this.logger.log(`[Checkout] User ${userId} activated Free plan`);
      return { token: null, redirect_url: null, free: true };
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    // Create a new subscription record (pending) or update existing
    let subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    
    // In Snap, usually we treat it as order. We will generate order ID.
    const orderId = `ORDER-${userId.substring(0, 5)}-${Date.now()}`;

    let subId = subscription?.id;
    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan: planId,
          billingCycle,
          status: 'pending',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        },
      });
      subId = subscription.id;
    } else {
      // Just temporarily update status or use it for invoice
      subId = subscription.id;
    }

    // Create Invoice Draft
    await this.prisma.invoice.create({
      data: {
        userId,
        subscriptionId: subId,
        amount,
        status: 'pending',
        midtransTransactionId: orderId,
      },
    });

    this.logger.log(`[Checkout] User ${userId} initiated checkout for ${planId} (${billingCycle}) - Order: ${orderId}`);

    // Request Snap Token
    const snapParam = {
      orderId,
      grossAmount: amount,
      customerDetails: {
        firstName: user.fullName,
        email: user.email,
        phone: user.phone || undefined,
      },
      itemDetails: [
        {
          id: planId,
          price: amount,
          quantity: 1,
          name: `LocalCompliance ${plan.name} (${billingCycle})`,
        },
      ],
    };

    try {
      const transaction = await this.midtrans.createSnapToken(snapParam);
      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
      };
    } catch (error) {
      this.logger.error(`[Checkout] Failed to create Snap token for order ${orderId}:`, error);
      throw error;
    }
  }

  private async activateFreePlan(userId: string) {
    const defaultData = {
      plan: 'free',
      billingCycle: 'monthly',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Active for a year
    };
    
    await this.prisma.subscription.upsert({
      where: { userId },
      update: defaultData,
      create: { userId, ...defaultData },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan: 'free' },
    });
  }

  async handleWebhook(payload: any) {
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = payload;
    
    // Validasi Signature
    const isValid = this.midtrans.verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key,
    );

    if (!isValid) {
      this.logger.warn(`[Webhook] Invalid signature for order ${order_id}`);
      return false;
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { midtransTransactionId: order_id },
      include: { subscription: true },
    });

    if (!invoice) {
      this.logger.warn(`[Webhook] Invoice not found for order ${order_id}`);
      return false;
    }

    // Idempotency check: if already processed, skip
    if (invoice.status === 'paid' && (transaction_status === 'settlement' || transaction_status === 'capture')) {
      this.logger.log(`[Webhook] Order ${order_id} already processed (idempotent)`);
      return true;
    }

    if (invoice.status === 'failed' && ['cancel', 'expire', 'deny'].includes(transaction_status)) {
      this.logger.log(`[Webhook] Order ${order_id} already marked as failed (idempotent)`);
      return true;
    }

    try {
      if (
        transaction_status === 'settlement' ||
        transaction_status === 'capture'
      ) {
        // Payment Success!
        await this.prisma.$transaction(async (tx: any) => {
          // Update Invoice
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: 'paid', paidAt: new Date() },
          });

          // Determine next period
          const addDays = invoice.subscription.billingCycle === 'annual' ? 365 : 30;
          const newPeriodEnd = new Date();
          newPeriodEnd.setDate(newPeriodEnd.getDate() + addDays);

          // Find what plan to apply based on gross_amount
          const amountNum = parseFloat(gross_amount);
          let updatedPlan = invoice.subscription.plan;
          
          for (const p of PLANS) {
            if (p.price_monthly === amountNum) {
              updatedPlan = p.id;
              break;
            } else if (p.price_annual === amountNum) {
              updatedPlan = p.id;
              break;
            }
          }

          // Update Subscription
          await tx.subscription.update({
            where: { id: invoice.subscriptionId },
            data: {
              plan: updatedPlan,
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: newPeriodEnd,
              cancelAtPeriodEnd: false, // reset cancel
            },
          });

          // Update User Profile
          await tx.user.update({
            where: { id: invoice.userId },
            data: { plan: updatedPlan },
          });
        });

        this.logger.log(`[Webhook] ✅ Order ${order_id} settled → user ${invoice.userId} upgraded to ${invoice.subscription.plan}`);
      } else if (transaction_status === 'cancel' || transaction_status === 'expire' || transaction_status === 'deny') {
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'failed' },
        });
        this.logger.log(`[Webhook] ❌ Order ${order_id} failed with status: ${transaction_status}`);
      } else if (transaction_status === 'pending') {
        this.logger.log(`[Webhook] ⏳ Order ${order_id} still pending`);
      }

      return true;
    } catch (error) {
      this.logger.error(`[Webhook] Error processing order ${order_id}:`, error);
      // Return false so Midtrans retries
      return false;
    }
  }

  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!sub) throw new NotFoundException('Subscription aktif tidak ditemukan');
    
    // Let UX gracefully degrade
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });
    
    return { success: true, message: 'Plan akan dibatalkan pada akhir periode' };
  }

  async generateInvoicePdf(invoiceId: string, userId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { user: true, subscription: true },
    });

    if (!invoice) throw new NotFoundException('Invoice tidak ditemukan');

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Title
      doc.fontSize(20).text('INVOICE', { align: 'right' });
      doc.fontSize(10).text(`LocalCompliance SaaS`, 50, 50);
      
      doc.moveDown(4);
      doc.fontSize(12).text(`Order ID: ${invoice.midtransTransactionId}`);
      doc.text(`Tanggal: ${invoice.createdAt.toISOString().split('T')[0]}`);
      doc.text(`Status: ${invoice.status.toUpperCase()}`);

      doc.moveDown(2);
      doc.text('Tagihan Kepada:');
      doc.text(invoice.user.fullName);
      doc.text(invoice.user.email);

      doc.moveDown(2);
      doc.rect(50, doc.y, 500, 20).fill('#eeeeee');
      doc.fillColor('#000000');
      doc.text('Deskripsi', 60, doc.y - 15);
      doc.text('Total', 450, doc.y - 15);

      doc.moveDown(1);
      const planName = PLANS.find(p => p.id === invoice.subscription.plan)?.name || 'Paket Berbayar';
      doc.text(`Berlangganan LocalCompliance - ${planName} (${invoice.subscription.billingCycle})`, 60, doc.y);
      doc.text(`Rp ${Number(invoice.amount).toLocaleString('id-ID')}`, 450, doc.y);

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);
      doc.fontSize(14).text(`Total Dibayar: Rp ${Number(invoice.amount).toLocaleString('id-ID')}`, { align: 'right' });

      doc.moveDown(4);
      doc.fontSize(10).fillColor('#666666').text('Terima kasih telah menggunakan LocalCompliance.', { align: 'center' });

      doc.end();
    });
  }
}
