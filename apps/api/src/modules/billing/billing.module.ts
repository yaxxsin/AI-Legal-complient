import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { MidtransService } from './midtrans.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, MidtransService],
  exports: [BillingService],
})
export class BillingModule {}
