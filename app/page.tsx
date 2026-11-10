'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertBanner, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, ChartLegend, Dot, EventFeed,
  MeterRow, MetricCard, MetricGrid, PageBody, PageHeader, Progress, ScoreBar, Sparkline, StatusDot, Table,
  TableBody, TableCell, TableHead, TableHeader, TableRow, TimeSeriesChart, scoreTone, toneText, toneVar,
} from '@lumyx/ui';
import { useDashboard } from '@/components/dashboard-chrome';
import { DashboardTopBar, RANGE_LABEL } from '@/components/dashboard-top-bar';
import { EVENTS, FLEET_PEERS, ROOMS, TIME_LABELS, metricTone, series, shift } from '@/lib/dashboard-data';

const BW_MAX = 16;

export default function OverviewPage() {
  const router = useRouter();
  const { range, tick } = useDashboard();
  const [alert, setAlert] = React.useState(true);

  const bwOut = series(48, 2 + tick * 0.15, 11, 2.2);
  const bwIn = series(48, 5 + tick * 0.15, 3.1, 0.8);
  const worst = [...FLEET_PEERS].sort((a, b) => a.score - b.score).slice(0, 6);
  const active = ROOMS.filter((r) => r.state === 'active');

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Overview' }]} />
      <PageBody>
        <PageHeader title="Overview" description={`This instance, last ${RANGE_LABEL[range]}.`} />

        {alert ? (
          <AlertBanner
            severity="critical"
            title="Peer ff104b2c is degrading"
            body="Packet loss has been above 2% for 3m 12s. Force audio only or renegotiate the session."
            context="webinar-us · ap-south-1 · 14:06:41 · loss 7.90% vs 2%"
            actionLabel="Open room"
            onAction={() => router.push('/rooms/room?id=webinar-us')}
            onDismiss={() => setAlert(false)}
            dismissLabel="Dismiss alert"
          />
        ) : null}

        <MetricGrid columns={5}>
          <MetricCard label="Active rooms" value={4} sub="1 idle" series={series(20, 1, 4, 1)} seriesColor="var(--idle)" />
          <MetricCard
            label="Connected peers" value={65 + (tick % 3)} sub="+3 in 60s" subState="ok"
            series={series(20, 2 + tick * 0.2, 62, 4)}
          />
          <MetricCard label="Bandwidth out" value={bwOut[47].toFixed(1)} unit="Mbps" sub="3.1 Mbps in" series={bwOut.slice(28)} />
          <MetricCard
            label="Packets forwarded" value={(1284920 + tick * 1840).toLocaleString('en-US')} sub="1.29 GB total"
            series={series(20, 3, 10, 2)} seriesColor="var(--idle)"
          />
          <MetricCard
            label="Alerts" value={4} state="danger" sub="2 critical"
            series={[1, 1, 2, 1, 2, 2, 3, 2, 3, 4, 4, 3, 4, 4]} seriesColor="var(--danger-solid)"
          />
        </MetricGrid>

        <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bandwidth</CardTitle>
                <span className="flex-1" />
                <ChartLegend
                  items={[
                    { name: 'Outbound', color: 'var(--series-1)' },
                    { name: 'Inbound', color: 'var(--series-2)' },
                  ]}
                />
              </CardHeader>
              <CardContent>
                <TimeSeriesChart
                  height={220}
                  max={BW_MAX}
                  yUnit=" Mbps"
                  xLabels={TIME_LABELS}
                  legend={false}
                  series={[
                    { name: 'Outbound', color: 'var(--series-1)', data: bwOut, area: true },
                    { name: 'Inbound', color: 'var(--series-2)', data: bwIn },
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Peers</CardTitle>
                <CardDescription>6 of 65 · worst first</CardDescription>
                <span className="flex-1" />
                <Button asChild variant="secondary">
                  <Link href="/peers" className="no-underline hover:no-underline">View all</Link>
                </Button>
              </CardHeader>
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Peer</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead className="text-right">RTT</TableHead>
                    <TableHead className="text-right">Jitter</TableHead>
                    <TableHead className="text-right">Loss</TableHead>
                    <TableHead>60s</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {worst.map((p) => (
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
                      <TableCell className="text-muted">{p.room}</TableCell>
                      <TableCell><ScoreBar score={p.score} /></TableCell>
                      <TableCell className={`sl-num text-right ${toneText[metricTone(p.rtt, 150, 200)]}`}>{p.rtt}</TableCell>
                      <TableCell className={`sl-num text-right ${toneText[metricTone(p.jitter, 20, 30)]}`}>{p.jitter}</TableCell>
                      <TableCell className={`sl-num text-right ${toneText[metricTone(p.loss, 1, 2)]}`}>{p.loss.toFixed(2)}%</TableCell>
                      <TableCell>
                        <Sparkline data={p.series} width={72} height={24} fill={false} color={toneVar[scoreTone(p.score)]} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Card className="p-2">
              <div className="flex items-center gap-2 px-2 pt-2 pb-3">
                <CardTitle>Active rooms</CardTitle>
                <span className="sl-num text-12 text-faint">{active.length}</span>
              </div>
              {active.map((r) => {
                const tone = r.health === 'ok' ? 'ok' : 'warn';
                return (
                  <Link
                    key={r.id}
                    href={`/rooms/room?id=${r.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-md p-3 no-underline transition-colors duration-300 ease-[var(--ease-out)] hover:bg-sunken hover:no-underline"
                  >
                    <span className="flex items-center gap-2 text-14 font-semibold text-strong">
                      <Dot tone={tone} />
                      <span className="sl-num">{r.id}</span>
                    </span>
                    <Sparkline data={shift(r.series, tick % 6)} width={72} height={20} fill={false} color={toneVar[tone]} />
                    <span className="text-12 text-faint">{r.peers} peers · {r.uptime} · {r.region}</span>
                    <span className="sl-num text-right text-12 text-muted">{r.bitrate}</span>
                  </Link>
                );
              })}
            </Card>

            <Card>
              <CardHeader><CardTitle>Capacity</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-4">
                <MeterRow label="Rooms" value="4 / 32"><Progress value={12.5} /></MeterRow>
                <MeterRow label="Uplink" value="41%"><Progress value={41} /></MeterRow>
                <MeterRow label="Metrics retention" value="82%"><Progress value={82} indicatorClassName="bg-warn-solid" /></MeterRow>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="gap-x-2">
                <CardTitle>Recent events</CardTitle>
                <StatusDot status="live" size="sm" />
              </CardHeader>
              <CardContent className="pb-2">
                <EventFeed events={EVENTS} className="-mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
