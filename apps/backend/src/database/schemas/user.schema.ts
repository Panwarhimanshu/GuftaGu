import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  username: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ select: false })
  password: string;

  @Prop()
  avatar: string;

  @Prop({ maxlength: 200 })
  bio: string;

  @Prop({ enum: ['admin', 'moderator', 'user'], default: 'user' })
  role: string;

  @Prop({
    enum: ['available', 'busy', 'in_meeting', 'at_lunch', 'smoking', 'working', 'gaming', 'offline'],
    default: 'available',
  })
  status: string;

  @Prop()
  customStatus: string;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: Date.now })
  lastSeen: Date;

  // OAuth
  @Prop()
  googleId: string;

  @Prop()
  microsoftId: string;

  @Prop()
  appleId: string;

  // 2FA
  @Prop({ default: false })
  is2FAEnabled: boolean;

  @Prop({ select: false })
  twoFactorSecret: string;

  @Prop({ type: [String], select: false })
  twoFactorBackupCodes: string[];

  // Email verification
  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ select: false })
  emailVerificationToken: string;

  // Password reset
  @Prop({ select: false })
  passwordResetToken: string;

  @Prop({ select: false })
  passwordResetExpires: Date;

  // Friends / connections
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  friends: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  friendRequests: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  blockedUsers: Types.ObjectId[];

  // FCM tokens
  @Prop({ type: [String] })
  fcmTokens: string[];

  // Settings
  @Prop({
    type: {
      notifications: { type: Boolean, default: true },
      sounds:        { type: Boolean, default: true },
      theme:         { type: String,  default: 'system' },
    },
    default: {},
  })
  settings: Record<string, unknown>;

  // Ban/suspension
  @Prop({ default: false })
  isBanned: boolean;

  @Prop()
  banReason: string;

  @Prop({ default: false })
  isMuted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// ── Indexes ──────────────────────────────────────────────────
UserSchema.index({ username: 'text', displayName: 'text' });
UserSchema.index({ isOnline: 1 });
UserSchema.index({ googleId: 1 }, { sparse: true });

// ── Password hashing ─────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};
