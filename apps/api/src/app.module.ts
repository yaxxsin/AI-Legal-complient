import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessProfilesModule } from './modules/business-profiles/business-profiles.module';
import { SectorsModule } from './modules/sectors/sectors.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChatModule } from './modules/chat/chat.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { BillingModule } from './modules/billing/billing.module';
import { ComplianceRulesModule } from './modules/compliance-rules/compliance-rules.module';
import { RegulationsModule } from './modules/regulations/regulations.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { DocumentReviewModule } from './modules/document-review/document-review.module';
import { HrModule } from './modules/hr/hr.module';
import { TeamsModule } from './modules/teams/teams.module';
import { StorageModule } from './modules/storage/storage.module';
import { ComplianceItemsModule } from './modules/compliance-items/compliance-items.module';
import { RegulationSyncModule } from './modules/regulation-sync/regulation-sync.module';
import { CmsModule } from './modules/cms/cms.module';
import { OssWizardModule } from './modules/oss-wizard/oss-wizard.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    // Global config — reads from .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '../../.env.local',
        '../../.env',
        '.env.local',
        '.env',
      ],
    }),

    // Structured logging via Pino
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        autoLogging: true,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),

    // Rate limiting — 60 requests per minute per IP (global)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),

    // Database
    PrismaModule,

    // Queue / Redis Setup
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    BusinessProfilesModule,
    SectorsModule,
    DocumentsModule,
    NotificationsModule,
    ChatModule,
    ArticlesModule,
    BillingModule,
    ComplianceRulesModule,
    RegulationsModule,
    FeatureFlagsModule,
    DocumentReviewModule,
    HrModule,
    TeamsModule,
    StorageModule,
    ComplianceItemsModule,
    RegulationSyncModule,
    CmsModule,
    OssWizardModule,
  ],
  providers: [
    // Global rate limiter guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
