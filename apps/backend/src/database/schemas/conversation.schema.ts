import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ _id: false })
class Participant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['admin', 'moderator', 'member'], default: 'member' })
  role: string;

  @Prop({ default: Date.now })
  joinedAt: Date;

  @Prop()
  lastReadAt: Date;
}
const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ enum: ['private', 'group', 'channel'], required: true, index: true })
  type: string;

  @Prop({ trim: true })
  name: string;

  @Prop()
  avatar: string;

  @Prop({ maxlength: 500 })
  description: string;

  @Prop({ type: [ParticipantSchema], required: true })
  participants: Participant[];

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Message' }] })
  pinnedMessages: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  mutedBy: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  archivedBy: Types.ObjectId[];

  // Group settings
  @Prop({ default: false })
  isPublic: boolean;

  @Prop()
  inviteCode: string;

  @Prop()
  maxMembers: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ 'participants.userId': 1 });
ConversationSchema.index({ type: 1, updatedAt: -1 });
