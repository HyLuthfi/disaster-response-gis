import psycopg2

DB_CONFIG = {
    "dbname": "darlam_db",
    "user": "darlam_user",
    "password": "darlam_secure_2026",
    "host": "localhost",
    "port": 5432
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fasilitas_darurat (
            id SERIAL PRIMARY KEY,
            nama VARCHAR(150),
            jenis VARCHAR(100),
            kapasitas INTEGER,
            lokasi_geom GEOMETRY(Point, 4326)
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alat_berat (
            id SERIAL PRIMARY KEY,
            nama VARCHAR(150),
            jenis VARCHAR(100),
            status VARCHAR(50),
            instansi_pemilik VARCHAR(150),
            lokasi_geom GEOMETRY(Point, 4326)
        );
    """)

    cursor.execute("TRUNCATE TABLE fasilitas_darurat CASCADE;")
    cursor.execute("TRUNCATE TABLE alat_berat CASCADE;")

    cursor.execute("""
        INSERT INTO fasilitas_darurat (nama, jenis, kapasitas, lokasi_geom) 
        VALUES 
        ('RSUD Bob Bazar', 'Rumah Sakit', 100, ST_SetSRID(ST_MakePoint(105.5954, -5.7266), 4326)),
        ('BPBD Lampung Selatan', 'Posko', 50, ST_SetSRID(ST_MakePoint(105.5920, -5.7350), 4326))
    """)

    cursor.execute("""
        INSERT INTO alat_berat (nama, jenis, status, instansi_pemilik, lokasi_geom) 
        VALUES 
        ('Ambulance_1', 'Ambulans', 'Standby', 'RSUD Bob Bazar', ST_SetSRID(ST_MakePoint(105.5957, -5.7266), 4326)),
        ('Satgas_BPBD_1', 'Kendaraan Logistik', 'Standby', 'BPBD Lampung Selatan', ST_SetSRID(ST_MakePoint(105.5923, -5.7350), 4326))
    """)

    print("Fasilitas dan Alat Berat berhasil ditambahkan!")
except Exception as e:
    print(e)
