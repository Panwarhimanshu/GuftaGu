import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HangoutDocument = Hangout & Document;

@Schema({ _id: false })
class HangoutResponse {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['coming', 'not_coming', 'maybe'], required: true })
  status: string;

  @Prop({ min: 1, max: 120 })
  eta: number; // minutes

  @Prop({ default: Date.now })
  respondedAt: Date;
}

@Schema({ timestamps: true, collection: 'hangouts' })
export class Hangout {
  @Prop({
    enum: ['smoke_break', 'coffee_break', 'lunch_break', 'gaming', 'walk_break', 'hangout'],
    required: true,
    index: true,
  })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  initiatorId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ maxlength: 500 })
  message: string;

  @Prop()
  location: string;

  @Prop()
  scheduledAt: Date;

  @Prop({ required: true, min: 1, max: 480, default: 15 })
  durationMinutes: number;

  @Prop({ type: [HangoutResponse], default: [] })
  responses: HangoutResponse[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  invitedUsers: Types.ObjectId[];

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop()
  timerStartedAt: Date;
}

export const HangoutSchema = SchemaFactory.createForClass(Hangout);

HangoutSchema.index({ initiatorId: 1, createdAt: -1 });
HangoutSchema.index({ isActive: 1, expiresAt: 1 });
