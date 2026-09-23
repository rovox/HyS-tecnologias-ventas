import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const originRaw = (process.env.CORS_ORIGIN || '').trim();
  if (!originRaw) {
    throw new Error(
      'CORS_ORIGIN debe estar definido (origen HTTPS del SPA, p. ej. https://white-goat-213580.hostingersite.com).',
    );
  }
  const origins = originRaw.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({ origin: origins.length === 1 ? origins[0] : origins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.ENABLE_SWAGGER === '1') {
    const swagger = new DocumentBuilder()
      .setTitle('H&S Sales API')
      .setDescription('Sales microservice: auth, clients, quotations, tasks, relevamientos, goals, metrics.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('[Nest] bootstrap falló:', err);
  process.exit(1);
});
