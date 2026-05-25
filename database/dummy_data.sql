-- =======================================================================
-- Data Simulasi (Dummy) DARLAM - Wilayah Lampung Selatan (Kalianda & Sekitarnya)
-- =======================================================================

-- 1. Insert Alat Berat
INSERT INTO alat_berat (nama, jenis, status, instansi_pemilik, kontak_operator, deskripsi, lokasi_geom) VALUES
('Excavator PC200 - 01', 'Excavator', 'Tersedia', 'BPBD Lampung Selatan', '081234567801', 'Standby di Posko Kalianda', ST_SetSRID(ST_MakePoint(105.5898, -5.7331), 4326)),
('Excavator Mini - 02', 'Excavator', 'Tersedia', 'Dinas PU Lamsel', '081234567802', 'Cocok untuk jalan desa', ST_SetSRID(ST_MakePoint(105.6021, -5.7280), 4326)),
('Bulldozer D85', 'Bulldozer', 'Beroperasi', 'Swasta (PT. A)', '081234567803', 'Sedang pengerjaan proyek tol', ST_SetSRID(ST_MakePoint(105.5780, -5.7410), 4326)),
('Dump Truck Hino 01', 'Dump Truck', 'Tersedia', 'BPBD Lampung Selatan', '081234567804', 'Truk angkut material longsor', ST_SetSRID(ST_MakePoint(105.5899, -5.7331), 4326)),
('Wheel Loader 01', 'Wheel Loader', 'Rusak', 'Dinas PU Lamsel', '081234567805', 'Dalam perbaikan mesin', ST_SetSRID(ST_MakePoint(105.6150, -5.7150), 4326));

-- 2. Insert Fasilitas Darurat
INSERT INTO fasilitas_darurat (nama, jenis, kapasitas, kontak, lokasi_geom) VALUES
('RSUD Dr. H. Bob Bazar, SKM', 'Rumah Sakit', 200, '0727-322159', ST_SetSRID(ST_MakePoint(105.5901, -5.7345), 4326)),
('Posko Utama BPBD Lamsel', 'Posko', 50, '0727-322000', ST_SetSRID(ST_MakePoint(105.5897, -5.7330), 4326)),
('Puskesmas Way Urang', 'Puskesmas', 20, '0727-112233', ST_SetSRID(ST_MakePoint(105.5950, -5.7300), 4326)),
('GOR Way Handak (Titik Kumpul)', 'Tempat Evakuasi', 500, '-', ST_SetSRID(ST_MakePoint(105.5800, -5.7200), 4326));

-- Catatan:
-- Koordinat ditulis dalam format (Longitude, Latitude)
-- Longitude Lampung Selatan: ~105.5
-- Latitude Lampung Selatan: ~-5.7
