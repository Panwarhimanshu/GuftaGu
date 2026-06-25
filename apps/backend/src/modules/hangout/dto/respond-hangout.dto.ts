import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class RespondHangoutDto {
  @IsEnum(['coming', 'not_coming', 'maybe'])
  status: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  eta?: number;
}
