import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private model: string;
  private logger = new Logger('AiService');

  constructor(private configService: ConfigService) {
    const apiKey = configService.get<string>('OPENAI_API_KEY');
    this.model   = configService.get<string>('OPENAI_MODEL', 'gpt-4o');

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI key not configured — AI features disabled');
    }
  }

  async summarizeChat(messages: { role: string; content: string }[]): Promise<string> {
    if (!this.openai) return 'AI not configured';

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Summarize the following chat conversation in 3-5 bullet points. Be concise and highlight key decisions, topics, and action items.',
        },
        ...messages.map(m => ({ role: m.role as any, content: m.content })),
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content ?? '';
  }

  async translateMessage(text: string, targetLanguage: string): Promise<string> {
    if (!this.openai) return text;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role:    'system',
          content: `Translate the following text to ${targetLanguage}. Return only the translation.`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content ?? text;
  }

  async getSmartReplies(context: string): Promise<string[]> {
    if (!this.openai) return [];

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role:    'system',
          content: 'Generate 3 short, natural smart reply suggestions for the following message. Return them as a JSON array of strings.',
        },
        { role: 'user', content: context },
      ],
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    try {
      const parsed = JSON.parse(response.choices[0].message.content ?? '{}');
      return parsed.replies ?? parsed.suggestions ?? [];
    } catch {
      return [];
    }
  }

  async transcribeVoice(audioBuffer: Buffer): Promise<string> {
    if (!this.openai) return '';

    const file = new File([new Uint8Array(audioBuffer)], 'audio.webm', { type: 'audio/webm' });
    const response = await this.openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    return response.text;
  }

  async generateMeetingNotes(conversation: string): Promise<string> {
    if (!this.openai) return '';

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role:    'system',
          content: 'Generate structured meeting notes from this conversation. Include: Summary, Key Points, Action Items, and Decisions Made.',
        },
        { role: 'user', content: conversation },
      ],
      max_tokens: 800,
    });

    return response.choices[0].message.content ?? '';
  }
}
