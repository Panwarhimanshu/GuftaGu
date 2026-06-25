'use client';

import { useRef } from 'react';
import { Paperclip, ImageIcon, FileText, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { chatApi } from '@/lib/api/chatApi';
import toast from 'react-hot-toast';

interface MediaUploadButtonProps {
  conversationId: string;
}

export function MediaUploadButton({ conversationId }: MediaUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, _type: string) => {
    setIsUploading(true);
    try {
      await chatApi.uploadMedia(conversationId, file);
      toast.success('File sent!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      setIsOpen(false);
    }
  };

  const ACTIONS = [
    { icon: <ImageIcon className="w-4 h-4" />, label: 'Photo / Video', color: '#3b82f6', onClick: () => imageRef.current?.click() },
    { icon: <FileText className="w-4 h-4" />,  label: 'Document',      color: '#22c55e', onClick: () => fileRef.current?.click() },
    { icon: <MapPin className="w-4 h-4" />,    label: 'Location',      color: '#ef4444', onClick: () => {} },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="neu-btn-icon p-2 transition-all"
        style={{ color: isOpen ? 'var(--brand)' : 'var(--neu-text-muted)' }}
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {/* Hidden file inputs */}
      <input
        ref={imageRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
      />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'document')}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full left-0 mb-2 flex flex-col gap-2 p-2 rounded-neu-lg"
            style={{
              background: 'var(--neu-bg)',
              boxShadow: '8px 8px 16px var(--neu-shadow-1), -8px -8px 16px var(--neu-shadow-2)',
            }}
          >
            {ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-3 px-4 py-2.5 rounded-neu-sm hover:opacity-80 transition-all whitespace-nowrap"
                style={{ color: action.color }}
              >
                {action.icon}
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
