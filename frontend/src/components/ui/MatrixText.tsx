'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&!?><{}[]';

interface MatrixTextProps {
  /** The final resolved text */
  text: string;
  /** Whether to trigger the decode animation */
  trigger: boolean;
  /** ms per iteration step — lower = faster */
  speed?: number;
  /** Extra scramble passes per character before it resolves */
  scramblePasses?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Text scramble-decode animation.
 * Characters randomize then resolve one-by-one like the Matrix movie.
 */
export default function MatrixText({
  text,
  trigger,
  speed = 25,
  scramblePasses = 2,
  className = '',
  style,
}: MatrixTextProps) {
  const [display, setDisplay] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevTrigger = useRef(false);

  const decode = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    let idx = 0;
    let pass = 0;

    const step = () => {
      if (idx >= text.length) {
        setDisplay(text);
        return;
      }

      // Build string: resolved chars + current scramble + look-ahead noise
      let result = text.slice(0, idx);

      if (pass < scramblePasses) {
        result += CHARS[Math.floor(Math.random() * CHARS.length)];
        for (let i = idx + 1; i < Math.min(idx + 4, text.length); i++) {
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        pass++;
      } else {
        result += text[idx];
        idx++;
        pass = 0;
      }

      setDisplay(result);
      timerRef.current = setTimeout(step, speed);
    };

    step();
  }, [text, speed, scramblePasses]);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      setDisplay('');
      // Small delay so the empty state renders first
      const t = setTimeout(decode, 60);
      return () => clearTimeout(t);
    }
    if (!trigger) {
      setDisplay('');
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    prevTrigger.current = trigger;
  }, [trigger, decode]);

  // Cleanup
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  if (!display) return null;

  return (
    <span className={className} style={style}>
      {display}
      {/* Blinking cursor while decoding */}
      {display.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-current animate-pulse ml-0.5 align-middle" />
      )}
    </span>
  );
}
