# Aktivitas Proyek DARLAM
## 2026-05-25

### 16:38 — [Inisialisasi Proyek DARLAM]
- Aksi: Membaca referensi dan aturan dari d:\AG_Starter\preferences.md, serta menyiapkan file log aktivitas.
- File: logs/aktivitas_2026-05-25.md
- Catatan: Folder proyek DARLAM (V2) berhasil disiapkan dan bersih. Siap untuk tahap ERD/Database PostGIS.

### 16:40 — [Merancang Skema Database (Hari 1)]
- Aksi: Membuat ERD dan script DDL PostGIS untuk struktur data DARLAM (Alat Berat, Fasilitas, Jalan, Zona Bencana).
- File: database/schema.sql, docs/erd.md
- Catatan: Skema jalan (jaringan_jalan) sudah dioptimasi untuk kebutuhan pgRouting (source, target, cost).

### 16:45 — [Revisi Ekstensif Skema Database]
- Aksi: Mengembangkan ERD dari MVP menjadi standar operasional skripsi (menambahkan tabel kejadian, penugasan, dan laporan jalan).
- File: database/schema.sql, docs/erd.md
- Catatan: Database sekarang mendukung pelacakan log aktivitas alat berat dan dynamic routing via laporan masyarakat/relawan.

### 17:45 — [Setup Database Lokal (Hari 2-3)]
- Aksi: User berhasil melakukan instalasi PostgreSQL, ekstensi PostGIS & pgRouting, serta mengeksekusi file DDL.
- File: database/schema.sql (dieksekusi)
- Catatan: Database darlam_db sudah aktif dengan ekstensi spasial. Infrastruktur backend tahap awal selesai.

### 19:30 — [Ekstraksi Data & Topology Cleaning (Hari 4-5)]
- Aksi: Mengekstrak data jalan (highway) wilayah Lampung Selatan dari OSM menggunakan QuickOSM, lalu membersihkan topologi (v.clean -> break) untuk persiapan pgRouting.
- File: qgis/jalan_lampung_selatan.geojson
- Catatan: Garis jalan telah terpotong sempurna di persimpangan. Data spasial bersih siap diimpor ke PostGIS.

### 19:45 — [Impor Data & Penyelesaian Minggu 1 (Hari 6-7)]
- Aksi: Mengimpor data layer jalan hasil QGIS ke PostGIS melalui DB Manager, dan mengeksekusi data simulasi alat berat.
- File: database/dummy_data.sql
- Catatan: MINGGU 1 SELESAI. Database siap diolah oleh Backend API di Minggu ke-2. Laporan disusun.

### 20:30 — [Inisialisasi Backend API (Minggu 2)]
- Aksi: Membuat kerangka utama backend menggunakan FastAPI dan menyusun file konfigurasi pustaka (requirements.txt).
- File: backend/main.py, backend/requirements.txt
- Catatan: Konektor PostgreSQL bawaan menggunakan psycopg2 telah disiapkan dan dites melalui endpoint /api/db-check.

### 05:55 — [Pembuatan Endpoint Spasial (Hari 3-4)]
- Aksi: Menulis kode endpoint `/api/alat-berat` dan `/api/fasilitas` di FastAPI. Menggunakan fungsi `ST_AsGeoJSON` PostgreSQL untuk konversi titik geometri langsung di level database.
- File: backend/main.py (diperbarui)
- Catatan: API berhasil menyajikan data alat berat secara real-time dari database dengan format GeoJSON yang siap dibaca oleh pustaka peta (Leaflet.js).

### 06:20 — [Implementasi pgRouting API (Hari 5-7)]
- Aksi: Mengeksekusi pembuatan topologi manual jaringan jalan (PostGIS/pgRouting 4.x), mengekstrak node sumber/tujuan. Membuat endpoint `/api/rute` menggunakan algoritma `pgr_dijkstra` untuk menyelesaikan *Shortest Path Problem*.
- File: backend/setup_routing.py, backend/main.py
- Catatan: API Rute telah berhasil mengimplementasikan pencarian node terdekat secara dinamis (K-Nearest Neighbor `<->`) lalu me-return format GeoJSON garis rute. MINGGU 2 SELESAI.

### 06:30 — [Pembuatan UI/UX Web GIS Modern (Minggu 3)]
- Aksi: Menginisialisasi proyek React + Vite. Membangun antarmuka bergaya premium (*Glassmorphism, Dark Mode*) menggunakan TailwindCSS dan Framer Motion yang terinspirasi dari standar desain E-Commerce modern.
- File: frontend/src/App.jsx, frontend/tailwind.config.js, frontend/src/index.css
- Catatan: Peta menggunakan React-Leaflet dengan integrasi API langsung ke Backend FastAPI (CORS diaktifkan). Fitur *Floating Sidebar* dan interaksi rute sudah tertanam.

