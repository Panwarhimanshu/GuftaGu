'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  Monitor, UserPlus, MoreHorizontal, Maximize2
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface CallState {
  isActive: boolean;
  type: 'voice' | 'video';
  participant: { name: string; avatar?: string } | null;
  status: 'ringing' | 'ongoing' | 'ended';
  duration: number;
}

// Global call state managed by store in real implementation
const DEMO_CALL: CallState = {
  isActive: false,
  type: 'video',
  participant: null,
  status: 'ringing',
  duration: 0,
};

export function CallOverlay() {
  const [call, setCall] = useState(DEMO_CALL);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!call.isActive) return null;

  if (isMinimized) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-24 right-4 z-[200] rounded-neu-lg overflow-hidden cursor-move"
        style={{
          width: 140,
          height: 200,
          background: '#1a1a1f',
          boxShadow: '8px 8px 16px rgba(0,0,0,0.4)',
        }}
      >
        {/* Mini video */}
        <div className="w-full h-full flex items-center justify-center" style={{ background: '#2a2a30' }}>
          <Avatar name={call.participant?.name} src={call.participant?.avatar} size="lg" />
        </div>
        {/* Controls */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-full bg-white/20 text-white"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setCall(prev => ({ ...prev, isActive: false }))}
            className="p-1.5 rounded-full bg-red-500 text-white"
          >
            <PhoneOff className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col"
        style={{ background: 'linear-gradient(180deg, #0d0d14 0%, #1a1a2e 100%)' }}
      >
        {/* Remote video / avatar */}
        <div className="flex-1 relative flex items-center justify-center">
          {call.type === 'video' && !isVideoOff ? (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <span className="text-gray-500 text-lg">Camera feed</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Avatar
                src={call.participant?.avatar}
                name={call.participant?.name}
                size="2xl"
              />
              <h2 className="text-white text-2xl font-bold">{call.participant?.name}</h2>
              <p className="text-white/60">
                {call.status === 'ringing' ? 'Ringing...' : `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}`}
              </p>
            </div>
          )}

          {/* Local video (PiP) */}
          {call.type === 'video' && (
            <div
              className="absolute top-4 right-4 w-24 h-36 rounded-xl overflow-hidden border-2 border-white/20 cursor-pointer"
              onClick={() => setIsMinimized(true)}
            >
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Avatar src={undefined} name="You" size="sm" />
              </div>
            </div>
          )}
        </div>

        {/* Ringing animation */}
        {call.status === 'ringing' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-blue-400/30"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                style={{ width: 120, height: 120 }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="p-8 pb-12">
          <div className="flex items-center justify-center gap-4">
            {/* Mute */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.15)',
                }}
              >
                {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </div>
              <span className="text-xs text-white/60">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Video toggle */}
            {call.type === 'video' && (
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.15)' }}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                </div>
                <span className="text-xs text-white/60">Camera</span>
              </button>
            )}

            {/* End call */}
            <button
              onClick={() => setCall(prev => ({ ...prev, isActive: false }))}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-white/60">End</span>
            </button>

            {/* Screen share */}
            {call.type === 'video' && (
              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: isScreenSharing ? 'var(--brand)' : 'rgba(255,255,255,0.15)' }}
                >
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/60">Share</span>
              </button>
            )}

            {/* More */}
            <button className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <MoreHorizontal className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white/60">More</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
