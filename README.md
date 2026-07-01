<img src="https://capsule-render.vercel.app/api?type=waving&color=0:3b82f6,100:0f172a&height=120&section=header" width="100%">

# 🗺️ DISASTER RESPONSE GIS

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
</p>

<p align="center">
  Sistem Pendukung Keputusan Spasial (SPKG) cerdas berbasis Web GIS untuk mengoptimalkan penanganan darurat bencana alam. Menggunakan algoritma <b>Dijkstra via pgRouting</b> untuk penentuan rute evakuasi dinamis dengan antarmuka analitik <i>Premium Dashboard</i>.
</p>

<p align="center"><img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%"></p>

## ✨ Fitur Utama

<table align="center" width="100%">
  <tr>
    <td width="50%" valign="top">
      <b>Dynamic Dijkstra Routing</b><br/>
      Kalkulasi rute evakuasi terpendek secara <i>real-time</i> yang mampu memutar arah apabila infrastruktur jalan rusak/tertutup akibat bencana.
    </td>
    <td width="50%" valign="top">
      <b>Live Spatial Fleet Dispatch</b><br/>
      Sistem manajemen panggilan darurat yang mendistribusikan laporan ke armada logistik dan medis terdekat secara presisi.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <b>Executive GIS Dashboard</b><br/>
      Antarmuka Web interaktif dengan desain <i>Premium Glassmorphism</i> yang responsif memantau pergerakan relawan dan posko.
    </td>
    <td width="50%" valign="top">
      <b>Decomposition Database</b><br/>
      Topologi graf berskala enterprise menggunakan PostGIS dan pgRouting untuk komputasi jarak dan intersection berlambat rendah.
    </td>
  </tr>
</table>

<p align="center"><img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%"></p>

## 📸 Antarmuka Sistem (Premium Dashboard)

<table align="center" width="100%">
  <tr>
    <td width="50%" align="center">
      <b>Mode Armada & Radius Geofencing</b><br/>
      <img src="img/image_2.png" width="100%">
    </td>
    <td width="50%" align="center">
      <b>Peta Satelit & Dijkstra Routing</b><br/>
      <img src="img/image.png" width="100%">
    </td>
  </tr>
  <tr>
    <td width="50%" align="center" valign="middle">
      <b>Live Chat Koordinasi Relawan</b><br/>
      <img src="img/image_3.png" width="100%">
    </td>
    <td width="50%" align="center" valign="middle">
      <b>Panel Pelaporan Bencana</b><br/>
      <img src="img/image_4.png" width="45%">
    </td>
  </tr>
</table>

<p align="center"><img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%"></p>

## 🧮 Arsitektur Algoritma & Geospasial

Sistem mengeksekusi operasi spasial kompleks langsung pada level basis data:

**Topologi Geospasial (Database Metrics):**

- **PostGIS (Radius)** - Menggunakan operasi kueri spasial `(ST_DWithin)`
- **pgRouting (Graph)** - Membangun topologi jaringan jalan raya `(Cost & Reverse Cost)`

**Implementasi Algoritma:**

1. **Dijkstra's Shortest Path:** Digunakan via fungsi bawaan `pgr_dijkstra` untuk mencari rute terefisien dari titik awal ke koordinat bencana.
2. **Dynamic Cost Penalty:** Ketika terdapat ruas jalan yang tertutup, sistem secara otomatis menginjeksi nilai pembobot tak terhingga `(999999999)` pada ruas tersebut untuk memicu <i>rerouting</i>.

<p align="center"><img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%"></p>

## 🚀 Panduan Instalasi & Eksekusi

Sistem ini berarsitektur terpisah (*decoupled*) dan membutuhkan dua terminal.

### Bagian 1: Menjalankan Backend (Server API)

1. **Migrasi Database Terpusat**
   ```bash
   cd backend
   python setup_tables.py
   python setup_routing.py
   python setup_users.py
