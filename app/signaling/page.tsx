'use client';

import * as React from 'react';
import {
  Badge, Button, Card, CardContent, CardHeader, CardTitle, MetricCard, MetricGrid, PageBody, PageHeader,
  SegmentedControl, StatusDot, cn,
} from '@lumyx/ui';
import { useDashboard } from '@/components/dashboard-chrome';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { ALL_PEERS, INSTANCE, signalLog, type SignalType } from '@/lib/dashboard-data';

type Filter = 'all' | 'offer' | 'ice' | 'session' | 'error';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'offer', label: 'Offer' },
  { value: 'ice', label: 'ICE' },
  { value: 'session', label: 'Join / leave' },
  { value: 'error', label: 'Errors' },
];

const TYPE_TONE: Record<SignalType, 'accent' | 'neutral' | 'ok' | 'danger'> = {
  offer: 'accent',
  answer: 'accent',
  ice: 'neutral',
  join: 'ok',
  leave: 'neutral',
  error: 'danger',
};

const matches = (f: Filter, type: SignalType) =>
  f === 'all' || f === type || (f === 'session' && (type === 'join' || type === 'leave'));

export default function SignalingPage() {
  const { tick } = useDashboard();
  const [frozenAt, setFrozenAt] = React.useState<number | null>(null);
  const [filter, setFilter] = React.useState<Filter>('all');

  const k = frozenAt ?? tick;
  const log = signalLog(k).filter((l) => matches(filter, l.type)).slice(0, 12);
  const bars = Array.from({ length: 60 }, (_, i) => 30 + 14 * Math.abs(Math.sin((i + k) / 4)) + ((i + k) % 23 === 0 ? 50 : 0));

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Signaling' }]} />
      <PageBody>
        <PageHeader
          title="Signaling"
          description={<span className="sl-num">{INSTANCE.signaling}</span>}
          actions={
            <Button onClick={() => setFrozenAt((x) => (x == null ? tick : null))}>
              {frozenAt == null ? 'Pause stream' : 'Resume stream'}
            </Button>
          }
        />

        <MetricGrid columns={4} className="grid-cols-2">
          <MetricCard label="Open WebSockets" value={ALL_PEERS.length + 51} sub="one per peer" />
          <MetricCard label="Messages / s" value={38 + (k % 9)} sub="peak 112 at 14:06" />
          <MetricCard label="Handshake p50" value="180 ms" sub="offer to connected" />
          <MetricCard label="Failed handshakes" value={2} state="warn" sub="last 24h · token expired" subState="neutral" />
        </MetricGrid>

        <Card>
          <CardHeader><CardTitle>Messages per second</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-24 items-end gap-0.5">
              {bars.map((v, i) => (
                <span
                  key={i}
                  className={cn('flex-1 rounded-[2px]', v > 80 ? 'bg-accent2' : 'bg-accent-soft')}
                  style={{ height: `${((v / 112) * 100).toFixed(0)}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="gap-x-3">
            <CardTitle>Live log</CardTitle>
            <StatusDot status={frozenAt == null ? 'live' : 'idle'} size="sm" />
            <span className="flex-1" />
            <SegmentedControl aria-label="Message type" options={FILTERS} value={filter} onValueChange={setFilter} />
          </CardHeader>
          <div className="sl-scroll overflow-x-auto">
            <div className="sl-num min-w-[640px] text-13">
              {log.map((l) => (
                <div
                  key={l.key}
                  className="grid grid-cols-[96px_24px_120px_120px_minmax(240px,1fr)] items-center gap-3 border-t border-subtle px-4 py-2"
                >
                  <span className="text-faint">{l.time}</span>
                  <span className={l.dir === '↑' ? 'text-accent-text' : 'text-ok'}>{l.dir}</span>
                  <span><Badge shape="chip" tone={TYPE_TONE[l.type]}>{l.type}</Badge></span>
                  <span className="text-body">{l.peer}</span>
                  <span className="truncate text-muted">{l.body}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </PageBody>
    </>
  );
}
