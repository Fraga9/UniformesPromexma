# app/routes/sucursales.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

logger = logging.getLogger("app.sucursales")

from ..database import get_db
from ..models import Sucursal, SucursalCreate, SucursalUpdate, MensajeRespuesta

router = APIRouter(prefix="/sucursales", tags=["sucursales"])

@router.get("/", response_model=List[Sucursal])
def listar_sucursales(db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM sucursales")
    sucursales = cursor.fetchall()
    return list(sucursales)

@router.get("/{sucursal_id}", response_model=Sucursal)
def obtener_sucursal(sucursal_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM sucursales WHERE id = %s", (sucursal_id,))
    sucursal = cursor.fetchone()
    
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    return dict(sucursal)

@router.post("/", response_model=Sucursal)
def crear_sucursal(sucursal: SucursalCreate, db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    
    # En PostgreSQL, para obtener el ID insertado usamos RETURNING
    cursor.execute(
        "INSERT INTO sucursales (nombre, manager, zona, gerencia, region, pdv, ubicacion_pdv) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (sucursal.nombre, sucursal.manager, sucursal.zona, sucursal.gerencia, sucursal.region, sucursal.pdv, sucursal.ubicacion_pdv)
    )
    new_id = cursor.fetchone()['id']
    db.commit()
    
    # Construir la respuesta con todos los campos
    nueva_sucursal = {
        "id": new_id,
        "nombre": sucursal.nombre,
        "manager": sucursal.manager,
        "zona": sucursal.zona,
        "gerencia": sucursal.gerencia,
        "region": sucursal.region,
        "pdv": sucursal.pdv,
        "ubicacion_pdv": sucursal.ubicacion_pdv
    }
    
    return nueva_sucursal

@router.put("/{sucursal_id}", response_model=Sucursal)
def actualizar_sucursal(sucursal_id: int, sucursal: SucursalUpdate, db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    
    campos = []
    valores = []

    # Filtrar solo los campos que tienen valores (no son None)
    for campo, valor in sucursal.dict(exclude_unset=True).items():
        campos.append(f"{campo} = %s")
        valores.append(valor)

    if not campos:
        raise HTTPException(status_code=400, detail="No se proporcionó ningún campo para actualizar")

    query = f"UPDATE sucursales SET {', '.join(campos)} WHERE id = %s RETURNING *"
    valores.append(sucursal_id)

    cursor.execute(query, valores)
    sucursal_actualizada = cursor.fetchone()
    db.commit()

    if not sucursal_actualizada:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")

    # Devolver la sucursal completa actualizada
    return dict(sucursal_actualizada)

@router.delete("/{sucursal_id}")
def eliminar_sucursal(sucursal_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    
    # Comprobar si tiene empleados asociados
    cursor.execute("SELECT COUNT(*) FROM empleados WHERE sucursal_id = %s", (sucursal_id,))
    if cursor.fetchone()['count'] > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar la sucursal porque tiene empleados asociados"
        )
    
    cursor.execute("DELETE FROM sucursales WHERE id = %s", (sucursal_id,))
    db.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    return {"message": "Sucursal eliminada"}