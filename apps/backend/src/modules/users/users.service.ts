import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { StorageService }     from '../storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private storageService: StorageService,
  ) {}

  async getProfile(userId: string, currentUserId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -twoFactorSecret -emailVerificationToken -passwordResetToken -fcmTokens')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, updates: any, avatarFile?: Express.Multer.File): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException();

    if (avatarFile) {
      const result = await this.storageService.upload(avatarFile, 'avatars');
      updates.avatar = result.url;
    }

    // Remove protected fields
    delete updates.role;
    delete updates.isBanned;
    delete updates.email;
    delete updates.password;

    Object.assign(user, updates);
    return user.save();
  }

  async updateStatus(userId: string, status: string, customStatus?: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { status, customStatus },
      { new: true },
    );
  }

  async searchUsers(query: string, currentUserId: string): Promise<any[]> {
    return this.userModel
      .find({
        _id: { $ne: new Types.ObjectId(currentUserId) },
        $text: { $search: query },
        isBanned: false,
      })
      .select('displayName username avatar status isOnline')
      .limit(20)
      .lean();
  }

  async getOnlineFriends(userId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId).lean();
    if (!user?.friends?.length) return [];

    return this.userModel
      .find({ _id: { $in: user.friends }, isOnline: true })
      .select('displayName username avatar status lastSeen')
      .lean();
  }

  async getFriends(userId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId).lean();
    if (!user?.friends?.length) return [];

    return this.userModel
      .find({ _id: { $in: user.friends } })
      .select('displayName username avatar status isOnline lastSeen')
      .lean();
  }

  async sendFriendRequest(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) throw new ForbiddenException('Cannot add yourself');
    await this.userModel.findByIdAndUpdate(targetId, {
      $addToSet: { friendRequests: new Types.ObjectId(userId) },
    });
  }

  async acceptFriendRequest(userId: string, fromId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException();

    const reqIdx = user.friendRequests.findIndex(id => id.equals(new Types.ObjectId(fromId)));
    if (reqIdx === -1) throw new NotFoundException('Friend request not found');

    user.friendRequests.splice(reqIdx, 1);
    user.friends.push(new Types.ObjectId(fromId) as any);
    await user.save();

    await this.userModel.findByIdAndUpdate(fromId, {
      $addToSet: { friends: new Types.ObjectId(userId) },
    });
  }

  async blockUser(userId: string, targetId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: new Types.ObjectId(targetId) },
      $pull:     { friends: new Types.ObjectId(targetId) },
    });
  }

  async getOnlineUsers(currentUserId: string): Promise<any[]> {
    return this.userModel
      .find({ _id: { $ne: new Types.ObjectId(currentUserId) }, isOnline: true, isBanned: false })
      .select('displayName username avatar status isOnline')
      .lean();
  }

  async discoverUsers(currentUserId: string): Promise<any[]> {
    const currentUser = await this.userModel.findById(currentUserId).lean();
    if (!currentUser) throw new NotFoundException();

    const receivedFromIds = (currentUser.friendRequests ?? []).map(id => id.toString());
    const friendIds       = (currentUser.friends       ?? []).map(id => id.toString());
    const blockedIds      = (currentUser.blockedUsers  ?? []).map(id => id.toString());

    // Users whose friendRequests array contains currentUserId → current user sent request to them
    const sentToUsers = await this.userModel
      .find({ friendRequests: new Types.ObjectId(currentUserId) })
      .select('_id')
      .lean();
    const sentToIds = sentToUsers.map((u: any) => u._id.toString());

    const excludeIds = [
      new Types.ObjectId(currentUserId),
      ...blockedIds.map(id => new Types.ObjectId(id)),
    ];

    const users = await this.userModel
      .find({ _id: { $nin: excludeIds }, isBanned: false })
      .select('displayName username avatar status isOnline lastSeen')
      .sort({ isOnline: -1, displayName: 1 })
      .lean();

    return users.map((user: any) => {
      const uid = user._id.toString();
      let relationshipStatus: 'none' | 'friends' | 'request_sent' | 'request_received' = 'none';
      if (friendIds.includes(uid))         relationshipStatus = 'friends';
      else if (receivedFromIds.includes(uid)) relationshipStatus = 'request_received';
      else if (sentToIds.includes(uid))    relationshipStatus = 'request_sent';
      return { ...user, id: uid, relationshipStatus };
    });
  }

  async getFriendRequests(userId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId).lean();
    if (!user?.friendRequests?.length) return [];

    return this.userModel
      .find({ _id: { $in: user.friendRequests } })
      .select('displayName username avatar status isOnline')
      .lean();
  }

  async declineFriendRequest(userId: string, fromId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { friendRequests: new Types.ObjectId(fromId) },
    });
  }
}
