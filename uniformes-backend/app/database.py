# app/database.py
import sqlite3
from pathlib import Path

# Directorio de la base de datos
DB_PATH = Path(__file__).parent.parent / "uniformes.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    cursor = conn.cursor()
    
    # Crear tablas si no existen
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sucursales (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        manager TEXT NOT NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS empleados (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        sucursal_id INTEGER NOT NULL,
        talla TEXT NOT NULL,
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
    
    # Insertar datos de ejemplo si no existen
    cursor.execute("SELECT COUNT(*) FROM sucursales")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO sucursales (nombre, manager) VALUES (?, ?)", 
                       ("Monterrey", "Carlos Vázquez"))
        cursor.execute("INSERT INTO sucursales (nombre, manager) VALUES (?, ?)", 
                       ("CDMX Norte", "Ana Gutiérrez"))
        cursor.execute("INSERT INTO sucursales (nombre, manager) VALUES (?, ?)", 
                       ("Guadalajara", "Miguel Ángel Soto"))
    
    # app/database.py - Dentro de init_db()
    # Verificar si ya existen usuarios
    cursor.execute("SELECT COUNT(*) FROM usuarios")
    if cursor.fetchone()[0] == 0:
        # Crear un usuario admin por defecto
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        admin_password = pwd_context.hash("admin123")
        manager_password = pwd_context.hash("manager123")
        
        cursor.execute(
            "INSERT INTO usuarios (username, password, rol, sucursal_id) VALUES (?, ?, ?, ?)",
            ("admin", admin_password, "admin", None)
        )
        
        cursor.execute(
            "INSERT INTO usuarios (username, password, rol, sucursal_id) VALUES (?, ?, ?, ?)",
            ("manager", manager_password, "manager", 1)
        )


    conn.commit()
    conn.close()