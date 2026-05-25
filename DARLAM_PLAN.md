# 📅 Rencana Pengerjaan Skripsi DARLAM (4 Minggu)

Rencana ini dirancang secara terstruktur dan realistis agar memenuhi standar akademis (skripsi) dan menunjukkan progres (demo) nyata kepada dosen pembimbing setiap minggunya. Kita membuang cara instan, dan menggantinya dengan pondasi *engineering* yang benar.

---

## 🟢 Minggu 1: Fondasi Geospasial & Database (Data & QGIS)
**Fokus:** Menyiapkan wadah penyimpanan data yang *spatial-aware* dan mengumpulkan data peta mentah.
**Output Presentasi Dosen:** Desain Skema Database, Peta wilayah Lampung Selatan di QGIS, Data Alat Berat di Database.

*   **Hari 1:** Merancang ERD (Entity Relationship Diagram) khusus DARLAM. Tabel untuk *Alat Berat*, *Fasilitas Darurat*, *Jaringan Jalan*, dan *Zona Bencana*.
*   **Hari 2-3:** Instalasi PostgreSQL & Ekstensi PostGIS di laptop Anda. Mengeksekusi DDL (Data Definition Language) untuk membuat tabel tersebut.
*   **Hari 4-5:** Bekerja dengan **QGIS**. Mengunduh data jalan raya Lampung Selatan dari OpenStreetMap (OSM) / Geoportal. Membersihkan data jalan (*topology cleaning*) agar tidak ada jalan putus.
*   **Hari 6-7:** Mengimpor data hasil QGIS ke dalam PostGIS. Membuat data *dummy*/simulasi realistis untuk lokasi **Alat Berat** (Excavator, Dozer) yang tersebar di beberapa titik.

---

## 🟡 Minggu 2: Backend API & Logika Rute (Python & PostGIS)
**Fokus:** Membangun *otak* dari sistem agar bisa menjawab pertanyaan "Mana alat berat terdekat?" dan "Bagaimana rutenya?".
**Output Presentasi Dosen:** API (Endpoint) yang bisa diakses dan mengembalikan data JSON berisi jarak dan koordinat rute *nyata* (mengikuti jalan, bukan garis lurus).

*   **Hari 1-2:** Inisialisasi proyek **FastAPI**. Membuat koneksi database ke PostGIS menggunakan konektor (misal: psycopg2 / asyncpg).
*   **Hari 3-4:** Membuat Endpoint API: 
    *   `GET /api/alat-berat` (menampilkan semua)
    *   `GET /api/terdekat` (menggunakan *Query Spasial* PostGIS seperti `ST_DWithin` / `ST_Distance`).
*   **Hari 5-7:** **Implementasi Rute.** Menggunakan ekstensi **pgRouting** di dalam PostGIS untuk menghitung rute tercepat (Dijkstra/A* Algorithm) berdasarkan jaringan jalan. Membuat endpoint API `GET /api/rute`.

---

## 🟠 Minggu 3: Frontend Peta Interaktif (UI & Leaflet.js)
**Fokus:** Membangun antarmuka untuk pengguna akhir (BPBD) agar bisa berinteraksi dengan peta secara visual.
**Output Presentasi Dosen:** Dashboard Peta web interaktif yang menampilkan marker alat berat dan menggambar rute ke titik insiden.

*   **Hari 1-2:** *Setup* antarmuka (HTML/CSS murni atau ringan). Integrasi perpustakaan peta **Leaflet.js**.
*   **Hari 3:** Menghubungkan Frontend dengan API. Mengambil data dari backend dan merendernya sebagai *Marker* dengan ikon berbeda (Alat Berat vs Posko vs RS).
*   **Hari 4-5:** Menggambar *Polygon* (Area Rawan) di peta dengan peringatan warna (Merah untuk longsor/banjir).
*   **Hari 6-7:** Fitur interaktif: Saat pengguna mengklik "Titik Insiden" (lokasi bencana), peta otomatis menampilkan rute dari alat berat terdekat.

---

## 🔴 Minggu 4: Skenario Darurat, Sempurna, & Demo Final
**Fokus:** Mengimplementasikan "Fitur Jualan" skripsi Anda: Rute alternatif saat jalan terputus akibat bencana.
**Output Presentasi Dosen:** Sistem DARLAM sepenuhnya berfungsi dan mampu beradaptasi jika ada laporan jalan tertutup.

*   **Hari 1-3:** Fitur **Dynamic Routing**. Menambahkan logika di mana jika sebuah jalan dilaporkan "tertutup" (ditandai di UI), maka bobot/status jalan tersebut di database akan ditutup, dan sistem langsung mencarikan rute alternatif memutar.
*   **Hari 4:** Menambahkan *Dashboard Sidebar* untuk list/daftar alat berat dan statusnya (Siap / Sedang Beroperasi).
*   **Hari 5-6:** *Testing* End-to-End. Memastikan tidak ada *bug*, respons cepat, dan UI rapi.
*   **Hari 7:** Finalisasi dokumentasi teknis (membantu penyusunan Bab 3 dan Bab 4 skripsi Anda terkait arsitektur dan implementasi).

---

> *"Sebuah sistem yang dirancang dengan benar dari awal, akan menyelamatkan berminggu-minggu sakit kepala di akhir masa pengerjaan skripsi."*
