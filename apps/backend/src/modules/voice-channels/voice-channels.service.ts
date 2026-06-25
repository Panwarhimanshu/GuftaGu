import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VoiceChannel, VoiceChannelDocument } from '../../database/schemas/voice-channel.schema';

@Injectable()
export class VoiceChannelsService {
  constructor(
    @InjectModel(VoiceChannel.name) private model: Model<VoiceChannelDocument>,
  ) {}

  findAll(): Promise<any[]> {
    return this.model
      .find()
      .populate('createdBy', 'displayName username avatar')
      .sort({ createdAt: 1 })
      .lean();
  }

  create(userId: string, dto: { name: string; icon?: string }): Promise<VoiceChannelDocument> {
    return this.model.create({
      name:      dto.name,
      icon:      dto.icon ?? '🔊',
      createdBy: new Types.ObjectId(userId),
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const ch = await this.model.findById(id);
    if (!ch) throw new NotFoundException();
    if (!ch.createdBy.equals(new Types.ObjectId(userId))) throw new ForbiddenException();
    await ch.deleteOne();
  }
}
