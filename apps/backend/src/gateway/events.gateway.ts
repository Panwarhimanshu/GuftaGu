import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit,
  MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument }     from '../database/schemas/user.schema';
import { Message, MessageDocument } from '../database/schemas/message.schema';
import { Hangout, HangoutDocument } from '../database/schemas/hangout.schema';
import { SocketEvents } from '@memechat/shared';

interface AuthSocket extends Socket {
  userId: string;
  user: UserDocument;
}

@WebSocketGateway({ cors: { origin: '*', credentials: true } })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('EventsGateway');

  // userId → Set of socket IDs
  private onlineUsers = new Map<string, Set<string>>();

  // channelId → Map<socketId, { userId, displayName }>
  private voiceRooms = new Map<string, Map<string, { userId: string; displayName: string }>>();

  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name)    private userModel:    Model<UserDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Hangout.name) private hangoutModel: Model<HangoutDocument>,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  // ── Connection ────────────────────────────────────────────
  async handleConnection(socket: AuthSocket) {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) { socket.disconnect(); return; }

      const payload = this.jwtService.verify(token);
      const user    = await this.userModel.findById(payload.sub);
      if (!user) { socket.disconnect(); return; }

      socket.userId = user._id.toString();
      socket.user   = user;

      // Track online
      if (!this.onlineUsers.has(socket.userId)) {
        this.onlineUsers.set(socket.userId, new Set());
      }
      this.onlineUsers.get(socket.userId)!.add(socket.id);

      // Join personal room
      socket.join(`user:${socket.userId}`);

      // Set online in DB
      await this.userModel.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      // Broadcast presence
      this.server.emit(SocketEvents.USER_ONLINE, {
        userId:   socket.userId,
        status:   user.status,
        isOnline: true,
      });

      this.logger.log(`User ${user.username} connected (${socket.id})`);
    } catch {
      socket.disconnect();
    }
  }

  // ── Disconnection ─────────────────────────────────────────
  async handleDisconnect(socket: AuthSocket) {
    if (!socket.userId) return;

    const sockets = this.onlineUsers.get(socket.userId);
    sockets?.delete(socket.id);

    // Only go offline if no remaining sockets
    if (!sockets?.size) {
      this.onlineUsers.delete(socket.userId);

      await this.userModel.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      this.server.emit(SocketEvents.USER_OFFLINE, {
        userId: socket.userId,
        lastSeen: new Date(),
      });
    }

    // Clean up voice rooms
    this.voiceRooms.forEach((participants, channelId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        this.server.to(`voice:${channelId}`).emit('voice:user-left', {
          channelId,
          socketId: socket.id,
          userId:   socket.userId,
        });
      }
    });

    this.logger.log(`Socket disconnected: ${socket.id}`);
  }

  // ── Voice channel WebRTC signaling ────────────────────────
  @SubscribeMessage('voice:join')
  handleVoiceJoin(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { channelId: string },
  ) {
    const { channelId } = data;
    const room = `voice:${channelId}`;

    if (!this.voiceRooms.has(channelId)) {
      this.voiceRooms.set(channelId, new Map());
    }
    const participants = this.voiceRooms.get(channelId)!;

    // Give the new joiner the current participant list
    const currentUsers = Array.from(participants.entries()).map(([sid, info]) => ({
      socketId:    sid,
      userId:      info.userId,
      displayName: info.displayName,
    }));
    socket.emit('voice:room-users', { channelId, users: currentUsers });

    // Track & join room
    participants.set(socket.id, {
      userId:      socket.userId,
      displayName: socket.user?.displayName ?? 'Unknown',
    });
    socket.join(room);

    // Tell everyone else
    socket.to(room).emit('voice:user-joined', {
      channelId,
      socketId:    socket.id,
      userId:      socket.userId,
      displayName: socket.user?.displayName ?? 'Unknown',
    });
  }

  @SubscribeMessage('voice:leave')
  handleVoiceLeave(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { channelId: string },
  ) {
    const { channelId } = data;
    this.voiceRooms.get(channelId)?.delete(socket.id);
    socket.leave(`voice:${channelId}`);
    socket.to(`voice:${channelId}`).emit('voice:user-left', {
      channelId,
      socketId: socket.id,
      userId:   socket.userId,
    });
  }

  @SubscribeMessage('voice:offer')
  handleVoiceOffer(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { to: string; offer: RTCSessionDescriptionInit; channelId: string },
  ) {
    this.server.to(data.to).emit('voice:offer', {
      from:        socket.id,
      fromUserId:  socket.userId,
      offer:       data.offer,
      channelId:   data.channelId,
    });
  }

  @SubscribeMessage('voice:answer')
  handleVoiceAnswer(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { to: string; answer: RTCSessionDescriptionInit },
  ) {
    this.server.to(data.to).emit('voice:answer', {
      from:   socket.id,
      answer: data.answer,
    });
  }

  @SubscribeMessage('voice:ice-candidate')
  handleVoiceIce(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { to: string; candidate: RTCIceCandidateInit },
  ) {
    this.server.to(data.to).emit('voice:ice-candidate', {
      from:      socket.id,
      candidate: data.candidate,
    });
  }

  // Return participant list for a channel (REST helper)
  getVoiceRoomParticipants(channelId: string) {
    const participants = this.voiceRooms.get(channelId);
    if (!participants) return [];
    return Array.from(participants.entries()).map(([sid, info]) => ({
      socketId:    sid,
      userId:      info.userId,
      displayName: info.displayName,
    }));
  }

  // ── Room management ───────────────────────────────────────
  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  handleJoinRoom(@ConnectedSocket() socket: AuthSocket, @MessageBody() roomId: string) {
    socket.join(roomId);
  }

  @SubscribeMessage(SocketEvents.LEAVE_ROOM)
  handleLeaveRoom(@ConnectedSocket() socket: AuthSocket, @MessageBody() roomId: string) {
    socket.leave(roomId);
  }

  // ── Typing ────────────────────────────────────────────────
  @SubscribeMessage(SocketEvents.TYPING_START)
  handleTypingStart(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    socket.to(data.conversationId).emit(SocketEvents.TYPING_START, {
      userId:         socket.userId,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage(SocketEvents.TYPING_STOP)
  handleTypingStop(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    socket.to(data.conversationId).emit(SocketEvents.TYPING_STOP, {
      userId:         socket.userId,
      conversationId: data.conversationId,
    });
  }

  // ── Message seen ──────────────────────────────────────────
  @SubscribeMessage(SocketEvents.MESSAGE_SEEN)
  async handleMessageSeen(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    await this.messageModel.findByIdAndUpdate(data.messageId, {
      $addToSet: { seenBy: new Types.ObjectId(socket.userId) },
      $set:      { status: 'seen' },
    });

    socket.to(data.conversationId).emit(SocketEvents.MESSAGE_SEEN, {
      messageId:      data.messageId,
      seenBy:         socket.userId,
      conversationId: data.conversationId,
    });
  }

  // ── Public emit helpers ───────────────────────────────────

  /** Emit to a specific conversation room */
  emitToConversation(conversationId: string, event: string, data: unknown) {
    this.server.to(conversationId).emit(event, data);
  }

  /** Emit to a specific user (all their sockets) */
  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /** Emit to multiple users */
  emitToUsers(userIds: string[], event: string, data: unknown) {
    userIds.forEach(id => this.emitToUser(id, event, data));
  }

  /** Broadcast hangout event to friends */
  broadcastHangout(friendIds: string[], hangout: unknown) {
    this.emitToUsers(friendIds, SocketEvents.HANGOUT_CREATED, hangout);
  }

  /** Update hangout state */
  updateHangout(friendIds: string[], hangout: unknown) {
    this.emitToUsers(friendIds, SocketEvents.HANGOUT_UPDATED, hangout);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && (this.onlineUsers.get(userId)?.size ?? 0) > 0;
  }
}
