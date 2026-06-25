import {
  Controller, Post, Body, Get, UseGuards, Req, Res,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService }  from './auth.service';
import { RegisterDto }  from './dto/register.dto';
import { LoginDto }     from './dto/login.dto';
import { RefreshDto }   from './dto/refresh.dto';
import { SendOtpDto }   from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { LocalAuthGuard }    from './guards/local-auth.guard';
import { JwtAuthGuard }      from './guards/jwt-auth.guard';
import { GoogleAuthGuard }   from './guards/google-auth.guard';

@ApiTags('Auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email & password' })
  async login(@Req() req: any) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async me(@Req() req: any) {
    return req.user;
  }

  // ── Google OAuth ────────────────────────────────────────
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth redirect' })
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: any) {
    const tokens = await this.authService.googleLogin(req.user);
    const frontendUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    const params = new URLSearchParams({
      accessToken:  tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }

  // ── OTP ─────────────────────────────────────────────────
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to email' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.email);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and login' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  // ── Password reset ───────────────────────────────────────
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  // ── 2FA ─────────────────────────────────────────────────
  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setup2FA(@Req() req: any) {
    return this.authService.setup2FA(req.user._id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async verify2FA(@Req() req: any, @Body('token') token: string) {
    return this.authService.verify2FA(req.user._id, token);
  }
}
