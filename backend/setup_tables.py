import psycopg2
from main import DB_CONFIG

def setup_new_tables():
    print("Menghubungkan ke Database darlam_db untuk setup tabel baru...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()

        print("1. Membuat tabel laporan_bencana...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS laporan_bencana (
                id SERIAL PRIMARY KEY,
                jenis_bencana VARCHAR(100),
                kecamatan VARCHAR(100),
                deskripsi TEXT,
                pelapor VARCHAR(100),
                kontak VARCHAR(50),
                status VARCHAR(20) DEFAULT 'Menunggu',
                waktu_laporan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                lokasi_geom GEOMETRY(Point, 4326)
            );
        """)

        print("2. Membuat tabel tim_relawan...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tim_relawan (
                id SERIAL PRIMARY KEY,
                bencana_id INTEGER REFERENCES laporan_bencana(id),
                nama VARCHAR(100),
                peran VARCHAR(100),
                instansi VARCHAR(100),
                status VARCHAR(20) DEFAULT 'Aktif',
                img_url VARCHAR(255)
            );
        """)
        # Ensure img_url exists if table was already created
        cursor.execute("ALTER TABLE tim_relawan ADD COLUMN IF NOT EXISTS img_url VARCHAR(255);")

        print("3. Membuat tabel pesan_komunikasi...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pesan_komunikasi (
                id SERIAL PRIMARY KEY,
                bencana_id INTEGER REFERENCES laporan_bencana(id) NULL, -- Jika NULL, berarti Chat Publik
                sender_name VARCHAR(100),
                sender_role VARCHAR(100),
                sender_role_detail VARCHAR(100),
                message TEXT,
                time_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                jarak_str VARCHAR(50)
            );
        """)

        # Masukkan Dummy Data untuk Bencana
        print("4. Memasukkan data dummy untuk Bencana...")
        cursor.execute("SELECT COUNT(*) FROM laporan_bencana;")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO laporan_bencana (jenis_bencana, kecamatan, deskripsi, pelapor, status, lokasi_geom) VALUES
                ('Banjir Bandang', 'Sukamaju', 'Tanggul jebol di sektor utara desa.', 'Warga', 'Aktif', ST_SetSRID(ST_MakePoint(105.5898, -5.7331), 4326)),
                ('Tanah Longsor', 'Sidomulyo', 'Jalan lintas utama tertutup.', 'Petugas', 'Menunggu', ST_SetSRID(ST_MakePoint(105.6000, -5.7500), 4326))
            """)

        # Masukkan Dummy Data untuk Pesan Publik
        print("5. Memasukkan data dummy untuk Pesan Chat Publik...")
        cursor.execute("SELECT COUNT(*) FROM pesan_komunikasi WHERE bencana_id IS NULL;")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO pesan_komunikasi (sender_name, sender_role, sender_role_detail, message, jarak_str) VALUES
                ('Budi Santoso', 'Armada', 'Dump Truck 02', 'Tenda di sektor 3 sudah terpasang 80%. Kurang terpal tambahan. Ganti.', '1.2 km'),
                ('Relawan Medis', 'Infrastruktur', 'Puskesmas Way Urang', 'Mohon segera dikirimkan logistik selimut tambahan.', '3.4 km'),
                ('Warga Lokal', 'Warga', '', 'Air sungai mulai naik di dusun 3, tolong dipantau.', '450 m')
            """)

        print("6. Membuat tabel logistik...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS logistik (
                id SERIAL PRIMARY KEY,
                nama VARCHAR(100),
                stok VARCHAR(50),
                status VARCHAR(20),
                percent INTEGER DEFAULT 0,
                img_url TEXT
            );
        """)

        print("7. Memasukkan data dummy untuk Logistik...")
        cursor.execute("SELECT COUNT(*) FROM logistik;")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO logistik (nama, stok, status, percent, img_url) VALUES
                ('Beras & Sembako', '1.250 kg', 'Aman', 85, 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&w=150&q=80'),
                ('Obat-obatan Primer', '120 box', 'Kritis', 25, 'https://images.unsplash.com/photo-1584308666744-24d5e470817c?auto=format&fit=crop&w=150&q=80'),
                ('Pakaian Layak Pakai', '320 dus', 'Aman', 70, 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?auto=format&fit=crop&w=150&q=80'),
                ('Air Bersih (Galon)', '850 galon', 'Aman', 90, 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=150&q=80')
            """)

        print("8. Memasukkan data dummy untuk Tim Relawan...")
        cursor.execute("SELECT COUNT(*) FROM tim_relawan;")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO tim_relawan (bencana_id, nama, peran, instansi, status, img_url) VALUES
                (1, 'Ahmad Hidayat', 'Ketua Regu', 'BPBD Lamsel', 'Siaga', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'),
                (1, 'Budi Santoso', 'Medis', 'PMI Lamsel', 'Di Lapangan', 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80'),
                (1, 'Siti Rahma', 'Dapur Umum', 'Tagana', 'Siaga', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'),
                (1, 'Dimas Anggara', 'Evakuasi', 'SAR Lamsel', 'Di Lapangan', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80'),
                (2, 'Heri Prasetyo', 'Ketua Regu', 'BPBD Lamsel', 'Siaga', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'),
                (2, 'Larasati', 'Medis', 'Dinkes Lamsel', 'Siaga', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'),
                (2, 'Roni Wijaya', 'Evakuasi', 'Tagana', 'Di Lapangan', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80')
            """)
        else:
            # Update existing to have some dummy urls if null
            cursor.execute("""
                UPDATE tim_relawan SET img_url = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' WHERE img_url IS NULL;
            """)

        print("9. Memasukkan data dummy untuk Pesan Koordinasi Relawan...")
        cursor.execute("SELECT COUNT(*) FROM pesan_komunikasi WHERE bencana_id IS NOT NULL;")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO pesan_komunikasi (bencana_id, sender_name, sender_role, sender_role_detail, message, jarak_str) VALUES
                (1, 'Ahmad Hidayat', 'Posko Induk', 'Ketua Regu', 'Bagaimana kondisi sektor utara? Apakah tanggul aman?', '0 m'),
                (1, 'Budi Santoso', 'Armada', 'Medis', 'Posko kesehatan darurat sudah didirikan di dekat balai desa. Siap melayani warga.', '1.2 km'),
                (2, 'Heri Prasetyo', 'Posko Induk', 'Ketua Regu', 'Jalan raya yang tertimbun longsor masih dibersihkan. Alat berat sedang bekerja.', '0 m')
            """)

        print("Selesai! Tabel baru siap digunakan.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup_new_tables()
