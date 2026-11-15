'use client';

import * as React from 'react';
import {
  LayoutGrid,
  RadioTower,
  Users,
  Bell,
  ChartNoAxesColumn,
  CirclePlay,
  Server,
  Activity,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarBrand,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarNav,
  SidebarPanel,
  LumyxLinkProvider,
  SidebarProvider,
  StatusDot,
  type NavSection,
} from '@lumyx/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { INSTANCE } from '@/lib/dashboard-data';

const SECTIONS: NavSection[] = [
  {
    label: 'Live',
    items: [
      { href: '/', label: 'Overview', icon: LayoutGrid },
      { href: '/rooms', label: 'Rooms', icon: RadioTower, count: 4 },
      { href: '/peers', label: 'Peers', icon: Users, count: 65 },
      { href: '/alerts', label: 'Alerts', icon: Bell, dot: 'danger' },
    ],
  },
  {
    label: 'History',
    items: [
      { href: '/metrics', label: 'Metrics', icon: ChartNoAxesColumn },
      { href: '/replay', label: 'Session replay', icon: CirclePlay },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/server', label: 'Server', icon: Server },
      { href: '/signaling', label: 'Signaling', icon: Activity },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/** Rooms owns /rooms/room; every other item matches its own path. */
const isActive = (href: string, pathname: string) =>
  href === pathname || (href !== '/' && pathname.startsWith(`${href}/`));

export type TimeRange = '15m' | '1h' | '6h' | '24h';

type DashboardState = {
  range: TimeRange;
  setRange: (range: TimeRange) => void;
  /** Bumped every 2s and by the refresh button; screens derive their live values from it. */
  tick: number;
  refresh: () => void;
};

const DashboardContext = React.createContext<DashboardState>({
  range: '1h',
  setRange: () => {},
  tick: 0,
  refresh: () => {},
});

export const useDashboard = () => React.useContext(DashboardContext);

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [range, setRange] = React.useState<TimeRange>('1h');
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const value = React.useMemo<DashboardState>(
    () => ({ range, setRange, tick, refresh: () => setTick((t) => t + 1) }),
    [range, tick],
  );

  return (
    <LumyxLinkProvider link={Link} pathname={pathname}>
      <DashboardContext.Provider value={value}>
        <SidebarProvider
          open
          onOpenChange={() => {}}
          style={{ '--sidebar-width': '240px' } as React.CSSProperties}
        >
          <Sidebar collapsible="offcanvas" className="border-chrome-border">
            <SidebarHeader className="p-0">
              <Link href="/" className="no-underline hover:no-underline">
                <SidebarBrand name="Lumyx" meta={`${INSTANCE.name} · ${INSTANCE.region}`} tone="ink" monoMeta />
              </Link>
            </SidebarHeader>
            <SidebarContent className="sl-scroll px-3 py-2">
              <SidebarNav sections={SECTIONS} ariaLabel="Dashboard" isActive={isActive} />
            </SidebarContent>
            <SidebarFooter className="p-0">
              <SidebarPanel className="p-3">
                <span className="flex items-center gap-2 text-12 font-semibold text-strong">
                  <StatusDot status="live" />
                  Signaling connected
                </span>
                <span className="sl-num truncate text-12 text-faint">{INSTANCE.signaling}</span>
                <span className="text-12 text-faint">{INSTANCE.version} · AGPL-3.0 licensed</span>
              </SidebarPanel>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="grid h-svh grid-rows-[auto_1fr] overflow-hidden">{children}</SidebarInset>
        </SidebarProvider>
      </DashboardContext.Provider>
    </LumyxLinkProvider>
  );
}
