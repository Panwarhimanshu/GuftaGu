import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../database/schemas/user.schema';

interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private logger = new Logger('NotificationsService');
  private firebaseInitialized = false;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    try {
      const projectId    = this.configService.get('FIREBASE_PROJECT_ID');
      const clientEmail  = this.configService.get('FIREBASE_CLIENT_EMAIL');
      const privateKey   = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey && !admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
        this.firebaseInitialized = true;
        this.logger.log('Firebase Admin initialized');
      }
    } catch (e) {
      this.logger.warn('Firebase not configured — push notifications disabled');
    }
  }

  // ── Send to single user ───────────────────────────────────
  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    const user = await this.userModel.findById(userId).select('fcmTokens settings').lean();
    if (!user?.fcmTokens?.length) return;
    if (!user.settings?.notifications) return;

    await this.sendFCM(user.fcmTokens, payload);
  }

  // ── Send to multiple users ────────────────────────────────
  async sendBulk(userIds: string[], payload: NotificationPayload): Promise<void> {
    if (!userIds.length) return;

    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('fcmTokens settings')
      .lean();

    const tokens = users
      .filter(u => u.settings?.notifications !== false)
      .flatMap(u => u.fcmTokens ?? []);

    if (tokens.length) await this.sendFCM(tokens, payload);
  }

  // ── Register FCM token ────────────────────────────────────
  async registerToken(userId: string, token: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: token },
    });
  }

  async removeToken(userId: string, token: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: token },
    });
  }

  // ── Internal ──────────────────────────────────────────────
  private async sendFCM(tokens: string[], payload: NotificationPayload): Promise<void> {
    if (!this.firebaseInitialized || !tokens.length) return;

    try {
      const stringData: Record<string, string> = {};
      if (payload.data) {
        Object.entries(payload.data).forEach(([k, v]) => {
          stringData[k] = String(v);
        });
      }
      stringData.type = payload.type;

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: { title: payload.title, body: payload.body },
        data:         stringData,
        android: {
          priority: 'high',
          notification: { sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: { aps: { sound: 'default', badge: 1 } },
        },
        webpush: {
          headers: { Urgency: 'high' },
          notification: { icon: '/icons/icon-192x192.png', badge: '/icons/badge-72x72.png' },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.debug(`FCM: ${response.successCount} sent, ${response.failureCount} failed`);

      // Clean up invalid tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((r, i) => {
        if (!r.success && r.error?.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(tokens[i]);
        }
      });
      if (invalidTokens.length) {
        await this.userModel.updateMany(
          { fcmTokens: { $in: invalidTokens } },
          { $pullAll: { fcmTokens: invalidTokens } },
        );
      }
    } catch (e) {
      this.logger.error('FCM send error', e);
    }
  }
}
