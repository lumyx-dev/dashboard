'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EventFeed, InsetStat, MetricCard, PageBody,
  ScoreBar, SegmentedControl, StatusDot, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, areaPath, cn,
  linePath, scoreTone, toneText, toneVar, type Tone,
  thresholdTone,
} from '@lumyx/ui';
import { useDashboard } from '@/components/dashboard-chrome';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { GRAPH_POS, MATRIX, PEERS, ROOMS, ROOM_EVENTS, shift } from '@/lib/dashboard-data';

type Topo = 'graph' | 'matrix';

const TOPO: { value: Topo; label: string }[] = [
  { value: 'graph', label: 'Graph' },
  { value: 'matrix', label: 'Matrix' },
];

function RoomDetail() {
  const params = useSearchParams();
  const room = ROOMS.find((r) => r.id === params.get('id')) ?? ROOMS[0];
  const fromParam = PEERS.findIndex((p) => p.peer_id === params.get('peer'));
  const [sel, setSel] = React.useState(fromParam >= 0 ? fromParam : 3);
  const [topo, setTopo] = React.useState<Topo>('graph');

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Rooms', href: '/rooms' }, { label: room.id }]} />
      <PageBody>
        <div className="flex flex-wrap items-center gap-3">
          <StatusDot status={room.state === 'active' ? 'live' : 'idle'} className="size-2.5" />
          <h1 className="sl-num text-24 font-semibold text-strong">{room.id}</h1>
          <Badge shape="chip">{room.region}</Badge>
          <span className="text-14 text-muted">Up {room.uptime} · {room.peers} peers · {room.bitrate}</span>
          <span className="flex-1" />
          <Button asChild variant="secondary">
            <Link href={`/replay?room=${room.id}`} className="no-underline hover:no-underline">Session replay</Link>
          </Button>
          <Button variant="danger-outline">Close room</Button>
        </div>

        <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader className="gap-x-3 pb-4">
                <CardTitle>Topology</CardTitle>
                <CardDescription>{PEERS.length} peers · 1 relay path</CardDescription>
                <span className="flex-1" />
                <SegmentedControl aria-label="Topology view" options={TOPO} value={topo} onValueChange={setTopo} />
              </CardHeader>
              <CardContent>
                {topo === 'graph' ? (
                  <>
                    <TopologyGraph selected={sel} onSelect={setSel} />
                    <p className="mt-3 text-12 text-faint">Stroke width is bitrate. Dashed edge is a relay path. Click a peer to inspect it.</p>
                  </>
                ) : (
                  <>
                    <TopologyMatrix />
                    <p className="mt-3 text-12 text-faint">Rows are senders, columns receivers. A pale row isolates the faulty uplink at a glance.</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="gap-x-3">
                <CardTitle>Peers</CardTitle>
                <CardDescription>Click a row to inspect</CardDescription>
              </CardHeader>
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Peer</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead className="text-right">RTT</TableHead>
                    <TableHead className="text-right">Jitter</TableHead>
                    <TableHead className="text-right">Loss</TableHead>
                    <TableHead className="text-right">NACK</TableHead>
                    <TableHead>Codec</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PEERS.map((p, i) => (
                    <TableRow key={p.peer_id} data-selected={i === sel} className="cursor-pointer" onClick={() => setSel(i)}>
                      <TableCell>
                        <span className="sl-num inline-flex items-center gap-2 font-medium text-strong">
                          <StatusDot status={p.status === 'live' ? 'healthy' : 'failed'} />
                          {p.peer_id}
                        </span>
                      </TableCell>
                      <TableCell><ScoreBar score={p.score} /></TableCell>
                      <TableCell className={`sl-num text-right ${toneText[thresholdTone(p.rtt, 150, 200, 'neutral')]}`}>{p.rtt}</TableCell>
                      <TableCell className={`sl-num text-right ${toneText[thresholdTone(p.jitter, 20, 30, 'neutral')]}`}>{p.jitter}</TableCell>
                      <TableCell className={`sl-num text-right ${toneText[thresholdTone(p.loss, 1, 2, 'neutral')]}`}>{p.loss.toFixed(2)}%</TableCell>
                      <TableCell className={`sl-num text-right ${toneText[thresholdTone(p.nack, 3, 5, 'neutral')]}`}>{p.nack.toFixed(1)}%</TableCell>
                      <TableCell><Badge tone="accent" shape="chip">{p.codec}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard size="sm" label="Peers" value={room.peers} className="gap-1" />
              <MetricCard size="sm" label="Bitrate" value={room.bitrate} className="gap-1" />
              <MetricCard size="sm" label="RTT p50" value="94 ms" state="warn" className="gap-1" />
              <MetricCard size="sm" label="Loss" value="1.41%" state="warn" className="gap-1" />
            </div>
            <SelectedPeer index={sel} />
            <Card>
              <CardHeader className="gap-x-2">
                <CardTitle>Room timeline</CardTitle>
                <StatusDot status="live" size="sm" />
              </CardHeader>
              <CardContent className="pb-2">
                <EventFeed events={ROOM_EVENTS} className="-mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function TopologyGraph({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  return (
    <div className="relative h-85 overflow-hidden rounded-md border border-subtle bg-sunken">
      <svg viewBox="0 0 1000 340" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        {PEERS.map((p, i) => {
          const [x, y] = GRAPH_POS[i];
          const stroke = p.status === 'degraded' ? (p.path === 'relay' ? 'var(--danger-solid)' : 'var(--warn-solid)') : 'var(--border-hover)';
          return (
            <path
              key={p.peer_id}
              d={`M500 170 L${x * 10} ${y * 3.4}`}
              fill="none"
              stroke={stroke}
              strokeWidth={1.5 + p.score / 30}
              strokeDasharray={p.path === 'relay' ? '6 6' : undefined}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <span className="sl-num absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-ink px-4 py-2 text-14 text-card">
        sfu-core
      </span>
      {PEERS.map((p, i) => {
        const [x, y] = GRAPH_POS[i];
        const ring = toneVar[scoreTone(p.score)];
        return (
          <button
            key={p.peer_id}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={selected === i}
            aria-label={`Inspect peer ${p.peer_id}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1 rounded-sm"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-pill border-2 bg-card transition-shadow duration-400 ease-[var(--ease-out)]',
                selected === i && 'shadow-[0_0_0_4px_var(--accent-tint),0_0_0_5px_var(--accent)]',
              )}
              style={{ borderColor: ring }}
            >
              <span className="size-2 rounded-pill" style={{ background: ring }} />
            </span>
            <span className="sl-num rounded-2xs bg-card px-1 text-12 text-body">{p.peer_id}</span>
          </button>
        );
      })}
    </div>
  );
}

const CELL: Record<'self' | 'ok' | 'warn' | 'danger', { cls: string; title: string }> = {
  self: { cls: 'bg-hover border-hairline', title: 'self' },
  ok: { cls: 'bg-ok-tint border-ok-border', title: 'healthy' },
  warn: { cls: 'bg-warn-tint border-warn-border', title: 'approaching threshold' },
  danger: { cls: 'bg-danger-tint border-danger-border', title: 'breached' },
};

function TopologyMatrix() {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[480px] grid-cols-[96px_repeat(6,minmax(0,1fr))] gap-1">
        <span />
        {PEERS.map((p) => (
          <span key={p.peer_id} className="sl-num overflow-hidden text-center text-12 text-faint">{p.peer_id.slice(0, 4)}</span>
        ))}
        {PEERS.map((p, r) => (
          <React.Fragment key={p.peer_id}>
            <span className="sl-num text-12 leading-8 text-muted">{p.peer_id}</span>
            {MATRIX[r].map((v, c) => {
              const cell = CELL[v === null ? 'self' : v >= 0.75 ? 'ok' : v >= 0.5 ? 'warn' : 'danger'];
              return (
                <span
                  key={c}
                  title={`${p.peer_id} → ${PEERS[c].peer_id} · ${cell.title}`}
                  className={cn('h-8 rounded-xs border', cell.cls)}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

const RING = 2 * Math.PI * 24;

function SelectedPeer({ index }: { index: number }) {
  const { tick } = useDashboard();
  const p = PEERS[index] ?? PEERS[0];
  const tone = scoreTone(p.score);
  const color = toneVar[tone];
  const rtt = shift(p.series, tick % 6);
  const max = Math.max(...rtt) * 1.2;
  const stats: { k: string; v: string; tone: Tone }[] = [
    { k: 'RTT', v: `${p.rtt} ms`, tone: thresholdTone(p.rtt, 150, 200, 'neutral') },
    { k: 'Jitter', v: `${p.jitter} ms`, tone: thresholdTone(p.jitter, 20, 30, 'neutral') },
    { k: 'Loss', v: `${p.loss.toFixed(2)}%`, tone: thresholdTone(p.loss, 1, 2, 'neutral') },
    { k: 'NACK', v: `${p.nack.toFixed(1)}%`, tone: thresholdTone(p.nack, 3, 5, 'neutral') },
  ];

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <span className="relative size-14 shrink-0">
          <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--surface-hover)" strokeWidth="5" />
            <circle
              cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${((p.score / 100) * RING).toFixed(1)} ${RING.toFixed(1)}`}
              transform="rotate(-90 28 28)"
            />
          </svg>
          <span className={cn('sl-num absolute inset-0 flex items-center justify-center text-16 font-semibold', toneText[tone])}>
            {p.score}
          </span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="sl-num text-16 font-semibold text-strong">{p.peer_id}</span>
          <span className="truncate text-12 text-faint">{p.region} · {p.codec} · {p.tracks.join(' + ')}</span>
        </span>
        <Badge tone={p.status === 'live' ? 'ok' : 'danger'}>{p.status === 'live' ? 'Live' : 'Degraded'}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => <InsetStat key={s.k} label={s.k} value={s.v} tone={s.tone} />)}
      </div>
      <div>
        <span className="text-12 text-faint">RTT · last 60s</span>
        <svg viewBox="0 0 300 56" preserveAspectRatio="none" className="mt-2 block h-14 w-full" aria-hidden>
          <path d={areaPath(rtt, max, 300, 56)} fill={color} fillOpacity="0.08" />
          <path d={linePath(rtt, max, 300, 56)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </Card>
  );
}

export default function RoomDetailPage() {
  return (
    <React.Suspense
      fallback={
        <>
          <DashboardTopBar crumbs={[{ label: 'Rooms', href: '/rooms' }]} />
          <PageBody>{null}</PageBody>
        </>
      }
    >
      <RoomDetail />
    </React.Suspense>
  );
}
