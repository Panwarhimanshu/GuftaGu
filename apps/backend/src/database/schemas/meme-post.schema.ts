import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MemePostDocument = MemePost & Document;

@Schema({ timestamps: true, collection: 'meme_posts' })
export class MemePost {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  thumbnailUrl: string;

  @Prop({ maxlength: 2200 })
  caption: string;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0 })
  sharesCount: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  savedBy: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'MemePost' })
  originalPostId: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isReported: boolean;
}

export const MemePostSchema = SchemaFactory.createForClass(MemePost);

MemePostSchema.index({ authorId: 1, createdAt: -1 });
MemePostSchema.index({ likesCount: -1, createdAt: -1 }); // Trending
MemePostSchema.index({ tags: 1 });
MemePostSchema.index({ caption: 'text' });
