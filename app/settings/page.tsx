'use client';

import * as React from 'react';
import { Button, Card, Input, PageBody, PageHeader, SegmentedControl, Switch, cn } from '@lumyx/ui';
import { DashboardTopBar } from '@/components/dashboard-top-bar';
import { DEFAULT_CONFIG, THRESHOLD_FIELDS, type Config } from '@/lib/dashboard-data';

const TOGGLES: { key: 'slack' | 'pager' | 'audio'; label: string; hint: string }[] = [
  { key: 'slack', label: 'Send alerts to Slack', hint: 'Warnings and critical, to #video-oncall' },
  { key: 'pager', label: 'Page on critical', hint: 'PagerDuty, critical alerts only' },
  { key: 'audio', label: 'Allow automatic audio only', hint: 'Lumyx may switch a degrading peer to audio and log it' },
];

const RETENTION: { value: Config['retention']; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

function Section({ title, description, danger = false, children }: {
  title: string; description: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <Card className={cn('flex flex-col gap-4 p-6', danger && 'border-danger-border')}>
      <div>
        <h2 className={cn('text-16 font-semibold', danger ? 'text-danger' : 'text-strong')}>{title}</h2>
        <p className="text-14 text-faint">{description}</p>
      </div>
      {children}
    </Card>
  );
}

export default function SettingsPage() {
  const [cfg, setCfg] = React.useState<Config>(DEFAULT_CONFIG);
  const [saved, setSaved] = React.useState<Config>(DEFAULT_CONFIG);
  const [justSaved, setJustSaved] = React.useState(false);

  const edit = (patch: Partial<Config>) => {
    setCfg((c) => ({ ...c, ...patch }));
    setJustSaved(false);
  };

  const fields = THRESHOLD_FIELDS.map(([key, label, unit, lo, hi]) => {
    const raw = cfg.th[key];
    const v = Number(raw);
    return { key, label, unit, lo, hi, raw, ok: raw.trim() !== '' && Number.isFinite(v) && v >= lo && v <= hi };
  });
  const allOk = fields.every((f) => f.ok) && cfg.name.trim() !== '';
  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved);

  return (
    <>
      <DashboardTopBar crumbs={[{ label: 'Settings' }]} />
      <PageBody className="max-w-[880px] pb-24 lg:pb-24">
        <PageHeader title="Settings" description="Written back to lumyx.toml. Thresholds apply without a restart." />

        <Section title="General" description="How this instance shows up in logs and alerts.">
          <div className="grid gap-4 min-[1100px]:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-14 font-medium text-strong">Instance name</span>
              <Input className="sl-num" value={cfg.name} aria-invalid={cfg.name.trim() === ''} onChange={(e) => edit({ name: e.target.value })} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-14 font-medium text-strong">Region label</span>
              <Input className="sl-num" value={cfg.region} onChange={(e) => edit({ region: e.target.value })} />
            </label>
          </div>
        </Section>

        <Section title="Thresholds" description="A metric past its threshold for longer than the debounce opens an alert.">
          <div className="grid gap-4 min-[1100px]:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className="flex flex-col gap-2">
                <span className="flex justify-between text-14 font-medium text-strong">
                  {f.label}
                  <span className="sl-num text-12 font-normal text-faint">{f.key}</span>
                </span>
                <span className="flex">
                  <Input
                    className="sl-num rounded-r-none"
                    inputMode="decimal"
                    value={f.raw}
                    aria-invalid={!f.ok}
                    onChange={(e) => edit({ th: { ...cfg.th, [f.key]: e.target.value } })}
                  />
                  <span
                    className={cn(
                      'flex items-center rounded-r-sm border border-l-0 bg-sunken px-3 text-14 text-faint',
                      f.ok ? 'border-stroke' : 'border-danger',
                    )}
                  >
                    {f.unit}
                  </span>
                </span>
                <span className={cn('text-12', f.ok ? 'text-faint' : 'text-danger')}>
                  {!f.ok
                    ? `Enter a number between ${f.lo} and ${f.hi}.`
                    : f.raw !== saved.th[f.key]
                      ? `Was ${saved.th[f.key]} ${f.unit}`
                      : `Default ${DEFAULT_CONFIG.th[f.key]} ${f.unit}`}
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Alerting and retention" description="Where alerts go, and how long raw metrics are kept.">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center gap-4">
              <span className="flex flex-1 flex-col">
                <span className="text-14 font-medium text-strong">{t.label}</span>
                <span className="text-12 text-faint">{t.hint}</span>
              </span>
              <Switch aria-label={t.label} checked={cfg[t.key]} onCheckedChange={(on) => edit({ [t.key]: on })} />
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex flex-1 flex-col">
              <span className="text-14 font-medium text-strong">Metrics retention</span>
              <span className="text-12 text-faint">Older samples are dropped first.</span>
            </span>
            <SegmentedControl
              aria-label="Retention"
              options={RETENTION}
              value={cfg.retention}
              onValueChange={(retention) => edit({ retention })}
            />
          </div>
        </Section>

        <Section title="Danger zone" description="Both actions disconnect every peer on this instance." danger>
          <div className="flex flex-wrap gap-2">
            <Button variant="danger-outline">Restart server</Button>
            <Button variant="danger-outline">Clear all metrics</Button>
          </div>
        </Section>

        {dirty || justSaved ? (
          <div className="sticky bottom-4 flex items-center gap-3 rounded-lg bg-ink py-3 pr-3 pl-4 text-card shadow-lg">
            <span className="flex-1 text-14">
              {!dirty && justSaved
                ? 'Saved to lumyx.toml. Thresholds are live.'
                : allOk
                  ? 'You have unsaved changes.'
                  : 'Fix the highlighted fields to save.'}
            </span>
            {dirty ? (
              <>
                <Button
                  variant="ghost"
                  className="border-[var(--n-600)] text-card hover:bg-transparent hover:text-card hover:opacity-80"
                  onClick={() => {
                    setCfg(saved);
                    setJustSaved(false);
                  }}
                >
                  Discard
                </Button>
                <Button
                  disabled={!allOk}
                  onClick={() => {
                    setSaved(cfg);
                    setJustSaved(true);
                  }}
                >
                  Save changes
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </PageBody>
    </>
  );
}
