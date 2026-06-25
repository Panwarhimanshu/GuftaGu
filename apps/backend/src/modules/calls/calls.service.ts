import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

@Injectable()
export class CallsService {
  private logger = new Logger('CallsService');
  private livekitUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(private configService: ConfigService) {
    this.livekitUrl = configService.get<string>('LIVEKIT_URL', 'ws://localhost:7880');
    this.apiKey     = configService.get<string>('LIVEKIT_API_KEY', 'devkey');
    this.apiSecret  = configService.get<string>('LIVEKIT_API_SECRET', 'secret');
  }

  async createRoom(roomName: string): Promise<{ name: string; url: string }> {
    const svc = new RoomServiceClient(this.livekitUrl, this.apiKey, this.apiSecret);
    const room = await svc.createRoom({ name: roomName, maxParticipants: 50 });
    return { name: room.name, url: this.livekitUrl };
  }

  async generateToken(roomName: string, participantName: string, userId: string): Promise<string> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: userId,
      name:     participantName,
      ttl:      '2h',
    });

    at.addGrant({
      roomJoin:       true,
      room:           roomName,
      canPublish:     true,
      canSubscribe:   true,
      canPublishData: true,
    });

    return at.toJwt();
  }

  async deleteRoom(roomName: string): Promise<void> {
    const svc = new RoomServiceClient(this.livekitUrl, this.apiKey, this.apiSecret);
    await svc.deleteRoom(roomName);
  }

  generateRoomName(type: 'call' | 'voice', ...ids: string[]): string {
    return `${type}-${ids.sort().join('-')}-${Date.now()}`;
  }
}
