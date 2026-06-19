from fastapi import FastAPI, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from typing import List, Optional

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="DARLAM API",
    description="Backend API untuk Sistem Informasi Geografi Respon Darurat Bencana Lampung",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "dbname": "darlam_db",
    "user": "postgres",
    "password": "admin",
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

# ==================== MODELS ====================

class LaporanRequest(BaseModel):
    jenis_bencana: str
    kecamatan: str
    deskripsi: str
    pelapor: str
    kontak: str
    lat: float
    lon: float

class PesanRequest(BaseModel):
    sender_name: str
    sender_role: str
    sender_role_detail: str = ""
    message: str
    jarak_str: str = ""

class PesanKoordinasiRequest(BaseModel):
    sender_name: str
    sender_role: str
    sender_role_detail: str = ""
    message: str
    jarak_str: str = ""

class TutupJalanRequest(BaseModel):
    lat: float
    lon: float
    radius: float = 50.0
    alasan: str = "Tertutup akibat bencana"

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: str
    instansi_name: Optional[str] = None
    armada_type: Optional[str] = None

class JoinRelawanRequest(BaseModel):
    nama: str
    peran: str
    instansi: str
    img_url: str = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'

class DispatchRequest(BaseModel):
    laporan_id: int
    target_instansi: str
    sender_username: str

class DispatchResponseRequest(BaseModel):
    status: str
    armada_id: Optional[int] = None

# ==================== ENDPOINTS ====================

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend API DARLAM berjalan dengan baik!"}

@app.get("/api/db-check")
def check_db_connection_route():
    conn = get_db_connection()
    if conn:
        conn.close()
        return {"status": "ok", "message": "Koneksi ke PostgreSQL / darlam_db Berhasil!"}
    else:
        raise HTTPException(status_code=500, detail="Gagal terkoneksi ke Database")

