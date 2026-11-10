/** Sample data for the self-hosted dashboard (Dashboard UI v3). Swap for the SFU's API later. */

export const series = (n: number, seed: number, base: number, amp: number) =>
  Array.from({ length: n }, (_, i) =>
    Math.max(0, base + amp * Math.sin(i / 2.6 + seed) + amp * 0.45 * Math.sin(i / 7.3 + seed * 2)),
  );

/** Rotates a series by `k` samples — a cheap way to make a sparkline look live. */
export const shift = <T,>(arr: T[], k: number) => {
  const n = ((k % arr.length) + arr.length) % arr.length;
  return arr.slice(n).concat(arr.slice(0, n));
};

export const INSTANCE = {
  name: 'sfu-eu-3',
  region: 'eu-west-3',
  signaling: 'wss://127.0.0.1:3000/ws',
  version: 'v0.4.1',
  uptime: '6d 04h',
};

export const TIME_LABELS = ['14:02', '14:17', '14:32', '14:47', '15:02'];

// ── Tones ────────────────────────────────────────────────────────────────────

export type Tone = 'ok' | 'warn' | 'danger' | 'accent' | 'idle' | 'neutral';

/** Past `warn` is a warning, past `danger` a breach; under both stays neutral. */
export const sev = (v: number, warn: number, danger: number): Tone =>
  v > danger ? 'danger' : v > warn ? 'warn' : 'neutral';

export const scoreTone = (score: number): Tone => (score < 50 ? 'danger' : score < 80 ? 'warn' : 'ok');

// ── Rooms ────────────────────────────────────────────────────────────────────

export type Health = 'ok' | 'degraded' | 'idle';

export type RoomRow = {
  id: string; peers: number; uptime: string; bitrate: string; region: string;
  health: Health; state: 'active' | 'ended'; data: string; series: number[];
};

export const ROOMS: RoomRow[] = [
  { id: 'test-room', peers: 6, uptime: '2h 14m', bitrate: '2.4 Mbps', region: 'eu-west-3', health: 'ok', state: 'active', data: '1.29 GB', series: series(30, 1, 2400, 340) },
  { id: 'standup-eu', peers: 4, uptime: '18m', bitrate: '812 kbps', region: 'eu-west-3', health: 'degraded', state: 'active', data: '104 MB', series: series(30, 4, 800, 220) },
  { id: 'webinar-us', peers: 47, uptime: '52m', bitrate: '8.1 Mbps', region: 'us-east-1', health: 'degraded', state: 'active', data: '3.42 GB', series: series(30, 7, 8100, 900) },
  { id: 'pairing-fr', peers: 2, uptime: '4h 02m', bitrate: '640 kbps', region: 'eu-west-3', health: 'ok', state: 'active', data: '812 MB', series: series(30, 2, 640, 120) },
  { id: 'load-test-9', peers: 0, uptime: 'ended', bitrate: 'none', region: 'eu-west-3', health: 'idle', state: 'ended', data: '2.10 GB', series: series(30, 9, 40, 30) },
  { id: 'demo-call-3', peers: 0, uptime: '31m', bitrate: 'none', region: 'eu-west-3', health: 'idle', state: 'ended', data: '286 MB', series: series(30, 5, 60, 40) },
];

// ── Peers ────────────────────────────────────────────────────────────────────

export type IcePath = 'host' | 'srflx' | 'relay';

export type PeerRow = {
  peer_id: string; room: string; score: number; rtt: number; jitter: number; loss: number;
  nack: number; codec: string; tracks: string[]; status: 'live' | 'degraded'; region: string;
  path: IcePath; series: number[];
};

