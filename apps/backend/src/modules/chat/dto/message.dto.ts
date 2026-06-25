import {
  IsString,
  IsOptional,
  IsIn,
  IsMongoId,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@memechat/shared';

const MESSAGE_TYPES = ['text','image','video','audio','voice_note','document','gif','sticker','location','poll','system'] as const;

export class SendMessageDto {
  @ApiProperty({ enum: MESSAGE_TYPES })
  @IsIn(MESSAGE_TYPES)
  type: MessageType;

  @ApiPropertyOptional({ example: 'Hey, coffee break?' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  replyTo?: string;
}

export class EditMessageDto {
  @ApiProperty({ example: 'Edited message content' })
  @IsString()
  @MaxLength(10000)
  content: string;
}

export class ReactToMessageDto {
  @ApiProperty({ example: '❤️' })
  @IsString()
  @MaxLength(10)
  emoji: string;
}

export class GetMessagesDto {
  @ApiPropertyOptional({ description: 'Cursor (last message _id) for pagination' })
  @IsOptional()
  @IsMongoId()
  cursor?: string;

  @ApiPropertyOptional({ default: 30, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SearchMessagesDto {
  @ApiProperty({ example: 'coffee break' })
  @IsString()
  @MaxLength(200)
  q: string;
}

export class CreatePrivateConversationDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;
}

export class CreateGroupConversationDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ type: [String] })
  @IsMongoId({ each: true })
  memberIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
