import { Module } from '@nestjs/common';
import { BusinessProfilesController } from './business-profiles.controller';
import { BusinessProfilesService } from './business-profiles.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [BusinessProfilesController],
  providers: [BusinessProfilesService],
  exports: [BusinessProfilesService],
})
export class BusinessProfilesModule {}