/** The six peers of test-room — the room detail's sample. */
export const PEERS: PeerRow[] = [
  { peer_id: 'a3f91c02', room: 'test-room', score: 96, rtt: 38, jitter: 11, loss: 0.2, nack: 0.9, codec: 'vp8', tracks: ['audio', 'video'], status: 'live', region: 'eu-west-3', path: 'host', series: series(30, 1, 38, 9) },
  { peer_id: '0b8e2f61', room: 'test-room', score: 88, rtt: 44, jitter: 14, loss: 0.04, nack: 1.1, codec: 'h264', tracks: ['audio', 'video'], status: 'live', region: 'eu-west-3', path: 'host', series: series(30, 3, 44, 11) },
  { peer_id: '5e7b21f4', room: 'test-room', score: 74, rtt: 96, jitter: 22, loss: 0.81, nack: 2.4, codec: 'vp8', tracks: ['audio'], status: 'live', region: 'eu-west-3', path: 'srflx', series: series(30, 6, 96, 18) },
  { peer_id: 'd41f9ab7', room: 'test-room', score: 41, rtt: 212, jitter: 38, loss: 3.41, nack: 6.2, codec: 'vp8', tracks: ['audio', 'video'], status: 'degraded', region: 'us-east-1', path: 'relay', series: series(30, 5, 190, 45) },
  { peer_id: '9c0d34aa', room: 'test-room', score: 92, rtt: 41, jitter: 9, loss: 0.11, nack: 0.7, codec: 'vp9', tracks: ['audio', 'video'], status: 'live', region: 'eu-west-3', path: 'host', series: series(30, 8, 41, 8) },
  { peer_id: '2f81be07', room: 'test-room', score: 62, rtt: 128, jitter: 31, loss: 1.62, nack: 4.1, codec: 'vp8', tracks: ['audio', 'video'], status: 'degraded', region: 'eu-west-3', path: 'srflx', series: series(30, 10, 130, 30) },
];

/** The peers the overview ranks worst first. */
export const FLEET_PEERS: PeerRow[] = [
  ...PEERS,
  { peer_id: 'ff104b2c', room: 'webinar-us', score: 18, rtt: 284, jitter: 61, loss: 7.9, nack: 11.4, codec: 'vp8', tracks: ['audio', 'video'], status: 'degraded', region: 'ap-south-1', path: 'relay', series: series(30, 11, 260, 60) },
];

/** Every listed peer on the instance — the Peers screen. */
export const ALL_PEERS: PeerRow[] = [
  ...FLEET_PEERS,
  { peer_id: 'c27ad930', room: 'webinar-us', score: 92, rtt: 41, jitter: 9, loss: 0.11, nack: 0.7, codec: 'vp9', tracks: ['audio', 'video'], status: 'live', region: 'eu-west-3', path: 'host', series: series(30, 8, 41, 8) },
  { peer_id: '7e01d4aa', room: 'webinar-us', score: 84, rtt: 52, jitter: 12, loss: 0.3, nack: 1.2, codec: 'vp8', tracks: ['audio', 'video'], status: 'live', region: 'us-east-1', path: 'srflx', series: series(30, 12, 52, 10) },
  { peer_id: '5b9c3e10', room: 'standup-eu', score: 58, rtt: 168, jitter: 24, loss: 1.4, nack: 3.2, codec: 'vp8', tracks: ['audio', 'video'], status: 'degraded', region: 'eu-west-3', path: 'srflx', series: series(30, 13, 160, 25) },
  { peer_id: '91da0f67', room: 'standup-eu', score: 95, rtt: 44, jitter: 5, loss: 0.1, nack: 0.4, codec: 'vp9', tracks: ['audio', 'video'], status: 'live', region: 'eu-west-3', path: 'host', series: series(30, 14, 44, 6) },
  { peer_id: '3ac5e219', room: 'pairing-fr', score: 97, rtt: 22, jitter: 4, loss: 0.05, nack: 0.2, codec: 'h264', tracks: ['audio', 'video', 'screen'], status: 'live', region: 'eu-west-3', path: 'host', series: series(30, 15, 22, 4) },
  { peer_id: 'e8f0124b', room: 'pairing-fr', score: 93, rtt: 29, jitter: 6, loss: 0.08, nack: 0.3, codec: 'h264', tracks: ['audio', 'video'], status: 'live', region: 'eu-west-3', path: 'host', series: series(30, 16, 29, 5) },
];

// ── Events ───────────────────────────────────────────────────────────────────

export type FeedEvent = { time: string; message: string; detail: string; tone: Tone };

export const EVENTS: FeedEvent[] = [
  { time: '14:06:41', message: 'Packet loss above threshold', detail: 'ff104b2c · 7.90% vs 2%', tone: 'danger' },
  { time: '14:06:38', message: 'ICE candidate sent', detail: 'ff104b2c', tone: 'accent' },
  { time: '14:06:31', message: 'Peer joined', detail: 'c27ad930', tone: 'ok' },
  { time: '14:06:22', message: 'Answer received', detail: 'sfu_answer', tone: 'idle' },
  { time: '14:06:19', message: 'Room created', detail: 'standup-eu', tone: 'ok' },
  { time: '14:05:47', message: 'ICE failed', detail: 'ff104b2c', tone: 'danger' },
  { time: '14:05:12', message: 'Peer left', detail: '71c0e5da · 1006', tone: 'idle' },
];

