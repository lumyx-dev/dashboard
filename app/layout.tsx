import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { DashboardChrome } from '@/components/dashboard-chrome';

export const metadata: Metadata = {
  title: 'Lumyx — self-hosted dashboard',
  description: 'Rooms, peers, alerts and session replay for a self-hosted Lumyx SFU.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <DashboardChrome>{children}</DashboardChrome>
      </body>
    </html>
  );
}
