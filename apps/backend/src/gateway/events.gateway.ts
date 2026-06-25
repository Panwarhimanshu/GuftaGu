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

    this.logger.log(`Socket disconnected: ${socket.id}`);
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
