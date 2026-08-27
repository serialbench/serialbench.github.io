# 05 — Version-aware presentation

## What

Make the site's presentation layer version-aware: library pages show
version history, trend charts mark version changes, citations include
specific versions, and the feature comparison annotates when capabilities
arrived.

## Library page changes

- Version history section: "nokogiri 1.18.2 (Aug 30 – Sep 6) · 1.19.4 (Sep 13 – present)"
- Per-version performance delta: "1.19.4 parses large XML 15% faster than 1.18.2"
- Version-specific availability: which environments each version ran on

## Trend chart (new component: `VersionTrendChart.vue`)

- Line chart of ips over time for a serializer × environment
- Vertical markers at version changes
- Hover shows date, version, and value
- Uses Chart.js with a custom plugin for version-change annotations

## Citation box

- Include versions: "nokogiri 1.19.4 parses large XML 12.4× slower than
  leptris 1.9.2 on macOS 26, Ruby 3.4.8"
- Version is derived from the run's `serializers` section

## Feature comparison

- "StAX (pull): ✓ since 1.6.0" for leptris
- "Streaming (SAX): ✓ since 1.0" for nokogiri
- Version-arrival data comes from the version timeline (first run where
  the capability was declared)

## Acceptance

- [ ] Library pages show version history with date ranges
- [ ] Version-specific performance deltas between consecutive versions
- [ ] Trend chart with version-change markers
- [ ] Citations include exact versions
- [ ] Feature table shows "since X.Y.Z" annotations
