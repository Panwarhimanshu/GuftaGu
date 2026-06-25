import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EventsGateway } from './events.gateway';
import { User, UserSchema }       from '../database/schemas/user.schema';
import { Message, MessageSchema } from '../database/schemas/message.schema';
import { Hangout, HangoutSchema } from '../database/schemas/hangout.schema';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name,    schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Hangout.name, schema: HangoutSchema },
    ]),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class GatewayModule {}