export const ROOM_EVENTS: FeedEvent[] = [
  { time: '14:06:44', message: 'Jitter above threshold', detail: 'd41f9ab7 · 38ms vs 30ms', tone: 'danger' },
  { time: '14:05:58', message: 'Keyframe requested', detail: '2f81be07', tone: 'accent' },
  { time: '14:04:20', message: 'Track published', detail: '5e7b21f4 · video', tone: 'ok' },
  { time: '14:02:07', message: 'Peer joined', detail: '9c0d34aa', tone: 'ok' },
  { time: '13:59:41', message: 'Answer received', detail: 'sfu_answer', tone: 'idle' },
  { time: '12:46:02', message: 'Room created', detail: 'test-room', tone: 'ok' },
];

// ── Topology ─────────────────────────────────────────────────────────────────

/** Sender × receiver loss health. null is the diagonal. */
export const MATRIX: (number | null)[][] = [
  [null, 0.9, 0.8, 0.4, 0.9, 0.6],
  [0.9, null, 0.9, 0.3, 0.8, 0.7],
  [0.8, 0.9, null, 0.4, 0.9, 0.6],
  [0.3, 0.2, 0.3, null, 0.4, 0.2],
  [0.9, 0.9, 0.8, 0.4, null, 0.7],
  [0.7, 0.6, 0.7, 0.2, 0.7, null],
];

/** Node positions in the topology graph, in % of its box. */
export const GRAPH_POS: [number, number][] = [[16, 22], [14, 78], [84, 20], [88, 62], [62, 86], [34, 88]];

// ── Alerts ───────────────────────────────────────────────────────────────────

export type AlertRow = {
  id: string; title: string; metric: string; peer: string; room: string; value: string; th: string;
  v: number; t: number; max: number; dur: string; opened: string; sev: 'critical' | 'warning';
  open: boolean; action: string;
};

export const ALERTS: AlertRow[] = [
  { id: 'a1', title: 'Packet loss above 2%', metric: 'packet_loss_ratio', peer: 'ff104b2c', room: 'webinar-us', value: '7.90%', th: '2%', v: 7.9, t: 2, max: 10, dur: '3m 12s', opened: '14:03:29', sev: 'critical', open: true, action: 'The peer fell back to a TURN relay after ICE failed. Force audio only for ff104b2c, or drop it to the lowest simulcast layer.' },
  { id: 'a2', title: 'Freeze ratio above 1%', metric: 'freeze_ratio', peer: 'ff104b2c', room: 'webinar-us', value: '4.10%', th: '1%', v: 4.1, t: 1, max: 6, dur: '2m 40s', opened: '14:04:01', sev: 'critical', open: true, action: 'Freezes follow the loss on the same peer. Fix the loss first; a keyframe request alone will not hold.' },
  { id: 'a3', title: 'Jitter above 30 ms', metric: 'jitter_ms', peer: 'd41f9ab7', room: 'test-room', value: '38 ms', th: '30 ms', v: 38, t: 30, max: 60, dur: '1m 05s', opened: '14:05:39', sev: 'warning', open: true, action: 'Usually a path problem, not bandwidth. Compare with loss before touching bitrate.' },
  { id: 'a4', title: 'NACK ratio above 5%', metric: 'nack_ratio', peer: 'd41f9ab7', room: 'test-room', value: '6.2%', th: '5%', v: 6.2, t: 5, max: 10, dur: '48s', opened: '14:05:56', sev: 'warning', open: true, action: 'The uplink is saturating. Lower the publisher target bitrate or turn off its top simulcast layer.' },
  { id: 'a5', title: 'Round trip above 200 ms', metric: 'rtt_ms', peer: '5b9c3e10', room: 'standup-eu', value: '168 ms', th: '200 ms', v: 168, t: 200, max: 320, dur: '4m 10s', opened: '13:57:12', sev: 'warning', open: false, action: 'Resolved on its own when the peer moved back to a direct path.' },
  { id: 'a6', title: 'Bitrate under 100 kbps', metric: 'bitrate_kbps', peer: '71c0e5da', room: 'standup-eu', value: '412 kbps', th: '100 kbps', v: 412, t: 100, max: 800, dur: '2m 02s', opened: '13:31:40', sev: 'warning', open: false, action: 'Resolved after the publisher restarted its encoder.' },
];

