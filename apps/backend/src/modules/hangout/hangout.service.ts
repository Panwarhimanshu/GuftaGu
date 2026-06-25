import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Hangout, HangoutDocument } from '../../database/schemas/hangout.schema';
import { User, UserDocument }       from '../../database/schemas/user.schema';
import { NotificationsService }     from '../notifications/notifications.service';
import { CreateHangoutDto }  from './dto/create-hangout.dto';
import { RespondHangoutDto } from './dto/respond-hangout.dto';

const HANGOUT_META: Record<string, { title: string; emoji: string; defaultDuration: number }> = {
  smoke_break:  { title: 'Smoke Break',  emoji: '🚬', defaultDuration: 10 },
  coffee_break: { title: 'Coffee Break', emoji: '☕', defaultDuration: 15 },
  lunch_break:  { title: 'Lunch Break',  emoji: '🍔', defaultDuration: 45 },
  gaming:       { title: 'Gaming',        emoji: '🎮', defaultDuration: 60 },
  walk_break:   { title: 'Walk Break',   emoji: '🏃', defaultDuration: 20 },
  hangout:      { title: 'Hangout',       emoji: '🎉', defaultDuration: 30 },
};

@Injectable()
export class HangoutService {
  constructor(
    @InjectModel(Hangout.name) private hangoutModel: Model<HangoutDocument>,
    @InjectModel(User.name)    private userModel:    Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  // ── Create ────────────────────────────────────────────────
  async create(initiatorId: string, dto: CreateHangoutDto): Promise<HangoutDocument> {
    const meta = HANGOUT_META[dto.type];
    const duration = dto.durationMinutes ?? meta.defaultDuration;

    const hangout = await this.hangoutModel.create({
      type:           dto.type,
      initiatorId:    new Types.ObjectId(initiatorId),
      title:          meta.title,
      message:        dto.message,
      location:       dto.location,
      durationMinutes: duration,
      invitedUsers:   dto.invitedUserIds?.map(id => new Types.ObjectId(id)) ?? [],
      expiresAt:      new Date(Date.now() + (dto.expiresInMinutes ?? 30) * 60 * 1000),
      isActive:       true,
    });

    // Notify friends
    const initiator = await this.userModel.findById(initiatorId).lean();
    const friendIds = await this.getFriendsToNotify(initiatorId, dto.invitedUserIds);

    await this.notificationsService.sendBulk(friendIds, {
      type:   dto.type as any,
      title:  `${meta.emoji} ${initiator?.displayName} started a ${meta.title}!`,
      body:   dto.message ?? `Join ${initiator?.displayName} for a ${meta.title}!`,
      data:   { hangoutId: hangout._id.toString(), type: dto.type },
    });

    return this.populate(hangout);
  }

  // ── Respond ───────────────────────────────────────────────
  async respond(hangoutId: string, userId: string, dto: RespondHangoutDto): Promise<HangoutDocument> {
    const hangout = await this.hangoutModel.findById(hangoutId);
    if (!hangout) throw new NotFoundException('Hangout not found');
    if (!hangout.isActive) throw new BadRequestException('Hangout is no longer active');
    if (hangout.expiresAt < new Date()) throw new BadRequestException('Hangout has expired');

    // Remove old response
    hangout.responses = hangout.responses.filter(r => !r.userId.equals(new Types.ObjectId(userId)));

    // Add new response
    hangout.responses.push({
      userId: new Types.ObjectId(userId) as any,
      status: dto.status,
      eta:    dto.eta,
      respondedAt: new Date(),
    } as any);

    await hangout.save();
    return this.populate(hangout);
  }

  // ── Start timer ───────────────────────────────────────────
  async startTimer(hangoutId: string, userId: string): Promise<HangoutDocument> {
    const hangout = await this.hangoutModel.findById(hangoutId);
    if (!hangout) throw new NotFoundException();
    if (!hangout.initiatorId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only the initiator can start the timer');
    }
    hangout.timerStartedAt = new Date();
    await hangout.save();
    return this.populate(hangout);
  }

  // ── Get active ────────────────────────────────────────────
  async getActive(userId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId).lean();
    const friendIds = user?.friends ?? [];

    return this.hangoutModel
      .find({
        isActive:  true,
        expiresAt: { $gt: new Date() },
        $or: [
          { initiatorId: new Types.ObjectId(userId) },
          { initiatorId: { $in: friendIds } },
          { invitedUsers: new Types.ObjectId(userId) },
        ],
      })
      .sort({ createdAt: -1 })
      .populate('initiatorId', 'displayName avatar username status')
      .populate('responses.userId', 'displayName avatar username')
      .exec();
  }

  async getById(id: string): Promise<HangoutDocument> {
    const hangout = await this.hangoutModel.findById(id);
    if (!hangout) throw new NotFoundException();
    return this.populate(hangout);
  }

  async close(id: string, userId: string): Promise<void> {
    const hangout = await this.hangoutModel.findById(id);
    if (!hangout) throw new NotFoundException();
    if (!hangout.initiatorId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException();
    }
    hangout.isActive = false;
    await hangout.save();
  }

  async getHistory(userId: string): Promise<any[]> {
    return this.hangoutModel
      .find({ initiatorId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  // ── Auto-expire stale hangouts ────────────────────────────
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireHangouts() {
    await this.hangoutModel.updateMany(
      { isActive: true, expiresAt: { $lte: new Date() } },
      { $set: { isActive: false } },
    );
  }

  // ── Helpers ───────────────────────────────────────────────
  private async populate(hangout: HangoutDocument) {
    return hangout.populate([
      { path: 'initiatorId', select: 'displayName avatar username status' },
      { path: 'responses.userId', select: 'displayName avatar username' },
    ]);
  }

  private async getFriendsToNotify(initiatorId: string, invited?: string[]): Promise<string[]> {
    if (invited?.length) return invited;
    const user = await this.userModel.findById(initiatorId).lean();
    return (user?.friends ?? []).map(id => id.toString());
  }
}
