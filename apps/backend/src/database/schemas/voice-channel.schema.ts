import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoiceChannelDocument = VoiceChannel & Document;

@Schema({ timestamps: true, collection: 'voice_channels' })
export class VoiceChannel {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '🔊' })
  icon: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ default: 50 })
  maxParticipants: number;

  @Prop({ default: 64000 })
  bitrate: number;
}

export const VoiceChannelSchema = SchemaFactory.createForClass(VoiceChannel);
