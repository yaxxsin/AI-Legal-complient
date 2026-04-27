import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { MidtransService } from './midtrans.service';
import { UsageLimitService } from './usage-limits.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, MidtransService, UsageLimitService],
  exports: [BillingService, UsageLimitService],
})
export class BillingModule {}
