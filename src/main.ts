// Fix crypto module issue - only set if not already defined
if (!global.crypto) {
  try {
    (global as any).crypto = require('crypto');
  } catch (e) {
    // Ignore if crypto is already available
  }
}
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter() as any,
  );

  // Disable CORS - allow all domains and headers (match production)
  const corsPlugin = await import('@fastify/cors');
  await app.register(corsPlugin.default as any, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: true,
    exposedHeaders: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('IQX Trading API')
    .setDescription(
      'API cho hệ thống giao dịch IQX bao gồm xác thực, chứng khoán và đấu trường ảo',
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api.iqx.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag(
      'Authentication',
      'Endpoints for user authentication and authorization',
    )
    .addTag('Symbols', 'Stock symbols and market data')
    .addTag('Virtual Trading', 'Virtual trading platform endpoints')
    .addTag('Watchlist', 'User watchlist management endpoints')
    .addTag('Subscriptions', 'Subscription management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI với các endpoint tự động
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'IQX Trading API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .download-contents {
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;
        z-index: 1000 !important;
      }
      .download-contents a {
        background: #89bf04 !important;
        color: white !important;
        padding: 6px 12px !important;
        border-radius: 4px !important;
        text-decoration: none !important;
        margin-left: 8px !important;
        font-size: 12px !important;
        font-weight: bold !important;
        display: inline-block !important;
      }
      .download-contents a:nth-child(2) {
        background: #1976d2 !important;
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelExpandDepth: 3,
      defaultModelsExpandDepth: 3,
    },
    customJsStr: `
      setTimeout(function() {
        // Thêm nút download vào UI
        const infoContainer = document.querySelector('.info');
        if (infoContainer && !document.querySelector('.download-contents')) {
          const downloadDiv = document.createElement('div');
          downloadDiv.className = 'download-contents';
          downloadDiv.innerHTML = '<a href="/api/docs-json" target="_blank">📄 JSON</a><a href="/api/docs-yaml" target="_blank">📄 YAML</a>';
          infoContainer.appendChild(downloadDiv);
        }
      }, 1000);
    `,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(
    `🚀 API đang chạy tại: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger docs: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
  console.log(
    `📄 Download JSON: http://localhost:${process.env.PORT ?? 3000}/api/docs-json`,
  );
  console.log(
    `📄 Download YAML: http://localhost:${process.env.PORT ?? 3000}/api/docs-yaml`,
  );
}
bootstrap();
