import type { Locale, Severity, Verdict } from '@kanca/engine/browser';

export type Tone = 'high' | 'medium' | 'low' | 'neutral';

export const severityTone: Record<Severity, Tone> = {
  critical: 'high',
  high: 'high',
  medium: 'medium',
  low: 'neutral',
  info: 'neutral',
};

export const verdictTone: Record<Verdict, Tone> = { high: 'high', medium: 'medium', low: 'low' };

export function authTone(value: string | null): Tone {
  if (!value) return 'neutral';
  if (value === 'pass') return 'low';
  if (value === 'fail' || value === 'permerror') return 'high';
  if (value === 'softfail' || value === 'none' || value === 'temperror' || value === 'neutral') return 'medium';
  return 'neutral';
}

const localeTag: Record<Locale, string> = { en: 'en-GB', tr: 'tr-TR' };

export function formatDate(iso: string | null, locale: Locale) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(localeTag[locale], { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
