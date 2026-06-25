import {
  Controller, Post, Get, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard }     from '../auth/guards/jwt-auth.guard';
import { HangoutService }   from './hangout.service';
import { CreateHangoutDto } from './dto/create-hangout.dto';
import { RespondHangoutDto } from './dto/respond-hangout.dto';

@ApiTags('Hangouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hangouts')
export class HangoutController {
  constructor(private readonly hangoutService: HangoutService) {}

  @Post()
  @ApiOperation({ summary: 'Create a hangout / break event' })
  create(@Req() req: any, @Body() dto: CreateHangoutDto) {
    return this.hangoutService.create(req.user._id.toString(), dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active hangouts for current user' })
  getActive(@Req() req: any) {
    return this.hangoutService.getActive(req.user._id.toString());
  }

  @Get('history')
  getHistory(@Req() req: any) {
    return this.hangoutService.getHistory(req.user._id.toString());
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.hangoutService.getById(id);
  }

  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to a hangout invite' })
  respond(@Param('id') id: string, @Req() req: any, @Body() dto: RespondHangoutDto) {
    return this.hangoutService.respond(id, req.user._id.toString(), dto);
  }

  @Post(':id/timer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the group countdown timer' })
  startTimer(@Param('id') id: string, @Req() req: any) {
    return this.hangoutService.startTimer(id, req.user._id.toString());
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  close(@Param('id') id: string, @Req() req: any) {
    return this.hangoutService.close(id, req.user._id.toString());
  }
}
