# Contributing to DARLAM SDSS

Thank you for your interest in contributing to **DARLAM SDSS (Disaster Response Spatial Decision Support System)** — an enterprise-grade geospatial platform designed for emergency evacuation routing, disaster mitigation, and field responder dispatch.

This project is maintained by **Luthfi Muthathohirin**.

---

## 🛠️ Architecture & Development Setup

DARLAM SDSS is structured as a decoupled dual-stack geospatial application: a Python FastAPI backend powered by PostgreSQL/PostGIS/pgRouting, and a React 18/Vite geospatial frontend.

```text
disaster-response-gis/
├── backend/              # FastAPI Application Core & Spatial Routing Algorithms
│   ├── main.py           # REST API, PostGIS spatial queries, pgRouting execution
│   ├── setup_tables.py   # Database table migration runner
│   ├── setup_routing.py  # PostGIS topology and pgr_createTopology engine
│   └── requirements.txt  # Python backend dependencies
├── database/             # PostgreSQL DDL schemas & dummy data
│   ├── schema.sql        # Tables, spatial geometries, GIST indexes
│   └── dummy_data.sql    # Sample facilities, roads, and initial users
├── frontend/             # React 18 + Vite + Leaflet + Tailwind CSS
├── qgis/                 # QGIS project files & raw GeoJSON road network layers
└── assets/               # Architecture diagrams and system preview mockups
```

### 1. Spatial Database Setup (PostgreSQL 15 + PostGIS 3 + pgRouting)

Before running the application, ensure PostgreSQL is installed with the PostGIS and pgRouting extensions:

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create spatial database and user
CREATE USER darlam_user WITH PASSWORD 'darlam_password';
CREATE DATABASE darlam_db OWNER darlam_user;
\c darlam_db

# Enable essential spatial and routing extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;
\q

# Import database schema
psql -U darlam_user -d darlam_db -f database/schema.sql
```

### 2. Backend Setup (FastAPI & pgRouting)

```bash
# Navigate to backend directory
cd backend

# Create and activate Python 3.11 virtual environment
python -m venv .venv
source .venv/bin/activate       # Linux/macOS
.venv\Scripts\activate          # Windows

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Verify DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

# Initialize database tables and routing topology
python setup_tables.py
python setup_routing.py
python seed_db.py

# Start FastAPI development server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Interactive API documentation available at http://localhost:8000/docs
```

### 3. Frontend Setup (React 18 & Leaflet)

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
# Web application accessible at http://localhost:5173
```

---

## 🌿 Contribution Workflow

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally and configure upstream tracking:
   ```bash
   git clone https://github.com/<your-username>/disaster-response-gis.git
   cd disaster-response-gis
   git remote add upstream https://github.com/HyLuthfi/disaster-response-gis.git
   ```
3. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Implement your changes adhering to code conventions and spatial test coverage.
5. Verify local spatial routing and API contracts.
6. Commit your modifications following the Conventional Commits specification.
7. Open a **Pull Request** against `main` of the upstream repository.

---

## 📐 Commit Convention

This repository strictly enforces [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

| Prefix | Scope / Usage |
|---|---|
| `feat(scope):` | New feature, routing algorithm, or spatial analysis module |
| `fix(scope):` | Bug fix in routing calculation, node snapping, or map rendering |
| `docs(scope):` | Documentation updates, architecture guides, API schemas |
| `chore(scope):` | Tooling, dependencies, build configurations |
| `refactor(scope):` | Code refactoring without behavioral mutation |
| `perf(scope):` | Spatial query optimization, GIST index tuning |
| `test(scope):` | Adding unit tests, spatial graph verification |
| `security(scope):` | Security hardening, credential sanitization |

**Valid Examples:**
```text
feat(routing): implement multi-criteria A* algorithm for hazard avoidance
fix(snapping): resolve null vertex exception when coordinate falls in unmapped water body
perf(postgis): add GIST index on road geometry centroid for faster KNN snapping
docs(readme): add detailed documentation for dynamic barrier injection formula
```

---

## 📋 Pull Request Requirements

- **One PR per feature/fix**: Do not combine frontend map styling changes with PostGIS database migrations.
- **Spatial Topology Integrity**: Changes to road network graphs must maintain network connectivity. Do not commit broken edges or dangling vertices that cause Dijkstra routing failures.
- **No Large GeoJSON/Shapefiles in Git**: Large geographic datasets (>10MB) must be hosted via external storage or managed via pgDump import scripts, not committed directly into the git tree.
- **No Hardcoded Credentials**: Ensure all database connection parameters read from environment variables (`os.getenv`).
- **Clean Git History**: Rebase against upstream `main` and squash intermediate checkpoint commits before requesting review.

---

## 🗺️ Ethical Geospatial Standards & Disaster Data Privacy

When contributing code, datasets, or sample disaster reports to DARLAM SDSS, contributors **must strictly comply** with the following humanitarian and privacy standards:

1. **Victim Anonymization**: Never commit or display personally identifiable information (PII) of disaster victims. Names, phone numbers, and exact residential addresses must be masked or anonymized in all test fixtures.
2. **Do No Harm (Spatial Integrity)**: Evacuation route algorithms must be thoroughly validated. Submitting flawed routing logic that directs evacuees into active hazard zones (floodways, landslide cones) is unacceptable.
3. **Accurate Hazard Delineation**: Geospatial hazard buffers must cite authoritative scientific sources (e.g. BNPB, BMKG, PVMBG) or clearly indicate simulated/demonstration status.
4. **Open Data Principles**: Road network modifications should harmonize with OpenStreetMap (OSM) standards and geospatial topology best practices.

---

## 🔒 Security Vulnerability Reporting

If you identify a security issue, vulnerability, or secret leakage, **please do not open a public GitHub issue**. Contact the maintainer directly via email: `luthfirg2502@gmail.com`.

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
