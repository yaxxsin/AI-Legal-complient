import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Pino structured logging
  app.useLogger(app.get(Logger));

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LocalCompliance API')
    .setDescription('AI-Powered Business Legal Compliance Platform API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication & user management')
    .addTag('business-profiles', 'Business profile & onboarding')
    .addTag('chat', 'ComplianceBot AI chat')
    .addTag('compliance', 'Compliance checklist engine')
    .addTag('documents', 'Document template generator')
    .addTag('notifications', 'Regulatory alert system')
    .addTag('billing', 'Subscription & billing')
    .addTag('articles', 'Knowledge base & FAQ')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`🚀 API running on http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
