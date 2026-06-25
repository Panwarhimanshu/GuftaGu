import {
  Controller, Get, Patch, Post, Body, Param, Query,
  Req, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard }  from '../auth/guards/jwt-auth.guard';
import { UsersService }  from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('friends/online')
  getOnlineFriends(@Req() req: any) {
    return this.usersService.getOnlineFriends(req.user._id.toString());
  }

  @Get('friends')
  getFriends(@Req() req: any) {
    return this.usersService.getFriends(req.user._id.toString());
  }

  @Get('online')
  getOnlineUsers(@Req() req: any) {
    return this.usersService.getOnlineUsers(req.user._id.toString());
  }

  @Get('discover')
  discoverUsers(@Req() req: any) {
    return this.usersService.discoverUsers(req.user._id.toString());
  }

  @Get('me/friend-requests')
  getFriendRequests(@Req() req: any) {
    return this.usersService.getFriendRequests(req.user._id.toString());
  }

  @Get('search')
  searchUsers(@Query('q') query: string, @Req() req: any) {
    return this.usersService.searchUsers(query, req.user._id.toString());
  }

  @Get(':id')
  getProfile(@Param('id') id: string, @Req() req: any) {
    return this.usersService.getProfile(id, req.user._id.toString());
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  updateProfile(
    @Req() req: any,
    @Body() updates: any,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(req.user._id.toString(), updates, avatar);
  }

  @Patch('me/status')
  updateStatus(
    @Req() req: any,
    @Body('status') status: string,
    @Body('customStatus') customStatus?: string,
  ) {
    return this.usersService.updateStatus(req.user._id.toString(), status, customStatus);
  }

  @Post(':id/friend-request')
  sendFriendRequest(@Param('id') id: string, @Req() req: any) {
    return this.usersService.sendFriendRequest(req.user._id.toString(), id);
  }

  @Post(':id/friend-request/accept')
  acceptFriendRequest(@Param('id') id: string, @Req() req: any) {
    return this.usersService.acceptFriendRequest(req.user._id.toString(), id);
  }

  @Post(':id/friend-request/decline')
  declineFriendRequest(@Param('id') id: string, @Req() req: any) {
    return this.usersService.declineFriendRequest(req.user._id.toString(), id);
  }

  @Post(':id/block')
  blockUser(@Param('id') id: string, @Req() req: any) {
    return this.usersService.blockUser(req.user._id.toString(), id);
  }
}
