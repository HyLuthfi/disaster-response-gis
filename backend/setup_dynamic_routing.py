"""
Script untuk menambahkan fitur Dynamic Routing (Tutup/Buka Jalan)
ke tabel jaringan_jalan_temp.

Menambahkan kolom:
- is_closed (BOOLEAN): Menandai apakah jalan tertutup akibat bencana
- original_cost (FLOAT): Menyimpan cost asli sebelum jalan ditutup
"""
import psycopg2
from main import DB_CONFIG

def setup_dynamic_routing():
    print("=== Setup Dynamic Routing ===")
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Tambah kolom is_closed
    print("1. Menambahkan kolom is_closed...")
    cur.execute("ALTER TABLE jaringan_jalan_temp ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;")
    
    # 2. Tambah kolom original_cost untuk menyimpan cost asli sebelum ditutup
    print("2. Menambahkan kolom original_cost...")
    cur.execute("ALTER TABLE jaringan_jalan_temp ADD COLUMN IF NOT EXISTS original_cost DOUBLE PRECISION;")
    cur.execute("ALTER TABLE jaringan_jalan_temp ADD COLUMN IF NOT EXISTS original_reverse_cost DOUBLE PRECISION;")
    
    # 3. Inisialisasi original_cost = cost untuk semua jalan yang belum pernah diset
    print("3. Menginisialisasi original_cost...")
    cur.execute("UPDATE jaringan_jalan_temp SET original_cost = cost WHERE original_cost IS NULL;")
    cur.execute("UPDATE jaringan_jalan_temp SET original_reverse_cost = reverse_cost WHERE original_reverse_cost IS NULL;")

    # 4. Buat tabel log penutupan jalan (untuk tracking history)
    print("4. Membuat tabel log penutupan jalan...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS log_tutup_jalan (
            id SERIAL PRIMARY KEY,
            jalan_id INTEGER REFERENCES jaringan_jalan_temp(id),
            alasan TEXT,
            ditutup_oleh VARCHAR(100) DEFAULT 'Admin',
            waktu_tutup TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            waktu_buka TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
        );
    """)

    print("Selesai! Dynamic Routing siap digunakan.")
    
    # Verifikasi
    cur.execute("SELECT COUNT(*) FROM jaringan_jalan_temp WHERE is_closed = TRUE;")
    print(f"Jalan tertutup saat ini: {cur.fetchone()[0]}")
    cur.execute("SELECT COUNT(*) FROM jaringan_jalan_temp WHERE original_cost IS NOT NULL;")
    print(f"Jalan dengan backup cost: {cur.fetchone()[0]}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    setup_dynamic_routing()
