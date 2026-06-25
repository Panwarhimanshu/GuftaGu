// ─────────────────────────────────────────────────────────────
// MEMECHAT — SHARED TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────

// ── User ─────────────────────────────────────────────────────
export type UserRole = 'admin' | 'moderator' | 'user';

export type UserStatus =
  | 'available'
  | 'busy'
  | 'in_meeting'
  | 'at_lunch'
  | 'smoking'
  | 'working'
  | 'gaming'
  | 'offline';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  customStatus?: string;
  isOnline: boolean;
  lastSeen: Date;
  is2FAEnabled: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Auth ─────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

// ── Message ──────────────────────────────────────────────────
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice_note'
  | 'document'
  | 'gif'
  | 'sticker'
  | 'location'
  | 'poll'
  | 'system';

export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  location?: { lat: number; lng: number; address?: string };
  poll?: Poll;
  replyTo?: string;
  reactions: MessageReaction[];
  status: MessageStatus;
  isEdited: boolean;
  isDeleted: boolean;
  isStarred: boolean;
  isBookmarked: boolean;
  forwardedFrom?: string;
  threadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Poll {
  question: string;
  options: PollOption[];
  expiresAt?: Date;
  isMultipleChoice: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

// ── Conversation ─────────────────────────────────────────────
export type ConversationType = 'private' | 'group' | 'channel';

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatar?: string;
  description?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  pinnedMessages: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  userId: string;
  user?: User;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
}

// ── Hangout ──────────────────────────────────────────────────
export type HangoutType =
  | 'smoke_break'
  | 'coffee_break'
  | 'lunch_break'
  | 'gaming'
  | 'walk_break'
  | 'hangout';

export type HangoutResponseStatus = 'coming' | 'not_coming' | 'maybe';

export interface HangoutEvent {
  id: string;
  type: HangoutType;
  initiatorId: string;
  initiator?: User;
  title: string;
  message?: string;
  location?: string;
  scheduledAt?: Date;
  durationMinutes: number;
  responses: HangoutResponse[];
  invitedUsers: string[];
  expiresAt: Date;
  isActive: boolean;
  timerStartedAt?: Date;
  createdAt: Date;
}

export interface HangoutResponse {
  userId: string;
  user?: User;
  status: HangoutResponseStatus;
  eta?: number;
  respondedAt: Date;
}

// ── Story ─────────────────────────────────────────────────────
export type StoryType = 'photo' | 'video' | 'text';

export interface Story {
  id: string;
  userId: string;
  user?: User;
  type: StoryType;
  mediaUrl?: string;
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  duration: number;
  views: StoryView[];
  reactions: StoryReaction[];
  expiresAt: Date;
  createdAt: Date;
}

export interface StoryView {
  userId: string;
  viewedAt: Date;
}

export interface StoryReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

// ── Meme Feed ─────────────────────────────────────────────────
export interface MemeFeedPost {
  id: string;
  authorId: string;
  author?: User;
  imageUrl: string;
  caption?: string;
  tags: string[];
  likes: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isSaved: boolean;
  isReposted: boolean;
  originalPostId?: string;
  createdAt: Date;
}

export interface MemeComment {
  id: string;
  postId: string;
  authorId: string;
  author?: User;
  content: string;
  likes: string[];
  createdAt: Date;
}

// ── Voice Channel ─────────────────────────────────────────────
export interface VoiceChannel {
  id: string;
  name: string;
  icon?: string;
  participants: VoiceParticipant[];
  isPrivate: boolean;
  maxParticipants?: number;
  bitrate: number;
  createdAt: Date;
}

export interface VoiceParticipant {
  userId: string;
  user?: User;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAt: Date;
}

// ── Call ─────────────────────────────────────────────────────
export type CallType = 'voice' | 'video';
export type CallStatus =
  | 'ringing'
  | 'ongoing'
  | 'ended'
  | 'missed'
  | 'declined';

export interface Call {
  id: string;
  type: CallType;
  initiatorId: string;
  participants: CallParticipant[];
  status: CallStatus;
  roomId: string;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  isRecording: boolean;
  createdAt: Date;
}

export interface CallParticipant {
  userId: string;
  user?: User;
  joinedAt?: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
}

// ── Notification ──────────────────────────────────────────────
export type NotificationType =
  | 'new_message'
  | 'video_call'
  | 'voice_call'
  | 'mention'
  | 'hangout_request'
  | 'smoke_break'
  | 'coffee_break'
  | 'lunch_break'
  | 'story_reaction'
  | 'friend_request'
  | 'friend_accepted'
  | 'meme_like'
  | 'meme_comment';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// ── Socket Events ─────────────────────────────────────────────
export const SocketEvents = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',

  // Presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_STATUS_CHANGED: 'user:status_changed',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Messages
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_SEEN: 'message:seen',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_REACTION: 'message:reaction',

  // Hangout
  HANGOUT_CREATED: 'hangout:created',
  HANGOUT_RESPONSE: 'hangout:response',
  HANGOUT_UPDATED: 'hangout:updated',
  HANGOUT_EXPIRED: 'hangout:expired',
  HANGOUT_TIMER_STARTED: 'hangout:timer_started',

  // Calls
  CALL_INITIATED: 'call:initiated',
  CALL_ACCEPTED: 'call:accepted',
  CALL_DECLINED: 'call:declined',
  CALL_ENDED: 'call:ended',
  CALL_PARTICIPANT_JOINED: 'call:participant_joined',
  CALL_PARTICIPANT_LEFT: 'call:participant_left',

  // Voice Channels
  VOICE_CHANNEL_JOIN: 'voice_channel:join',
  VOICE_CHANNEL_LEAVE: 'voice_channel:leave',
  VOICE_CHANNEL_SPEAKING: 'voice_channel:speaking',

  // Stories
  STORY_CREATED: 'story:created',
  STORY_VIEWED: 'story:viewed',
  STORY_REACTION: 'story:reaction',

  // Notifications
  NOTIFICATION: 'notification',
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];

// ── Pagination ────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  cursor?: string;
}

// ── API Response ──────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}
