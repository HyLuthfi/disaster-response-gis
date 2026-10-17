import os
import psycopg2

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "darlam_db"),
    "user": os.getenv("DB_USER", "darlam_user"),
    "password": os.getenv("DB_PASSWORD", "darlam_password"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432))
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (username, password, role, full_name, instansi_name, armada_type, is_approved) VALUES
        ('User_1', 'user123', 'Public', 'Relawan Satu', NULL, NULL, TRUE),
        ('User_2', 'user123', 'Public', 'Relawan Dua', NULL, NULL, TRUE),
        ('ambulance_1', 'satgas123', 'Satgas', 'Satgas Ambulance 1', 'RSUD Bob Bazar', 'Medis / Ambulans (RS)', TRUE),
        ('bpbd_1', 'satgas123', 'Satgas', 'Satgas BPBD 1', 'BPBD Lampung Selatan', 'Penyelamatan & Logistik (BPBD / SAR)', TRUE)
        ON CONFLICT (username) DO NOTHING;
    """)
    print("Missing users added successfully!")
except Exception as e:
    print(e)
