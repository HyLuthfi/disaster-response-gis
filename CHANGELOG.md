# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-17

Initial stable release of **DARLAM SDSS (Disaster Response Spatial Decision Support System)** — an enterprise-grade geospatial emergency decision support and evacuation routing platform powered by PostgreSQL 15, PostGIS 3, pgRouting dynamic Dijkstra algorithms, FastAPI, and React Leaflet.

### Added

- **Dynamic Evacuation Routing Engine (pgRouting + Dijkstra)**:
  - Directed and undirected shortest path computation via `pgr_dijkstra` on PostGIS network topology (`jaringan_jalan_temp`).
  - Dynamic edge cost evaluation incorporating physical road segment length (`ST_Length`) and situational hazard disruption multipliers.
  - Sub-50ms K-Nearest Neighbor (KNN) node snapping utilizing the PostGIS `<->` bounding box centroid distance operator backed by GIST spatial indexing.
- **Real-Time Hazard & Road Barrier Injection**:
  - Dynamic road obstruction management allowing dispatchers to register flood (*banjir*), landslide (*longsor*), fallen trees, or bridge damage.
  - Automatic edge weight penalties (up to infinity / inaccessible) that force Dijkstra routing to circumvent dangerous zones in real time.
- **Emergency Shelter & Facility Proximity Analysis**:
  - PostGIS spatial radius queries (`ST_DWithin` and `ST_DistanceSphere`) querying active emergency shelters, command posts (*posko evakuasi*), and healthcare facilities (`fasilitas_umum`).
  - Automated shelter capacity tracking and occupancy state monitoring.
- **Satgas Emergency Fleet Dispatch & Field Coordination**:
  - Live field responder dispatch management tracking Satgas personnel status (Standby, En Route, On Site, Completed).
  - Geofenced incident reporting workflow enabling affected citizens to submit geo-tagged disaster alerts.
  - In-app situational coordination channel connecting field officers and command post operators.
- **Geospatial React Web Client**:
  - Modern React 18 and Vite frontend integrated with Leaflet mapping engine.
  - Multi-layer basemap support featuring ESRI World Imagery satellite tiles, OpenStreetMap cartography, and custom GeoJSON hazard overlays.
  - Visual evacuation route polylines with turn-by-turn distance and estimated time of arrival (ETA) telemetry.
- **QGIS Integration & Road Network Preprocessing**:
  - GIS topology pre-processing workflow based on South Lampung Regency regional dataset (`qgis/jalan_lampung_selatan.geojson`).
  - Topologically cleaned road segments ready for PostGIS `pgr_createTopology` ingestion.
- **Showcase DX & Visual Documentation**:
  - D2 vector architecture diagram (`assets/architecture.svg`) compiled in Terminal Dark palette with ELK layout engine documenting all 6 spatial subsystem layers.
  - Standard 9-element portfolio `README.md` featuring dynamic typing header, spatial formula specifications, 4-panel visual interface gallery, and zero AI buzzwords.

### Changed

- **Standardized Microservice & Port Orchestration**: Consolidated environment configuration for production deployments across ports `:80` (Nginx), `:8000` (FastAPI), and `:5432` (PostgreSQL/PostGIS).
- **Environment-Driven Configuration**: Decoupled all database access layers from hardcoded strings to standardized environment variables with `backend/.env.example` reference.

### Security

- **[P0] SPDX MIT License**: Added official `LICENSE` file under MIT License with legal copyright attributed to `Luthfi Muthathohirin`.
- **[P0] Hardcoded Credentials Neutralization**: Sanitized 7 backend and deployment files (`backend/main.py`, `backend/seed_db.py`, `seed_fasilitas.py`, `add_missing_users.py`, `deploy_db.sh`, `deploy_full.sh`, `fix_node.sh`) to consume `os.getenv` with `backend/.env.example` guidance.
- **[P0] Zero Leak Certification**: Certified clean by Gitleaks v8.30.1 full-history audit (**0 leaks detected**, Health Score 98/100).
- **[P1] Media Cleanup & Gitignore Hardening**: Removed redundant 1.8MB `Picture_evakuasi.webp` from root and expanded `.gitignore` to strictly exclude `.env*`, `node_modules/`, `dist/`, `*.key`, `*.dump`, and QGIS backup files.
- **Ethical Geospatial Data Standards**: Anonymized disaster victim coordinates and citizen emergency reports to prevent PII exposure in public transit logs.
