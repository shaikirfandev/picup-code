'use client';

import { clsx } from 'clsx';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[8px]',
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-sm',
};

export default function Avatar({ src, alt = '', fallback, size = 'md', className }: AvatarProps) {
  const letter = fallback?.[0]?.toUpperCase() || alt?.[0]?.toUpperCase() || 'U';

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={clsx(
          sizeMap[size],
          'rounded object-cover',
          className
        )}
        style={{
          border: '1px solid var(--edith-border)',
          boxShadow: 'var(--edith-shadow-sm)',
        }}
      />
    );
  }

  return (
    <div
      className={clsx(
        sizeMap[size],
        'rounded flex items-center justify-center font-mono font-bold text-edith-cyan',
        className
      )}
      style={{
        background: 'var(--edith-accent-muted)',
        border: '1px solid var(--edith-border)',
      }}
    >
      {letter}
    </div>
  );
}
