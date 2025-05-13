# app/routes/usuarios.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
import secrets
import logging 

logger = logging.getLogger("app.usuarios")

from ..database import get_db
from ..models import Usuario, UsuarioCreate, UsuarioLogin

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# Configuración para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/", response_model=Usuario)
def crear_usuario(usuario: UsuarioCreate, db: psycopg2.extensions.connection = Depends(get_db)):
    usuario_info = {
        "username": usuario.username,
        "rol": usuario.rol,
        "sucursal_id": usuario.sucursal_id
    }
    logger.debug(f"Datos recibidos del usuario: {usuario_info}")
    
    cursor = db.cursor()
    
    # Verificar que el username no exista ya
    cursor.execute("SELECT id FROM usuarios WHERE username = %s", (usuario.username,))
    if cursor.fetchone():
        logger.warning(f"El nombre de usuario {usuario.username} ya existe")
        raise HTTPException(
            status_code=400,
            detail="El nombre de usuario ya existe"
        )
    
    # Si es un administrador, asegurarse de que no tenga sucursal_id
    if usuario.rol == "admin":
        logger.info(f"Usuario {usuario.username} es admin, asignando sucursal_id a None")
        usuario.sucursal_id = None
    # Si es un manager, verificar que la sucursal existe
    elif usuario.rol == "manager" and usuario.sucursal_id is not None:
        logger.info(f"Usuario {usuario.username} es manager, verificando sucursal_id: {usuario.sucursal_id}")
        cursor.execute("SELECT id FROM sucursales WHERE id = %s", (usuario.sucursal_id,))
        if not cursor.fetchone():
            logger.warning(f"La sucursal con id {usuario.sucursal_id} no existe")
            raise HTTPException(
                status_code=404,
                detail="La sucursal no existe"
            )
    elif usuario.rol == "manager" and usuario.sucursal_id is None:
        logger.warning(f"Usuario manager {usuario.username} sin sucursal_id")
        raise HTTPException(
            status_code=400,
            detail="Los usuarios manager requieren una sucursal_id"
        )
        
    try:
        # Crear el usuario con contraseña hasheada
        hashed_password = get_password_hash(usuario.password)
        logger.debug(f"Contraseña hasheada para {usuario.username}")
        
        # En PostgreSQL, usamos RETURNING para obtener el ID insertado
        cursor.execute(
            "INSERT INTO usuarios (username, password, rol, sucursal_id) VALUES (%s, %s, %s, %s) RETURNING id",
            (usuario.username, hashed_password, usuario.rol, usuario.sucursal_id)
        )
        
        # Obtener el ID del nuevo usuario
        new_id = cursor.fetchone()['id']
        db.commit()
        
        # Devolver el usuario creado (sin la contraseña)
        nuevo_usuario = Usuario(
            id=new_id,
            username=usuario.username,
            rol=usuario.rol,
            sucursal_id=usuario.sucursal_id
        )

        logger.info(f"Usuario creado: {nuevo_usuario.username} con id: {nuevo_usuario.id}")
        
        return nuevo_usuario
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error al crear usuario {usuario.username}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al crear usuario: {str(e)}")
    
    
@router.post("/login")
def login(datos: UsuarioLogin, db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE username = %s", (datos.username,))
    usuario = cursor.fetchone()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    if not verify_password(datos.password, usuario["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    # Si es un manager, obtener información de la sucursal
    sucursal_info = None
    if usuario["rol"] == "manager" and usuario["sucursal_id"]:
        cursor.execute("SELECT nombre, manager FROM sucursales WHERE id = %s", (usuario["sucursal_id"],))
        sucursal = cursor.fetchone()
        if sucursal:
            sucursal_info = {
                "id": usuario["sucursal_id"],
                "nombre": sucursal["nombre"],
                "manager": sucursal["manager"]
            }
    
    # Crear un token simple (en producción usarías JWT)
    token = secrets.token_hex(32)
    
    return {
        "id": usuario["id"],
        "username": usuario["username"],
        "rol": usuario["rol"],
        "sucursal_id": usuario["sucursal_id"],
        "sucursal": sucursal_info,
        "token": token
    }

@router.get("/", response_model=List[Usuario])
def listar_usuarios(db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, username, rol, sucursal_id FROM usuarios")
    usuarios = cursor.fetchall()
    return list(usuarios)

@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM usuarios WHERE id = %s", (usuario_id,))
    db.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {"message": "Usuario eliminado"}