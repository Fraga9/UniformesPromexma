# app/routes/empleados.py con modificaciones para manejar objetos date
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from datetime import datetime, date
from pathlib import Path
import logging
import json

logger = logging.getLogger("app.empleados")

from ..database import get_db
from ..models import Empleado, EmpleadoCreate

router = APIRouter(prefix="/empleados", tags=["empleados"])

# Clase auxiliar para serializar objetos date
class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, date):
            return obj.isoformat()
        return super().default(obj)

@router.get("/", response_model=List[Empleado])
def listar_empleados(
    sucursal_id: Optional[int] = Query(None),
    db: psycopg2.extensions.connection = Depends(get_db)
):
    cursor = db.cursor()
    if sucursal_id:
        cursor.execute("SELECT * FROM empleados WHERE sucursal_id = %s", (sucursal_id,))
    else:
        cursor.execute("SELECT * FROM empleados")
    
    empleados = cursor.fetchall()
    
    # Convertir las fechas a string en formato ISO
    for emp in empleados:
        if isinstance(emp.get('fecha_ingreso'), date):
            emp['fecha_ingreso'] = emp['fecha_ingreso'].isoformat() if emp['fecha_ingreso'] else None
        if isinstance(emp.get('fecha_ingreso_puesto'), date):
            emp['fecha_ingreso_puesto'] = emp['fecha_ingreso_puesto'].isoformat() if emp['fecha_ingreso_puesto'] else None
    
    return list(empleados)

@router.get("/{empleado_id}", response_model=Empleado)
def obtener_empleado(empleado_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM empleados WHERE id = %s", (empleado_id,))
    empleado = cursor.fetchone()
    
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    # Convertir las fechas a string en formato ISO
    if isinstance(empleado.get('fecha_ingreso'), date):
        empleado['fecha_ingreso'] = empleado['fecha_ingreso'].isoformat() if empleado['fecha_ingreso'] else None
    if isinstance(empleado.get('fecha_ingreso_puesto'), date):
        empleado['fecha_ingreso_puesto'] = empleado['fecha_ingreso_puesto'].isoformat() if empleado['fecha_ingreso_puesto'] else None
    
    return dict(empleado)

@router.post("/", response_model=Empleado)
def crear_empleado(empleado: EmpleadoCreate, db: psycopg2.extensions.connection = Depends(get_db)):
    # Verificar que la sucursal existe
    cursor = db.cursor()
    cursor.execute("SELECT id FROM sucursales WHERE id = %s", (empleado.sucursal_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    # Crear consulta dinámica basada en los campos proporcionados
    campos = []
    valores = []
    placeholders = []
    
    for campo, valor in empleado.dict().items():
        if valor is not None:  # Solo incluir campos con valores
            campos.append(campo)
            # Convertir date a string si es necesario
            if isinstance(valor, date):
                valor = valor.isoformat()
            valores.append(valor)
            placeholders.append("%s")
    
    # Construir la consulta SQL
    query = f"INSERT INTO empleados ({', '.join(campos)}) VALUES ({', '.join(placeholders)}) RETURNING *"
    
    try:
        cursor.execute(query, valores)
        nuevo_empleado = cursor.fetchone()
        db.commit()
        
        if not nuevo_empleado:
            raise HTTPException(status_code=500, detail="Error al crear empleado")
        
        # Convertir las fechas a string en formato ISO
        if isinstance(nuevo_empleado.get('fecha_ingreso'), date):
            nuevo_empleado['fecha_ingreso'] = nuevo_empleado['fecha_ingreso'].isoformat() if nuevo_empleado['fecha_ingreso'] else None
        if isinstance(nuevo_empleado.get('fecha_ingreso_puesto'), date):
            nuevo_empleado['fecha_ingreso_puesto'] = nuevo_empleado['fecha_ingreso_puesto'].isoformat() if nuevo_empleado['fecha_ingreso_puesto'] else None
            
        return dict(nuevo_empleado)
    except Exception as e:
        db.rollback()
        logger.error(f"Error al crear empleado: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al crear empleado: {str(e)}")

@router.put("/{empleado_id}", response_model=Empleado)
def actualizar_empleado(empleado_id: int, empleado: EmpleadoCreate, db: psycopg2.extensions.connection = Depends(get_db)):
    # Verificar que la sucursal existe
    cursor = db.cursor()
    cursor.execute("SELECT id FROM sucursales WHERE id = %s", (empleado.sucursal_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    # Crear consulta dinámica para la actualización
    campos = []
    valores = []
    
    for campo, valor in empleado.dict().items():
        # Convertir date a string si es necesario
        if isinstance(valor, date):
            valor = valor.isoformat()
        campos.append(f"{campo} = %s")
        valores.append(valor)
    
    # Añadir el ID al final de los valores
    valores.append(empleado_id)
    
    # Construir la consulta SQL
    query = f"UPDATE empleados SET {', '.join(campos)} WHERE id = %s RETURNING *"
    
    cursor.execute(query, valores)
    empleado_actualizado = cursor.fetchone()
    db.commit()
    
    if not empleado_actualizado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    # Convertir las fechas a string en formato ISO
    if isinstance(empleado_actualizado.get('fecha_ingreso'), date):
        empleado_actualizado['fecha_ingreso'] = empleado_actualizado['fecha_ingreso'].isoformat() if empleado_actualizado['fecha_ingreso'] else None
    if isinstance(empleado_actualizado.get('fecha_ingreso_puesto'), date):
        empleado_actualizado['fecha_ingreso_puesto'] = empleado_actualizado['fecha_ingreso_puesto'].isoformat() if empleado_actualizado['fecha_ingreso_puesto'] else None
    
    return dict(empleado_actualizado)

@router.delete("/{empleado_id}")
def eliminar_empleado(empleado_id: int, db: psycopg2.extensions.connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM empleados WHERE id = %s", (empleado_id,))
    db.commit()
    
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    return {"message": "Empleado eliminado"}