import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService }    from './ai.service';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  summarize(@Body('messages') messages: any[]) {
    return this.aiService.summarizeChat(messages);
  }

  @Post('translate')
  translate(@Body('text') text: string, @Body('language') language: string) {
    return this.aiService.translateMessage(text, language);
  }

  @Post('smart-replies')
  smartReplies(@Body('context') context: string) {
    return this.aiService.getSmartReplies(context);
  }

  @Post('meeting-notes')
  meetingNotes(@Body('conversation') conversation: string) {
    return this.aiService.generateMeetingNotes(conversation);
  }
}
