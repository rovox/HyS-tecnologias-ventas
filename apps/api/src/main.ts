import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validationMessages } from './common/domain/validation-messages';
import { DigicorpService } from './modules/digicorp/digicorp.service';
import { QuotationFlowService } from './modules/quotations/quotation-flow.service';
import { TasksService } from './modules/tasks/tasks.service';

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
      // Dev only (API_STRICT_DTO=1, set by `pnpm dev`): reject fields the API does not know instead of dropping them silently.
      forbidNonWhitelisted: process.env.API_STRICT_DTO === '1',
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // Only Spanish on screen: class-validator's English defaults are translated (the DTO's own messages are kept).
      exceptionFactory: (errors) => new BadRequestException(validationMessages(errors)),
    }),
  );

  if (process.env.ENABLE_SWAGGER === '1') {
    const swagger = new DocumentBuilder()
      .setTitle('hs-erp API')
      .setDescription('H&S Tecnologías ERP: auth, clients, quotations, projects (schedules), payments, relevamientos, internal orders, goals, metrics.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`[Nest] escuchando en el puerto ${port}`);
  // Background work only once the port is open: Hostinger kills a process that does not listen within seconds.
  for (const service of [QuotationFlowService, TasksService, DigicorpService]) app.get(service).startTimers();
}

bootstrap().catch((err) => {
  console.error('[Nest] bootstrap falló:', err);
  process.exit(1);
});
