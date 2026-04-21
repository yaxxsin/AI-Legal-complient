import { Module } from '@nestjs/common';
import { ComplianceItemsController } from './compliance-items.controller';
import { ComplianceItemsService } from './compliance-items.service';
import { PrismaModule } from '../../database/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ComplianceItemsController],
  providers: [ComplianceItemsService],
  exports: [ComplianceItemsService],
})
export class ComplianceItemsModule {}
