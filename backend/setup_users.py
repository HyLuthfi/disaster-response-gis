import psycopg2
from main import DB_CONFIG

def setup_users():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()

        print('Creating users table...')
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                full_name VARCHAR(100),
                instansi_name VARCHAR(150),
                armada_type VARCHAR(100),
                is_approved BOOLEAN DEFAULT TRUE
            );
        """)

        # Alter table to add columns if they don't exist in existing database
        cursor.execute("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
        """)
        cursor.execute("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS instansi_name VARCHAR(150);
        """)
        cursor.execute("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS armada_type VARCHAR(100);
        """)
        cursor.execute("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;
        """)


        print('Inserting dummy users...')
        cursor.execute("""
            INSERT INTO users (username, password, role, full_name, instansi_name, armada_type, is_approved) VALUES
            ('admin', 'admin123', 'Super Admin', 'Komandan Jenderal', NULL, NULL, TRUE),
            ('dispatcher', 'admin123', 'Dispatcher', 'Operator Posko', 'BPBD Posko Utama', 'Pusat Komando', TRUE),
            ('agent', 'admin123', 'Field Agent', 'Tim Satgas Lapangan', 'Satgas Kalianda', 'Penyelamatan & Logistik', TRUE),
            ('guest', 'guest', 'Public', 'Warga Lapor', NULL, NULL, TRUE),
            ('rs_bob_bazar', 'instansi123', 'Instansi', 'Dr. Bob Bazar', 'RSUD Bob Bazar', 'Medis / Ambulans (RS)', TRUE),
            ('damkar_kalianda', 'instansi123', 'Instansi', 'Danton Damkar', 'Pemadam Kebakaran Kalianda', 'Pemadam Kebakaran (Damkar)', TRUE),
            ('bpbd_lamsel', 'instansi123', 'Instansi', 'Logistik BPBD', 'BPBD Lampung Selatan', 'Penyelamatan & Logistik (BPBD / SAR)', TRUE)
            ON CONFLICT (username) DO NOTHING;
        """)
        print('User setup complete!')
    except Exception as e:
        print('Error:', e)


if __name__ == '__main__':
    setup_users()
