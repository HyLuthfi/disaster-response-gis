---
name: Feature Request
about: Propose a new routing algorithm, spatial data layer, or emergency decision capability
title: "[FEATURE] "
labels: enhancement
assignees: ''
---

## Problem Statement

A clear and concise description of the humanitarian, spatial decision, or operational limitation.

*Example: "During sudden flash flood events, dispatchers cannot model road elevation profiles or water depth thresholds, risking routing emergency vehicles through submerged roads."*

## Proposed Solution

A clear and concise description of the feature, routing algorithm, or spatial analysis capability you want added:
- Technical description of the algorithm, geospatial query, or UI component.
- Operational benefit for disaster evacuation, shelter management, or responder dispatch.
- Target user persona (BPBD Incident Commander, Satgas Field Responder, Evacuating Citizen).

## Architectural Impact

| Subsystem Layer | Yes / No / Description |
|---|---|
| **PostgreSQL / PostGIS Schema** | |
| **pgRouting Graph & Cost Formulas** | |
| **FastAPI Backend Endpoints** | |
| **React Leaflet Frontend Interface** | |
| **QGIS Preprocessing Workflow** | |
| **Sensor / External API Integration** | |

## Proposed Spatial Algorithms & Data Sources (if applicable)

If this proposal introduces new spatial routing algorithms or external telemetry:

| Item | Details |
|---|---|
| **Algorithm Family** | e.g. A* (`pgr_astar`), Contraction Hierarchies, Multi-Criteria Pareto |
| **External Data Source** | e.g. BMKG Weather Radar API, Sentinel-1 Flood Inundation Layer |
| **Spatial Resolution / Accuracy** | Expected spatial precision (meters) |
| **Computational Overhead** | Estimated impact on sub-50ms routing latency target |

## Alternatives Considered

A clear and concise description of any alternative solutions, manual workflows, or workarounds you've explored.

## Additional Context

Add any other context, UI mockups, QGIS screenshots, or disaster management references here.
