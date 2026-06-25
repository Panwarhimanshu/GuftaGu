'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Send, X } from 'lucide-react';
import { chatApi } from '@/lib/api/chatApi';
import toast from 'react-hot-toast';

interface VoiceNoteRecorderProps {
  conversationId: string;
  onClose: () => void;
}

export function VoiceNoteRecorder({ conversationId, onClose }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const sendVoiceNote = async () => {
    if (!audioBlob) return;
    const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
    try {
      await chatApi.uploadMedia(conversationId, file);
      toast.success('Voice note sent!');
      onClose();
    } catch {
      toast.error('Failed to send');
    }
  };

  useEffect(() => {
    startRecording();
    return () => { clearInterval(timerRef.current); mediaRecorderRef.current?.stop(); };
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="absolute inset-x-4 bottom-20 rounded-neu-lg p-4 flex items-center gap-4"
      style={{
        background: 'var(--neu-bg)',
        boxShadow: '8px 8px 16px var(--neu-shadow-1), -8px -8px 16px var(--neu-shadow-2)',
      }}
    >
      {/* Cancel */}
      <button onClick={onClose} className="text-red-400"><X className="w-5 h-5" /></button>

      {/* Waveform + timer */}
      <div className="flex-1 flex items-center gap-3">
        {isRecording && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-red-500"
                animate={{ height: [8, Math.random() * 24 + 8, 8] }}
                transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5, delay: i * 0.05 }}
              />
            ))}
          </div>
        )}
        <span className="text-sm font-mono font-bold" style={{ color: 'var(--neu-text)' }}>
          {fmt(duration)}
        </span>
      </div>

      {/* Stop / Send */}
      {isRecording ? (
        <button
          onClick={stopRecording}
          className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"
        >
          <Square className="w-4 h-4 text-white fill-white" />
        </button>
      ) : (
        <button
          onClick={sendVoiceNote}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
        >
          <Send className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
