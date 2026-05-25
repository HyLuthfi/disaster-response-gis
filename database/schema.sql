CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;

CREATE TABLE alat_berat (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    jenis VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Tersedia',
    instansi_pemilik VARCHAR(100),
    kontak_operator VARCHAR(50),
    deskripsi TEXT,
    lokasi_geom GEOMETRY(Point, 4326)
);

CREATE INDEX idx_alat_berat_geom ON alat_berat USING GIST (lokasi_geom);

CREATE TABLE kejadian_bencana (
    id SERIAL PRIMARY KEY,
    nama_kejadian VARCHAR(200) NOT NULL,
    jenis VARCHAR(50) NOT NULL,
    waktu_kejadian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Aktif',
    tingkat_keparahan VARCHAR(50),
    lokasi_geom GEOMETRY(Point, 4326)
);

CREATE INDEX idx_kejadian_geom ON kejadian_bencana USING GIST (lokasi_geom);

CREATE TABLE penugasan (
    id SERIAL PRIMARY KEY,
    id_alat_berat INT REFERENCES alat_berat(id),
    id_kejadian INT REFERENCES kejadian_bencana(id),
    waktu_berangkat TIMESTAMP,
    waktu_tiba TIMESTAMP,
    waktu_selesai TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Menuju Lokasi'
);

CREATE TABLE fasilitas_darurat (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    jenis VARCHAR(50) NOT NULL,
    kapasitas INT,
    kontak VARCHAR(50),
    lokasi_geom GEOMETRY(Point, 4326)
);

CREATE INDEX idx_fasilitas_geom ON fasilitas_darurat USING GIST (lokasi_geom);

CREATE TABLE jaringan_jalan (
    id SERIAL PRIMARY KEY,
    source INT,
    target INT,
    cost FLOAT,
    reverse_cost FLOAT,
    nama_jalan VARCHAR(150),
    jenis_jalan VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Buka',
    panjang_meter FLOAT,
    geom GEOMETRY(LineString, 4326)
);

CREATE INDEX idx_jalan_geom ON jaringan_jalan USING GIST (geom);
CREATE INDEX idx_jalan_source ON jaringan_jalan (source);
CREATE INDEX idx_jalan_target ON jaringan_jalan (target);

CREATE TABLE laporan_jalan_tutup (
    id SERIAL PRIMARY KEY,
    id_jalan INT REFERENCES jaringan_jalan(id),
    waktu_lapor TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    keterangan TEXT,
    status_verifikasi VARCHAR(50) DEFAULT 'Pending'
);

CREATE TABLE zona_rawan (
    id SERIAL PRIMARY KEY,
    jenis_kerawanan VARCHAR(50) NOT NULL,
    tingkat_bahaya VARCHAR(50),
    geom GEOMETRY(Polygon, 4326)
);

CREATE INDEX idx_zona_rawan_geom ON zona_rawan USING GIST (geom);
