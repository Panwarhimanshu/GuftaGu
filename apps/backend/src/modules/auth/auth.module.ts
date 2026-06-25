import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService }    from './auth.service';

import { JwtStrategy }     from './strategies/jwt.strategy';
import { LocalStrategy }   from './strategies/local.strategy';
import { GoogleStrategy }  from './strategies/google.strategy';

import { User, UserSchema } from '../../database/schemas/user.schema';
import { UsersModule }      from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret:      cfg.get<string>('JWT_SECRET', 'fallback-secret'),
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers:   [AuthService, JwtStrategy, LocalStrategy, GoogleStrategy],
  exports:     [AuthService, JwtModule],
})
export class AuthModule {}
