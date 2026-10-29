"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const validation_messages_1 = require("./common/domain/validation-messages");
const digicorp_service_1 = require("./modules/digicorp/digicorp.service");
const quotation_flow_service_1 = require("./modules/quotations/quotation-flow.service");
const tasks_service_1 = require("./modules/tasks/tasks.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const originRaw = (process.env.CORS_ORIGIN || '').trim();
    if (!originRaw) {
        throw new Error('CORS_ORIGIN debe estar definido (origen HTTPS del SPA, p. ej. https://white-goat-213580.hostingersite.com).');
    }
    const origins = originRaw.split(',').map((o) => o.trim()).filter(Boolean);
    app.enableCors({ origin: origins.length === 1 ? origins[0] : origins, credentials: true });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: process.env.API_STRICT_DTO === '1',
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors) => new common_1.BadRequestException((0, validation_messages_1.validationMessages)(errors)),
    }));
    if (process.env.ENABLE_SWAGGER === '1') {
        const swagger = new swagger_1.DocumentBuilder()
            .setTitle('hs-erp API')
            .setDescription('H&S Tecnologías ERP: auth, clients, quotations, projects (schedules), payments, relevamientos, internal orders, goals, metrics.')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swagger);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    const port = Number(process.env.PORT) || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`[Nest] escuchando en el puerto ${port}`);
    for (const service of [quotation_flow_service_1.QuotationFlowService, tasks_service_1.TasksService, digicorp_service_1.DigicorpService])
        app.get(service).startTimers();
}
bootstrap().catch((err) => {
    console.error('[Nest] bootstrap falló:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map