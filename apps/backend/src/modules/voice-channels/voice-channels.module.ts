import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VoiceChannel, VoiceChannelSchema } from '../../database/schemas/voice-channel.schema';
import { VoiceChannelsService }    from './voice-channels.service';
import { VoiceChannelsController } from './voice-channels.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: VoiceChannel.name, schema: VoiceChannelSchema }]),
  ],
  controllers: [VoiceChannelsController],
  providers:   [VoiceChannelsService],
  exports:     [VoiceChannelsService],
})
export class VoiceChannelsModule {}
