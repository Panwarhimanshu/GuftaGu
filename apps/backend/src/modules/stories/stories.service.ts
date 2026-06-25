import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Story, StoryDocument } from '../../database/schemas/story.schema';
import { User, UserDocument }   from '../../database/schemas/user.schema';
import { StorageService }       from '../storage/storage.service';

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
    @InjectModel(User.name)  private userModel:  Model<UserDocument>,
    private storageService: StorageService,
  ) {}

  async getFeed(userId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId).lean();
    const friendIds = user?.friends ?? [];
    const authorIds = [new Types.ObjectId(userId), ...friendIds];

    return this.storyModel
      .find({ userId: { $in: authorIds }, expiresAt: { $gt: new Date() } })
      .populate('userId', 'displayName avatar username')
      .sort({ createdAt: -1 })
      .lean();
  }

  async create(userId: string, dto: any, file?: Express.Multer.File): Promise<StoryDocument> {
    let mediaUrl: string | undefined;

    if (file) {
      const result = await this.storageService.upload(file, 'stories');
      mediaUrl = result.url;
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    return this.storyModel.create({
      userId:          new Types.ObjectId(userId),
      type:            dto.type,
      mediaUrl,
      text:            dto.text,
      backgroundColor: dto.backgroundColor,
      textColor:       dto.textColor,
      duration:        dto.duration ?? 5,
      expiresAt,
    });
  }

  async view(storyId: string, viewerId: string): Promise<void> {
    await this.storyModel.findByIdAndUpdate(storyId, {
      $addToSet: {
        views: { userId: new Types.ObjectId(viewerId), viewedAt: new Date() },
      },
    });
  }

  async react(storyId: string, userId: string, emoji: string): Promise<void> {
    const uid = new Types.ObjectId(userId);
    await this.storyModel.findByIdAndUpdate(storyId, {
      $pull: { reactions: { userId: uid } },
    });
    await this.storyModel.findByIdAndUpdate(storyId, {
      $push: { reactions: { userId: uid, emoji, createdAt: new Date() } },
    });
  }

  async delete(storyId: string, userId: string): Promise<void> {
    const story = await this.storyModel.findById(storyId);
    if (!story) throw new NotFoundException();
    if (!story.userId.equals(new Types.ObjectId(userId))) throw new ForbiddenException();
    await story.deleteOne();
  }
}
