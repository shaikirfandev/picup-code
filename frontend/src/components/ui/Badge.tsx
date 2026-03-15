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
    bg: 'var(--edith-accent-muted)',
    border: 'var(--edith-border)',
    text: 'var(--edith-text-dim)',
  },
  success: {
    bg: 'var(--edith-success-bg)',
    border: 'rgba(0, 230, 118, 0.2)',
    text: 'var(--edith-success)',
  },
  warning: {
    bg: 'var(--edith-warning-bg)',
    border: 'rgba(255, 170, 0, 0.2)',
    text: 'var(--edith-warning)',
  },
  error: {
    bg: 'var(--edith-error-bg)',
    border: 'rgba(255, 51, 51, 0.2)',
    text: 'var(--edith-error)',
  },
  info: {
    bg: 'var(--edith-accent-muted)',
    border: 'rgba(0, 200, 255, 0.2)',
    text: 'var(--edith-cyan)',
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
