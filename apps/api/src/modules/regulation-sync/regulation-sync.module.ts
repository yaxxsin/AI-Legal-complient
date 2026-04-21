import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RegulationSyncService } from './regulation-sync.service';
import { RegulationSyncController } from './regulation-sync.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
  controllers: [RegulationSyncController],
  providers: [RegulationSyncService],
  exports: [RegulationSyncService],
})
export class RegulationSyncModule {}
