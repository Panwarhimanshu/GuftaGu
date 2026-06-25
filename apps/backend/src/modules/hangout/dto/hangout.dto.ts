import {
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HangoutType {
  SMOKE_BREAK = 'smoke_break',
  COFFEE_BREAK = 'coffee_break',
  LUNCH_BREAK = 'lunch_break',
  GAMING = 'gaming',
  WALK_BREAK = 'walk_break',
  HANGOUT = 'hangout',
}

export enum HangoutResponseStatus {
  COMING = 'coming',
  NOT_COMING = 'not_coming',
  MAYBE = 'maybe',
}

export class CreateHangoutDto {
  @ApiProperty({ enum: HangoutType })
  @IsEnum(HangoutType)
  type: HangoutType;

  @ApiPropertyOptional({ example: "Anyone up for a quick smoke?" })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;

  @ApiPropertyOptional({ example: 'Building lobby' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ default: 10, minimum: 5, maximum: 120 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  durationMinutes?: number;

  @ApiPropertyOptional({ default: 30, minimum: 5, maximum: 1440 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  expiresInMinutes?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  invitedUserIds?: string[];
}

export class RespondToHangoutDto {
  @ApiProperty({ enum: HangoutResponseStatus })
  @IsEnum(HangoutResponseStatus)
  status: HangoutResponseStatus;

  @ApiPropertyOptional({ description: 'ETA in minutes', minimum: 0, maximum: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  eta?: number;
}
