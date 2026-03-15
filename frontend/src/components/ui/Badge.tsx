'use client';

import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; border: string; text: string }> = {
  default: {
    bg: 'var(--accent-muted)',
    border: 'var(--border)',
    text: 'var(--text-secondary)',
  },
  success: {
    bg: 'var(--success-bg)',
    border: 'rgba(0, 230, 118, 0.2)',
    text: 'var(--success)',
  },
  warning: {
    bg: 'var(--warning-bg)',
    border: 'rgba(255, 170, 0, 0.2)',
    text: 'var(--warning)',
  },
  error: {
    bg: 'var(--error-bg)',
    border: 'rgba(255, 51, 51, 0.2)',
    text: 'var(--error)',
  },
  info: {
    bg: 'var(--accent-muted)',
    border: 'rgba(0, 200, 255, 0.2)',
    text: 'var(--accent)',
  },
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium rounded',
        className
      )}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
      }}
    >
      {children}
    </span>
  );
}
