import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoryDocument = Story & Document;

@Schema({ _id: false })
class StoryView {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: Date.now })
  viewedAt: Date;
}

@Schema({ _id: false })
class StoryReaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  emoji: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true, collection: 'stories' })
export class Story {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['photo', 'video', 'text'], required: true })
  type: string;

  @Prop()
  mediaUrl: string;

  @Prop({ maxlength: 1000 })
  text: string;

  @Prop()
  backgroundColor: string;

  @Prop()
  textColor: string;

  @Prop({ default: 5, min: 1, max: 15 })
  duration: number; // seconds

  @Prop({ type: [StoryView], default: [] })
  views: StoryView[];

  @Prop({ type: [StoryReaction], default: [] })
  reactions: StoryReaction[];

  @Prop({ required: true, index: true })
  expiresAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);

StorySchema.index({ userId: 1, createdAt: -1 });
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete
