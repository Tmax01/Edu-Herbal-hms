import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap() {
  const logger = new Logger('EduHMS Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 4000;
  const apiPrefix = process.env.API_PREFIX || 'api/v1';

  // Global Route Prefix
  app.setGlobalPrefix(apiPrefix);

  // Global Validation Pipe with automatic DTO stripping and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Response Envelope & Exception Filters
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // CORS Configuration
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS access denied by policy for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Branch-ID',
  });


  // Swagger OpenAPI 3.0 Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('EduHMS Healthcare API')
    .setDescription('EduHMS Enterprise REST API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your Bearer access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const swaggerCustomOptions: SwaggerCustomOptions = {
    customSiteTitle: 'EduHMS API Docs',
    customCss: `
      .swagger-ui .topbar { display: none }
      html { box-sizing: border-box; overflow-y: scroll; }
      *, *:after, *:before { box-sizing: inherit; }
      body, html, #swagger-ui, .swagger-ui, .swagger-ui .wrapper, .swagger-ui .scheme-container { 
        background-color: #fafafa !important; 
        background: #fafafa !important; 
        color: #3b4151 !important; 
        font-family: sans-serif !important; 
      }
      .swagger-ui .wrapper { max-width: 1460px; padding: 20px; margin: 0 auto; }
      
      /* Main API Title & Header Info */
      .swagger-ui .info { margin: 25px 0 20px !important; }
      .swagger-ui .info .title { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; 
        font-size: 34px !important; 
        font-weight: 800 !important; 
        color: #0f172a !important; 
        margin: 0 0 8px !important; 
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
      }
      .swagger-ui .info .title small { 
        background: #3b82f6 !important; 
        color: #ffffff !important; 
        border-radius: 12px !important; 
        padding: 3px 10px !important; 
        font-size: 12px !important; 
        font-weight: 700 !important; 
        top: 0 !important; 
        display: inline-block !important;
      }
      .swagger-ui .info .description, 
      .swagger-ui .info .description p, 
      .swagger-ui .info p { 
        color: #334155 !important; 
        font-size: 15px !important; 
        line-height: 1.6 !important; 
        margin: 6px 0 !important; 
      }
      .swagger-ui .info a { color: #2563eb !important; font-weight: 600 !important; }

      /* Scheme / Authorize Bar */
      .swagger-ui .scheme-container { 
        background: #ffffff !important; 
        border: 1px solid #e2e8f0 !important; 
        border-radius: 6px !important; 
        padding: 16px 20px !important; 
        margin: 15px 0 20px !important; 
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
      }
      .swagger-ui .schemes-title, 
      .swagger-ui .servers-title { 
        color: #0f172a !important; 
        font-weight: 700 !important; 
        font-size: 14px !important; 
      }
      .swagger-ui .btn.authorize { 
        border-color: #10b981 !important; 
        color: #10b981 !important; 
        font-weight: 700 !important; 
        border-radius: 4px !important; 
      }
      .swagger-ui .btn.authorize svg { fill: #10b981 !important; }

      /* Headers / Category Tags */
      .swagger-ui .opblock-tag-section { margin-bottom: 10px !important; }
      .swagger-ui .opblock-tag { 
        font-family: sans-serif !important;
        font-size: 24px !important; 
        font-weight: 700 !important; 
        color: #3b4151 !important; 
        margin: 15px 0 5px !important; 
        padding: 10px 0 10px 0 !important;
        border-bottom: 1px solid rgba(59, 65, 81, 0.2) !important; 
        outline: none !important;
      }
      .swagger-ui .opblock-tag a, 
      .swagger-ui .opblock-tag span { 
        color: #3b4151 !important; 
        font-family: sans-serif !important;
        font-size: 24px !important; 
        font-weight: 700 !important; 
        text-decoration: none !important;
        outline: none !important;
      }
      .swagger-ui .opblock-tag:hover a,
      .swagger-ui .opblock-tag:focus a {
        color: #3b4151 !important;
        outline: none !important;
      }
      .swagger-ui .opblock-tag svg { fill: #3b4151 !important; }
      .swagger-ui .opblock-tag small { display: none !important; }

      /* Summary Rows */
      .swagger-ui .opblock { 
        border-radius: 4px !important; 
        margin: 0 0 15px !important; 
        box-shadow: 0 0 3px rgba(0, 0, 0, 0.19) !important; 
      }
      .swagger-ui .opblock .opblock-summary { display: flex !important; align-items: center !important; padding: 5px !important; cursor: pointer !important; }
      .swagger-ui .opblock .opblock-summary-control { display: flex !important; align-items: center !important; width: 100% !important; outline: none !important; border: none !important; background: none !important; }
      .swagger-ui .opblock .opblock-summary-method { 
        font-family: sans-serif !important;
        font-size: 14px !important; 
        font-weight: 700 !important; 
        min-width: 80px !important; 
        text-align: center !important; 
        padding: 6px 15px !important; 
        border-radius: 3px !important; 
        text-shadow: 0 1px 0 rgba(0, 0, 0, 0.1) !important; 
        color: #ffffff !important; 
      }
      .swagger-ui .opblock .opblock-summary-path { 
        font-family: monospace !important; 
        font-size: 16px !important; 
        font-weight: 600 !important; 
        min-width: 280px !important; 
        color: #3b4151 !important; 
        padding: 0 10px !important;
      }
      .swagger-ui .opblock .opblock-summary-path a { color: #3b4151 !important; }
      .swagger-ui .opblock .opblock-summary-description { 
        font-family: monospace, sans-serif !important;
        margin-left: auto !important; 
        margin-right: 15px !important; 
        text-align: right !important; 
        font-size: 13px !important; 
        color: #3b4151 !important; 
        font-weight: 400 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        max-width: 50% !important;
      }
      
      /* Locks & Expand Arrow */
      .swagger-ui .authorization__btn svg { fill: #3b4151 !important; }
      .swagger-ui .opblock-summary svg.arrow { fill: #3b4151 !important; }

      /* Exact Paymaster HTTP Method Palette */
      .swagger-ui .opblock.opblock-get { background: rgba(97, 175, 254, 0.1) !important; border-color: #61affe !important; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #61affe !important; color: #ffffff !important; }

      .swagger-ui .opblock.opblock-post { background: rgba(73, 204, 144, 0.1) !important; border-color: #49cc90 !important; }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90 !important; color: #ffffff !important; }

      .swagger-ui .opblock.opblock-put { background: rgba(252, 161, 48, 0.1) !important; border-color: #fca130 !important; }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #fca130 !important; color: #ffffff !important; }

      .swagger-ui .opblock.opblock-patch { background: rgba(80, 227, 194, 0.1) !important; border-color: #50e3c2 !important; }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #50e3c2 !important; color: #ffffff !important; }

      .swagger-ui .opblock.opblock-delete { background: rgba(249, 62, 62, 0.1) !important; border-color: #f93e3e !important; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f93e3e !important; color: #ffffff !important; }

      /* Expanded Opblock Body & Parameter Contrast Fixes */
      .swagger-ui .opblock-body { background: #ffffff !important; padding: 15px 20px !important; border-radius: 0 0 4px 4px !important; }
      .swagger-ui .opblock-section-header { 
        background: #f1f5f9 !important; 
        border-radius: 4px !important; 
        padding: 8px 12px !important; 
        box-shadow: none !important;
        min-height: auto !important;
      }
      .swagger-ui .opblock-section-header h4 { color: #1e293b !important; font-weight: 700 !important; font-size: 14px !important; }
      .swagger-ui .try-out__btn { color: #3b4151 !important; border-color: #94a3b8 !important; border-radius: 4px !important; }

      /* Parameters Table */
      .swagger-ui table.parameters { width: 100% !important; margin: 10px 0 !important; }
      .swagger-ui table.parameters thead th { 
        color: #1e293b !important; 
        font-weight: 700 !important; 
        font-size: 13px !important; 
        border-bottom: 1px solid #cbd5e1 !important; 
        padding: 8px 0 !important;
      }
      .swagger-ui table.parameters td { color: #1e293b !important; padding: 10px 0 !important; border-bottom: 1px solid #f1f5f9 !important; }
      .swagger-ui .parameter__name { color: #0f172a !important; font-weight: 700 !important; font-size: 14px !important; }
      .swagger-ui .parameter__type { color: #475569 !important; font-weight: 600 !important; font-size: 12px !important; }
      .swagger-ui .parameter__in { color: #64748b !important; font-style: italic !important; font-size: 12px !important; }
      .swagger-ui .parameter__default { color: #64748b !important; font-size: 12px !important; }
      .swagger-ui .renderedMarkdown p, .swagger-ui .markdown p { color: #334155 !important; font-size: 13px !important; margin: 0 !important; }

      /* Form Inputs & Textareas */
      .swagger-ui input[type=text], 
      .swagger-ui input[type=password], 
      .swagger-ui input[type=search], 
      .swagger-ui input[type=email], 
      .swagger-ui textarea, 
      .swagger-ui select { 
        background: #ffffff !important; 
        background-color: #ffffff !important; 
        color: #0f172a !important; 
        border: 1px solid #cbd5e1 !important; 
        border-radius: 4px !important; 
        padding: 8px 10px !important; 
        font-size: 13px !important;
        font-family: inherit !important;
      }
      .swagger-ui input[type=text]:focus, 
      .swagger-ui textarea:focus, 
      .swagger-ui select:focus {
        border-color: #3b82f6 !important;
        outline: none !important;
      }

      /* Responses Section */
      .swagger-ui .responses-wrapper { padding: 10px 0 !important; }
      .swagger-ui .responses-inner { color: #1e293b !important; }
      .swagger-ui table.responses-table thead th { color: #1e293b !important; font-weight: 700 !important; }
      .swagger-ui .response-col_status { color: #0f172a !important; font-weight: 700 !important; font-size: 14px !important; }
      .swagger-ui .response-col_description { color: #334155 !important; font-size: 13px !important; }
      .swagger-ui .tab li button.tablinks { color: #475569 !important; font-weight: 600 !important; }
      .swagger-ui .tab li button.tablinks.active { color: #0f172a !important; font-weight: 700 !important; }
      .swagger-ui .btn.execute { background-color: #4990e2 !important; border-color: #4990e2 !important; color: #ffffff !important; border-radius: 4px !important; font-weight: 600 !important; }
      .swagger-ui .btn-clear { border-radius: 4px !important; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      deepLinking: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: -1,
      defaultModelExpandDepth: 1,
      filter: true,
      displayRequestDuration: true,
    },
  };

  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);


  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 EduHMS API running on: http://0.0.0.0:${port}/${apiPrefix}`);
  logger.log(`📖 Swagger API Docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
