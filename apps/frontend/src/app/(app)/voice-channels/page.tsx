'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { Avatar } from '@/components/ui/Avatar';
import {
  Radio, Plus, Mic, MicOff, PhoneOff, X, Volume2, Users, Hash,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────

interface Channel {
  id: string;
  name: string;
  icon: string;
  createdBy: { id: string; displayName: string; avatar?: string };
  maxParticipants: number;
  createdAt: string;
}

interface VoicePeer {
  socketId:    string;
  userId:      string;
  displayName: string;
  stream?:     MediaStream;
  isSpeaking:  boolean;
}

const STUN = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ── Voice Room Hook ───────────────────────────────────────────

function useVoiceRoom(channelId: string | null) {
  const { socket } = useSocket();
  const { user }   = useAuthStore();

  const localStream   = useRef<MediaStream | null>(null);
  const peers         = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioEls      = useRef<Map<string, HTMLAudioElement>>(new Map());

  const [participants, setParticipants] = useState<VoicePeer[]>([]);
  const [isMuted,      setIsMuted]      = useState(false);
  const [micError,     setMicError]     = useState<string | null>(null);

  const createPeer = useCallback((toSocketId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(STUN);

    localStream.current?.getTracks().forEach(t => pc.addTrack(t, localStream.current!));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket?.emit('voice:ice-candidate', { to: toSocketId, candidate });
    };

    pc.ontrack = ({ streams: [stream] }) => {
      let audio = audioEls.current.get(toSocketId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioEls.current.set(toSocketId, audio);
      }
      audio.srcObject = stream;

      // Speaking detection
      try {
        const ctx    = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const anal   = ctx.createAnalyser();
        anal.fftSize = 256;
        source.connect(anal);
        const buf = new Uint8Array(anal.fftSize);

        const tick = () => {
          anal.getByteFrequencyData(buf);
          const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
          setParticipants(prev =>
            prev.map(p =>
              p.socketId === toSocketId ? { ...p, isSpeaking: avg > 15 } : p,
            ),
          );
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch {/* ignore */}
    };

    peers.current.set(toSocketId, pc);
    return pc;
  }, [socket]);

  // Join / leave
  useEffect(() => {
    if (!channelId || !socket) return;

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStream.current = stream;
        setMicError(null);
      } catch {
        setMicError('Microphone access denied. Please allow mic permission.');
        return;
      }

      socket.emit('voice:join', { channelId });

      // Existing participants → send offers
      socket.once('voice:room-users', async ({ users }: { users: VoicePeer[] }) => {
        if (cancelled) return;
        setParticipants(users.map(u => ({ ...u, isSpeaking: false })));

        for (const p of users) {
          const pc    = createPeer(p.socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('voice:offer', { to: p.socketId, offer, channelId });
        }
      });
    })();

    // New user joined → update participants list ONLY; the new joiner will send offers to us
    const onUserJoined = (data: { socketId: string; userId: string; displayName: string; channelId: string }) => {
      if (data.userId === user?.id) return;
      setParticipants(prev => [
        ...prev.filter(p => p.socketId !== data.socketId),
        { socketId: data.socketId, userId: data.userId, displayName: data.displayName, isSpeaking: false },
      ]);
    };

    // Receive offer from new joiner → answer (never initiate here; avoids WebRTC glare)
    const onOffer = async ({ from, offer }: any) => {
      let pc = peers.current.get(from);
      if (!pc) pc = createPeer(from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('voice:answer', { to: from, answer });
      } catch (err) {
        console.warn('voice:offer handling error', err);
      }
    };

    // Receive answer
    const onAnswer = async ({ from, answer }: any) => {
      const pc = peers.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    // ICE candidate
    const onIce = async ({ from, candidate }: any) => {
      const pc = peers.current.get(from);
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    // User left
    const onUserLeft = ({ socketId }: { socketId: string }) => {
      peers.current.get(socketId)?.close();
      peers.current.delete(socketId);
      audioEls.current.get(socketId)?.remove();
      audioEls.current.delete(socketId);
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    };

    socket.on('voice:user-joined',   onUserJoined);
    socket.on('voice:offer',         onOffer);
    socket.on('voice:answer',        onAnswer);
    socket.on('voice:ice-candidate', onIce);
    socket.on('voice:user-left',     onUserLeft);

    return () => {
      cancelled = true;
      socket.emit('voice:leave', { channelId });
      socket.off('voice:user-joined',   onUserJoined);
      socket.off('voice:offer',         onOffer);
      socket.off('voice:answer',        onAnswer);
      socket.off('voice:ice-candidate', onIce);
      socket.off('voice:user-left',     onUserLeft);

      peers.current.forEach(pc => pc.close());
      peers.current.clear();
      audioEls.current.forEach(a => { a.srcObject = null; });
      audioEls.current.clear();
      localStream.current?.getTracks().forEach(t => t.stop());
      localStream.current = null;
      setParticipants([]);
    };
  }, [channelId, socket]); // eslint-disable-line

  const toggleMute = () => {
    const enabled = isMuted;
    localStream.current?.getAudioTracks().forEach(t => { t.enabled = enabled; });
    setIsMuted(!enabled);
  };

  return { participants, isMuted, micError, toggleMute };
}

// ── Main Page ─────────────────────────────────────────────────

const CHANNEL_ICONS = ['🔊', '🎵', '🎮', '📚', '☕', '🛋️', '🎤', '🏃', '🎧', '💬'];

export default function VoiceChannelsPage() {
  const qc          = useQueryClient();
  const { user }    = useAuthStore();
  const [activeId,   setActiveId]   = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [newIcon,    setNewIcon]    = useState('🔊');

  // ── Channel CRUD ────────────────────────────────────────────
  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ['voice-channels'],
    queryFn:  () => apiClient.get('/voice-channels').then(r => r.data),
    refetchInterval: 15_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; icon: string }) =>
      apiClient.post('/voice-channels', body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-channels'] });
      setShowCreate(false);
      setNewName('');
      setNewIcon('🔊');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/voice-channels/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['voice-channels'] }),
  });

  // ── Voice room ──────────────────────────────────────────────
  const { participants, isMuted, micError, toggleMute } = useVoiceRoom(activeId);
  const activeChannel = channels.find(c => c.id === activeId);

  const handleJoin = (channelId: string) => {
    if (activeId === channelId) return;
    setActiveId(channelId);
  };

  const handleLeave = () => setActiveId(null);

  return (
    <div className="flex-1 overflow-y-auto neu-scroll p-4 md:p-6 space-y-6 pb-40">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Voice Channels</h1>
            <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Jump in and talk with everyone</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-neu-sm font-semibold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
        >
          <Plus className="w-4 h-4" /> New Channel
        </motion.button>
      </motion.div>

      {/* Mic error banner */}
      {micError && activeId && (
        <div className="p-3 rounded-neu-sm text-sm font-medium text-red-500 bg-red-500/10 border border-red-500/20">
          {micError}
        </div>
      )}

      {/* Channel list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="neu-card p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <p className="text-5xl mb-4">🎙️</p>
          <p className="font-semibold text-lg" style={{ color: 'var(--neu-text)' }}>No voice channels yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>Create one and invite others to join</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch, i) => {
            const isJoined  = activeId === ch.id;
            const pCount    = isJoined ? participants.length + 1 : 0;

            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="neu-card p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-neu-sm flex items-center justify-center text-2xl"
                      style={{ background: 'var(--neu-bg-card)', boxShadow: '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)' }}
                    >
                      {ch.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>{ch.name}</h3>
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--neu-text-muted)' }}>
                        <Users className="w-3 h-3" /> {pCount} connected
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isJoined && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                    {ch.createdBy?.id === user?.id && (
                      <button
                        onClick={() => deleteMutation.mutate(ch.id)}
                        className="p-1 rounded hover:text-red-400 transition-colors"
                        style={{ color: 'var(--neu-text-muted)' }}
                        title="Delete channel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Active participants in channel */}
                {isJoined && participants.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {participants.map(p => (
                      <div key={p.socketId} className="flex flex-col items-center gap-1">
                        <div className={`rounded-full p-0.5 transition-all ${p.isSpeaking ? 'ring-2 ring-green-400' : ''}`}>
                          <Avatar name={p.displayName} size="sm" />
                        </div>
                        <span className="text-xs truncate w-10 text-center" style={{ color: 'var(--neu-text-muted)' }}>
                          {p.displayName.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => isJoined ? handleLeave() : handleJoin(ch.id)}
                  className="w-full py-2.5 rounded-neu-sm font-semibold text-sm transition-all text-white"
                  style={{
                    background: isJoined
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #6366f1, #a855f7)',
                  }}
                >
                  {isJoined ? '📵 Leave Channel' : '🎙️ Join Channel'}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Active Voice Panel (bottom bar) ──────────────── */}
      <AnimatePresence>
        {activeId && activeChannel && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4"
          >
            <div
              className="rounded-neu-xl px-5 py-3 flex items-center gap-4"
              style={{
                background:  'var(--neu-bg)',
                boxShadow:   '12px 12px 24px var(--neu-shadow-1), -12px -12px 24px var(--neu-shadow-2)',
                border:      '1px solid var(--neu-border)',
              }}
            >
              {/* Channel info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xl">{activeChannel.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--neu-text)' }}>
                    {activeChannel.name}
                  </p>
                  <p className="text-xs" style={{ color: '#22c55e' }}>
                    Voice connected · {participants.length + 1} in channel
                  </p>
                </div>
              </div>

              {/* Participants row */}
              <div className="flex items-center gap-1">
                <div className="flex -space-x-2">
                  {/* Self */}
                  <div className="ring-2 ring-green-500 rounded-full">
                    <Avatar src={user?.avatar} name={user?.displayName} size="sm" />
                  </div>
                  {participants.slice(0, 3).map(p => (
                    <div key={p.socketId} className={`ring-2 rounded-full ${p.isSpeaking ? 'ring-green-400' : 'ring-gray-500/30'}`}>
                      <Avatar name={p.displayName} size="sm" />
                    </div>
                  ))}
                </div>
                {participants.length > 3 && (
                  <span className="text-xs ml-1" style={{ color: 'var(--neu-text-muted)' }}>+{participants.length - 3}</span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background:  isMuted ? '#ef444422' : 'var(--neu-bg-card)',
                    boxShadow:   '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
                    color:       isMuted ? '#ef4444' : 'var(--neu-text)',
                  }}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleLeave}
                  title="Leave channel"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
                  style={{ background: '#ef4444' }}
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Channel Modal ──────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-auto rounded-neu-xl p-6"
              style={{
                background: 'var(--neu-bg)',
                boxShadow:  '20px 20px 40px var(--neu-shadow-1), -20px -20px 40px var(--neu-shadow-2)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg" style={{ color: 'var(--neu-text)' }}>
                  Create Voice Channel
                </h2>
                <button onClick={() => setShowCreate(false)} style={{ color: 'var(--neu-text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Icon picker */}
              <div className="mb-4">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--neu-text)' }}>Icon</label>
                <div className="flex flex-wrap gap-2">
                  {CHANNEL_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewIcon(icon)}
                      className="w-9 h-9 text-xl rounded-neu-sm flex items-center justify-center transition-all"
                      style={{
                        background: newIcon === icon ? 'var(--brand)' : 'var(--neu-bg)',
                        boxShadow:  '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
                        transform:  newIcon === icon ? 'scale(1.15)' : undefined,
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="mb-5">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--neu-text)' }}>Channel Name</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && newName.trim() && createMutation.mutate({ name: newName.trim(), icon: newIcon })}
                  placeholder="e.g. Lounge, Gaming, Study..."
                  className="neu-input w-full text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-neu-sm text-sm font-medium transition-all"
                  style={{
                    background: 'var(--neu-bg)',
                    color:      'var(--neu-text-muted)',
                    boxShadow:  '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!newName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate({ name: newName.trim(), icon: newIcon })}
                  className="flex-1 py-2.5 rounded-neu-sm text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
