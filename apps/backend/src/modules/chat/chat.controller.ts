import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Req, Query, UseGuards, HttpCode, HttpStatus, UseInterceptors,
  UploadedFile, ParseFilePipe, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService }  from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

const MAX_UPLOAD = 100 * 1024 * 1024; // 100 MB

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ── Conversations ─────────────────────────────────────────
  @Get()
  getConversations(@Req() req: any) {
    return this.chatService.getConversations(req.user._id.toString());
  }

  @Get(':id')
  getConversation(@Param('id') id: string, @Req() req: any) {
    return this.chatService.getConversation(id, req.user._id.toString());
  }

  @Post('private')
  createPrivate(@Req() req: any, @Body('userId') targetId: string) {
    return this.chatService.createPrivate(req.user._id.toString(), targetId);
  }

  @Post('group')
  createGroup(@Req() req: any, @Body() dto: any) {
    return this.chatService.createGroup(req.user._id.toString(), dto);
  }

  // ── Messages ──────────────────────────────────────────────
  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Req() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(id, req.user._id.toString(), cursor, limit ? Number(limit) : 50);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Req() req: any, @Body() dto: CreateMessageDto) {
    return this.chatService.sendMessage(id, req.user._id.toString(), dto);
  }

  @Post(':id/media')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  uploadMedia(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD })] }))
    file: Express.Multer.File,
  ) {
    return this.chatService.sendMessage(id, req.user._id.toString(), { type: 'image' }, file);
  }

  @Patch('/messages/:msgId')
  editMessage(@Param('msgId') msgId: string, @Req() req: any, @Body('content') content: string) {
    return this.chatService.editMessage(msgId, req.user._id.toString(), content);
  }

  @Delete('/messages/:msgId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMessage(@Param('msgId') msgId: string, @Req() req: any) {
    return this.chatService.deleteMessage(msgId, req.user._id.toString());
  }

  @Post('/messages/:msgId/reactions')
  @HttpCode(HttpStatus.OK)
  reactToMessage(@Param('msgId') msgId: string, @Req() req: any, @Body('emoji') emoji: string) {
    return this.chatService.reactToMessage(msgId, req.user._id.toString(), emoji);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@Param('id') id: string, @Req() req: any, @Body('messageId') messageId: string) {
    return this.chatService.markRead(id, req.user._id.toString(), messageId);
  }

  @Post(':id/pin')
  @HttpCode(HttpStatus.OK)
  pinMessage(@Param('id') id: string, @Req() req: any, @Body('messageId') messageId: string) {
    return this.chatService.pinMessage(id, req.user._id.toString(), messageId);
  }

  @Get(':id/search')
  searchMessages(@Param('id') id: string, @Req() req: any, @Query('q') query: string) {
    return this.chatService.searchMessages(id, req.user._id.toString(), query);
  }
}
