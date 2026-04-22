import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { MidtransService } from './midtrans.service';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('BillingService - Midtrans Sandbox E2E', () => {
  let service: BillingService;
  let prisma: PrismaService;
  let midtrans: MidtransService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        MidtransService,
        PrismaService,
        ConfigService,
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);
    midtrans = module.get<MidtransService>(MidtransService);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('Checkout Flow', () => {
    it('should create Snap token for paid plan', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          fullName: 'Test User',
          password: 'hashed',
          role: 'user',
          plan: 'free',
        },
      });

      const result = await service.checkout(user.id, 'starter', 'monthly');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('redirect_url');
      expect(result.token).toBeTruthy();

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should activate free plan without Snap token', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-free-${Date.now()}@example.com`,
          fullName: 'Free User',
          password: 'hashed',
          role: 'user',
          plan: 'free',
        },
      });

      const result = await service.checkout(user.id, 'free', 'monthly');

      expect(result.free).toBe(true);
      expect(result.token).toBeNull();

      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      expect(subscription?.status).toBe('active');
      expect(subscription?.plan).toBe('free');

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Webhook Handler', () => {
    let testUser: any;
    let testInvoice: any;
    let testSubscription: any;

    beforeEach(async () => {
      // Setup test data
      testUser = await prisma.user.create({
        data: {
          email: `webhook-test-${Date.now()}@example.com`,
          fullName: 'Webhook Test',
          password: 'hashed',
          role: 'user',
          plan: 'free',
        },
      });

      testSubscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          billingCycle: 'monthly',
          status: 'pending',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        },
      });

      testInvoice = await prisma.invoice.create({
        data: {
          userId: testUser.id,
          subscriptionId: testSubscription.id,
          amount: 99000,
          status: 'pending',
          midtransTransactionId: `TEST-ORDER-${Date.now()}`,
        },
      });
    });

    afterEach(async () => {
      // Cleanup
      await prisma.invoice.deleteMany({ where: { userId: testUser.id } });
      await prisma.subscription.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    });

    it('should handle settlement webhook and upgrade user plan', async () => {
      const payload = {
        order_id: testInvoice.midtransTransactionId,
        status_code: '200',
        gross_amount: '99000.00',
        transaction_status: 'settlement',
        signature_key: midtrans.verifySignature(
          testInvoice.midtransTransactionId,
          '200',
          '99000.00',
          'dummy', // Will be replaced by actual hash
        )
          ? 'valid-signature'
          : 'invalid',
      };

      // Mock signature verification
      jest.spyOn(midtrans, 'verifySignature').mockReturnValue(true);

      const result = await service.handleWebhook(payload);

      expect(result).toBe(true);

      // Verify invoice updated
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: testInvoice.id },
      });
      expect(updatedInvoice?.status).toBe('paid');
      expect(updatedInvoice?.paidAt).toBeTruthy();

      // Verify subscription upgraded
      const updatedSub = await prisma.subscription.findUnique({
        where: { id: testSubscription.id },
      });
      expect(updatedSub?.status).toBe('active');
      expect(updatedSub?.plan).toBe('starter');

      // Verify user plan updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(updatedUser?.plan).toBe('starter');
    });

    it('should handle cancel webhook and mark invoice as failed', async () => {
      const payload = {
        order_id: testInvoice.midtransTransactionId,
        status_code: '200',
        gross_amount: '99000.00',
        transaction_status: 'cancel',
        signature_key: 'valid',
      };

      jest.spyOn(midtrans, 'verifySignature').mockReturnValue(true);

      const result = await service.handleWebhook(payload);

      expect(result).toBe(true);

      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: testInvoice.id },
      });
      expect(updatedInvoice?.status).toBe('failed');
    });

    it('should handle expire webhook', async () => {
      const payload = {
        order_id: testInvoice.midtransTransactionId,
        status_code: '407',
        gross_amount: '99000.00',
        transaction_status: 'expire',
        signature_key: 'valid',
      };

      jest.spyOn(midtrans, 'verifySignature').mockReturnValue(true);

      const result = await service.handleWebhook(payload);

      expect(result).toBe(true);

      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: testInvoice.id },
      });
      expect(updatedInvoice?.status).toBe('failed');
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = {
        order_id: testInvoice.midtransTransactionId,
        status_code: '200',
        gross_amount: '99000.00',
        transaction_status: 'settlement',
        signature_key: 'invalid-signature',
      };

      jest.spyOn(midtrans, 'verifySignature').mockReturnValue(false);

      const result = await service.handleWebhook(payload);

      expect(result).toBe(false);

      // Invoice should remain unchanged
      const invoice = await prisma.invoice.findUnique({
        where: { id: testInvoice.id },
      });
      expect(invoice?.status).toBe('pending');
    });

    it('should handle idempotent webhook (already processed)', async () => {
      // First, mark invoice as paid
      await prisma.invoice.update({
        where: { id: testInvoice.id },
        data: { status: 'paid', paidAt: new Date() },
      });

      const payload = {
        order_id: testInvoice.midtransTransactionId,
        status_code: '200',
        gross_amount: '99000.00',
        transaction_status: 'settlement',
        signature_key: 'valid',
      };

      jest.spyOn(midtrans, 'verifySignature').mockReturnValue(true);

      const result = await service.handleWebhook(payload);

      expect(result).toBe(true); // Should return true (idempotent)
    });
  });

  describe('Subscription Cancellation', () => {
    it('should cancel subscription at period end', async () => {
      const user = await prisma.user.create({
        data: {
          email: `cancel-test-${Date.now()}@example.com`,
          fullName: 'Cancel Test',
          password: 'hashed',
          role: 'user',
          plan: 'starter',
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'starter',
          billingCycle: 'monthly',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await service.cancelSubscription(user.id);

      expect(result.success).toBe(true);

      const updatedSub = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });

      expect(updatedSub?.cancelAtPeriodEnd).toBe(true);

      // Cleanup
      await prisma.subscription.delete({ where: { id: subscription.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('Invoice PDF Generation', () => {
    it('should generate PDF for paid invoice', async () => {
      const user = await prisma.user.create({
        data: {
          email: `pdf-test-${Date.now()}@example.com`,
          fullName: 'PDF Test',
          password: 'hashed',
          role: 'user',
          plan: 'starter',
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'starter',
          billingCycle: 'monthly',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        },
      });

      const invoice = await prisma.invoice.create({
        data: {
          userId: user.id,
          subscriptionId: subscription.id,
          amount: 99000,
          status: 'paid',
          paidAt: new Date(),
          midtransTransactionId: `PDF-TEST-${Date.now()}`,
        },
      });

      const pdfBuffer = await service.generateInvoicePdf(invoice.id, user.id);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Cleanup
      await prisma.invoice.delete({ where: { id: invoice.id } });
      await prisma.subscription.delete({ where: { id: subscription.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
