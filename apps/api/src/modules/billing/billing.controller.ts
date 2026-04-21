import { Controller, Get, Post, Body, Req, UseGuards, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

// Define typed request
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return {
      success: true,
      data: this.billingService.getPlans(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  async getSubscription(@Req() req: AuthenticatedRequest) {
    return {
      success: true,
      data: await this.billingService.getSubscription(req.user.userId),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices')
  async getInvoices(@Req() req: AuthenticatedRequest) {
    return {
      success: true,
      data: await this.billingService.getInvoices(req.user.userId),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(
    @Req() req: AuthenticatedRequest,
    @Body() body: { planId: string; billingCycle: 'monthly' | 'annual' },
  ) {
    const res = await this.billingService.checkout(
      req.user.userId,
      body.planId,
      body.billingCycle,
    );
    return {
      success: true,
      data: res,
    };
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    // This is public route accessed by Midtrans
    await this.billingService.handleWebhook(payload);
    // Always return 200 OK so Midtrans stops pinging
    return { status: 'OK' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  async cancelSubscription(@Req() req: AuthenticatedRequest) {
    return {
      success: true,
      data: await this.billingService.cancelSubscription(req.user.userId),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices/:id/download')
  async downloadInvoice(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.billingService.generateInvoicePdf(
      req.params.id as string,
      req.user.userId,
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${req.params.id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }
}
