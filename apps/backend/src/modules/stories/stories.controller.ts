import {
  Controller, Get, Post, Delete, Param, Body, Req,
  UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard }   from '../auth/guards/jwt-auth.guard';
import { StoriesService } from './stories.service';

@ApiTags('Stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  getFeed(@Req() req: any) {
    return this.storiesService.getFeed(req.user._id.toString());
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@Req() req: any, @Body() dto: any, @UploadedFile() file?: Express.Multer.File) {
    return this.storiesService.create(req.user._id.toString(), dto, file);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  view(@Param('id') id: string, @Req() req: any) {
    return this.storiesService.view(id, req.user._id.toString());
  }

  @Post(':id/react')
  @HttpCode(HttpStatus.OK)
  react(@Param('id') id: string, @Req() req: any, @Body('emoji') emoji: string) {
    return this.storiesService.react(id, req.user._id.toString(), emoji);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @Req() req: any) {
    return this.storiesService.delete(id, req.user._id.toString());
  }
}
