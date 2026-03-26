'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, X, Shield } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, hardDelete: boolean) => Promise<void>;
  count: number; // number of posts being deleted
  postTitle?: string; // for single delete
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  count,
  postTitle,
}: DeleteConfirmationModalProps) {
  const [reason, setReason] = useState('');
  const [hardDelete, setHardDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doubleConfirm, setDoubleConfirm] = useState(false);

  const isBulk = count > 1;
  const needsDoubleConfirm = count > 10;

  const handleConfirm = async () => {
    if (needsDoubleConfirm && !doubleConfirm) {
      setDoubleConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason, hardDelete);
      setReason('');
      setHardDelete(false);
      setDoubleConfirm(false);
      onClose();
    } catch {
      // error handled by caller via toast
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setReason('');
    setHardDelete(false);
    setDoubleConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-xl overflow-hidden animate-scale-in"
        style={{
          background: 'var(--dropdown-bg)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--dropdown-shadow)',
        }}
      >
        {/* Top glow */}
        <div
          className="h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)',
          }}
        />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3
              className="text-sm font-semibold font-bold tracking-wider"
              style={{ color: 'var(--foreground)' }}
            >
              {doubleConfirm
                ? 'CONFIRM AGAIN'
                : isBulk
                  ? `DELETE ${count} POSTS`
                  : 'DELETE POST'}
            </h3>
            <p className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {doubleConfirm
                ? 'This is a large operation — double-confirm to proceed'
                : 'This action requires confirmation'}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-3 space-y-4">
          {/* Warning */}
          <div
            className="p-3 rounded-lg text-[11px] font-mono leading-relaxed"
            style={{
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.15)',
              color: 'var(--text-secondary)',
            }}
          >
            {isBulk ? (
              <>
                You are about to delete <strong className="text-red-400">{count} posts</strong>.
                {hardDelete
                  ? ' This will permanently remove them and all associated data (likes, comments, reports).'
                  : ' Posts will be soft-deleted and can be restored later.'}
              </>
            ) : (
              <>
                You are about to delete{' '}
                {postTitle ? (
                  <strong className="text-red-400">&ldquo;{postTitle}&rdquo;</strong>
                ) : (
                  'this post'
                )}
                .
                {hardDelete
                  ? ' This is permanent and cannot be undone.'
                  : ' The post will be soft-deleted and can be restored.'}
              </>
            )}
          </div>

          {/* Reason input */}
          {!doubleConfirm && (
            <>
              <div>
                <label className="block text-[10px] font-mono font-medium tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  REASON (OPTIONAL)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Violates community guidelines..."
                  rows={2}
                  className="w-full px-3 py-2 text-[11px] font-mono rounded-lg outline-none resize-none transition-all"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--foreground)',
                  }}
                  maxLength={500}
                />
              </div>

              {/* Hard delete toggle */}
              <label
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-red-500/5"
                style={{ border: '1px solid var(--border)' }}
              >
                <input
                  type="checkbox"
                  checked={hardDelete}
                  onChange={(e) => setHardDelete(e.target.checked)}
                  className="accent-red-500 w-4 h-4"
                />
                <div>
                  <p className="text-[11px] font-mono font-medium" style={{ color: 'var(--foreground)' }}>
                    Permanent delete
                  </p>
                  <p className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    Hard delete — removes all associated data. Cannot be undone.
                  </p>
                </div>
              </label>
            </>
          )}

          {/* Double confirm warning for bulk > 10 */}
          {doubleConfirm && (
            <div
              className="p-3 rounded-lg text-[11px] font-mono text-center"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: 'var(--foreground)',
              }}
            >
              <Shield className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p>
                Deleting <strong className="text-red-400">{count}</strong> posts is a significant action.
              </p>
              <p className="mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Click &quot;Confirm Delete&quot; to proceed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-[11px] font-mono tracking-wider rounded-lg transition-colors hover:bg-accent/5 disabled:opacity-50"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-mono font-medium tracking-wider rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                DELETING...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                {doubleConfirm ? 'CONFIRM DELETE' : isBulk ? `DELETE ${count} POSTS` : 'DELETE POST'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
