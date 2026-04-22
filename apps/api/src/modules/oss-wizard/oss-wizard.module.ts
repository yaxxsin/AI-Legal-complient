import { Module } from '@nestjs/common';
import { OssWizardController } from './oss-wizard.controller';
import { OssWizardService } from './oss-wizard.service';
import { PrismaModule } from '../../database/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [OssWizardController],
  providers: [OssWizardService],
  exports: [OssWizardService],
})
export class OssWizardModule {}
