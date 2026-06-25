'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, MapPin, Users, Send, ChevronDown,
  CheckCircle2, XCircle, HelpCircle, Timer
} from 'lucide-react';
import { useHangoutStore } from '@/store/hangoutStore';
import { useSocket } from '@/hooks/useSocket';
import { Avatar } from '@/components/ui/Avatar';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuInput } from '@/components/ui/NeuInput';
import type { HangoutType, HangoutResponse, HangoutResponseStatus } from '@memechat/shared';
import { formatDistanceToNow } from 'date-fns';

const HANGOUT_META: Record<HangoutType, { emoji: string; label: string; color: string; defaultDuration: number }> = {
  smoke_break:  { emoji: '🚬', label: 'Smoke Break',  color: '#94a3b8', defaultDuration: 10 },
  coffee_break: { emoji: '☕', label: 'Coffee Break', color: '#b45309', defaultDuration: 15 },
  lunch_break:  { emoji: '🍔', label: 'Lunch Break',  color: '#15803d', defaultDuration: 45 },
  gaming:       { emoji: '🎮', label: 'Gaming',        color: '#7c3aed', defaultDuration: 60 },
  walk_break:   { emoji: '🏃', label: 'Walk Break',   color: '#0891b2', defaultDuration: 20 },
  hangout:      { emoji: '🎉', label: 'Hangout',       color: '#db2777', defaultDuration: 30 },
};

type ModalStep = 'create' | 'live';

