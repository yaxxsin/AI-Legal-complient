import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessProfilesModule } from './modules/business-profiles/business-profiles.module';
import { SectorsModule } from './modules/sectors/sectors.module';
import { RagModule } from './modules/rag/rag.module';
import { RegulationsModule } from './modules/regulations/regulations.module';
import { ChatModule } from './modules/chat/chat.module';
import { ComplianceModule } from './modules/compliance/compliance.module';

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
    RagModule,
    RegulationsModule,
    ChatModule,
    ComplianceModule,
  ],
})
export class AppModule {}
