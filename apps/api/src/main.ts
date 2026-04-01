import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Raw body needed for Stripe webhook signature verification
    rawBody: true,
  });

  // ── CORS ────────────────────────────────────────────────────
  app.enableCors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'https://*.vercel.app', // allow Vercel preview deployments
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Global Prefix ────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Swagger API Docs ─────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Golf Charity Platform API')
    .setDescription('REST API for the Golf Charity Subscription Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ── Start Server ─────────────────────────────────────────────
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
  console.log(`📚 Docs: http://localhost:${port}/api/docs`);
}
bootstrap();
