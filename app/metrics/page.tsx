'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, CardContent, CardHeader, CardTitle, ChartLegend, PageBody, PageHeader, Sparkline, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, TimeSeriesChart, cn, toneText, toneVar, type Tone,
} from '@lumyx/ui';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { METRICS, ROOMS, TIME_LABELS, series, type MetricDef } from '@/lib/dashboard-data';

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
            <ChartLegend
              items={[
                { name: 'p50', color: 'var(--series-1)' },
                { name: 'p95', color: 'var(--series-2)' },
                { name: 'threshold', color: 'var(--text-faint)', swatch: 'dashed' },
              ]}
            />
          </CardHeader>
          <CardContent>
            <TimeSeriesChart
              height={240}
              max={m.max}
              yUnit={m.unit === '%' ? '%' : ''}
              xLabels={TIME_LABELS}
              legend={false}
              band={{ lo: p50, hi: p95, color: 'var(--series-1)' }}
              thresholds={[{ value: m.th, color: 'var(--text-faint)' }]}
              series={[
                { name: 'p50', color: 'var(--series-1)', data: p50 },
                { name: 'p95', color: 'var(--series-2)', data: p95 },
              ]}
            />
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
                    <TableCell className={cn('sl-num text-right', toneText[tone])}>{fmt(m, r.v95)}</TableCell>
                    <TableCell className="sl-num text-right text-muted">{fmt(m, r.vmax)}</TableCell>
                    <TableCell className={cn('sl-num text-right', r.over ? 'text-danger' : 'text-faint')}>{r.over}</TableCell>
                    <TableCell>
                      <Sparkline data={r.spark} width={96} height={24} fill={false} color={toneVar[tone]} />
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
