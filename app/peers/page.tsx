'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, MetricCard, MetricGrid, PageBody, PageHeader,
  SegmentedControl, Sparkline, StatusDot, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn,
} from '@lumyx/ui';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { MeterRow, ScoreBar, SearchField, TONE_BG, TONE_TEXT, TONE_VAR } from '@/components/dashboard-parts';
import { ALL_PEERS, scoreTone, sev, type IcePath } from '@/lib/dashboard-data';

type Filter = 'all' | 'degraded' | 'live';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'live', label: 'Healthy' },
];

const BUCKETS: { lo: number; hi: number; label: string; bar: string }[] = [
  { lo: 0, hi: 50, label: '0–49', bar: TONE_BG.danger },
  { lo: 50, hi: 70, label: '50–69', bar: TONE_BG.warn },
  { lo: 70, hi: 85, label: '70–84', bar: 'bg-[var(--indigo-300)]' },
  { lo: 85, hi: 101, label: '85+', bar: TONE_BG.ok },
];

const PATHS: { key: IcePath; label: string; bar: string }[] = [
  { key: 'host', label: 'Direct (host)', bar: TONE_BG.ok },
  { key: 'srflx', label: 'Through NAT (srflx)', bar: 'bg-[var(--indigo-300)]' },
  { key: 'relay', label: 'TURN relay', bar: TONE_BG.danger },
];

const inBucket = (score: number, b: (typeof BUCKETS)[number]) => score >= b.lo && score < b.hi;
const pathCount = (k: IcePath) => ALL_PEERS.filter((p) => p.path === k).length;

export default function PeersPage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>('all');
  const [q, setQ] = React.useState('');

  const query = q.trim().toLowerCase();
  const fleet = ALL_PEERS
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => !query || `${p.peer_id} ${p.room}`.toLowerCase().includes(query))
    .sort((a, b) => a.score - b.score);
  const histMax = Math.max(...BUCKETS.map((b) => ALL_PEERS.filter((p) => inBucket(p.score, b)).length));

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Peers' }]} />
      <PageBody>
        <PageHeader
          title="Peers"
          description={`${fleet.length} of ${ALL_PEERS.length} peers shown, worst first`}
          actions={
            <>
              <SegmentedControl aria-label="Filter peers" options={FILTERS} value={filter} onValueChange={setFilter} />
              <SearchField value={q} onChange={setQ} placeholder="Search peer or room" label="Search peers" />
            </>
          }
        />

        <MetricGrid columns={4} className="grid-cols-2">
          <MetricCard label="Connected" value={65} sub={`across 4 rooms · ${ALL_PEERS.length} listed`} />
          <MetricCard
            label="Degraded" value={ALL_PEERS.filter((p) => p.status === 'degraded').length} state="danger"
            sub="score under 70" subState="neutral"
          />
          <MetricCard label="Median RTT" value="44 ms" sub="p95 212 ms" />
          <MetricCard label="On a relay" value={pathCount('relay')} state="warn" sub="TURN fallback" subState="neutral" />
        </MetricGrid>

        <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="min-w-0 overflow-hidden">
            {fleet.length ? (
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Peer</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead className="text-right">RTT</TableHead>
                    <TableHead className="text-right">Jitter</TableHead>
                    <TableHead className="text-right">Loss</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>60s</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fleet.map((p) => (
                    <TableRow
                      key={p.peer_id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/rooms/room?id=${p.room}&peer=${p.peer_id}`)}
                    >
                      <TableCell>
                        <span className="sl-num inline-flex items-center gap-2 font-medium text-strong">
                          <StatusDot status={p.status === 'live' ? 'healthy' : 'failed'} />
                          {p.peer_id}
                        </span>
                      </TableCell>
                      <TableCell className="sl-num text-13 text-muted">{p.room}</TableCell>
                      <TableCell><ScoreBar score={p.score} /></TableCell>
                      <TableCell className={`sl-num text-right ${TONE_TEXT[sev(p.rtt, 150, 200)]}`}>{p.rtt}</TableCell>
                      <TableCell className={`sl-num text-right ${TONE_TEXT[sev(p.jitter, 20, 30)]}`}>{p.jitter}</TableCell>
                      <TableCell className={`sl-num text-right ${TONE_TEXT[sev(p.loss, 1, 2)]}`}>{p.loss.toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge shape="chip" tone={p.path === 'relay' ? 'danger' : 'neutral'}>{p.path}</Badge>
                      </TableCell>
                      <TableCell>
                        <Sparkline data={p.series} width={72} height={24} fill={false} color={TONE_VAR[scoreTone(p.score)]} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title={`No peer matches “${q.trim()}”.`} className="py-12" />
            )}
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader><CardTitle>Quality distribution</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex h-30 items-end gap-2">
                  {BUCKETS.map((b) => {
                    const n = ALL_PEERS.filter((p) => inBucket(p.score, b)).length;
                    return (
                      <span key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                        <span className="sl-num text-12 text-muted">{n}</span>
                        <span className={cn('w-full rounded-xs', b.bar)} style={{ height: `${Math.max(4, (n / histMax) * 88)}%` }} />
                      </span>
                    );
                  })}
                </div>
                <div className="sl-num flex gap-2 text-12 text-faint">
                  {BUCKETS.map((b) => <span key={b.label} className="flex-1 text-center">{b.label}</span>)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Connection paths</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                {PATHS.map((path) => {
                  const n = pathCount(path.key);
                  return (
                    <MeterRow key={path.key} label={path.label} value={n}>
                      <span className="h-2 overflow-hidden rounded-pill bg-hover">
                        <span className={cn('block h-full rounded-pill', path.bar)} style={{ width: `${((n / ALL_PEERS.length) * 100).toFixed(0)}%` }} />
                      </span>
                    </MeterRow>
                  );
                })}
                <p className="text-12 text-faint">
                  Relay peers pay an extra hop on every packet. They are usually the first to cross a threshold.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
