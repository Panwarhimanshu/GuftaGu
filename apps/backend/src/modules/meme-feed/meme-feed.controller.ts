import {
  Controller, Get, Post, Delete, Param, Body, Req, Query,
  UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard }   from '../auth/guards/jwt-auth.guard';
import { MemeFeedService } from './meme-feed.service';

@ApiTags('Meme Feed')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meme-feed')
export class MemeFeedController {
  constructor(private readonly memeFeedService: MemeFeedService) {}

  @Get()
  getFeed(@Req() req: any, @Query('cursor') cursor?: string, @Query('limit') limit?: string): Promise<any> {
    return this.memeFeedService.getFeed(req.user._id.toString(), cursor, limit ? Number(limit) : 20);
  }

  @Get('trending')
  getTrending() {
    return this.memeFeedService.getTrending();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
    @Body('tags') tagsJson?: string,
  ) {
    const tags = tagsJson ? JSON.parse(tagsJson) : [];
    return this.memeFeedService.upload(req.user._id.toString(), file, caption, tags);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  like(@Param('id') id: string, @Req() req: any) {
    return this.memeFeedService.toggleLike(id, req.user._id.toString());
  }

  @Post(':id/save')
  @HttpCode(HttpStatus.OK)
  save(@Param('id') id: string, @Req() req: any) {
    return this.memeFeedService.toggleSave(id, req.user._id.toString());
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @Req() req: any) {
    return this.memeFeedService.delete(id, req.user._id.toString());
  }
}
