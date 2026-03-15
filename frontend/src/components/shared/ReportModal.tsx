'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Shield, Send, Loader2 } from 'lucide-react';
import { postsAPI, blogAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', description: 'Irrelevant or repeated content', icon: '🚫' },
  { value: 'nsfw', label: 'NSFW', description: 'Inappropriate or explicit content', icon: '🔞' },
  { value: 'nudity', label: 'Nudity', description: 'Contains nudity or sexual content', icon: '⚠️' },
  { value: 'violence', label: 'Violence', description: 'Contains violent or graphic content', icon: '💀' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying or targeted harassment', icon: '😡' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Promotes hatred against a group', icon: '🚨' },
  { value: 'abuse', label: 'Abuse', description: 'Abusive or threatening behavior', icon: '⛔' },
  { value: 'misinformation', label: 'Misinformation', description: 'False or misleading information', icon: '📰' },
  { value: 'copyright', label: 'Copyright', description: 'Infringes intellectual property', icon: '©️' },
  { value: 'other', label: 'Other', description: 'Something else not listed above', icon: '📝' },
] as const;

interface ReportModalProps {
  postId?: string;
  blogPostId?: string;
  postTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ postId, blogPostId, postTitle, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'reason' | 'details' | 'success'>('reason');
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDescription('');
      setStep('reason');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Close on outside click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportData = { reason, description: description.trim() || undefined };
      if (blogPostId) {
        await blogAPI.reportPost(blogPostId, reportData);
      } else if (postId) {
        await postsAPI.reportPost(postId, reportData);
      }
      setStep('success');
      setTimeout(() => onClose(), 2000);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to submit report';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    Report {blogPostId ? 'Article' : 'Post'}
                  </h2>
                  {postTitle && (
                    <p className="text-xs truncate max-w-[280px]" style={{ color: 'var(--text-secondary)' }}>
                      {postTitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              {step === 'reason' && (
                <div className="space-y-3">
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Why are you reporting this {blogPostId ? 'article' : 'post'}? Select the most appropriate reason.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => {
                          setReason(r.value);
                          setStep('details');
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl text-left transition-all group"
                        style={{
                          background: reason === r.value ? 'var(--accent-muted)' : 'transparent',
                          border: `1px solid ${reason === r.value ? 'var(--accent)' : 'var(--border)'}`,
                        }}
                      >
                        <span className="text-lg flex-shrink-0">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold block" style={{ color: 'var(--foreground)' }}>
                            {r.label}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {r.description}
                          </span>
                        </div>
                        <svg className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-secondary)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 'details' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setStep('reason')}
                    className="flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Change reason
                  </button>

                  <div
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-lg">{REPORT_REASONS.find((r) => r.value === reason)?.icon}</span>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {REPORT_REASONS.find((r) => r.value === reason)?.label}
                      </span>
                      <span className="text-xs block" style={{ color: 'var(--text-tertiary)' }}>
                        {REPORT_REASONS.find((r) => r.value === reason)?.description}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2" style={{ color: 'var(--foreground)' }}>
                      Additional details <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide more context about why you're reporting this post..."
                      maxLength={1000}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                      }}
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {description.length}/1000
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-2 p-3 rounded-xl text-xs"
                    style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Our moderation team will review this report. False reports may result in account restrictions.
                    </p>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <Shield className="w-8 h-8 text-green-500" />
                  </motion.div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    Report Submitted
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Thank you for helping keep our community safe. We&apos;ll review this report shortly.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {step === 'details' && (
              <div
                className="px-6 py-4 flex items-center justify-end gap-3"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !reason}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Report
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
