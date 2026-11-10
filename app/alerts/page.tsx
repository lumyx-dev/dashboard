'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import {
  Badge, Button, Card, Dot, EmptyState, InsetStat, PageBody, PageHeader, SegmentedControl, areaPath, cn, linePath, toneVar,
  type Tone,
} from '@lumyx/ui';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { ALERTS, type AlertRow } from '@/lib/dashboard-data';

type Tab = 'open' | 'resolved';

const TABS: { value: Tab; label: string }[] = [
  { value: 'open', label: `Open · ${ALERTS.filter((a) => a.open).length}` },
  { value: 'resolved', label: 'Resolved' },
];

const alertTone = (a: AlertRow): Tone => (!a.open ? 'ok' : a.sev === 'critical' ? 'danger' : 'warn');

/** The metric over the last 10 minutes: under threshold, then crossing it (or back under once resolved). */
function curve(a: AlertRow) {
  return Array.from({ length: 40 }, (_, i) => {
    const r = i / 39;
    const v = a.open
      ? a.t * 0.5 + (a.v - a.t * 0.5) * Math.min(1, Math.max(0, (r - 0.45) * 3))
      : a.v * (r < 0.6 ? 1 : 0.4);
    return Math.max(0, v * (1 + 0.06 * Math.sin(i * 1.7)));
  });
}

export default function AlertsPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>('open');
  const [selected, setSelected] = React.useState('a1');
  const [acked, setAcked] = React.useState<Record<string, boolean>>({});

  const list = ALERTS.filter((a) => (tab === 'open' ? a.open : !a.open));
  const ad = list.find((a) => a.id === selected) ?? list[0] ?? ALERTS[0];
  const tone = alertTone(ad);
  const color = toneVar[tone];
  const data = curve(ad);
  // Hand-drawn: in a 440px card TimeSeriesChart's axis text gets squashed. 4% headroom over max.
  const max = ad.max / 0.96;
  const thY = (100 - Math.min(1, ad.t / ad.max) * 96).toFixed(1);

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Alerts' }]} />
      <PageBody>
        <PageHeader
          title="Alerts"
          description="A metric that stays past its threshold for 30s opens an alert."
          actions={<SegmentedControl aria-label="Alert state" options={TABS} value={tab} onValueChange={setTab} />}
        />

        <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_440px]">
          <Card className="flex min-w-0 flex-col gap-1 p-2">
            {list.map((a) => {
              const isSel = a.id === ad.id;
              const state = !a.open ? 'Resolved' : acked[a.id] ? 'Acknowledged' : 'Open';
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelected(a.id)}
                  aria-pressed={isSel}
                  className={cn(
                    'grid w-full grid-cols-[8px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-md border p-3 text-left transition-colors duration-300 ease-[var(--ease-out)]',
                    isSel ? 'border-accent-border bg-accent-subtle' : 'border-transparent hover:bg-sunken',
                  )}
                >
                  <Dot tone={a.open ? (a.sev === 'critical' ? 'danger' : 'warn') : 'idle'} />
                  <span className="text-14 font-semibold text-strong">{a.title}</span>
                  <Badge tone={state === 'Open' ? 'danger' : state === 'Acknowledged' ? 'warn' : 'ok'}>{state}</Badge>
                  <span />
                  <span className="sl-num truncate text-12 text-faint">{a.peer} · {a.room} · {a.value} vs {a.th}</span>
                  <span className="sl-num text-12 text-faint">{a.dur}</span>
                </button>
              );
            })}
            {list.length === 0 ? (
              <EmptyState title="Nothing here." body="Every metric is within its threshold." className="py-12" />
            ) : null}
          </Card>

          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-md',
                  tone === 'ok' ? 'bg-ok-tint text-ok' : tone === 'danger' ? 'bg-danger-tint text-danger' : 'bg-warn-tint text-warn',
                )}
              >
                <AlertTriangle className="size-5 stroke-[1.75]" />
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-20 font-semibold text-strong">{ad.title}</span>
                <span className="sl-num text-12 text-faint">{ad.metric} · opened {ad.opened}</span>
              </span>
              <Badge tone={tone === 'ok' ? 'ok' : tone === 'danger' ? 'danger' : 'warn'}>
                {!ad.open ? 'Resolved' : ad.sev === 'critical' ? 'Critical' : 'Warning'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <InsetStat label="Current" value={ad.value} tone={tone} size="lg" />
              <InsetStat label="Threshold" value={ad.th} size="lg" />
              <InsetStat label="Duration" value={ad.dur} size="lg" />
            </div>

            <div>
              <span className="text-12 text-faint">{ad.metric} · last 10 min</span>
              <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="mt-2 block h-25 w-full" aria-hidden>
                <path d={areaPath(data, max, 400, 100)} fill={color} fillOpacity="0.08" />
                <path d={`M0 ${thY} H400`} stroke="var(--text-faint)" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
                <path d={linePath(data, max, 400, 100)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-12 text-faint">Suggested action</span>
              <p className="text-14 text-body">{ad.action}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => router.push(`/rooms/room?id=${ad.room}`)}>Open room</Button>
              {ad.open ? (
                <Button onClick={() => setAcked((x) => ({ ...x, [ad.id]: !x[ad.id] }))}>
                  {acked[ad.id] ? 'Unacknowledge' : 'Acknowledge'}
                </Button>
              ) : null}
              <Button onClick={() => router.push(`/replay?session=${ad.room === 'test-room' ? 's2' : 's1'}&t=85`)}>
                Replay session
              </Button>
            </div>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
