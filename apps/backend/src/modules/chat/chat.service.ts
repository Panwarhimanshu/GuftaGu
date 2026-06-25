import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../../database/schemas/conversation.schema';
import { Message, MessageDocument }           from '../../database/schemas/message.schema';
import { User, UserDocument }                 from '../../database/schemas/user.schema';
import { NotificationsService }               from '../notifications/notifications.service';
import { StorageService }                     from '../storage/storage.service';
import { CreateMessageDto }                   from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private convModel: Model<ConversationDocument>,
    @InjectModel(Message.name)      private msgModel:  Model<MessageDocument>,
    @InjectModel(User.name)         private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
  ) {}

  // ── Conversations ─────────────────────────────────────────
  async getConversations(userId: string): Promise<any[]> {
    return this.convModel
      .find({ 'participants.userId': new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .populate('participants.userId', 'displayName avatar username status isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'displayName avatar' },
      })
      .lean();
  }

  async getConversation(convId: string, userId: string): Promise<ConversationDocument> {
    const conv = await this.convModel
      .findById(convId)
      .populate('participants.userId', 'displayName avatar username status isOnline lastSeen');

    if (!conv) throw new NotFoundException('Conversation not found');
    const isMember = conv.participants.some(p => p.userId.equals(new Types.ObjectId(userId)));
    if (!isMember) throw new ForbiddenException();
    return conv;
  }

  async createPrivate(userId: string, targetId: string): Promise<ConversationDocument> {
    const existing = await this.convModel.findOne({
      type: 'private',
      'participants.userId': {
        $all: [new Types.ObjectId(userId), new Types.ObjectId(targetId)],
      },
    });
    if (existing) return existing;

    return this.convModel.create({
      type: 'private',
      participants: [
        { userId: new Types.ObjectId(userId),   role: 'member' },
        { userId: new Types.ObjectId(targetId), role: 'member' },
      ],
      createdBy: new Types.ObjectId(userId),
    });
  }

  async createGroup(userId: string, dto: { name: string; participantIds: string[]; avatar?: string }) {
    const participantIds = [...new Set([userId, ...dto.participantIds])];

    return this.convModel.create({
      type: 'group',
      name: dto.name,
      avatar: dto.avatar,
      participants: participantIds.map(id => ({
        userId: new Types.ObjectId(id),
        role:   id === userId ? 'admin' : 'member',
      })),
      createdBy: new Types.ObjectId(userId),
    });
  }

  // ── Messages ──────────────────────────────────────────────
  async getMessages(convId: string, userId: string, cursor?: string, limit = 50) {
    await this.getConversation(convId, userId); // auth check

    const filter: any = { conversationId: new Types.ObjectId(convId), isDeleted: false };
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor) };

    const messages = await this.msgModel
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('senderId', 'displayName avatar username')
      .lean();

    const hasMore = messages.length > limit;
    const result  = messages.slice(0, limit).reverse();

    return {
      messages: result,
      cursor:   result.length > 0 ? result[0]._id.toString() : null,
      hasMore,
    };
  }

  async sendMessage(
    convId: string,
    senderId: string,
    dto: CreateMessageDto,
    file?: Express.Multer.File,
  ): Promise<MessageDocument> {
    const conv = await this.getConversation(convId, senderId);

    let mediaUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (file) {
      const uploaded = await this.storageService.upload(file, `chat/${convId}`);
      mediaUrl = uploaded.url;
      thumbnailUrl = uploaded.thumbnailUrl;
    }

    const message = await this.msgModel.create({
      conversationId: new Types.ObjectId(convId),
      senderId:       new Types.ObjectId(senderId),
      type:           dto.type,
      content:        dto.content,
      mediaUrl,
      thumbnailUrl,
      replyTo:        dto.replyTo ? new Types.ObjectId(dto.replyTo) : undefined,
      status:         'sent',
    });

    // Update last message in conversation
    await this.convModel.findByIdAndUpdate(convId, {
      lastMessage: message._id,
      updatedAt:   new Date(),
    });

    const populated = await message.populate('senderId', 'displayName avatar username');

    // Push notification to offline participants
    const offlineParticipants = conv.participants
      .filter(p => !p.userId.equals(new Types.ObjectId(senderId)))
      .map(p => p.userId.toString());

    const sender = await this.userModel.findById(senderId).lean();
    await this.notificationsService.sendBulk(offlineParticipants, {
      type:  'new_message',
      title: sender?.displayName ?? 'New message',
      body:  dto.content ?? '📎 Media',
      data:  { conversationId: convId, messageId: message._id.toString() },
    });

    return populated;
  }

  async editMessage(msgId: string, userId: string, content: string): Promise<MessageDocument> {
    const msg = await this.msgModel.findById(msgId);
    if (!msg) throw new NotFoundException();
    if (!msg.senderId.equals(new Types.ObjectId(userId))) throw new ForbiddenException();
    if (msg.type !== 'text') throw new BadRequestException('Only text messages can be edited');

    msg.content  = content;
    msg.isEdited = true;
    msg.editedAt = new Date();
    return msg.save();
  }

  async deleteMessage(msgId: string, userId: string): Promise<void> {
    const msg = await this.msgModel.findById(msgId);
    if (!msg) throw new NotFoundException();

    const conv = await this.convModel.findById(msg.conversationId);
    const isAdmin = conv?.participants.find(p =>
      p.userId.equals(new Types.ObjectId(userId)) && p.role === 'admin',
    );

    if (!msg.senderId.equals(new Types.ObjectId(userId)) && !isAdmin) {
      throw new ForbiddenException();
    }

    msg.isDeleted = true;
    msg.deletedAt = new Date();
    msg.content   = '';
    await msg.save();
  }

  async reactToMessage(msgId: string, userId: string, emoji: string): Promise<MessageDocument> {
    const msg = await this.msgModel.findById(msgId);
    if (!msg) throw new NotFoundException();

    const uid = new Types.ObjectId(userId);
    const existing = msg.reactions.find(r => r.emoji === emoji);

    if (existing) {
      const hasReacted = existing.users.some(u => u.equals(uid));
      if (hasReacted) {
        existing.users = existing.users.filter(u => !u.equals(uid));
        existing.count = existing.users.length;
        if (existing.count === 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existing.users.push(uid as any);
        existing.count++;
      }
    } else {
      msg.reactions.push({ emoji, users: [uid as any], count: 1 });
    }

    return msg.save();
  }

  async markRead(convId: string, userId: string, messageId: string): Promise<void> {
    await this.msgModel.updateMany(
      {
        conversationId: new Types.ObjectId(convId),
        _id:            { $lte: new Types.ObjectId(messageId) },
        seenBy:         { $ne: new Types.ObjectId(userId) },
      },
      { $addToSet: { seenBy: new Types.ObjectId(userId) }, $set: { status: 'seen' } },
    );

    await this.convModel.updateOne(
      { _id: convId, 'participants.userId': new Types.ObjectId(userId) },
      { $set: { 'participants.$.lastReadAt': new Date() } },
    );
  }

  async pinMessage(convId: string, userId: string, msgId: string): Promise<void> {
    const conv = await this.getConversation(convId, userId);
    const isAdmin = conv.participants.find(
      p => p.userId.equals(new Types.ObjectId(userId)) && ['admin', 'moderator'].includes(p.role),
    );
    if (!isAdmin && conv.type !== 'private') throw new ForbiddenException();

    await this.convModel.findByIdAndUpdate(convId, {
      $addToSet: { pinnedMessages: new Types.ObjectId(msgId) },
    });
  }

  async searchMessages(convId: string, userId: string, query: string): Promise<any[]> {
    await this.getConversation(convId, userId);
    return this.msgModel
      .find({
        conversationId: new Types.ObjectId(convId),
        $text: { $search: query },
        isDeleted: false,
      })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .populate('senderId', 'displayName avatar')
      .lean();
  }
}
