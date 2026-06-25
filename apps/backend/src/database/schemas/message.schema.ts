import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ _id: false })
class MessageReaction {
  @Prop({ required: true })
  emoji: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  users: Types.ObjectId[];

  @Prop({ default: 0 })
  count: number;
}

@Schema({ _id: false })
class PollOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  votes: Types.ObjectId[];
}

@Schema({ _id: false })
class Poll {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [PollOption] })
  options: PollOption[];

  @Prop()
  expiresAt: Date;

  @Prop({ default: false })
  isMultipleChoice: boolean;
}

@Schema({ _id: false })
class Location {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop()
  address: string;
}

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({
    enum: ['text','image','video','audio','voice_note','document','gif','sticker','location','poll','system'],
    required: true,
  })
  type: string;

  @Prop({ maxlength: 10000 })
  content: string;

  @Prop()
  mediaUrl: string;

  @Prop()
  thumbnailUrl: string;

  @Prop()
  fileName: string;

  @Prop()
  fileSize: number;

  @Prop()
  duration: number; // seconds (audio/video)

  @Prop({ type: Location })
  location: Location;

  @Prop({ type: Poll })
  poll: Poll;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  forwardedFrom: Types.ObjectId;

  @Prop({ type: [MessageReaction], default: [] })
  reactions: MessageReaction[];

  @Prop({ enum: ['sent', 'delivered', 'seen'], default: 'sent' })
  status: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  seenBy: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  deliveredTo: Types.ObjectId[];

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  starredBy: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  bookmarkedBy: Types.ObjectId[];

  @Prop({ default: 0 })
  threadCount: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ content: 'text' });
