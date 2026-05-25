# LAPORAN PROGRES SKRIPSI - MINGGU 1

**Judul Proyek:** DARLAM (Sistem Informasi Geografi Respon Darurat, Bencana Lampung)  
**Fokus Minggu 1:** Analisis Kebutuhan Spasial, Desain Arsitektur Database, dan Topology Cleaning Data QGIS

---

## BAB 1: PENDAHULUAN

### 1.1 Latar Belakang Masalah
Wilayah Indonesia, termasuk Kabupaten Lampung Selatan, memiliki kerentanan yang tinggi terhadap berbagai bencana alam seperti banjir, tanah longsor, dan potensi tsunami. Belajar dari studi kasus penanganan bencana di beberapa daerah (misalnya bencana di Aceh), salah satu hambatan terbesar dalam proses Tanggap Darurat (*Emergency Response*) dan Pemulihan (*Recovery*) adalah terputusnya akses jalan raya akibat material longsor atau lumpur. 

Dalam situasi ini, kebutuhan akan alat berat (seperti *Excavator*, *Bulldozer*, *Wheel Loader*, dan *Dump Truck*) menjadi sangat mendesak untuk membuka akses rute evakuasi dan distribusi logistik. Namun, di lapangan sering ditemukan kendala berupa:
1. Tidak adanya basis data terpusat yang memetakan posisi dan status ketersediaan alat berat milik BPBD, Dinas PU, maupun pihak swasta.
2. Kurangnya koordinasi antar lembaga yang menyebabkan penugasan alat berat menjadi tidak efisien.
3. Tidak adanya sistem pendukung keputusan yang mampu secara dinamis mengkalkulasi ulang rute alternatif tercepat apabila suatu ruas jalan dilaporkan terputus.

Berdasarkan permasalahan tersebut, penelitian ini mengusulkan pengembangan **DARLAM (Sistem Informasi Geografi Respon Darurat)**. Sebuah sistem cerdas berbasis *Geographic Information System* (GIS) yang tidak hanya memetakan lokasi alat berat, tetapi juga memiliki fitur *Dynamic Routing* berbasis kondisi nyata di lapangan.

### 1.2 Rumusan Masalah
Berdasarkan latar belakang di atas, rumusan masalah dalam penelitian ini adalah:
1. Bagaimana merancang dan membangun arsitektur basis data spasial yang mampu mengelola data lokasi alat berat, fasilitas darurat, dan topologi jaringan jalan secara efisien?
2. Bagaimana mengimplementasikan algoritma pencarian rute terpendek (*shortest path*) yang dinamis dan adaptif terhadap laporan jalan tertutup akibat bencana?
3. Bagaimana membangun antarmuka web interaktif yang mempermudah BPBD dalam melakukan penugasan (dispatch) alat berat ke lokasi insiden?

### 1.3 Tujuan Penelitian
1. Membangun basis data spasial (PostgreSQL + PostGIS) yang terstruktur untuk manajemen aset kebencanaan (Alat Berat dan Fasilitas Darurat).
2. Menerapkan ekstensi `pgRouting` untuk menghasilkan fitur *Dynamic Routing* yang akurat berdasarkan topologi jaringan jalan aktual di Lampung Selatan.
3. Menghasilkan purwarupa (*prototype*) aplikasi web GIS DARLAM yang siap digunakan sebagai pendukung keputusan operasional tanggap darurat.

---

## BAB 2: METODOLOGI & ARSITEKTUR SISTEM (Fokus Minggu 1)

Pada tahap awal pengembangan (Minggu 1), fokus utama penelitian adalah membangun **Pondasi Basis Data (Engineering Layer)**. Keputusan teknis yang diambil adalah menghentikan penggunaan format penyimpanan file statis (JSON) yang tidak memiliki kemampuan analisis keruangan, dan beralih sepenuhnya ke Relational Database Management System (RDBMS) yang mendukung data geospasial.

### 2.1 Pemilihan Teknologi Inti
- **PostgreSQL**: Dipilih karena keandalannya dalam menangani data skala besar.
- **PostGIS**: Ekstensi PostgreSQL yang memungkinkan penyimpanan tipe data geometri (Point, LineString, Polygon) dan query spasial (seperti pencarian radius *ST_DWithin*).
- **pgRouting**: Ekstensi algoritma graf rute (seperti Dijkstra dan A-Star) yang berjalan langsung di level database, sehingga kalkulasi rute menjadi jauh lebih cepat dibandingkan jika diproses di level backend aplikasi.

