'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Pause, Play } from 'lucide-react';
import {
  Card, CardTitle, Dot, InsetStat, PageBody, PageHeader, cn, linePath, toneBg, type Tone,
} from '@lumyx/ui';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import {
  REPLAY_EVENTS, REPLAY_PEERS, SESSIONS, clock, replayLossAt,
} from '@/lib/dashboard-data';

function Replay() {
  const params = useSearchParams();
  const initial =
    SESSIONS.find((s) => s.id === params.get('session')) ?? SESSIONS.find((s) => s.room === params.get('room')) ?? SESSIONS[0];
  const [sessionId, setSessionId] = React.useState(initial.id);
  const [rt, setRt] = React.useState(() => Number(params.get('t') ?? 89) || 0);
  const [playing, setPlaying] = React.useState(false);

  const se = SESSIONS.find((s) => s.id === sessionId) ?? SESSIONS[0];
  const t = Math.min(rt, se.len);
  const atEnd = t >= se.len;
  const isPlaying = playing && !atEnd;

  React.useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setRt((r) => Math.min(se.len, r + 1)), 120);
    return () => clearInterval(id);
  }, [isPlaying, se.len]);

  const togglePlay = () => {
    if (isPlaying) return setPlaying(false);
    if (atEnd) setRt(0);
    setPlaying(true);
  };

  const pick = (id: string) => {
    setPlaying(false);
    setSessionId(id);
    setRt(0);
  };

  const seekTo = (fraction: number) => setRt(Math.round(Math.max(0, Math.min(1, fraction)) * se.len));

  const lossNow = replayLossAt(t);
  const frozen = t >= 101 && t < 140;
  const audioOnly = t >= 140;
  const direct = t < 62;
  const events = REPLAY_EVENTS.filter((e) => e.at <= se.len);
  const lossCurve = Array.from({ length: 61 }, (_, i) => replayLossAt((i * se.len) / 60));
  const pct = (t / se.len) * 100;

  const stats: { k: string; v: string; tone: Tone }[] = [
    { k: 'Packet loss', v: `${lossNow.toFixed(1)}%`, tone: lossNow > 2 ? 'danger' : 'neutral' },
    { k: 'Round trip', v: `${direct ? 48 : 284} ms`, tone: direct ? 'neutral' : 'danger' },
    { k: 'Path', v: direct ? 'host' : 'relay', tone: direct ? 'neutral' : 'warn' },
    { k: 'Video', v: t < 12 ? 'joining' : frozen ? 'frozen' : audioOnly ? 'off' : 'flowing', tone: frozen ? 'danger' : 'neutral' },
  ];

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Session replay' }]} />
      <PageBody>
        <PageHeader
          title="Session replay"
          description="Step through a call as the forwarder saw it: who was frozen, when, and why."
        />

        <div className="grid items-start gap-4 min-[1100px]:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="flex flex-col gap-1 p-2">
            <span className="p-2 text-12 font-semibold text-faint">Recordings</span>
            {SESSIONS.map((s) => {
              const on = s.id === se.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(s.id)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 rounded-md border p-3 text-left transition-colors duration-300 ease-[var(--ease-out)]',
                    on ? 'border-accent-border bg-accent-subtle' : 'border-transparent hover:bg-sunken',
                  )}
                >
                  <span className="flex items-center gap-2 text-14 font-semibold text-strong">
                    <span className="sl-num">{s.room}</span>
                    <span className="flex-1" />
                    <Dot tone={s.tone} />
                  </span>
                  <span className="text-12 text-faint">{s.when} · {clock(s.len)} · {s.note}</span>
                </button>
              );
            })}
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            <Card className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {REPLAY_PEERS.map((id, k) => {
                  const fz = k === 0 && frozen;
                  const ao = k === 0 && audioOnly;
                  const joined = !(k === 0 && t < 12);
                  const tag = !joined ? 'Joining' : fz ? 'Frozen' : ao ? 'Audio only' : 'Live';
                  return (
                    <div
                      key={id}
                      className={cn(
                        'relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-md border',
                        fz ? 'border-danger-border bg-danger-tint' : 'border-subtle bg-sunken',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-10 items-center justify-center rounded-pill bg-accent-tint text-16 font-semibold text-accent-text',
                          !joined ? 'opacity-20' : fz ? 'opacity-40' : '',
                        )}
                      >
                        {id.replace(/[^a-z]/g, '')[0].toUpperCase()}
                      </span>
                      <span className="sl-num absolute bottom-2 left-2 text-12 text-body">{id}</span>
                      <span
                        className={cn(
                          'absolute top-2 right-2 rounded-pill px-2 py-0.5 text-12 font-semibold',
                          !joined ? 'bg-hover text-faint' : fz ? 'bg-danger-tint text-danger' : ao ? 'bg-warn-tint text-warn' : 'bg-ok-tint text-ok',
                        )}
                      >
                        {tag}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-ink text-card transition-transform duration-400 ease-[var(--ease-out)] active:scale-[0.98]"
                >
                  {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
                </button>
                <span className="sl-num w-24 text-14 text-strong">{clock(t)}</span>
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Playhead"
                  aria-valuemin={0}
                  aria-valuemax={se.len}
                  aria-valuenow={t}
                  aria-valuetext={clock(t)}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    seekTo((e.clientX - r.left) / r.width);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') setRt(Math.min(se.len, t + 5));
                    if (e.key === 'ArrowLeft') setRt(Math.max(0, t - 5));
                  }}
                  className="relative h-10 flex-1 cursor-pointer rounded-xs"
                >
                  <span className="absolute inset-x-0 top-4.5 h-1 rounded-pill bg-hover" />
                  <span className="absolute top-4.5 left-0 h-1 rounded-pill bg-accent" style={{ width: `${pct}%` }} />
                  {events.map((e) => (
                    <span
                      key={e.at}
                      title={e.label}
                      className={cn('absolute top-2.5 -ml-0.5 h-5 w-1 rounded-2xs', toneBg[e.tone])}
                      style={{ left: `${(e.at / se.len) * 100}%` }}
                    />
                  ))}
                  <span
                    className="absolute top-3 -ml-2 size-4 rounded-pill border-2 border-accent bg-card"
                    style={{ left: `${pct}%` }}
                  />
                </div>
                <span className="sl-num text-14 text-faint">{clock(se.len)}</span>
              </div>
            </Card>

            <div className="grid items-start gap-4 min-[1100px]:grid-cols-2">
              <Card className="p-4">
                <CardTitle className="mb-3">Events</CardTitle>
                {events.map((e) => (
                  <button
                    key={e.at}
                    type="button"
                    onClick={() => setRt(e.at)}
                    className={cn(
                      'grid w-full grid-cols-[16px_minmax(0,1fr)_auto] gap-2 rounded-sm p-2 text-left transition-colors duration-300 ease-[var(--ease-out)] hover:bg-sunken',
                      e.at <= t ? 'opacity-100' : 'opacity-40',
                    )}
                  >
                    <Dot tone={e.tone} className="mt-1.5" />
                    <span className="flex flex-col">
                      <span className="text-14 font-medium text-strong">{e.label}</span>
                      <span className="sl-num text-12 text-faint">{e.detail}</span>
                    </span>
                    <span className="sl-num text-12 leading-5 text-faint">{clock(e.at)}</span>
                  </button>
                ))}
              </Card>

              <Card className="flex flex-col gap-3 p-4">
                <CardTitle>
                  ff104b2c at <span className="sl-num">{clock(t)}</span>
                </CardTitle>
                <div className="grid grid-cols-2 gap-2">
                  {stats.map((s) => <InsetStat key={s.k} label={s.k} value={s.v} tone={s.tone} size="lg" />)}
                </div>
                {/* Hand-drawn: the playhead is violet, and the card is too narrow for axis text. */}
                <svg viewBox="0 0 400 80" preserveAspectRatio="none" className="block h-20 w-full" aria-hidden>
                  <path d="M0 62 H400" stroke="var(--border-hover)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                  <path
                    d={linePath(lossCurve, 9, 400, 74)}
                    transform="translate(0 4)"
                    fill="none"
                    stroke="var(--danger-solid)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path d={`M${((t / se.len) * 400).toFixed(1)} 0 V80`} stroke="var(--accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="text-12 text-faint">Packet loss over the session. The violet line is the playhead.</span>
              </Card>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}

export default function ReplayPage() {
  return (
    <React.Suspense
      fallback={
        <>
          <DashboardTopBar crumbs={[{ label: 'Session replay' }]} />
          <PageBody>{null}</PageBody>
        </>
      }
    >
      <Replay />
    </React.Suspense>
  );
}
