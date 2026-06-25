'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { Avatar } from './Avatar';
import { formatDistanceToNow } from 'date-fns';

export function NotificationPanel() {
  const { isOpen, notifications, toggle, markAllRead, dismiss } = useNotificationStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={toggle}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col"
            style={{
              background: 'var(--neu-bg)',
              boxShadow: '-8px 0 24px var(--neu-shadow-1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--neu-border)' }}>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" style={{ color: 'var(--brand)' }} />
                <h2 className="font-bold text-lg" style={{ color: 'var(--neu-text)' }}>Notifications</h2>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold text-white rounded-full bg-red-500">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium"
                  style={{ color: 'var(--brand)' }}
                >
                  Mark all read
                </button>
                <button onClick={toggle} className="neu-btn-icon p-1.5">
                  <X className="w-4 h-4" style={{ color: 'var(--neu-text-muted)' }} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto neu-scroll">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                  <Bell className="w-12 h-12" style={{ color: 'var(--neu-text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>No notifications yet</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {notifications.map(notif => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`relative flex items-start gap-3 p-3 rounded-neu-sm cursor-pointer transition-all`}
                      style={{
                        background: notif.read ? 'transparent' : 'var(--neu-bg-card)',
                        boxShadow: notif.read ? 'none' : '3px 3px 6px var(--neu-shadow-1), -3px -3px 6px var(--neu-shadow-2)',
                      }}
                    >
                      <Avatar src={notif.avatar} name={notif.from} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
                          {notif.title}
                        </p>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--neu-text-muted)' }}>
                          {notif.body}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)', opacity: 0.6 }}>
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" style={{ color: 'var(--neu-text-muted)' }} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
