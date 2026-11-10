'use client';

import { RotateCw } from 'lucide-react';
import { Badge, Button, SegmentedControl, TopBar, type Crumb } from '@lumyx/ui';
import { useDashboard, type TimeRange } from '@/components/dashboard-chrome';
import { INSTANCE } from '@/lib/dashboard-data';

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
];

export const RANGE_LABEL: Record<TimeRange, string> = {
  '15m': '15 minutes',
  '1h': 'hour',
  '6h': '6 hours',
  '24h': '24 hours',
};

/**
 * Row 1 of every screen: instance › screen breadcrumb, the shared time range, the uptime pill
 * and a refresh button. `crumbs` are the crumbs after the instance name.
 */
export function DashboardTopBar({ crumbs }: { crumbs: Crumb[] }) {
  const { range, setRange, refresh } = useDashboard();
  return (
    <TopBar breadcrumb={[{ label: INSTANCE.name, href: '/' }, ...crumbs]}>
      <SegmentedControl
        aria-label="Time range"
        options={RANGES}
        value={range}
        onValueChange={setRange}
        className="hidden sm:inline-flex"
      />
      <Badge tone="ok" className="hidden px-3 py-1 sm:inline-flex">
        <span aria-hidden className="size-1.5 rounded-pill bg-ok-solid" />
        Up {INSTANCE.uptime}
      </Badge>
      <Button variant="secondary" size="icon" aria-label="Refresh" onClick={refresh}>
        <RotateCw className="text-muted" />
      </Button>
    </TopBar>
  );
}
