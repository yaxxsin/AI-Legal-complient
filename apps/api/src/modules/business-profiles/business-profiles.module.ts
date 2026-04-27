import { Module } from '@nestjs/common';
import { BusinessProfilesController } from './business-profiles.controller';
import { BusinessProfilesService } from './business-profiles.service';
import { ChatModule } from '../chat/chat.module';
import { ComplianceItemsModule } from '../compliance-items/compliance-items.module';

@Module({
  imports: [ChatModule, ComplianceItemsModule],
  controllers: [BusinessProfilesController],
  providers: [BusinessProfilesService],
  exports: [BusinessProfilesService],
})
export class BusinessProfilesModule {}
