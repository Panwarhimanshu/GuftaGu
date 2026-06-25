import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHangoutDto {
  @ApiProperty({ enum: ['smoke_break','coffee_break','lunch_break','gaming','walk_break','hangout'] })
  @IsEnum(['smoke_break','coffee_break','lunch_break','gaming','walk_break','hangout'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  expiresInMinutes?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  invitedUserIds?: string[];
}
