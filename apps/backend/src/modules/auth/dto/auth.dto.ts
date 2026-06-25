import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsJWT,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'username can only contain letters, numbers, underscores' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ng!Pass' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'password must have uppercase, lowercase, number and special character',
  })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ng!Pass' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsJWT()
  refreshToken: string;
}

export class SendOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewStr0ng!Pass' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'password must have uppercase, lowercase, number and special character',
  })
  newPassword: string;
}

export class Verify2FADto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(8)
  token: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backupCode?: string;
}
