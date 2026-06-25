import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

import { User, UserDocument } from '../../database/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ── Register ──────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists) throw new ConflictException('Email or username already taken');

    const user = await this.userModel.create(dto);
    return this.buildTokenResponse(user);
  }

  // ── Validate local ────────────────────────────────────────
  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user?.password) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (user.isBanned) throw new ForbiddenException('Account has been banned');
    return user;
  }

  // ── Login ─────────────────────────────────────────────────
  async login(user: UserDocument) {
    return this.buildTokenResponse(user);
  }

  // ── Refresh token ─────────────────────────────────────────
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.userModel.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.buildTokenResponse(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ── Google OAuth ──────────────────────────────────────────
  async googleLogin(profile: any) {
    let user = await this.userModel.findOne({ googleId: profile.id });
    if (!user) {
      user = await this.userModel.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id;
        await user.save();
      } else {
        user = await this.userModel.create({
          googleId:       profile.id,
          email:          profile.emails[0].value,
          displayName:    profile.displayName,
          username:       await this.generateUsername(profile.displayName),
          avatar:         profile.photos?.[0]?.value,
          isEmailVerified: true,
        });
      }
    }
    return this.buildTokenResponse(user);
  }

  // ── OTP ───────────────────────────────────────────────────
  async sendOtp(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);

    user.emailVerificationToken = `${hash}:${Date.now() + 10 * 60 * 1000}`;
    await user.save();

    // TODO: Send via email/SMS service
    return { message: 'OTP sent', otp: process.env.NODE_ENV === 'development' ? otp : undefined };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userModel.findOne({ email }).select('+emailVerificationToken');
    if (!user?.emailVerificationToken) throw new BadRequestException('No OTP pending');

    const [hash, expiry] = user.emailVerificationToken.split(':');
    if (Date.now() > Number(expiry)) throw new BadRequestException('OTP expired');

    const valid = await bcrypt.compare(otp, hash);
    if (!valid) throw new BadRequestException('Invalid OTP');

    user.emailVerificationToken = undefined;
    user.isEmailVerified = true;
    await user.save();

    return this.buildTokenResponse(user);
  }

  // ── Password reset ────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) return { message: 'If email exists, reset link was sent' };

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = await bcrypt.hash(token, 8);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // TODO: send email with reset link
    return { message: 'Reset link sent', token: process.env.NODE_ENV === 'development' ? token : undefined };
  }

  async resetPassword(token: string, password: string) {
    const users = await this.userModel
      .find({ passwordResetExpires: { $gt: new Date() } })
      .select('+passwordResetToken');

    const user = await Promise.all(
      users.map(async u => (await bcrypt.compare(token, u.passwordResetToken ?? '')) ? u : null),
    ).then(res => res.find(Boolean));

    if (!user) throw new BadRequestException('Invalid or expired token');

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password updated' };
  }

  // ── 2FA ───────────────────────────────────────────────────
  async setup2FA(userId: string) {
    const user = await this.userModel.findById(userId);
    const secret = authenticator.generateSecret();
    user.twoFactorSecret = secret;
    await user.save();

    const otpauth = authenticator.keyuri(user.email, 'MemeChat', secret);
    const qrCode = await QRCode.toDataURL(otpauth);
    return { qrCode, secret };
  }

  async verify2FA(userId: string, token: string) {
    const user = await this.userModel.findById(userId).select('+twoFactorSecret');
    if (!user?.twoFactorSecret) throw new BadRequestException('2FA not set up');

    const valid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!valid) throw new BadRequestException('Invalid 2FA token');

    user.is2FAEnabled = true;
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    user.twoFactorBackupCodes = await Promise.all(backupCodes.map(c => bcrypt.hash(c, 8)));
    await user.save();

    return { backupCodes };
  }

  // ── Helpers ───────────────────────────────────────────────
  private buildTokenResponse(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret:    this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60,
      user: this.sanitizeUser(user),
    };
  }

  private sanitizeUser(user: UserDocument) {
    const u = user.toObject();
    delete u.password;
    delete u.twoFactorSecret;
    delete u.emailVerificationToken;
    delete u.passwordResetToken;
    return u;
  }

  private async generateUsername(displayName: string): Promise<string> {
    const base = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    let username = base;
    let i = 0;
    while (await this.userModel.exists({ username })) {
      username = `${base}${++i}`;
    }
    return username;
  }
}
