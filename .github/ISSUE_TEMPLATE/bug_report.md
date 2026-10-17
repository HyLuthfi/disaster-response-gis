---
name: Bug Report
about: Report a routing error, spatial topology issue, or application bug in DARLAM SDSS
title: "[BUG] "
labels: bug
assignees: ''
---

## Description

A clear and concise description of what the spatial or application bug is.

## Steps to Reproduce

1. Select origin coordinate `[lat, lng]` at '...'
2. Select destination / shelter at '...'
3. Trigger route calculation via '...'
4. Observe spatial routing error or unexpected behavior at '...'

## Expected Behavior

A clear and concise description of what you expected to happen (e.g. valid polyline generated along road network, nearest node snapped within 50ms, evacuation path circumvents flood barrier).

## Actual Behavior / Error Traceback

What actually happened (e.g. pgRouting query timeout, null vertex returned from node snapping, disconnected graph error, 500 Internal Server Error).

```text
Paste terminal traceback, PostGIS SQL error, or browser console log here
```

## Geospatial Routing Parameters

| Parameter | Value |
|---|---|
| **Origin Coordinates** | e.g. `[-5.7123, 105.5891]` |
| **Destination / Shelter ID** | e.g. `Posko Balai Desa Kalianda (ID: 4)` |
| **Active Road Barriers** | e.g. Flood on Jalan Raden Intan (Penalty: 999999) |
| **Snapping Distance** | e.g. Distance to nearest node in meters |
| **Algorithm Invoked** | `pgr_dijkstra` (Undirected / Directed) |

## System & Database Environment

| Parameter | Value |
|---|---|
| **Operating System** | Windows 11 / Ubuntu 22.04 / Debian |
| **PostgreSQL Version** | e.g. PostgreSQL 15.4 |
| **PostGIS Version** | e.g. PostGIS 3.4.0 |
| **pgRouting Version** | e.g. pgRouting 3.5.0 |
| **Python Version** | e.g. 3.11.6 |
| **FastAPI & Asyncpg/Psycopg2** | e.g. fastapi 0.109.0, psycopg2-binary 2.9.9 |
| **Browser & Leaflet Version** | e.g. Chrome 129, Leaflet 1.9.4 |

## Additional Context

Add any other context about the issue here (e.g. road topology segment ID from QGIS, disconnected subgraph observation, or screenshot showing routing polyline).
