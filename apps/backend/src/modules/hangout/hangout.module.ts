import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HangoutController } from './hangout.controller';
import { HangoutService }    from './hangout.service';
import { Hangout, HangoutSchema } from '../../database/schemas/hangout.schema';
import { User, UserSchema }       from '../../database/schemas/user.schema';
import { NotificationsModule }    from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hangout.name, schema: HangoutSchema },
      { name: User.name,    schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [HangoutController],
  providers:   [HangoutService],
  exports:     [HangoutService],
})
export class HangoutModule {}
