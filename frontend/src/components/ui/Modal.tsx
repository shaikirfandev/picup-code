'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', hideClose }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modal = (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease' }}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-lg overflow-hidden`}
        style={{
          background: 'var(--edith-surface)',
          border: '1px solid var(--edith-border-strong)',
          boxShadow: 'var(--edith-shadow-xl)',
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--edith-accent-muted), transparent)',
          }}
        />

        {/* Header */}
        {(title || !hideClose) && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid var(--edith-border)' }}
          >
            {title && (
              <h2 className="text-sm font-display font-bold tracking-wider" style={{ color: 'var(--edith-text)' }}>
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-edith-cyan/10 transition-colors ml-auto"
                style={{ color: 'var(--edith-text-dim)' }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modal, document.body);
}
