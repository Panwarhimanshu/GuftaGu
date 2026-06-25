import { Controller, Post, Body, Req, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CallsService } from './calls.service';

@ApiTags('Calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('token')
  async getToken(
    @Req() req: any,
    @Body('roomName') roomName: string,
    @Body('participantName') participantName: string,
  ) {
    const token = await this.callsService.generateToken(roomName, participantName, req.user._id.toString());
    return { token, url: process.env.LIVEKIT_URL };
  }

  @Post('room')
  async createRoom(@Body('roomName') roomName: string) {
    return this.callsService.createRoom(roomName);
  }
}
