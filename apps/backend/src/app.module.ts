import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Feature modules
import { AuthModule }          from './modules/auth/auth.module';
import { UsersModule }         from './modules/users/users.module';
import { ChatModule }          from './modules/chat/chat.module';
import { HangoutModule }       from './modules/hangout/hangout.module';
import { StoriesModule }       from './modules/stories/stories.module';
import { MemeFeedModule }      from './modules/meme-feed/meme-feed.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CallsModule }         from './modules/calls/calls.module';
import { AdminModule }         from './modules/admin/admin.module';
import { AiModule }            from './modules/ai/ai.module';
import { StorageModule }       from './modules/storage/storage.module';

// Gateway
import { GatewayModule }       from './gateway/gateway.module';

@Module({
  controllers: [HealthController],
  imports: [
    // ── Config ──────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ── MongoDB ─────────────────────────────────────────────
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGODB_URI', 'mongodb://localhost:27017/memechat'),
        dbName: cfg.get<string>('MONGODB_DB_NAME', 'memechat'),
        connectionFactory: (connection: any) => {
          return connection;
        },
      }),
    }),

    // ── Rate Limiting ────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        throttlers: [
          {
            ttl:   cfg.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: cfg.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // ── Scheduler ───────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Feature Modules ──────────────────────────────────────
    AuthModule,
    UsersModule,
    ChatModule,
    HangoutModule,
    StoriesModule,
    MemeFeedModule,
    NotificationsModule,
    CallsModule,
    AdminModule,
    AiModule,
    StorageModule,
    GatewayModule,
  ],
})
export class AppModule {}
