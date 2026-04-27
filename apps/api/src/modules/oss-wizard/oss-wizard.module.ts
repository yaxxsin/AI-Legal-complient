import { Module } from '@nestjs/common';
import { OssWizardController } from './oss-wizard.controller';
import { OssWizardService } from './oss-wizard.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [NotificationsModule, StorageModule],
  controllers: [OssWizardController],
  providers: [OssWizardService],
  exports: [OssWizardService],
})
export class OssWizardModule {}
