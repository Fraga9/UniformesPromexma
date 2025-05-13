import os
from supabase import create_client, Client
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

logger = logging.getLogger("app.database")

# Configuración de Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Configuración directa de PostgreSQL (alternativa para operaciones directas)
DATABASE_URL = os.environ.get("DATABASE_URL")  # Supabase proporciona esta URL

def get_supabase_client() -> Client:
    """Retorna un cliente de Supabase"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Variables de entorno SUPABASE_URL o SUPABASE_KEY no configuradas")
        raise ValueError("Faltan credenciales de Supabase")
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_db():
    """Obtiene una conexión directa a la base de datos PostgreSQL con manejo de contexto"""
    if not DATABASE_URL:
        logger.error("Variable de entorno DATABASE_URL no configurada")
        raise ValueError("Falta URL de la base de datos")
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.cursor_factory = RealDictCursor  # Para obtener resultados como diccionarios similares a sqlite3.Row
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
    """Normaliza una fecha al formato YYYY-MM-DD para PostgreSQL"""
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
    """
    Inicializa la base de datos si es necesario
    Esta función no creará tablas ya que Supabase ya las tiene creadas
    Pero podemos usarla para verificar la conexión y crear usuarios por defecto si no existen
    """
    logger.info("Verificando conexión con Supabase y usuario por defecto")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.cursor_factory = RealDictCursor
        cursor = conn.cursor()
        
        # Verificar si ya existen usuarios
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        result = cursor.fetchone()
        if result and result['count'] == 0:
            logger.info("Creando usuario administrador por defecto")
            _crear_usuarios_default(cursor)
            conn.commit()
        
        conn.close()
        logger.info("Conexión a Supabase verificada correctamente")
    except Exception as e:
        logger.error(f"Error al inicializar la conexión con Supabase: {str(e)}")
        raise

def _crear_usuarios_default(cursor):
    """Crea usuarios por defecto si no existen"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    admin_password = pwd_context.hash("admin123")
    
    cursor.execute(
        "INSERT INTO usuarios (username, password, rol, sucursal_id) VALUES (%s, %s, %s, %s)",
        ("admin", admin_password, "admin", None)
    )