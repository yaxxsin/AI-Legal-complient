import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
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

    // Database
    PrismaModule,

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
  ],
})
export class AppModule {}
