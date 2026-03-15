'use client';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-[3px]',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} border-edith-cyan/20 border-t-edith-cyan rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
