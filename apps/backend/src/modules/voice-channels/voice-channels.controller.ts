import {
  Controller, Get, Post, Delete, Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoiceChannelsService } from './voice-channels.service';

@ApiTags('VoiceChannels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('voice-channels')
export class VoiceChannelsController {
  constructor(private readonly svc: VoiceChannelsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  create(@Req() req: any, @Body() body: { name: string; icon?: string }) {
    return this.svc.create(req.user._id.toString(), body);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.svc.delete(id, req.user._id.toString());
  }
}
