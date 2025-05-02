import sqlite3
from pathlib import Path

# Directorio de la base de datos
DB_PATH = Path(__file__).parent.parent / "uniformes.db"

def get_db():
    """Obtiene una conexión a la base de datos con manejo de contexto"""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def normalizar_texto(texto):
    """Convierte un texto a formato con la primera letra en mayúscula y el resto en minúscula"""
    if not texto:
        return ""
    
    # Para textos que contienen comas, normaliza cada parte por separado
    if "," in texto:
        partes = texto.split(",")
        partes_normalizadas = [normalizar_texto(parte.strip()) for parte in partes]
        return ", ".join(partes_normalizadas)
    
    # Para textos con espacios (nombres compuestos, etc.)
    palabras = texto.split()
    palabras_normalizadas = []
    
    for palabra in palabras:
        # Palabras pequeñas como preposiciones o artículos pueden dejarse en minúsculas
        if len(palabra) <= 2 and len(palabras) > 1:
            palabras_normalizadas.append(palabra.lower())
        else:
            # Primera letra en mayúscula, resto en minúscula
            palabras_normalizadas.append(palabra[0].upper() + palabra[1:].lower() if palabra else "")
    
    return " ".join(palabras_normalizadas)

def normalizar_fecha(fecha_str):
    """Normaliza una fecha al formato YYYY-MM-DD para SQLite"""
    if not fecha_str:
        return None
    try:
        # Manejar formato típico MM/DD/YYYY
        partes = fecha_str.split('/')
        if len(partes) == 3:
            mes, dia, anio = partes
            return f"{anio}-{mes.zfill(2)}-{dia.zfill(2)}"
    except:
        pass
    return fecha_str

def init_db():
    """Inicializa la base de datos si no existe"""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    cursor = conn.cursor()
    
    # Crear tablas si no existen
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sucursales (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        manager TEXT NOT NULL,
        zona TEXT NOT NULL,
        gerencia TEXT,
        region TEXT,
        pdv TEXT,
        ubicacion_pdv TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS empleados (
        id INTEGER PRIMARY KEY,
        numero_nomina INTEGER,
        nombre TEXT NOT NULL,
        sucursal_id INTEGER NOT NULL,
        talla TEXT NOT NULL,
        puesto_hc TEXT,
        puesto_homologado TEXT,
        fecha_ingreso DATE,
        fecha_ingreso_puesto DATE,
        cumpleanos TEXT,
        ubicacion_hc TEXT,
        sexo TEXT,
        email TEXT,
        cemex_id TEXT,
        asesor_rh TEXT,
        prcrt TEXT,
        categoria TEXT,
        area_nom TEXT,
        FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL,
        sucursal_id INTEGER,
        FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    )
    ''')
    
    # Verificar si ya existen usuarios
    cursor.execute("SELECT COUNT(*) FROM usuarios")
    if cursor.fetchone()[0] == 0:
        _crear_usuarios_default(cursor)
    
    conn.commit()
    conn.close()

def _crear_usuarios_default(cursor):
    """Crea usuarios por defecto si no existen"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    admin_password = pwd_context.hash("admin123")
    
    cursor.execute(
        "INSERT INTO usuarios (username, password, rol, sucursal_id) VALUES (?, ?, ?, ?)",
        ("admin", admin_password, "admin", None)
    )
