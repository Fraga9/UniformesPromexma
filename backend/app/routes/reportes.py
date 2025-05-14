# app/routes/reportes.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import FileResponse, JSONResponse
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from datetime import datetime
from pathlib import Path
import os
import logging
from typing import Optional
import json

logger = logging.getLogger("app.reportes")

from ..database import get_db, get_supabase_client

router = APIRouter(prefix="/reportes", tags=["reportes"])

# Crear carpeta para reportes si no existe
REPORTS_DIR = Path(__file__).parent.parent.parent / "reportes"
os.makedirs(REPORTS_DIR, exist_ok=True)

@router.get("/excel")
async def generar_reporte_excel(db: psycopg2.extensions.connection = Depends(get_db)):
    """
    Genera un reporte Excel con los datos de tallas de empleados y lo guarda localmente.
    """
    try:
        # Obtener datos de empleados con nombre de sucursal
        cursor = db.cursor()
        cursor.execute("""
            SELECT e.id, e.nombre, e.talla, s.nombre as sucursal, s.manager, s.zona, s.region
            FROM empleados e
            JOIN sucursales s ON e.sucursal_id = s.id
            ORDER BY s.nombre, e.nombre
        """)
        
        datos = cursor.fetchall()
        
        # Crear DataFrame
        df = pd.DataFrame(datos)
        
        # Obtener resumen por talla
        cursor.execute("""
            SELECT talla, COUNT(*) as cantidad
            FROM empleados
            GROUP BY talla
            ORDER BY 
                CASE 
                    WHEN talla = 'XS' THEN 1
                    WHEN talla = 'S' THEN 2
                    WHEN talla = 'M' THEN 3
                    WHEN talla = 'L' THEN 4
                    WHEN talla = 'XL' THEN 5
                    WHEN talla = 'XXL' THEN 6
                    WHEN talla = 'XXXL' THEN 7
                    ELSE 8
                END
        """)
        
        datos_resumen = cursor.fetchall()
        df_resumen = pd.DataFrame(datos_resumen)
        
        # Generar nombre único para el archivo
        fecha_hora = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_archivo = f"reporte_uniformes_{fecha_hora}.xlsx"
        ruta_archivo = REPORTS_DIR / nombre_archivo
        
        # Crear archivo Excel con múltiples hojas
        with pd.ExcelWriter(ruta_archivo) as writer:
            df.to_excel(writer, sheet_name='Detalle', index=False)
            df_resumen.to_excel(writer, sheet_name='Resumen', index=False)
            
            # Añadir hoja con resumen por sucursal y talla
            cursor.execute("""
                SELECT 
                    s.nombre as sucursal,
                    COUNT(CASE WHEN e.talla = 'XS' THEN 1 END) as XS,
                    COUNT(CASE WHEN e.talla = 'S' THEN 1 END) as S,
                    COUNT(CASE WHEN e.talla = 'M' THEN 1 END) as M,
                    COUNT(CASE WHEN e.talla = 'L' THEN 1 END) as L,
                    COUNT(CASE WHEN e.talla = 'XL' THEN 1 END) as XL,
                    COUNT(CASE WHEN e.talla = 'XXL' THEN 1 END) as XXL,
                    COUNT(CASE WHEN e.talla = 'XXXL' THEN 1 END) as XXXL,
                    COUNT(CASE WHEN e.talla = 'Por definir' OR e.talla IS NULL THEN 1 END) as Por_definir,
                    COUNT(*) as Total
                FROM sucursales s
                LEFT JOIN empleados e ON s.id = e.sucursal_id
                GROUP BY s.nombre
                ORDER BY s.nombre
            """)
            
            datos_por_sucursal = cursor.fetchall()
            df_por_sucursal = pd.DataFrame(datos_por_sucursal)
            df_por_sucursal.to_excel(writer, sheet_name='Por Sucursal', index=False)
        
        # Registrar el reporte en la base de datos
        cursor.execute("""
            INSERT INTO reportes (nombre_archivo, fecha_generacion, tipo)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (nombre_archivo, datetime.now(), 'excel'))
        
        reporte_id = cursor.fetchone()['id']
        db.commit()
        
        return {
            "success": True,
            "archivo": nombre_archivo,
            "id": reporte_id,
            "url": f"/reportes/excel/download/{nombre_archivo}"
        }
    
    except Exception as e:
        logger.error(f"Error al generar reporte Excel: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar reporte: {str(e)}"
        )

@router.get("/excel/download/{nombre_archivo}")
async def descargar_reporte_excel(nombre_archivo: str):
    """
    Descarga un reporte Excel previamente generado.
    """
    ruta_archivo = REPORTS_DIR / nombre_archivo
    
    if not ruta_archivo.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo solicitado no existe"
        )
    
    return FileResponse(
        path=ruta_archivo,
        filename=nombre_archivo,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.get("/supabase/excel")
async def generar_reporte_excel_supabase(db: psycopg2.extensions.connection = Depends(get_db)):
    """
    Genera un reporte Excel completo con todos los detalles de empleados y lo sube a Supabase Storage para su descarga.
    """
    try:
        logger.info("Iniciando generación de reporte Excel completo para Supabase Storage")
        
        # Primero generamos el Excel con información más completa
        cursor = db.cursor()
        logger.debug("Consultando datos completos de empleados y sucursales")
        cursor.execute("""
            SELECT 
                e.id, 
                e.nombre, 
                e.numero_nomina,
                e.puesto_hc,
                e.puesto_homologado,
                e.talla, 
                e.talla_administrativa,
                e.requiere_playera_administrativa,
                e.fecha_ingreso,
                e.fecha_ingreso_puesto,
                e.cumpleanos,
                e.ubicacion_hc,
                e.sexo,
                e.email,
                e.cemex_id,
                e.asesor_rh,
                e.prcrt,
                e.categoria,
                e.area_nom,
                s.nombre as sucursal, 
                s.manager, 
                s.zona, 
                s.region,
                s.gerencia,
                s.pdv,
                s.ubicacion_pdv
            FROM empleados e
            JOIN sucursales s ON e.sucursal_id = s.id
            ORDER BY s.nombre, e.nombre
        """)
        
        datos = cursor.fetchall()
        logger.debug(f"Obtenidos {len(datos)} registros de empleados con información completa")
        
        # Crear DataFrame con los datos completos
        df = pd.DataFrame(datos)
        
        # Resumen por talla estándar
        logger.debug("Consultando resumen por talla estándar")
        cursor.execute("""
            SELECT talla, COUNT(*) as cantidad
            FROM empleados
            GROUP BY talla
            ORDER BY 
                CASE 
                    WHEN talla = 'XS' THEN 1
                    WHEN talla = 'S' THEN 2
                    WHEN talla = 'M' THEN 3
                    WHEN talla = 'L' THEN 4
                    WHEN talla = 'XL' THEN 5
                    WHEN talla = 'XXL' THEN 6
                    WHEN talla = 'XXXL' THEN 7
                    ELSE 8
                END
        """)
        
        datos_resumen = cursor.fetchall()
        df_resumen = pd.DataFrame(datos_resumen)
        
        # Resumen por talla administrativa
        logger.debug("Consultando resumen por talla administrativa")
        cursor.execute("""
            SELECT 
                talla_administrativa, 
                COUNT(*) as cantidad
            FROM empleados
            WHERE requiere_playera_administrativa = true
            GROUP BY talla_administrativa
            ORDER BY 
                CASE 
                    WHEN talla_administrativa = 'XS' THEN 1
                    WHEN talla_administrativa = 'S' THEN 2
                    WHEN talla_administrativa = 'M' THEN 3
                    WHEN talla_administrativa = 'L' THEN 4
                    WHEN talla_administrativa = 'XL' THEN 5
                    WHEN talla_administrativa = 'XXL' THEN 6
                    WHEN talla_administrativa = 'XXXL' THEN 7
                    ELSE 8
                END
        """)
        
        datos_resumen_admin = cursor.fetchall()
        df_resumen_admin = pd.DataFrame(datos_resumen_admin)
        
        # Resumen por sucursal para tallas estándar
        logger.debug("Consultando resumen por sucursal para tallas estándar")
        cursor.execute("""
            SELECT 
                s.nombre as sucursal,
                COUNT(CASE WHEN e.talla = 'XS' THEN 1 END) as XS,
                COUNT(CASE WHEN e.talla = 'S' THEN 1 END) as S,
                COUNT(CASE WHEN e.talla = 'M' THEN 1 END) as M,
                COUNT(CASE WHEN e.talla = 'L' THEN 1 END) as L,
                COUNT(CASE WHEN e.talla = 'XL' THEN 1 END) as XL,
                COUNT(CASE WHEN e.talla = 'XXL' THEN 1 END) as XXL,
                COUNT(CASE WHEN e.talla = 'XXXL' THEN 1 END) as XXXL,
                COUNT(CASE WHEN e.talla = 'Por definir' OR e.talla IS NULL THEN 1 END) as Por_definir,
                COUNT(*) as Total
            FROM sucursales s
            LEFT JOIN empleados e ON s.id = e.sucursal_id
            GROUP BY s.nombre
            ORDER BY s.nombre
        """)
        
        datos_por_sucursal = cursor.fetchall()
        df_por_sucursal = pd.DataFrame(datos_por_sucursal)
        
        # Resumen por sucursal para tallas administrativas
        logger.debug("Consultando resumen por sucursal para tallas administrativas")
        cursor.execute("""
            SELECT 
                s.nombre as sucursal,
                COUNT(CASE WHEN e.talla_administrativa = 'XS' THEN 1 END) as XS,
                COUNT(CASE WHEN e.talla_administrativa = 'S' THEN 1 END) as S,
                COUNT(CASE WHEN e.talla_administrativa = 'M' THEN 1 END) as M,
                COUNT(CASE WHEN e.talla_administrativa = 'L' THEN 1 END) as L,
                COUNT(CASE WHEN e.talla_administrativa = 'XL' THEN 1 END) as XL,
                COUNT(CASE WHEN e.talla_administrativa = 'XXL' THEN 1 END) as XXL,
                COUNT(CASE WHEN e.talla_administrativa = 'XXXL' THEN 1 END) as XXXL,
                COUNT(CASE WHEN e.talla_administrativa = 'Por definir' OR e.talla_administrativa IS NULL THEN 1 END) as Por_definir,
                COUNT(CASE WHEN e.requiere_playera_administrativa = true THEN 1 END) as Total_Administrativos
            FROM sucursales s
            LEFT JOIN empleados e ON s.id = e.sucursal_id
            WHERE e.requiere_playera_administrativa = true
            GROUP BY s.nombre
            ORDER BY s.nombre
        """)
        
        datos_admin_por_sucursal = cursor.fetchall()
        df_admin_por_sucursal = pd.DataFrame(datos_admin_por_sucursal)
        
        # Resumen por puesto homologado
        logger.debug("Consultando resumen por puesto homologado")
        cursor.execute("""
            SELECT 
                puesto_homologado, 
                COUNT(*) as cantidad
            FROM empleados
            WHERE puesto_homologado IS NOT NULL
            GROUP BY puesto_homologado
            ORDER BY COUNT(*) DESC
        """)
        
        datos_por_puesto = cursor.fetchall()
        df_por_puesto = pd.DataFrame(datos_por_puesto)
        
        # Generar nombre único para el archivo
        fecha_hora = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_archivo = f"reporte_completo_uniformes_{fecha_hora}.xlsx"
        ruta_archivo = REPORTS_DIR / nombre_archivo
        
        logger.debug(f"Generando archivo Excel completo: {nombre_archivo}")
        # Crear archivo Excel con múltiples hojas
        with pd.ExcelWriter(ruta_archivo) as writer:
            df.to_excel(writer, sheet_name='Detalle Completo', index=False)
            df_resumen.to_excel(writer, sheet_name='Resumen Tallas', index=False)
            df_resumen_admin.to_excel(writer, sheet_name='Resumen Tallas Adm', index=False)
            df_por_sucursal.to_excel(writer, sheet_name='Tallas Por Sucursal', index=False)
            df_admin_por_sucursal.to_excel(writer, sheet_name='Tallas Adm Por Sucursal', index=False)
            df_por_puesto.to_excel(writer, sheet_name='Por Puesto', index=False)
            
            # Ajustar el ancho de las columnas en cada hoja
            for sheet_name in writer.sheets:
                worksheet = writer.sheets[sheet_name]
                for i, col in enumerate(df.columns):
                    # Establecer un ancho mínimo para cada columna
                    column_width = max(df[col].astype(str).map(len).max(), len(str(col))) + 2
                    worksheet.column_dimensions[chr(65 + i)].width = min(column_width, 50)  # A=65 en ASCII, limitar a 50 de ancho máximo
        
        logger.debug("Archivo Excel completo generado correctamente")
        
        # Intentar subir a Supabase Storage
        try:
            logger.debug("Iniciando subida a Supabase Storage")
            # Obtener cliente de Supabase
            supabase = get_supabase_client()
            logger.debug("Cliente Supabase obtenido correctamente")
            
            # Leer el archivo Excel
            with open(ruta_archivo, 'rb') as file:
                file_contents = file.read()
            
            logger.debug(f"Archivo leído, tamaño: {len(file_contents)} bytes")
            
            # Subir a Supabase Storage en el bucket 'reportes'
            bucket_name = 'reportes'
            
            try:
                # Verificar si el bucket existe
                logger.debug(f"Verificando si existe el bucket '{bucket_name}'")
                buckets = supabase.storage.list_buckets()
                bucket_exists = any(bucket.name == bucket_name for bucket in buckets)
                
                if not bucket_exists:
                    logger.debug(f"El bucket '{bucket_name}' no existe, intentando crearlo")
                    supabase.storage.create_bucket(bucket_name, {'public': False})
                    logger.info(f"Bucket '{bucket_name}' creado exitosamente")
            except Exception as e:
                logger.warning(f"Error al verificar o crear bucket: {str(e)}")
            
            # Subir el archivo
            logger.debug(f"Subiendo archivo '{nombre_archivo}' al bucket '{bucket_name}'")
            upload_result = supabase.storage.from_(bucket_name).upload(
                nombre_archivo,
                file_contents,
                {"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
            )
            
            logger.debug(f"Archivo subido correctamente, resultado: {upload_result}")
            
            # Generar URL firmada que expire en 24 horas
            logger.debug("Generando URL firmada para descarga")
            signed_url = supabase.storage.from_(bucket_name).create_signed_url(
                nombre_archivo,
                86400  # 24 horas en segundos
            )
            
            url_descarga = signed_url['signedURL']
            logger.debug(f"URL firmada generada: {url_descarga}")
            
            # Registrar en la base de datos
            expiracion = datetime.now() + timedelta(hours=24)
            logger.debug("Registrando reporte en la base de datos")
            cursor.execute("""
                INSERT INTO reportes (nombre_archivo, fecha_generacion, tipo, url_descarga, expiracion)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (nombre_archivo, datetime.now(), 'excel_completo_supabase', url_descarga, expiracion))
            
            reporte_id = cursor.fetchone()['id']
            db.commit()
            
            logger.info(f"Reporte completo registrado con ID: {reporte_id}")
            
            return {
                "success": True,
                "archivo": nombre_archivo,
                "id": reporte_id,
                "url": url_descarga
            }
            
        except Exception as storage_error:
            # Si falla la subida a Supabase, devolvemos el archivo local
            logger.error(f"Error al subir a Supabase Storage: {str(storage_error)}")
            logger.exception("Traceback completo:")
            
            # Registrar en la base de datos, pero como reporte local
            cursor.execute("""
                INSERT INTO reportes (nombre_archivo, fecha_generacion, tipo)
                VALUES (%s, %s, %s)
                RETURNING id
            """, (nombre_archivo, datetime.now(), 'excel_completo_local'))
            
            reporte_id = cursor.fetchone()['id']
            db.commit()
            
            return {
                "success": True,
                "archivo": nombre_archivo,
                "id": reporte_id,
                "url": f"/reportes/excel/download/{nombre_archivo}",
                "warning": "El archivo se generó localmente debido a un error en Supabase Storage"
            }
    
    except Exception as e:
        logger.error(f"Error al generar reporte Excel completo para Supabase: {str(e)}")
        logger.exception("Traceback completo:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar reporte completo: {str(e)}"
        )