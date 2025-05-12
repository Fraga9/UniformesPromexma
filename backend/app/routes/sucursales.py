# app/routes/sucursales.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
import sqlite3

from ..database import get_db
from ..models import Sucursal, SucursalCreate, SucursalUpdate

router = APIRouter(prefix="/sucursales", tags=["sucursales"])

@router.get("/", response_model=List[Sucursal])
def listar_sucursales(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM sucursales")
    sucursales = [dict(row) for row in cursor.fetchall()]
    return sucursales

@router.get("/{sucursal_id}", response_model=Sucursal)
def obtener_sucursal(sucursal_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM sucursales WHERE id = ?", (sucursal_id,))
    sucursal = cursor.fetchone()
    
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    return dict(sucursal)

@router.post("/", response_model=Sucursal)
def crear_sucursal(sucursal: SucursalCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO sucursales (nombre, manager) VALUES (?, ?)",
        (sucursal.nombre, sucursal.manager)
    )
    db.commit()
    
    nueva_sucursal = Sucursal(
        id=cursor.lastrowid,
        nombre=sucursal.nombre,
        manager=sucursal.manager
    )
    
    return nueva_sucursal

@router.put("/{sucursal_id}", response_model=Sucursal)
def actualizar_sucursal(sucursal_id: int, sucursal: SucursalUpdate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    campos = []
    valores = []

    for campo, valor in sucursal.dict(exclude_unset=True).items():
        campos.append(f"{campo} = ?")
        valores.append(valor)

    if not campos:
        raise HTTPException(status_code=400, detail="No se proporcionó ningún campo para actualizar")

    query = f"UPDATE sucursales SET {', '.join(campos)} WHERE id = ?"
    valores.append(sucursal_id)

    cursor.execute(query, valores)
    db.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")

    # Recupera la sucursal actualizada si lo deseas, o devuelve los valores modificados
    return {**sucursal.dict(exclude_unset=True), "id": sucursal_id}


@router.delete("/{sucursal_id}")
def eliminar_sucursal(sucursal_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    # Comprobar si tiene empleados asociados
    cursor.execute("SELECT COUNT(*) FROM empleados WHERE sucursal_id = ?", (sucursal_id,))
    if cursor.fetchone()[0] > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar la sucursal porque tiene empleados asociados"
        )
    
    cursor.execute("DELETE FROM sucursales WHERE id = ?", (sucursal_id,))
    db.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    return {"message": "Sucursal eliminada"}