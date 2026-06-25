'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Users, MapPin, X, CheckCircle, Timer } from 'lucide-react';
import { hangoutApi } from '@/lib/api/hangoutApi';
import { useHangoutStore } from '@/store/hangoutStore';
import { Avatar } from '@/components/ui/Avatar';
import { NeuButton } from '@/components/ui/NeuButton';

const HANGOUT_TYPES = [
  { type: 'smoke_break',  emoji: '🚬', label: 'Smoke Break', color: '#94a3b8', gradient: 'linear-gradient(135deg,#667eea33,#764ba233)' },
  { type: 'coffee_break', emoji: '☕', label: 'Coffee',       color: '#b45309', gradient: 'linear-gradient(135deg,#92400e33,#b4530933)' },
  { type: 'lunch_break',  emoji: '🍔', label: 'Lunch',        color: '#15803d', gradient: 'linear-gradient(135deg,#15803d33,#4ade8033)' },
  { type: 'gaming',       emoji: '🎮', label: 'Gaming',       color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed33,#a855f733)' },
  { type: 'walk_break',   emoji: '🏃', label: 'Walk',         color: '#0891b2', gradient: 'linear-gradient(135deg,#0891b233,#06b6d433)' },
  { type: 'hangout',      emoji: '🎉', label: 'Hangout',      color: '#db2777', gradient: 'linear-gradient(135deg,#db277733,#f4338233)' },
];

export default function HangoutPage() {
  const qc = useQueryClient();
  const { openHangoutModal } = useHangoutStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(15);
  const [showCreate, setShowCreate] = useState(false);

  const { data: activeHangouts = [], isLoading } = useQuery({
    queryKey: ['hangouts', 'active'],
    queryFn: () => hangoutApi.getActive(),
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: () => hangoutApi.create({
      type: selectedType!,
      message,
      durationMinutes: duration,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hangouts'] });
      setShowCreate(false);
      setSelectedType(null);
      setMessage('');
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'coming' | 'not_coming' }) =>
      hangoutApi.respond(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hangouts'] }),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => hangoutApi.close(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hangouts'] }),
  });

  return (
    <div className="flex-1 overflow-y-auto neu-scroll p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--neu-text)' }}>
            <Zap className="w-6 h-6 text-yellow-500" /> Hangout
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
            Let your friends know what you're up to
          </p>
        </div>
        {activeHangouts.length > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'var(--brand)' }}>
            {activeHangouts.length} active
          </span>
        )}
      </div>

      {/* Quick action buttons */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--neu-text-muted)' }}>
          Start a hangout
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {HANGOUT_TYPES.map((h, i) => (
            <motion.button
              type="button"
              key={h.type}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => { setSelectedType(h.type); setShowCreate(true); }}
              className="hangout-btn relative group"
              style={{ background: h.gradient }}
            >
              <motion.div
                className="absolute inset-0 rounded-neu-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: `0 0 24px ${h.color}55` }}
              />
              <span className="text-3xl">{h.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: h.color }}>{h.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Create hangout form */}
      <AnimatePresence>
        {showCreate && selectedType && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            className="neu-card p-5 space-y-4"
          >
            {(() => {
              const h = HANGOUT_TYPES.find(x => x.type === selectedType)!;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg" style={{ color: 'var(--neu-text)' }}>
                      {h.emoji} {h.label}
                    </h3>
                    <button type="button" onClick={() => setShowCreate(false)} style={{ color: 'var(--neu-text-muted)' }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--neu-text)' }}>Message (optional)</label>
                    <input
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={`Going for a ${h.label.toLowerCase()}...`}
                      className="neu-input text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2" style={{ color: 'var(--neu-text)' }}>
                      Duration: <span style={{ color: h.color }}>{duration} min</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[5, 10, 15, 30, 45, 60].map(d => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => setDuration(d)}
                          className="px-3 py-1.5 rounded-neu-sm text-sm font-medium transition-all"
                          style={{
                            background: duration === d ? h.color : 'var(--neu-bg)',
                            color: duration === d ? '#fff' : 'var(--neu-text-muted)',
                            boxShadow: '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
                          }}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <NeuButton
                    variant="primary"
                    className="w-full"
                    loading={createMutation.isPending}
                    onClick={() => createMutation.mutate()}
                  >
                    Broadcast {h.emoji}
                  </NeuButton>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active hangouts */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--neu-text-muted)' }}>
          Active hangouts
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="neu-card p-4 animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-full" style={{ background: 'var(--neu-shadow-1)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded w-32" style={{ background: 'var(--neu-shadow-1)' }} />
                  <div className="h-3 rounded w-48" style={{ background: 'var(--neu-shadow-1)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : activeHangouts.length === 0 ? (
          <div className="neu-surface p-8 text-center">
            <p className="text-4xl mb-2">😴</p>
            <p className="font-semibold" style={{ color: 'var(--neu-text)' }}>No active hangouts</p>
            <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>
              Start one above to let your crew know!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeHangouts.map(hangout => {
              const typeInfo = HANGOUT_TYPES.find(h => h.type === hangout.type);
              return (
                <motion.div
                  key={hangout.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="neu-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{typeInfo?.emoji ?? '🎉'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>
                          {(hangout as any).creator?.displayName ?? 'Someone'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: typeInfo?.color + '22', color: typeInfo?.color }}>
                          {typeInfo?.label}
                        </span>
                      </div>
                      {hangout.message && (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>{hangout.message}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" /> {hangout.durationMinutes}m
                        </span>
                        {hangout.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {hangout.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {hangout.responses?.length ?? 0} joined
                        </span>
                      </div>
                    </div>
                    <button type="button" onClick={() => closeMutation.mutate(hangout.id)} style={{ color: 'var(--neu-text-muted)' }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Join / Decline */}
                  <div className="flex gap-2 mt-3">
                    <NeuButton
                      size="sm"
                      variant="primary"
                      className="flex-1"
                      onClick={() => respondMutation.mutate({ id: hangout.id, status: 'coming' })}
                      icon={<CheckCircle className="w-4 h-4" />}
                    >
                      Join
                    </NeuButton>
                    <NeuButton
                      size="sm"
                      variant="danger"
                      className="flex-1"
                      onClick={() => respondMutation.mutate({ id: hangout.id, status: 'not_coming' })}
                    >
                      Skip
                    </NeuButton>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
