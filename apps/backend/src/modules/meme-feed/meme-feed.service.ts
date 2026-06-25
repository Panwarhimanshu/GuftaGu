import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MemePost, MemePostDocument } from '../../database/schemas/meme-post.schema';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MemeFeedService {
  constructor(
    @InjectModel(MemePost.name) private memeModel: Model<MemePostDocument>,
    private storageService: StorageService,
  ) {}

  async getFeed(userId: string, cursor?: string, limit = 20): Promise<any> {
    const filter: any = { isDeleted: false };
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor) };

    const posts = await this.memeModel
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('authorId', 'displayName avatar username')
      .lean();

    const hasMore = posts.length > limit;
    const result  = posts.slice(0, limit);

    return {
      posts: result.map(p => ({
        ...p,
        isSaved: (p.savedBy ?? []).some((id: any) => id.equals(new Types.ObjectId(userId))),
      })),
      cursor: result.length > 0 ? result[result.length - 1]._id.toString() : null,
      hasMore,
    };
  }

  async getTrending(): Promise<any[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.memeModel
      .find({ isDeleted: false, createdAt: { $gte: since } })
      .sort({ likesCount: -1 })
      .limit(20)
      .populate('authorId', 'displayName avatar username')
      .lean();
  }

  async upload(userId: string, file: Express.Multer.File, caption?: string, tags?: string[]) {
    const { url, thumbnailUrl } = await this.storageService.upload(file, 'memes');
    return this.memeModel.create({
      authorId:     new Types.ObjectId(userId),
      imageUrl:     url,
      thumbnailUrl,
      caption,
      tags: tags ?? [],
    });
  }

  async toggleLike(postId: string, userId: string): Promise<void> {
    const uid  = new Types.ObjectId(userId);
    const post = await this.memeModel.findById(postId);
    if (!post) throw new NotFoundException();

    const liked = post.likes.some(id => id.equals(uid));
    if (liked) {
      post.likes = post.likes.filter(id => !id.equals(uid));
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(uid as any);
      post.likesCount++;
    }
    await post.save();
  }

  async toggleSave(postId: string, userId: string): Promise<void> {
    const uid  = new Types.ObjectId(userId);
    const post = await this.memeModel.findById(postId);
    if (!post) throw new NotFoundException();

    const saved = post.savedBy.some(id => id.equals(uid));
    if (saved) {
      post.savedBy = post.savedBy.filter(id => !id.equals(uid));
    } else {
      post.savedBy.push(uid as any);
    }
    await post.save();
  }

  async delete(postId: string, userId: string): Promise<void> {
    await this.memeModel.findOneAndUpdate(
      { _id: postId, authorId: new Types.ObjectId(userId) },
      { isDeleted: true },
    );
  }
}