### 2.2 Desain Skema Database (Entity Relationship)
Struktur ERD DARLAM dirancang agar tidak hanya menjadi peta statis, tetapi mampu menjadi "Sistem Manajemen Penugasan". Tabel utama meliputi:
1. **`alat_berat`**: Menyimpan koordinat aktual (*Point*) dan status ketersediaan.
2. **`kejadian_bencana`**: Mencatat lokasi spesifik insiden darurat.
3. **`penugasan`**: Tabel transaksional yang merekam log riwayat (*history*) penugasan sebuah alat berat ke lokasi kejadian, lengkap dengan catatan waktu (*timestamp*).
4. **`jaringan_jalan`**: Menyimpan garis jalan (*LineString*) lengkap dengan atribut graf jaringan (`source`, `target`, dan bobot tempuh/`cost`).
5. **`laporan_jalan_tutup`**: Memungkinkan integrasi data *crowdsourcing* dari relawan lapangan untuk mengubah status jalan menjadi tertutup, yang akan memicu sistem merutekan ulang perjalanan.

---

## BAB 3: HASIL IMPLEMENTASI QGIS & DATA SPASIAL

Sebagai sistem yang berbasis data dunia nyata, akurasi data jalan menjadi komponen paling vital. Rute yang dihasilkan oleh aplikasi hanya akan sebaik data jalan yang dimasukkan ke dalam database (*Garbage In, Garbage Out*).

### 3.1 Ekstraksi Data OpenStreetMap (OSM)
Proses dimulai dengan menggunakan perangkat lunak desktop **QGIS** dan plugin **QuickOSM**. Data jaringan jalan (*highway*) khusus untuk wilayah cakupan Lampung Selatan (difokuskan di area Kalianda sebagai titik mula) diunduh secara langsung dari server OSM.

### 3.2 Pembersihan Topologi (Topology Cleaning)
Data jalan mentah dari satelit atau OSM umumnya memiliki cacat topologi (misalnya: ada garis jalan yang bersilangan tapi tidak saling memotong, atau ada jalan yang menumpuk). Jika data mentah ini langsung dimasukkan ke algoritma rute, rute akan gagal atau melompat (*error*).

Oleh karena itu, dilakukan proses *Topology Cleaning* menggunakan algoritma **`v.clean`** (dengan *tool* `break`) bawaan dari GRASS GIS di dalam ekosistem QGIS. Proses ini secara matematis memotong garis jalan tepat di setiap titik persimpangannya, memastikan setiap node terhubung dengan sempurna untuk pembentukan graf *routing*.

### 3.3 Impor Database & Pembuatan Simulasi
1. Data jaringan jalan yang telah bersih diekspor ke format GeoJSON dan diimpor ke dalam PostgreSQL melalui fitur **DB Manager** pada QGIS.
2. Skrip Data Definition Language (DDL) dieksekusi melalui **pgAdmin 4** untuk membentuk seluruh struktur tabel.
3. Data simulasi (dummy) yang realistis dimasukkan ke dalam tabel `alat_berat` (mencakup 5 unit alat berat berbagai jenis) dan `fasilitas_darurat` (mencakup RSUD Dr. H. Bob Bazar dan Posko Utama BPBD Lamsel) menggunakan koordinat garis lintang dan bujur yang valid untuk wilayah Lampung Selatan.

---

## BAB 4: KESIMPULAN & RENCANA KERJA MINGGU DEPAN

### 4.1 Kesimpulan
Seluruh target penyelesaian Minggu ke-1 telah dicapai 100%. Fondasi utama aplikasi berupa arsitektur *database* geospasial telah berhasil berdiri dan diisi dengan data aktual jalan raya wilayah Lampung Selatan yang telah terverifikasi topologinya. Sistem siap untuk melangkah ke tahap pengolahan logika (Backend).

### 4.2 Rencana Progres Minggu 2
1. Melakukan inisialisasi *framework* Backend API menggunakan **FastAPI** (Python).
2. Membangun jembatan koneksi antara kode Python dengan database PostgreSQL.
3. Mengimplementasikan fungsi *Query* Spasial (mencari alat berat terdekat dalam radius X kilometer dari lokasi bencana).
4. Melakukan setup algoritma `pgRouting` pada tabel `jaringan_jalan` untuk menghasilkan respons berupa titik-titik koordinat rute tercepat (GeoJSON/JSON Response) yang nantinya akan digambar di atas peta web.
