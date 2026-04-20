import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import {
  AdminComplianceController,
  AdminComplianceCategoryController,
} from './admin-compliance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ComplianceController,
    AdminComplianceController,
    AdminComplianceCategoryController,
  ],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
