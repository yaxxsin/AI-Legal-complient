import { Module } from '@nestjs/common';
import { OssWizardController } from './oss-wizard.controller';
import { OssWizardService } from './oss-wizard.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [OssWizardController],
  providers: [OssWizardService],
  exports: [OssWizardService],
})
export class OssWizardModule {}
