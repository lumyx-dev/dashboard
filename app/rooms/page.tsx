'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge, Card, EmptyState, PageBody, PageHeader, SegmentedControl, Sparkline, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@lumyx/ui';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { Dot, SearchField, TONE_VAR } from '@/components/dashboard-parts';
import { ROOMS } from '@/lib/dashboard-data';

type Filter = 'active' | 'ended' | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'ended', label: 'Ended' },
  { value: 'all', label: 'All' },
];

export default function RoomsPage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>('active');
  const [q, setQ] = React.useState('');

  const query = q.trim();
  const rows = ROOMS.filter((r) => (filter === 'all' || r.state === filter) && (!query || r.id.includes(query)));

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Rooms' }]} />
      <PageBody>
        <PageHeader
          title="Rooms"
          description={`${rows.length} ${filter === 'all' ? '' : `${filter} `}rooms on this instance`}
          actions={
            <>
              <SegmentedControl aria-label="Filter rooms" options={FILTERS} value={filter} onValueChange={setFilter} />
              <SearchField value={q} onChange={setQ} placeholder="Search by room_id" label="Search rooms" />
            </>
          }
        />

        <Card className="overflow-hidden">
          {rows.length ? (
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>room_id</TableHead>
                  <TableHead className="text-right">Participants</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Bandwidth</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const tone = r.health === 'idle' ? 'idle' : r.health === 'ok' ? 'ok' : 'warn';
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => router.push(`/rooms/room?id=${r.id}`)}>
                      <TableCell className="py-4">
                        <span className="sl-num inline-flex items-center gap-2 font-medium text-strong">
                          <Dot tone={tone} />
                          {r.id}
                        </span>
                      </TableCell>
                      <TableCell className="sl-num py-4 text-right text-strong">{r.peers}</TableCell>
                      <TableCell className="sl-num py-4 text-right text-muted">{r.uptime}</TableCell>
                      <TableCell className="sl-num py-4 text-right text-strong">{r.bitrate}</TableCell>
                      <TableCell className="sl-num py-4 text-right text-muted">{r.data}</TableCell>
                      <TableCell className="py-4"><Badge shape="chip">{r.region}</Badge></TableCell>
                      <TableCell className="py-4">
                        <Sparkline data={r.series} width={72} height={20} fill={false} color={TONE_VAR[tone]} />
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge tone={r.state === 'active' ? 'ok' : 'neutral'}>{r.state === 'active' ? 'Active' : 'Ended'}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={query ? `No room matches “${query}”` : 'No rooms match this filter'}
              body="Room ids are case sensitive. Try the All filter."
              className="py-12"
            />
          )}
        </Card>
      </PageBody>
    </>
  );
}
