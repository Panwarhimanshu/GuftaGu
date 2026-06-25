import 'reflect-metadata';
import * as dns from 'dns';
// Force Node.js to use Google DNS — fixes ECONNREFUSED on SRV lookups via restrictive routers
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
import * as mongoose from 'mongoose';
// Globally map _id → id and strip __v from all Mongoose toJSON / toObject outputs.
// Without this, every response has _id (ObjectId) but the frontend types expect id (string).
mongoose.plugin(function (schema: mongoose.Schema) {
  const idTransform = (_doc: any, ret: any) => {
    if (ret._id !== undefined) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v;
    return ret;
  };
  schema.set('toJSON',   { virtuals: true, transform: idTransform });
  schema.set('toObject', { virtuals: true, transform: idTransform });
});
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helmet = require('helmet');
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

class SocketIOAdapter extends IoAdapter {
  private readonly origin: string;

  constructor(app: any, origin: string) {
    super(app);
    this.origin = origin;
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: [this.origin, 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const appUrl = configService.get<string>('APP_URL', 'http://localhost:3000');

  // ── Security ────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc:  ["'self'", "'unsafe-inline'"],
          styleSrc:   ["'self'", "'unsafe-inline'"],
          imgSrc:     ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // ── Compression ─────────────────────────────────────────────
  app.use(compression());

  // ── CORS ────────────────────────────────────────────────────
  app.enableCors({
    origin: [appUrl, 'http://localhost:3000'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // ── Global prefix ───────────────────────────────────────────
  const prefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(prefix);

  // ── Validation ──────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global filters & interceptors ───────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // ── WebSocket adapter ───────────────────────────────────────
  app.useWebSocketAdapter(new SocketIOAdapter(app, appUrl));

  // ── Swagger ─────────────────────────────────────────────────
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MemeChat API')
      .setDescription('MemeChat — Real-Time Social Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication & session management')
      .addTag('Users', 'User management & profiles')
      .addTag('Conversations', 'Chat conversations')
      .addTag('Messages', 'Message operations')
      .addTag('Hangouts', 'Hangout & break coordination')
      .addTag('Stories', '24-hour stories')
      .addTag('Meme Feed', 'Instagram-style meme feed')
      .addTag('Calls', 'Voice & video calls')
      .addTag('Notifications', 'Push notifications')
      .addTag('Admin', 'Admin panel')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 MemeChat API running on http://localhost:${port}/${prefix}`);
}

bootstrap();
