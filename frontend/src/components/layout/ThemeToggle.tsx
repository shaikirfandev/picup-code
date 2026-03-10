'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const modes = [
    { key: 'light', icon: Sun, label: 'Light' },
    { key: 'dark', icon: Moon, label: 'Dark' },
    { key: 'system', icon: Monitor, label: 'System' },
  ] as const;

  const cycleTheme = () => {
    const current = modes.findIndex((m) => m.key === theme);
    const next = (current + 1) % modes.length;
    setTheme(modes[next].key);
  };

  const CurrentIcon = modes.find((m) => m.key === theme)?.icon || Moon;

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded transition-all duration-300 hover:text-edith-cyan hover:bg-edith-cyan/5"
      style={{ color: 'var(--edith-text-dim)' }}
      title={`Theme: ${theme}`}
      aria-label="Toggle theme"
    >
      <CurrentIcon className="w-4 h-4" />
    </button>
  );
}
