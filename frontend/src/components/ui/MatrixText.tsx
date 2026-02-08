'use client';

import { useState, useEffect, useRef } from 'react';

interface MatrixTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';
  glowColor?: string;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*<>{}[]|/\\~';

export default function MatrixText({
  text,
  className = '',
  delay = 0,
  speed = 30,
  as: Tag = 'span',
  glowColor = 'rgba(0,240,255,0.6)',
}: MatrixTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const iterRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    indexRef.current = 0;
    iterRef.current = 0;
    setDisplayed('');

    intervalRef.current = setInterval(() => {
      const idx = indexRef.current;
      const iter = iterRef.current;

      if (idx >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayed(text);
        return;
      }

      // Build the string: resolved chars + scrambled current + faded rest
      let result = text.slice(0, idx);
      if (iter < 3) {
        result += CHARS[Math.floor(Math.random() * CHARS.length)];
        iterRef.current++;
      } else {
        result += text[idx];
        indexRef.current++;
        iterRef.current = 0;
      }

      setDisplayed(result);
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, text, speed]);

  return (
    <Tag
      className={`font-mono ${className}`}
      style={{
        textShadow: started ? `0 0 8px ${glowColor}` : 'none',
      }}
    >
      {displayed}
      {displayed.length < text.length && started && (
        <span className="inline-block w-[2px] h-[1em] bg-cyber-glow animate-pulse ml-0.5 align-middle" />
      )}
    </Tag>
  );
}