export function HangoutModal() {
  const { isOpen, type, activeEvent, close, startHangout, respond, isCreator } = useHangoutStore();
  const { socket } = useSocket();
  const [step, setStep] = useState<ModalStep>('create');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState(15);
  const [timer, setTimer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const meta = type ? HANGOUT_META[type] : null;

  useEffect(() => {
    if (type && meta) setDuration(meta.defaultDuration);
  }, [type]);

  useEffect(() => {
    if (activeEvent?.timerStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(activeEvent.timerStartedAt).getTime()) / 1000);
      const remaining = activeEvent.durationMinutes * 60 - elapsed;
      setTimer(Math.max(0, remaining));

      const interval = setInterval(() => {
        setTimer(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeEvent?.timerStartedAt]);

  const handleCreate = async () => {
    if (!type) return;
    setIsSubmitting(true);
    try {
      await startHangout({ type, message, location, durationMinutes: duration });
      setStep('live');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespond = async (status: HangoutResponseStatus, eta?: number) => {
    if (!activeEvent) return;
    await respond(activeEvent.id, status, eta);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!meta || !type) return null;

  const coming   = activeEvent?.responses.filter(r => r.status === 'coming') ?? [];
  const maybe    = activeEvent?.responses.filter(r => r.status === 'maybe') ?? [];
  const notComing= activeEvent?.responses.filter(r => r.status === 'not_coming') ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md"
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-md max-h-[90vh] overflow-y-auto neu-scroll rounded-neu-xl"
            style={{
              background: 'var(--neu-bg)',
              boxShadow: '20px 20px 40px var(--neu-shadow-1), -20px -20px 40px var(--neu-shadow-2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="sticky top-0 flex items-center justify-between p-5 rounded-t-neu-xl z-10"
              style={{ background: 'var(--neu-bg)' }}
            >
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-4xl"
                  animate={{ rotate: [0, -10, 10, -5, 0] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {meta.emoji}
                </motion.span>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>
                    {meta.label}
                  </h2>
                  {step === 'live' && activeEvent && (
                    <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                      Started {formatDistanceToNow(new Date(activeEvent.createdAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={close}
                className="neu-btn-icon p-2"
                style={{ color: 'var(--neu-text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 space-y-5">
              {step === 'create' ? (
                /* ── Create step ── */
                <>
                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                      Message (optional)
                    </label>
                    <NeuInput
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={`Anyone up for a ${meta.label.toLowerCase()}?`}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
                      Location (optional)
                    </label>
                    <NeuInput
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Building lobby, Terrace..."
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--neu-text)' }}>
                      Duration
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[5, 10, 15, 30, 45, 60].map(d => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`px-4 py-2 rounded-neu-sm text-sm font-semibold transition-all`}
                          style={{
                            background: duration === d ? meta.color : 'var(--neu-bg)',
                            color: duration === d ? '#fff' : 'var(--neu-text)',
                            boxShadow: duration === d
                              ? `3px 3px 8px var(--neu-shadow-1), -2px -2px 6px var(--neu-shadow-2), 0 0 16px ${meta.color}44`
                              : '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
                          }}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Send button */}
                  <NeuButton
                    variant="primary"
                    className="w-full"
                    onClick={handleCreate}
                    loading={isSubmitting}
                    icon={<Send className="w-4 h-4" />}
                  >
                    Send Invite
                  </NeuButton>
                </>
              ) : (
                /* ── Live step ── */
                <>
                  {/* Timer */}
                  {timer !== null && (
                    <div className="neu-pressed flex items-center justify-between p-4">
                      <div className="flex items-center gap-2">
                        <Timer className="w-5 h-5" style={{ color: meta.color }} />
                        <span className="font-semibold" style={{ color: 'var(--neu-text)' }}>Timer</span>
                      </div>
                      <span
                        className="text-2xl font-mono font-bold tabular-nums"
                        style={{ color: meta.color }}
                      >
                        {formatTimer(timer)}
                      </span>
                    </div>
                  )}

                  {/* Your response / creator badge */}
                  {isCreator ? (
                    <div
                      className="flex items-center justify-center gap-2 p-4 rounded-neu-sm"
                      style={{ background: '#22c55e18', border: '1px solid #22c55e44' }}
                    >
                      <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
                      <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                        You organized this — you&apos;re going!
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--neu-text)' }}>
                        Are you joining?
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { status: 'coming',      icon: CheckCircle2, label: 'Coming!',   color: '#22c55e' },
                          { status: 'maybe',       icon: HelpCircle,   label: 'Maybe',     color: '#f59e0b' },
                          { status: 'not_coming',  icon: XCircle,      label: 'Can\'t',    color: '#ef4444' },
                        ] as const).map(({ status, icon: Icon, label, color }) => (
                          <button
                            key={status}
                            onClick={() => handleRespond(status)}
                            className="flex flex-col items-center gap-2 p-3 rounded-neu-sm transition-all"
                            style={{
                              background: 'var(--neu-bg)',
                              boxShadow: '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
                            }}
                          >
                            <Icon className="w-6 h-6" style={{ color }} />
                            <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responses */}
                  {[
                    { label: 'Coming', responses: coming,    icon: '✅', color: '#22c55e' },
                    { label: 'Maybe',  responses: maybe,     icon: '🤔', color: '#f59e0b' },
                    { label: "Can't",  responses: notComing, icon: '❌', color: '#ef4444' },
                  ].map(({ label, responses, icon, color }) => responses.length > 0 && (
                    <div key={label}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color }}>
                        {icon} {label} · {responses.length}
                      </p>
                      <div className="space-y-2">
                        {responses.map(r => (
                          <motion.div
                            key={r.userId}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-2 rounded-neu-sm"
                            style={{
                              background: 'var(--neu-bg-card)',
                              boxShadow: '2px 2px 4px var(--neu-shadow-1), -2px -2px 4px var(--neu-shadow-2)',
                            }}
                          >
                            <Avatar src={r.user?.avatar} name={r.user?.displayName} size="sm" />
                            <span className="text-sm font-medium flex-1" style={{ color: 'var(--neu-text)' }}>
                              {r.user?.displayName ?? 'Unknown'}
                            </span>
                            {r.eta && (
                              <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                                ~{r.eta}m
                              </span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
