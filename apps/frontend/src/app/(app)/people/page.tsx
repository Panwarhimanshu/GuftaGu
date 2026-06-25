'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, Clock, X, Users, Check } from 'lucide-react';
import { userApi } from '@/lib/api/userApi';
import { Avatar } from '@/components/ui/Avatar';
import type { User } from '@memechat/shared';

type DiscoverUser = User & {
  relationshipStatus: 'none' | 'friends' | 'request_sent' | 'request_received';
};

export default function PeoplePage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: allUsers = [], isLoading } = useQuery<DiscoverUser[]>({
    queryKey: ['discover-users'],
    queryFn: userApi.discoverUsers,
  });

  const sendRequest = useMutation({
    mutationFn: (userId: string) => userApi.sendFriendRequest(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover-users'] }),
  });

  const acceptRequest = useMutation({
    mutationFn: (userId: string) => userApi.acceptFriendRequest(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover-users'] }),
  });

  const declineRequest = useMutation({
    mutationFn: (userId: string) => userApi.declineFriendRequest(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover-users'] }),
  });

  const incoming = allUsers.filter(u => u.relationshipStatus === 'request_received');
  const q = search.trim().toLowerCase();
  const filtered = allUsers.filter(u =>
    u.relationshipStatus !== 'request_received' &&
    (!q || u.displayName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)),
  );

  return (
    <div className="flex-1 overflow-y-auto neu-scroll p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6" style={{ color: 'var(--brand)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>People</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          Find and connect with other GuftaGu users
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative"
      >
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--neu-text-muted)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or username…"
          className="w-full pl-10 pr-4 py-2.5 rounded-neu text-sm neu-pressed outline-none"
          style={{ background: 'var(--neu-bg)', color: 'var(--neu-text)' }}
        />
      </motion.div>

      {/* Incoming requests */}
      <AnimatePresence>
        {incoming.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: 'var(--brand)' }}>
              <Clock className="w-3.5 h-3.5" />
              Friend Requests ({incoming.length})
            </h2>
            <div className="space-y-2">
              {incoming.map(user => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="neu-card flex items-center gap-3 p-3"
                >
                  <Avatar src={user.avatar} name={user.displayName} size="md" status={user.isOnline ? 'online' : 'offline'} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--neu-text)' }}>{user.displayName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>@{user.username}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => acceptRequest.mutate(user.id!)}
                      disabled={acceptRequest.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-neu-sm text-xs font-semibold text-white transition-all"
                      style={{ background: 'var(--brand)' }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => declineRequest.mutate(user.id!)}
                      disabled={declineRequest.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-neu-sm text-xs font-semibold transition-all"
                      style={{
                        background: 'var(--neu-bg)',
                        color: 'var(--neu-text-muted)',
                        boxShadow: '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* All users */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--neu-text-muted)' }}>
          {search ? `Results for "${search}"` : 'All People'}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="neu-card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full" style={{ background: 'var(--neu-shadow-1)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded w-2/3" style={{ background: 'var(--neu-shadow-1)' }} />
                    <div className="h-2.5 rounded w-1/2" style={{ background: 'var(--neu-shadow-1)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--neu-text-muted)' }}>
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No users match your search' : 'No other users yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((user, i) => (
              <UserCard
                key={user.id}
                user={user}
                index={i}
                onAdd={() => sendRequest.mutate(user.id!)}
                onAccept={() => acceptRequest.mutate(user.id!)}
                onDecline={() => declineRequest.mutate(user.id!)}
                loading={sendRequest.isPending || acceptRequest.isPending}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function UserCard({
  user, index, onAdd, onAccept, onDecline, loading,
}: {
  user: DiscoverUser;
  index: number;
  onAdd: () => void;
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="neu-card p-4 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <Avatar src={user.avatar} name={user.displayName} size="md" status={user.isOnline ? 'online' : 'offline'} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--neu-text)' }}>{user.displayName}</p>
          <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>@{user.username}</p>
        </div>
      </div>

      {user.relationshipStatus === 'friends' && (
        <div
          className="w-full flex items-center justify-center gap-2 py-2 rounded-neu-sm text-xs font-semibold"
          style={{ color: '#22c55e' }}
        >
          <UserCheck className="w-4 h-4" />
          Friends
        </div>
      )}

      {user.relationshipStatus === 'request_sent' && (
        <div
          className="w-full flex items-center justify-center gap-2 py-2 rounded-neu-sm text-xs font-semibold"
          style={{ color: 'var(--neu-text-muted)' }}
        >
          <Clock className="w-4 h-4" />
          Request Sent
        </div>
      )}

      {user.relationshipStatus === 'none' && (
        <button
          onClick={onAdd}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-neu-sm text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--brand), #a855f7)' }}
        >
          <UserPlus className="w-4 h-4" />
          Add Friend
        </button>
      )}
    </motion.div>
  );
}
