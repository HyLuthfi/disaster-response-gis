import psycopg2

conn = psycopg2.connect(dbname='darlam_db', user='postgres', password='admin', host='localhost')
cursor = conn.cursor()

try:
    # 1. Truncate everything
    cursor.execute("TRUNCATE TABLE panggilan_darurat CASCADE;")
    cursor.execute("TRUNCATE TABLE laporan_bencana CASCADE;")
    cursor.execute("TRUNCATE TABLE tim_relawan CASCADE;")
    cursor.execute("TRUNCATE TABLE alat_berat CASCADE;")
    cursor.execute("TRUNCATE TABLE fasilitas_darurat CASCADE;")
    cursor.execute("TRUNCATE TABLE users CASCADE;")

    # 2. Insert Users
    users = [
        ('admin', 'admin123', 'Admin Utama', 'Super Admin', None),
        ('User_1', 'user123', 'User 1', 'Public', None),
        ('User_2', 'user123', 'User 2', 'Public', None),
        ('rs_bob_bazar', 'instansi123', 'RSUD Bob Bazar Admin', 'Instansi', 'RSUD Bob Bazar'),
        ('bpbd_lamsel', 'instansi123', 'BPBD Lamsel Admin', 'Instansi', 'BPBD Lampung Selatan'),
        ('ambulance_1', 'satgas123', 'Ambulance 1', 'Satgas', 'RSUD Bob Bazar'),
        ('bpbd_1', 'satgas123', 'Satgas BPBD 1', 'Satgas', 'BPBD Lampung Selatan'),
    ]
    for u in users:
        # Note: In main.py, the columns are: username, password, full_name, role, instansi_name
        cursor.execute(
            "INSERT INTO users (username, password, full_name, role, instansi_name) VALUES (%s, %s, %s, %s, %s)",
            u
        )

    # 3. Insert Fasilitas
    # RSUD Bob Bazar: -5.7266, 105.5954 (Kalianda)
    # BPBD Lamsel: -5.7350, 105.5920 (Dekat center User)
    cursor.execute("""
        INSERT INTO fasilitas_darurat (nama, jenis, kapasitas, lokasi_geom) 
        VALUES 
        ('RSUD Bob Bazar', 'Rumah Sakit', 100, ST_SetSRID(ST_MakePoint(105.5954, -5.7266), 4326)),
        ('BPBD Lampung Selatan', 'Posko', 50, ST_SetSRID(ST_MakePoint(105.5920, -5.7350), 4326))
    """)

    # 4. Insert Alat Berat (Armada/Satgas) - Offset slightly to the east (+0.0003 Lon) so they don't hide under the building marker
    cursor.execute("""
        INSERT INTO alat_berat (nama, jenis, status, instansi_pemilik, lokasi_geom) 
        VALUES 
        ('Ambulance_1', 'Ambulans', 'Standby', 'RSUD Bob Bazar', ST_SetSRID(ST_MakePoint(105.5957, -5.7266), 4326)),
        ('Satgas_BPBD_1', 'Kendaraan Logistik', 'Standby', 'BPBD Lampung Selatan', ST_SetSRID(ST_MakePoint(105.5923, -5.7350), 4326))
    """)

    conn.commit()
    print("Database Seeded Successfully!")
except Exception as e:
    conn.rollback()
    print("Error:", e)
finally:
    cursor.close()
    conn.close()
