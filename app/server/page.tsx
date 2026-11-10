'use client';

import Link from 'next/link';
import {
  Button, Card, CardContent, CardDescription, CardHeader, CardTitle, CodeBlock, MetricCard, MetricGrid, PageBody,
  PageHeader, cn,
} from '@lumyx/ui';
import { useDashboard } from '@/components/dashboard-chrome';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { DEFAULT_CONFIG, INSTANCE, PROCESS_INFO, tomlLines } from '@/lib/dashboard-data';

export default function ServerPage() {
  const { tick } = useDashboard();
  const cpu = Math.round(23 + 6 * Math.sin(tick / 2));
  const host = [
    { label: 'CPU', value: String(cpu), unit: '%', pct: cpu, warn: false, sub: '8 cores · load 1.84' },
    { label: 'Memory', value: '412', unit: 'MB', pct: 20, warn: false, sub: 'of 2 GB · RSS stable' },
    { label: 'Uplink', value: '12.4', unit: 'Mbps', pct: 12, warn: false, sub: 'of 100 Mbps provisioned' },
    { label: 'UDP ports', value: '64', unit: 'in use', pct: 63, warn: true, sub: 'range 50000 to 50100' },
  ];
  const cores = Array.from({ length: 8 }, (_, i) =>
    Math.max(6, Math.min(96, 18 + 30 * Math.abs(Math.sin(i * 1.3 + tick / 3)) + (i === 2 ? 28 : 0))),
  );

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Server' }]} />
      <PageBody>
        <PageHeader
          title="Server"
          description={<span className="sl-num">{INSTANCE.name} · {INSTANCE.region} · pid 1</span>}
          actions={
            <Button asChild variant="secondary">
              <Link href="/settings" className="no-underline hover:no-underline">Edit configuration</Link>
            </Button>
          }
        />

        <MetricGrid columns={4} className="grid-cols-2">
          {host.map((k) => (
            <MetricCard
              key={k.label}
              label={k.label}
              value={k.value}
              unit={k.unit}
              sub={k.sub}
              progress={{ value: k.pct, indicatorClassName: k.warn ? 'bg-warn-solid' : undefined }}
            />
          ))}
        </MetricGrid>

        <div className="grid items-start gap-4 min-[1100px]:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Load per core</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex h-35 items-end gap-2">
                {cores.map((v, i) => (
                  <span key={i} className="flex h-full flex-1 items-end overflow-hidden rounded-sm bg-hover">
                    <span
                      className={cn(
                        'w-full transition-[height] duration-600 ease-[var(--ease-out)]',
                        v > 70 ? 'bg-warn-solid' : 'bg-accent-muted',
                      )}
                      style={{ height: `${v.toFixed(0)}%` }}
                    />
                  </span>
                ))}
              </div>
              <div className="sl-num flex gap-2 text-12 text-faint">
                {cores.map((_, i) => <span key={i} className="flex-1 text-center">c{i}</span>)}
              </div>
              <p className="text-12 text-faint">One forwarding worker per core. Rooms are pinned to a worker when they are created.</p>
            </CardContent>
          </Card>

          <Card className="p-2">
            <CardTitle className="px-2 pt-2 pb-1">Process</CardTitle>
            {PROCESS_INFO.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(0,160px)_minmax(0,1fr)] gap-3 border-t border-subtle p-2 text-14 sm:grid-cols-[160px_minmax(0,1fr)]">
                <span className="text-faint">{k}</span>
                <span className="sl-num text-13 break-words text-strong">{v}</span>
              </div>
            ))}
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-x-3">
            <CardTitle>lumyx.toml</CardTitle>
            <CardDescription>Read at startup · read only here</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock className="leading-5">
              {tomlLines(DEFAULT_CONFIG).map((line, i) => (
                <div key={i} className={cn('min-h-5 whitespace-pre', line.startsWith('[') && 'text-on-ink-accent')}>
                  {line || ' '}
                </div>
              ))}
            </CodeBlock>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
