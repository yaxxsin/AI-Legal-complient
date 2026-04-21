import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // IMPORTANT: Wait for AppModule to fully initialize
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Simulate main.ts setup
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/billing/plans (GET) - Should return subscription plans', () => {
    return request(app.getHttpServer())
      .get('/api/v1/billing/plans')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('/api/v1/chat (POST) - Should fail without Auth Token', () => {
    return request(app.getHttpServer())
      .post('/api/v1/chat')
      .send({ message: 'Hello' })
      .expect(401); // Unauthorized
  });
});
