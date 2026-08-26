"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
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
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    if (process.env.ENABLE_SWAGGER === '1') {
        const swagger = new swagger_1.DocumentBuilder()
            .setTitle('H&S Sales API')
            .setDescription('Sales microservice: auth, clients, quotations, tasks, relevamientos, goals, metrics.')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swagger);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    const port = Number(process.env.PORT) || 3001;
    await app.listen(port, '0.0.0.0');
}
bootstrap().catch((err) => {
    console.error('[Nest] bootstrap falló:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map