// ── Metrics ──────────────────────────────────────────────────────────────────

export type MetricDef = {
  field: string; name: string; unit: string; th: number; base: number; amp: number;
  spike: number; max: number; dp: number;
};

export const METRICS: MetricDef[] = [
  { field: 'packet_loss_ratio', name: 'Packet loss', unit: '%', th: 2, base: 0.6, amp: 0.5, spike: 5, max: 9, dp: 2 },
  { field: 'rtt_ms', name: 'Round trip', unit: ' ms', th: 200, base: 70, amp: 20, spike: 140, max: 320, dp: 0 },
  { field: 'jitter_ms', name: 'Jitter', unit: ' ms', th: 30, base: 12, amp: 4, spike: 26, max: 60, dp: 0 },
  { field: 'nack_ratio', name: 'NACK ratio', unit: '%', th: 5, base: 1.2, amp: 0.5, spike: 5, max: 12, dp: 1 },
  { field: 'freeze_ratio', name: 'Freeze ratio', unit: '%', th: 1, base: 0.1, amp: 0.08, spike: 2.4, max: 5, dp: 2 },
  { field: 'bitrate_kbps', name: 'Bitrate floor', unit: ' kbps', th: 100, base: 1800, amp: 300, spike: -1500, max: 2800, dp: 0 },
];

// ── Session replay ───────────────────────────────────────────────────────────

export type Session = { id: string; room: string; when: string; len: number; note: string; tone: Tone };

export const SESSIONS: Session[] = [
  { id: 's1', room: 'webinar-us', when: 'Today 14:03', len: 180, note: 'freeze on ff104b2c', tone: 'danger' },
  { id: 's2', room: 'test-room', when: 'Today 13:58', len: 150, note: 'jitter on d41f9ab7', tone: 'warn' },
  { id: 's3', room: 'standup-eu', when: 'Today 09:30', len: 120, note: 'clean', tone: 'ok' },
  { id: 's4', room: 'cohort-42', when: 'Yesterday 17:04', len: 160, note: 'one reconnect', tone: 'warn' },
];

/** Replay events, `at` in seconds from the start of the session. */
export const REPLAY_EVENTS: { at: number; label: string; detail: string; tone: Tone }[] = [
  { at: 12, label: 'Peer joined', detail: 'ff104b2c', tone: 'ok' },
  { at: 47, label: 'ICE failed on direct path', detail: 'ff104b2c · host', tone: 'danger' },
  { at: 62, label: 'Fell back to TURN relay', detail: 'ff104b2c · relay', tone: 'warn' },
  { at: 89, label: 'Packet loss above 2%', detail: 'ff104b2c · 7.9%', tone: 'danger' },
  { at: 101, label: 'Freeze detected', detail: 'ff104b2c · 5 receivers', tone: 'danger' },
  { at: 103, label: 'Keyframe requested', detail: 'PLI to ff104b2c', tone: 'accent' },
  { at: 140, label: 'Audio only forced', detail: 'ff104b2c', tone: 'accent' },
  { at: 151, label: 'Loss back under 2%', detail: 'ff104b2c · 0.8%', tone: 'ok' },
];

export const REPLAY_PEERS = ['ff104b2c', 'c27ad930', '7e01d4aa', 'a3f91c02', '9c0d34aa', '0b8e2f61'];

/** Packet loss (%) of ff104b2c at second `x` of the replayed session. */
export const replayLossAt = (x: number) =>
  x < 62 ? 0.4 + 0.2 * Math.sin(x)
    : x < 89 ? 0.6 + (x - 62) * 0.08
      : x < 140 ? 7 + Math.sin(x / 3)
        : Math.max(0.6, 7 - (x - 140) * 0.6);

const pad2 = (n: number) => String(n).padStart(2, '0');
export const clock = (x: number) => `${pad2(Math.floor(x / 60))}:${pad2(Math.floor(x % 60))}`;

// ── Signaling ────────────────────────────────────────────────────────────────

