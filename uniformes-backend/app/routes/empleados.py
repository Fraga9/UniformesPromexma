# app/routes/empleados.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import sqlite3
import pandas as pd
from datetime import datetime
from pathlib import Path

from ..database import get_db
from ..models import Empleado, EmpleadoCreate

router = APIRouter(prefix="/empleados", tags=["empleados"])

@router.get("/", response_model=List[Empleado])
def listar_empleados(
    sucursal_id: Optional[int] = Query(None),
    db: sqlite3.Connection = Depends(get_db)
):
    cursor = db.cursor()
    if sucursal_id:
        cursor.execute("SELECT * FROM empleados WHERE sucursal_id = ?", (sucursal_id,))
    else:
        cursor.execute("SELECT * FROM empleados")
    
    empleados = [dict(row) for row in cursor.fetchall()]
    return empleados

@router.get("/{empleado_id}", response_model=Empleado)
def obtener_empleado(empleado_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM empleados WHERE id = ?", (empleado_id,))
    empleado = cursor.fetchone()
    
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    return dict(empleado)

@router.post("/", response_model=Empleado)
def crear_empleado(empleado: EmpleadoCreate, db: sqlite3.Connection = Depends(get_db)):
    # Verificar que la sucursal existe
    cursor = db.cursor()
    cursor.execute("SELECT id FROM sucursales WHERE id = ?", (empleado.sucursal_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    cursor.execute(
        "INSERT INTO empleados (nombre, sucursal_id, talla) VALUES (?, ?, ?)",
        (empleado.nombre, empleado.sucursal_id, empleado.talla)
    )
    db.commit()
    
    nuevo_empleado = Empleado(
        id=cursor.lastrowid,
        nombre=empleado.nombre,
        sucursal_id=empleado.sucursal_id,
        talla=empleado.talla
    )
    
    return nuevo_empleado

@router.put("/{empleado_id}", response_model=Empleado)
def actualizar_empleado(empleado_id: int, empleado: EmpleadoCreate, db: sqlite3.Connection = Depends(get_db)):
    # Verificar que la sucursal existe
    cursor = db.cursor()
    cursor.execute("SELECT id FROM sucursales WHERE id = ?", (empleado.sucursal_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    cursor.execute(
        "UPDATE empleados SET nombre = ?, sucursal_id = ?, talla = ? WHERE id = ?",
        (empleado.nombre, empleado.sucursal_id, empleado.talla, empleado_id)
    )
    db.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    return Empleado(
        id=empleado_id,
        nombre=empleado.nombre,
        sucursal_id=empleado.sucursal_id,
        talla=empleado.talla
    )

@router.delete("/{empleado_id}")
def eliminar_empleado(empleado_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM empleados WHERE id = ?", (empleado_id,))
    db.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    return {"message": "Empleado eliminado"}