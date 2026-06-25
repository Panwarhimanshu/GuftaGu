import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController }    from './chat.controller';
import { ChatService }       from './chat.service';
import { Conversation, ConversationSchema } from '../../database/schemas/conversation.schema';
import { Message, MessageSchema }           from '../../database/schemas/message.schema';
import { User, UserSchema }                 from '../../database/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule }       from '../storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name,      schema: MessageSchema },
      { name: User.name,         schema: UserSchema },
    ]),
    NotificationsModule,
    StorageModule,
  ],
  controllers: [ChatController],
  providers:   [ChatService],
  exports:     [ChatService],
})
export class ChatModule {}
