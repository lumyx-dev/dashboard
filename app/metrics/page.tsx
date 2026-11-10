'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, CardContent, CardHeader, CardTitle, PageBody, PageHeader, Sparkline, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, cn,
} from '@lumyx/ui';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { LegendItem, TONE_TEXT, TONE_VAR, TimeAxis, linePath } from '@/components/dashboard-parts';
import { METRICS, ROOMS, TIME_LABELS, series, type MetricDef, type Tone } from '@/lib/dashboard-data';

const N = 48;

const isWorse = (m: MetricDef, v: number) => (m.field === 'bitrate_kbps' ? v < m.th : v > m.th);
const fmt = (m: MetricDef, v: number) => (m.unit === '%' ? `${v.toFixed(m.dp)}%` : `${Math.round(v)}${m.unit}`);
const toneOf = (m: MetricDef, v: number): Tone => (isWorse(m, v) ? 'danger' : isWorse(m, v * 1.25) ? 'warn' : 'neutral');

export default function MetricsPage() {
  const router = useRouter();
  const [field, setField] = React.useState(METRICS[0].field);
  const m = METRICS.find((x) => x.field === field) ?? METRICS[0];

  const spike = (i: number, k: number) => (i > 30 && i < 40 ? m.spike * k * Math.sin(((i - 30) / 10) * Math.PI) : 0);
  const p50 = Array.from({ length: N }, (_, i) => m.base + m.amp * Math.sin(i / 3.1) + spike(i, 0.25));
  const p95 = p50.map((v, i) => v * 1.6 + spike(i, 1));
  // Plot box: 220 high, 10 of headroom, so the max sits at y=10.
  const max = m.max * (220 / 210);
  const y = (v: number) => (220 - (Math.min(1, Math.max(0, v) / m.max) * 210)).toFixed(1);
  const p95Line = linePath(p95, max, 600, 220);
  const band = `${p95Line} ${p50
    .slice()
    .reverse()
    .map((v, i) => `L${(((N - 1 - i) * 600) / (N - 1)).toFixed(1)} ${y(v)}`)
    .join(' ')} Z`;

  const rooms = ROOMS.filter((r) => r.state === 'active').map((r, k) => {
    const f = [1, 0.8, 2.2, 0.5][k];
    const v50 = m.base * f;
    const v95 = m.base * 1.6 * f + (k === 2 ? m.spike * 0.6 : 0);
    const over = isWorse(m, v95) ? (k === 2 ? 2 : 1) : 0;
    return { id: r.id, v50, v95, vmax: v95 * 1.4, over, spark: series(30, k + 3, v50, m.amp * f + 0.01) };
  });

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Metrics' }]} />
      <PageBody>
        <PageHeader title="Metrics" description="Six numbers per peer, sampled every 500 ms, rolled up per room." />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 min-[1100px]:grid-cols-6">
          {METRICS.map((x) => {
            const on = x.field === m.field;
            const pv = x.base * 1.6 + x.spike * 0.6;
            return (
              <button
                key={x.field}
                type="button"
                aria-pressed={on}
                onClick={() => setField(x.field)}
                className={cn(
                  'flex flex-col gap-1 rounded-lg border bg-card px-4 py-3 text-left transition-all duration-400 ease-[var(--ease-out)]',
                  on ? 'border-accent shadow-[0_0_0_3px_var(--accent-tint)]' : 'border-hairline hover:border-stroke-hover',
                )}
              >
                <span className="text-12 text-muted">{x.name}</span>
                <span className={cn('sl-num text-20 font-semibold', isWorse(x, pv) ? 'text-danger' : 'text-strong')}>{fmt(x, pv)}</span>
                <span className="sl-num text-12 text-faint">
                  p95 · limit {x.field === 'bitrate_kbps' ? '< ' : '> '}{x.th}{x.unit === '%' ? '%' : x.unit}
                </span>
              </button>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{m.name}</CardTitle>
            <span className="sl-num text-12 text-faint">{m.field}</span>
            <span className="flex-1" />
            <LegendItem color="var(--series-1)" label="p50" />
            <LegendItem color="var(--series-2)" label="p95" />
            <LegendItem color="var(--text-faint)" label="threshold" dashed />
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="block h-60 w-full" role="img" aria-label={`${m.name}, p50 and p95`}>
              <path d="M0 55H600M0 110H600M0 165H600" stroke="var(--border-subtle)" vectorEffect="non-scaling-stroke" />
              <path d={band} fill="var(--series-1)" fillOpacity="0.06" />
              <path d={`M0 ${y(m.th)} H600`} stroke="var(--text-faint)" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
              <path d={linePath(p50, max, 600, 220)} fill="none" stroke="var(--series-1)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <path d={p95Line} fill="none" stroke="var(--series-2)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            <TimeAxis labels={TIME_LABELS} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader><CardTitle>By room</CardTitle></CardHeader>
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead className="text-right">p50</TableHead>
                <TableHead className="text-right">p95</TableHead>
                <TableHead className="text-right">Max</TableHead>
                <TableHead className="text-right">Peers over</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((r) => {
                const tone = toneOf(m, r.v95);
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => router.push(`/rooms/room?id=${r.id}`)}>
                    <TableCell className="sl-num font-medium text-strong">{r.id}</TableCell>
                    <TableCell className="sl-num text-right text-strong">{fmt(m, r.v50)}</TableCell>
                    <TableCell className={cn('sl-num text-right', TONE_TEXT[tone])}>{fmt(m, r.v95)}</TableCell>
                    <TableCell className="sl-num text-right text-muted">{fmt(m, r.vmax)}</TableCell>
                    <TableCell className={cn('sl-num text-right', r.over ? 'text-danger' : 'text-faint')}>{r.over}</TableCell>
                    <TableCell>
                      <Sparkline data={r.spark} width={96} height={24} fill={false} color={TONE_VAR[tone]} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </PageBody>
    </>
  );
}
