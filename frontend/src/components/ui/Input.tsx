'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[10px] font-mono tracking-wider uppercase"
            style={{ color: 'var(--edith-text-dim)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-edith-cyan/40">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'input-field',
              icon && 'pl-10',
              error && 'border-edith-error/50 focus:border-edith-error',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[10px] font-mono" style={{ color: 'var(--edith-error)' }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-[10px] font-mono" style={{ color: 'var(--edith-text-muted)' }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
