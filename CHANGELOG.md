# Changelog

All notable changes to the self-hosted Lumyx dashboard. Versions follow
[SemVer](https://semver.org/); the `@lumyx/ui` version each release needs is noted.

## 0.2.0

Requires `@lumyx/ui` 0.4.0.

### Changed

- Rebuilt on the Dashboard UI v3 design: ink brand tile, sidebar with per-screen counts and an
  alert dot, a "Signaling connected" panel in the sidebar foot, and a translucent top bar with
  breadcrumb, time range, uptime and refresh. The bottom status strip is gone.
- Overview, Rooms and Room detail restyled; numbers and identifiers in Geist Mono.
- Links go through `LumyxLinkProvider`.

### Added

- Peers, Alerts, Metrics, Session replay, Server, Signaling and Settings screens.
- Deep links between screens: `/rooms/room?id=&peer=` and `/replay?session=&t=`.
- `verify:ds` follows the design system's rules (type scale, palette, durations).
