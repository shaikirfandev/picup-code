'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { themeQuartz } from 'ag-grid-community';

/* ── AG Grid — Picup Dark Theme ───────────────────────────────────────── */
const picupDarkTheme = themeQuartz.withParams({
  backgroundColor: 'transparent',
  foregroundColor: 'rgba(200,230,255,0.92)',
  headerBackgroundColor: 'rgba(0,200,255,0.04)',
  headerTextColor: 'rgba(170,200,230,0.7)',
  fontSize: 13,
  rowHoverColor: 'rgba(0,200,255,0.06)',
  borderColor: 'rgba(0,200,255,0.08)',
  chromeBackgroundColor: 'rgba(10,10,26,0.5)',
  columnBorder: false,
  wrapperBorderRadius: 12,
  oddRowBackgroundColor: 'rgba(0,200,255,0.02)',
  cellHorizontalPadding: 12,
  fontFamily: 'Rajdhani, Inter, system-ui, sans-serif',
  accentColor: '#00d4ff',
});

/* ── AG Grid — Picup Light Theme ──────────────────────────────────────── */
const picupLightTheme = themeQuartz.withParams({
  backgroundColor: 'transparent',
  foregroundColor: '#1a2233',
  headerBackgroundColor: 'rgba(0, 100, 140, 0.05)',
  headerTextColor: '#3d4f66',
  fontSize: 13,
  rowHoverColor: 'rgba(0, 145, 179, 0.06)',
  borderColor: 'rgba(15, 30, 60, 0.1)',
  chromeBackgroundColor: 'rgba(244, 246, 249, 0.8)',
  columnBorder: false,
  wrapperBorderRadius: 12,
  oddRowBackgroundColor: 'rgba(0, 100, 140, 0.025)',
  cellHorizontalPadding: 12,
  fontFamily: 'Rajdhani, Inter, system-ui, sans-serif',
  accentColor: '#0091b3',
});

/**
 * Returns the correct AG Grid theme based on the current Picup light/dark mode.
 */
export function usePicupGridTheme() {
  const { resolvedTheme } = useTheme();
  return useMemo(
    () => (resolvedTheme === 'light' ? picupLightTheme : picupDarkTheme),
    [resolvedTheme],
  );
}

export { picupDarkTheme, picupLightTheme };
