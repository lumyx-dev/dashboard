'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input, cn } from '@lumyx/ui';
import { scoreTone, type FeedEvent, type Tone } from '@/lib/dashboard-data';

/*
 * Small pieces the v3 screens repeat that @lumyx/ui does not ship as such. They are composed
 * from tokens only — no literal colours.
 */

export const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  accent: 'text-accent-text',
  idle: 'text-faint',
  neutral: 'text-strong',
};

export const TONE_BG: Record<Tone, string> = {
  ok: 'bg-ok-solid',
  warn: 'bg-warn-solid',
  danger: 'bg-danger-solid',
  accent: 'bg-accent',
  idle: 'bg-idle',
  neutral: 'bg-strong',
};

/** For SVG strokes and fills. */
export const TONE_VAR: Record<Tone, string> = {
  ok: 'var(--ok-solid)',
  warn: 'var(--warn-solid)',
  danger: 'var(--danger-solid)',
  accent: 'var(--accent)',
  idle: 'var(--idle)',
  neutral: 'var(--text-strong)',
};

/** A static 8px dot in a tone (StatusDot breathes on live; most v3 dots do not). */
export function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2 shrink-0 rounded-pill', TONE_BG[tone], className)} />;
}

/** Quality score: a 48×4 meter and the score in mono, both in the score's tone. */
export function ScoreBar({ score }: { score: number }) {
  const tone = scoreTone(score);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1 w-12 overflow-hidden rounded-pill bg-hover">
        <span className={cn('block h-full', TONE_BG[tone])} style={{ width: `${score}%` }} />
      </span>
      <span className={cn('sl-num text-12', TONE_TEXT[tone])}>{score}</span>
    </span>
  );
}

/** Two-line event feed: message, mono detail underneath, time on the right. */
export function EventFeed({ events, className }: { events: FeedEvent[]; className?: string }) {
  return (
    <ul className={cn('flex flex-col', className)}>
      {events.map((e, i) => (
        <li key={`${e.time}-${i}`} className="grid grid-cols-[16px_minmax(0,1fr)_auto] gap-2 py-2">
          <Dot tone={e.tone} className="mt-1.5" />
          <span className="flex min-w-0 flex-col">
            <span className="text-14 font-medium text-strong">{e.message}</span>
            <span className="sl-num truncate text-12 text-faint">{e.detail}</span>
          </span>
          <span className="sl-num text-12 leading-5 text-faint">{e.time}</span>
        </li>
      ))}
    </ul>
  );
}

/** A 240px search input with a leading glyph. */
export function SearchField({
  value, onChange, placeholder, label, className,
}: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <label className={cn('relative block w-full sm:w-60', className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 stroke-[1.75] text-faint" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-8 pl-8"
      />
    </label>
  );
}

/** An inset tile inside a card: faint label, mono value. */
export function InsetStat({
  label, value, tone = 'neutral', size = 'md', className,
}: { label: string; value: React.ReactNode; tone?: Tone; size?: 'md' | 'lg'; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 rounded-md bg-sunken p-3', className)}>
      <span className="text-12 text-faint">{label}</span>
      <span className={cn('sl-num font-semibold', size === 'lg' ? 'text-20' : 'text-16', TONE_TEXT[tone])}>{value}</span>
    </div>
  );
}

/** A legend swatch for charts whose legend sits in the card header. */
export function LegendItem({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-12 text-muted">
      <span
        aria-hidden
        className={cn('w-3', dashed ? 'h-0 border-t-2 border-dashed' : 'h-0.5')}
        style={dashed ? { borderColor: color } : { background: color }}
      />
      {label}
    </span>
  );
}

/** A labelled 8px meter row: label left, mono value right. */
export function MeterRow({ label, value, children }: { label: string; value: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex justify-between text-14">
        <span className="text-muted">{label}</span>
        <span className="sl-num text-strong">{value}</span>
      </span>
      {children}
    </div>
  );
}

/** SVG path through `d`, scaled to a W×H box with `max` at the top. */
export const linePath = (d: number[], max: number, W: number, H: number) =>
  d
    .map((v, i) => `${i ? 'L' : 'M'}${((i * W) / (d.length - 1)).toFixed(1)} ${(H - (Math.min(max, Math.max(0, v)) / max) * H).toFixed(1)}`)
    .join(' ');

/** The same path closed down to the baseline, for a 6–8% area fill. */
export const areaPath = (d: number[], max: number, W: number, H: number) => `${linePath(d, max, W, H)} L${W} ${H} L0 ${H} Z`;

/** Mono x-axis labels spread under a chart. */
export function TimeAxis({ labels }: { labels: string[] }) {
  return (
    <div className="sl-num mt-2 flex justify-between text-12 text-faint">
      {labels.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}