export type SignalType = 'offer' | 'answer' | 'ice' | 'join' | 'leave' | 'error';

export const SIGNAL_TYPES: [SignalType, '↑' | '↓', string][] = [
  ['offer', '↑', 'sdp v=0 · 2 m-lines · simulcast 3 layers'],
  ['answer', '↓', 'sdp v=0 · a=group:BUNDLE 0 1'],
  ['ice', '↑', 'candidate:1 udp 2122260223 10.0.4.19 54400 typ host'],
  ['ice', '↓', 'candidate:3 udp 41885439 52.47.12.8 3478 typ relay'],
  ['join', '↑', '{"room":"webinar-us","token":"eyJhbGciOi…"}'],
  ['leave', '↑', '{"code":1000,"reason":"client closed"}'],
  ['error', '↓', '{"code":4003,"reason":"token expired"}'],
];

export const SIGNAL_PEERS = ['ff104b2c', 'c27ad930', '7e01d4aa', 'a3f91c02', '5b9c3e10', '3ac5e219', 'd41f9ab7'];

/** A deterministic slice of the signaling stream at tick `k`, newest first. */
export const signalLog = (k: number, n = 40) =>
  Array.from({ length: n }, (_, j) => {
    const i = k * 3 + n - j;
    const hx = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const ty = SIGNAL_TYPES[hx < 0.22 ? 0 : hx < 0.42 ? 1 : hx < 0.62 ? 2 : hx < 0.8 ? 3 : hx < 0.88 ? 4 : hx < 0.96 ? 5 : 6];
    const sec = 41 + Math.floor(i * 0.7);
    return {
      key: i,
      type: ty[0], dir: ty[1], body: ty[2],
      peer: SIGNAL_PEERS[(i * 5) % SIGNAL_PEERS.length],
      time: `14:${pad2(6 + (Math.floor(sec / 60) % 50))}:${pad2(sec % 60)}`,
    };
  });

// ── Server & settings ────────────────────────────────────────────────────────

export const PROCESS_INFO: [string, string][] = [
  ['Version', 'sfu-core 0.4.1 (alpha)'],
  ['Build', 'a91f3c2 · 2026-10-28'],
  ['Toolchain', 'rustc 1.79.0'],
  ['Started', '2026-10-31 10:52:07 UTC'],
  ['Uptime', '6d 04h 11m'],
  ['Workers', '8 · one per core'],
  ['Signaling', 'ws://0.0.0.0:3000/ws'],
  ['Config', '/etc/lumyx/lumyx.toml'],
];

export type Config = {
  name: string; region: string;
  th: Record<'packet_loss_ratio' | 'rtt_ms' | 'jitter_ms' | 'nack_ratio' | 'freeze_ratio' | 'debounce', string>;
  slack: boolean; pager: boolean; audio: boolean; retention: '24h' | '7d' | '30d';
};

export const DEFAULT_CONFIG: Config = {
  name: 'sfu-eu-3', region: 'eu-west-3',
  th: { packet_loss_ratio: '2', rtt_ms: '200', jitter_ms: '30', nack_ratio: '5', freeze_ratio: '1', debounce: '30' },
  slack: true, pager: false, audio: true, retention: '7d',
};

/** Threshold fields: key, label, unit, min, max. */
export const THRESHOLD_FIELDS: [keyof Config['th'], string, string, number, number][] = [
  ['packet_loss_ratio', 'Packet loss', '%', 0, 100],
  ['rtt_ms', 'Round trip', 'ms', 1, 5000],
  ['jitter_ms', 'Jitter', 'ms', 1, 1000],
  ['nack_ratio', 'NACK ratio', '%', 0, 100],
  ['freeze_ratio', 'Freeze ratio', '%', 0, 100],
  ['debounce', 'Debounce', 's', 5, 3600],
];

/** lumyx.toml as the server read it. */
export const tomlLines = (cfg: Config) => [
  '[server]',
  `name = "${cfg.name}"`,
  `region = "${cfg.region}"`,
  'listen = "0.0.0.0:3000"',
  '',
  '[thresholds]',
  ...THRESHOLD_FIELDS.slice(0, 5).map(([k]) => `${k} = ${cfg.th[k]}`),
  `debounce = "${cfg.th.debounce}s"`,
  '',
  '[retention]',
  `metrics = "${cfg.retention}"`,
];