@app.get("/api/alat-berat")
def get_alat_berat():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('''
            SELECT id, nama, jenis, status, instansi_pemilik, kontak_operator, 
                   deskripsi, ST_AsGeoJSON(lokasi_geom)::json AS geometry
            FROM alat_berat;
        ''')
        result = cursor.fetchall()
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get("/api/fasilitas")
def get_fasilitas():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('''
            SELECT id, nama, jenis, kapasitas, kontak, 
                   ST_AsGeoJSON(lokasi_geom)::json AS geometry
            FROM fasilitas_darurat;
        ''')
        result = cursor.fetchall()
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get("/api/rute")
def get_rute(start_lon: float, start_lat: float, end_lon: float, end_lat: float):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('''
            SELECT id FROM jaringan_jalan_temp_vertices_pgr 
            ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326) 
            LIMIT 1;
        ''', (start_lon, start_lat))
        start_node = cursor.fetchone()
        
        cursor.execute('''
            SELECT id FROM jaringan_jalan_temp_vertices_pgr 
            ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326) 
            LIMIT 1;
        ''', (end_lon, end_lat))
        end_node = cursor.fetchone()

        if not start_node or not end_node:
            raise HTTPException(status_code=404, detail="Tidak dapat menemukan jalan terdekat dari koordinat tersebut.")

        cursor.execute('''
            SELECT path.seq, path.node, path.edge, path.cost, 
                   ST_AsGeoJSON(j.geom)::json AS geometry
            FROM pgr_dijkstra(
                'SELECT id, source, target, cost, reverse_cost FROM jaringan_jalan_temp WHERE is_closed = FALSE',
                %s, 
                %s, 
                directed := false
            ) AS path
            LEFT JOIN jaringan_jalan_temp j ON path.edge = j.id
            WHERE j.geom IS NOT NULL;
        ''', (start_node['id'], end_node['id']))
        result = cursor.fetchall()
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get("/api/bencana")
def get_bencana():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('''
            SELECT lb.id, lb.jenis_bencana, lb.kecamatan, lb.deskripsi, lb.pelapor, lb.kontak, lb.status, 
                   lb.waktu_laporan, ST_AsGeoJSON(lb.lokasi_geom)::json AS geometry,
                   COALESCE(COUNT(tr.id), 0) AS relawan_count
            FROM laporan_bencana lb
            LEFT JOIN tim_relawan tr ON lb.id = tr.bencana_id
            GROUP BY lb.id, lb.jenis_bencana, lb.kecamatan, lb.deskripsi, lb.pelapor, lb.kontak, lb.status, lb.waktu_laporan, lb.lokasi_geom
            ORDER BY lb.id ASC;
        ''')
        result = cursor.fetchall()
        for row in result:
            if row['waktu_laporan']:
                row['waktu_laporan'] = row['waktu_laporan'].strftime("%H:%M")
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post("/api/laporan")
def create_laporan(data: LaporanRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor()
        duplicate_check_query = """
            SELECT id FROM laporan_bencana 
            WHERE jenis_bencana = %s 
            AND status != 'Menunggu' 
            AND ST_DWithin(lokasi_geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, 200)
            LIMIT 1;
        """
        cursor.execute(duplicate_check_query, (data.jenis_bencana, data.lon, data.lat))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Laporan ditolak: Bencana serupa (terverifikasi) sudah ada di radius 200m.")
        query = """
            INSERT INTO laporan_bencana (jenis_bencana, kecamatan, deskripsi, pelapor, kontak, status, lokasi_geom)
            VALUES (%s, %s, %s, %s, %s, 'Menunggu', ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            RETURNING id;
        """
        cursor.execute(query, (data.jenis_bencana, data.kecamatan, data.deskripsi, data.pelapor, data.kontak, data.lon, data.lat))
        new_id = cursor.fetchone()[0]
        conn.commit()
        return {"status": "success", "message": "Laporan berhasil disubmit", "id": new_id}
    except HTTPException: raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.put("/api/laporan/{laporan_id}/verifikasi")
def verifikasi_laporan(laporan_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE laporan_bencana SET status = 'Aktif' WHERE id = %s", (laporan_id,))
        conn.commit()
        return {"status": "success", "message": "Laporan diverifikasi"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.delete("/api/laporan/{laporan_id}")
def tolak_laporan(laporan_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor()
        # Hapus data dependen terlebih dahulu untuk menghindari error Foreign Key constraint
        cursor.execute("DELETE FROM pesan_komunikasi WHERE bencana_id = %s", (laporan_id,))
        cursor.execute("DELETE FROM tim_relawan WHERE bencana_id = %s", (laporan_id,))
        # Baru hapus laporan utama
        cursor.execute("DELETE FROM laporan_bencana WHERE id = %s", (laporan_id,))
        conn.commit()
        return {"status": "success", "message": "Laporan dihapus"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get("/api/pesan-publik")
def get_pesan_publik():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('''
            SELECT id, sender_name, sender_role, sender_role_detail, message, 
                   time_sent, jarak_str
            FROM pesan_komunikasi
            WHERE bencana_id IS NULL
            ORDER BY time_sent ASC;
        ''')
        result = cursor.fetchall()
        for row in result:
            if row['time_sent']:
                row['time_sent'] = row['time_sent'].strftime("%H:%M")
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post("/api/pesan-publik")
def post_pesan_publik(data: PesanRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('''
            INSERT INTO pesan_komunikasi (sender_name, sender_role, sender_role_detail, message, jarak_str)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, sender_name, sender_role, sender_role_detail, message, time_sent, jarak_str;
        ''', (data.sender_name, data.sender_role, data.sender_role_detail, data.message, data.jarak_str))
        result = cursor.fetchone()
        if result and result['time_sent']:
            result['time_sent'] = result['time_sent'].strftime("%H:%M")
        conn.commit()
        return {"status": "success", "data": result}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get("/api/logistik")
def get_logistik():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, nama, stok, status, percent, img_url FROM logistik ORDER BY id;")
        result = cursor.fetchall()
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get("/api/bencana/{bencana_id}/relawan")
def get_relawan(bencana_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, nama, peran, instansi, status, img_url FROM tim_relawan WHERE bencana_id = %s ORDER BY id;", (bencana_id,))
        result = cursor.fetchall()
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get("/api/bencana/{bencana_id}/pesan")
def get_bencana_pesan(bencana_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT id, sender_name, sender_role, sender_role_detail, message, time_sent, jarak_str 
            FROM pesan_komunikasi 
            WHERE bencana_id = %s 
            ORDER BY time_sent ASC;
        """, (bencana_id,))
        result = cursor.fetchall()
        for row in result:
            if row['time_sent']:
                row['time_sent'] = row['time_sent'].strftime("%H:%M")
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post("/api/bencana/{bencana_id}/pesan")
def post_bencana_pesan(bencana_id: int, data: PesanKoordinasiRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            INSERT INTO pesan_komunikasi (bencana_id, sender_name, sender_role, sender_role_detail, message, jarak_str)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, sender_name, sender_role, sender_role_detail, message, time_sent, jarak_str;
        """, (bencana_id, data.sender_name, data.sender_role, data.sender_role_detail, data.message, data.jarak_str))
        result = cursor.fetchone()
        if result and result['time_sent']:
            result['time_sent'] = result['time_sent'].strftime("%H:%M")
        conn.commit()
        return {"status": "success", "data": result}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post("/api/tutup-jalan")
def tutup_jalan(data: TutupJalanRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('''
            SELECT id, name, highway, 
                   ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) AS distance_m,
                   ST_AsGeoJSON(geom)::json AS geometry
            FROM jaringan_jalan_temp
            WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
              AND is_closed = FALSE
            ORDER BY distance_m ASC
            LIMIT 1;
        ''', (data.lon, data.lat, data.radius))
        jalan = cursor.fetchone()
        if not jalan:
            raise HTTPException(status_code=404, detail=f"Tidak ditemukan jalan dalam radius {data.radius}m dari titik tersebut.")
        
        jalan_id = jalan['id']
        cursor.execute('''
            UPDATE jaringan_jalan_temp 
            SET is_closed = TRUE, cost = 999999999, reverse_cost = 999999999
            WHERE id = %s;
        ''', (jalan_id,))
        cursor.execute('''
            INSERT INTO log_tutup_jalan (jalan_id, alasan)
            VALUES (%s, %s);
        ''', (jalan_id, data.alasan))
        conn.commit()
        return {
            "status": "success",
            "message": f"Jalan '{jalan.get('name') or 'Tanpa Nama'}' berhasil ditutup.",
            "data": {
                "id": jalan_id,
                "name": jalan.get('name'),
                "highway": jalan.get('highway'),
                "distance_m": round(jalan['distance_m'], 1),
                "geometry": jalan['geometry']
            }
        }
    except HTTPException: raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post("/api/buka-jalan/{jalan_id}")
def buka_jalan(jalan_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            UPDATE jaringan_jalan_temp 
            SET is_closed = FALSE, cost = original_cost, reverse_cost = original_reverse_cost
            WHERE id = %s AND is_closed = TRUE
            RETURNING id, name;
        """, (jalan_id,))
        result = cursor.fetchone()
        if not result: raise HTTPException(status_code=404, detail="Jalan tidak ditemukan atau sudah terbuka.")
        cursor.execute("""
            UPDATE log_tutup_jalan 
            SET is_active = FALSE, waktu_buka = CURRENT_TIMESTAMP
            WHERE jalan_id = %s AND is_active = TRUE;
        """, (jalan_id,))
        conn.commit()
        return {"status": "success", "message": f"Jalan '{result.get('name') or 'Tanpa Nama'}' berhasil dibuka kembali."}
    except HTTPException: raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get("/api/jalan-tertutup")
def get_jalan_tertutup():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT j.id, j.name, j.highway, 
                   ST_AsGeoJSON(j.geom)::json AS geometry,
                   l.alasan, l.waktu_tutup
            FROM jaringan_jalan_temp j
            JOIN log_tutup_jalan l ON j.id = l.jalan_id AND l.is_active = TRUE
            WHERE j.is_closed = TRUE
            ORDER BY l.waktu_tutup DESC;
        """)
        result = cursor.fetchall()
        for row in result:
            if row['waktu_tutup']:
                row['waktu_tutup'] = row['waktu_tutup'].strftime("%d/%m/%Y %H:%M")
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post('/api/login')
def login(data: LoginRequest):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, username, role, full_name, instansi_name, armada_type, is_approved FROM users WHERE username = %s AND password = %s", (data.username, data.password))
        user = cursor.fetchone()
        if user: return {"status": "success", "user": user}
        else: raise HTTPException(status_code=401, detail="Username atau password salah")
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post('/api/register')
def register(data: RegisterRequest):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id FROM users WHERE username = %s", (data.username,))
        if cursor.fetchone(): raise HTTPException(status_code=400, detail="Username sudah terdaftar")
        is_approved = True
        cursor.execute("""
            INSERT INTO users (username, password, role, full_name, instansi_name, armada_type, is_approved) 
            VALUES (%s, %s, %s, %s, %s, %s, %s) 
            RETURNING id, username, role, full_name, instansi_name, armada_type, is_approved
        """, (data.username, data.password, data.role, data.full_name, data.instansi_name, data.armada_type, is_approved))
        new_user = cursor.fetchone()
        conn.commit()
        return {"status": "success", "user": new_user}
    except HTTPException: raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get('/api/admin/pending-users')
def pending_users():
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT id, username, role, full_name FROM users WHERE is_approved = FALSE")
        return {"status": "success", "users": cursor.fetchall()}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post('/api/admin/approve-user/{user_id}')
def approve_user(user_id: int):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("UPDATE users SET is_approved = TRUE WHERE id = %s RETURNING id, username, role, full_name", (user_id,))
        user = cursor.fetchone()
        conn.commit()
        if not user: raise HTTPException(status_code=404, detail="User tidak ditemukan")
        return {"status": "success", "user": user}
    except HTTPException: raise
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post('/api/bencana/{id}/join')
def join_bencana(id: int, data: JoinRelawanRequest):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('SELECT id FROM tim_relawan WHERE bencana_id = %s AND nama = %s', (id, data.nama))
        if cursor.fetchone(): return {'status': 'success', 'message': 'Already joined'}
        cursor.execute("""
            INSERT INTO tim_relawan (bencana_id, nama, peran, instansi, status, img_url)
            VALUES (%s, %s, %s, %s, 'Siaga', %s)
            RETURNING id, nama, peran, instansi, status, img_url
        """, (id, data.nama, data.peran, data.instansi, data.img_url))
        new_member = cursor.fetchone()
        conn.commit()
        return {'status': 'success', 'data': new_member}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.post('/api/dispatch')
def create_dispatch(data: DispatchRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            INSERT INTO panggilan_darurat (laporan_id, target_instansi, sender_username, status)
            VALUES (%s, %s, %s, 'Menunggu')
            RETURNING id, laporan_id, target_instansi, sender_username, status, created_at
        """, (data.laporan_id, data.target_instansi, data.sender_username))
        dispatch = cursor.fetchone()
        conn.commit()
        return {"status": "success", "data": dispatch}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get('/api/dispatch/me')
def get_my_dispatch(instansi: str):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT p.*, l.jenis_bencana, l.kecamatan, l.deskripsi, ST_X(l.lokasi_geom::geometry) as lon, ST_Y(l.lokasi_geom::geometry) as lat
            FROM panggilan_darurat p
            JOIN laporan_bencana l ON p.laporan_id = l.id
            WHERE p.target_instansi = %s AND p.status = 'Menunggu'
            ORDER BY p.created_at ASC LIMIT 1
        """, (instansi,))
        return {"status": "success", "data": cursor.fetchone()}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.put('/api/dispatch/{id}/respond')
def respond_dispatch(id: int, data: DispatchResponseRequest):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE panggilan_darurat SET status = %s, assigned_armada_id = %s WHERE id = %s", (data.status, data.armada_id, id))
        if data.status == 'Diterima' and data.armada_id:
            cursor.execute("UPDATE alat_berat SET status = 'Menuju Lokasi' WHERE id = %s", (data.armada_id,))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get('/api/dispatch/satgas/{armada_id}')
def get_satgas_dispatch(armada_id: int):
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT p.*, l.jenis_bencana, l.kecamatan, l.deskripsi, ST_X(l.lokasi_geom::geometry) as lon, ST_Y(l.lokasi_geom::geometry) as lat
            FROM panggilan_darurat p
            JOIN laporan_bencana l ON p.laporan_id = l.id
            WHERE p.assigned_armada_id = %s AND p.status = 'Diterima'
            ORDER BY p.updated_at DESC LIMIT 1
        """, (armada_id,))
        return {"status": "success", "data": cursor.fetchone()}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()

@app.get('/api/dispatch/active')
def get_active_dispatches():
    conn = get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT p.*, l.jenis_bencana, l.kecamatan, l.deskripsi, ST_X(l.lokasi_geom::geometry) as lon, ST_Y(l.lokasi_geom::geometry) as lat
            FROM panggilan_darurat p
            JOIN laporan_bencana l ON p.laporan_id = l.id
            WHERE p.status = 'Diterima' AND p.assigned_armada_id IS NOT NULL
        """)
        return {"status": "success", "data": cursor.fetchall()}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn: conn.close()
