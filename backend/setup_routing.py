import psycopg2
from main import DB_CONFIG

def setup_topology():
    print("Menghubungkan ke Database darlam_db...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()

        print("1. Menambahkan kolom rute (source, target, cost, reverse_cost) ke jaringan_jalan_temp...")
        cursor.execute("ALTER TABLE jaringan_jalan_temp ADD COLUMN IF NOT EXISTS source integer;")
        cursor.execute("ALTER TABLE jaringan_jalan_temp ADD COLUMN IF NOT EXISTS target integer;")
        cursor.execute("ALTER TABLE jaringan_jalan_temp ADD COLUMN IF NOT EXISTS cost double precision;")
        cursor.execute("ALTER TABLE jaringan_jalan_temp ADD COLUMN IF NOT EXISTS reverse_cost double precision;")

        print("2. Menghitung bobot (jarak asli dalam meter) untuk setiap ruas jalan...")
        cursor.execute("UPDATE jaringan_jalan_temp SET cost = ST_Length(geom::geography);")
        cursor.execute("UPDATE jaringan_jalan_temp SET reverse_cost = ST_Length(geom::geography);")

        print("3. Membangun graf topologi secara manual (pgRouting 4.0+)...")
        # Membuat tabel nodes/vertices
        cursor.execute("DROP TABLE IF EXISTS jaringan_jalan_temp_vertices_pgr CASCADE;")
        cursor.execute("""
            CREATE TABLE jaringan_jalan_temp_vertices_pgr (
                id SERIAL PRIMARY KEY,
                the_geom GEOMETRY(Point, 4326)
            );
        """)
        
        # Ekstrak titik awal dan titik akhir jalan yang unik
        cursor.execute("""
            INSERT INTO jaringan_jalan_temp_vertices_pgr (the_geom)
            SELECT DISTINCT ST_StartPoint(geom) FROM jaringan_jalan_temp
            UNION
            SELECT DISTINCT ST_EndPoint(geom) FROM jaringan_jalan_temp;
        """)
        
        # Buat indeks spasial untuk pencarian cepat
        cursor.execute("CREATE INDEX idx_vertices_geom ON jaringan_jalan_temp_vertices_pgr USING GIST (the_geom);")
        
        # Update source
        print("Mencocokkan node sumber (source)...")
        cursor.execute("""
            UPDATE jaringan_jalan_temp j
            SET source = v.id
            FROM jaringan_jalan_temp_vertices_pgr v
            WHERE j.geom && v.the_geom 
              AND ST_DWithin(ST_StartPoint(j.geom)::geography, v.the_geom::geography, 1.0);
        """)
        
        # Update target
        print("Mencocokkan node tujuan (target)...")
        cursor.execute("""
            UPDATE jaringan_jalan_temp j
            SET target = v.id
            FROM jaringan_jalan_temp_vertices_pgr v
            WHERE j.geom && v.the_geom 
              AND ST_DWithin(ST_EndPoint(j.geom)::geography, v.the_geom::geography, 1.0);
        """)
        
        print("Selesai! Jaringan jalan sekarang sudah pintar dan siap digunakan untuk algoritma rute.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup_topology()
