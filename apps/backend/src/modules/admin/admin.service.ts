import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument }     from '../../database/schemas/user.schema';
import { MemePost, MemePostDocument } from '../../database/schemas/meme-post.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)     private userModel: Model<UserDocument>,
    @InjectModel(MemePost.name) private memeModel: Model<MemePostDocument>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, onlineUsers, totalPosts, bannedUsers] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isOnline: true }),
      this.memeModel.countDocuments({ isDeleted: false }),
      this.userModel.countDocuments({ isBanned: true }),
    ]);

    const now     = new Date();
    const dayAgo  = new Date(now.getTime() - 86400000);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const [dau, wau] = await Promise.all([
      this.userModel.countDocuments({ lastSeen: { $gte: dayAgo } }),
      this.userModel.countDocuments({ lastSeen: { $gte: weekAgo } }),
    ]);

    return { totalUsers, onlineUsers, totalPosts, bannedUsers, dau, wau };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const filter: any = {};
    if (search) filter.$text = { $search: search };

    const [users, total] = await Promise.all([
      this.userModel.find(filter).skip((page - 1) * limit).limit(limit).lean(),
      this.userModel.countDocuments(filter),
    ]);

    return { users, total, page, limit };
  }

  async banUser(userId: string, reason: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isBanned: true,
      banReason: reason,
    });
  }

  async unbanUser(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isBanned: false,
      banReason: null,
    });
  }

  async updateRole(userId: string, role: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { role });
  }
}
