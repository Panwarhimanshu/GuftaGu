import { Controller, Post, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard }        from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  registerToken(@Req() req: any, @Body('token') token: string) {
    return this.notificationsService.registerToken(req.user._id.toString(), token);
  }

  @Delete('remove-token')
  removeToken(@Req() req: any, @Body('token') token: string) {
    return this.notificationsService.removeToken(req.user._id.toString(), token);
  }
}
