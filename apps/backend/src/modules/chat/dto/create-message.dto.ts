import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsEnum(['text','image','video','audio','voice_note','document','gif','sticker','location','poll'])
  type: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  replyTo?: string;
}
