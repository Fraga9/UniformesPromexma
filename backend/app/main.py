# app/main.py
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime
from pathlib import Path
import sqlite3
import os
from passlib.context import CryptContext
import logging 
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


# Configurar el logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  
    ]
)

logger = logging.getLogger("app")

from .database import init_db, get_db
from .routes import sucursales, empleados, usuarios


app = FastAPI(title="API Uniformes Promexma")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors_detail = []
    for error in exc.errors():
        error_detail = {
            "loc": error.get("loc", []),
            "msg": error.get("msg", ""),
            "type": error.get("type", "")
        }
        errors_detail.append(error_detail)
    
    logger.error(f"Error de validación: {errors_detail}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors_detail},
    )

@app.middleware("http")
async def log_requests(request, call_next):
    logger.debug(f"Solicitud entrante: {request.method} {request.url}")
    
    # Intentar obtener y loguear el cuerpo de la solicitud para depuración
    try:
        body = await request.body()
        if body:
            body_str = body.decode()
            # No logueamos contraseñas completas
            if "password" in body_str:
                body_str = "[CONTENIDO SENSIBLE OCULTO]"
            logger.debug(f"Cuerpo de la solicitud: {body_str}")
            # Necesitamos reestablecer el cuerpo para que FastAPI pueda acceder a él
            request._body = body
    except Exception as e:
        logger.error(f"Error al procesar cuerpo de la solicitud: {str(e)}")

    response = await call_next(request)
    
    logger.debug(f"Respuesta: {response.status_code}")
    return response

origins = [
    "https://uniformes-promexma.vercel.app",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Incluir rutas
app.include_router(sucursales.router)
app.include_router(empleados.router)
app.include_router(usuarios.router)


# Crear carpeta para reportes si no existe
REPORTS_DIR = Path(__file__).parent.parent / "reportes"
os.makedirs(REPORTS_DIR, exist_ok=True)

@app.get("/reporte/excel")
def generar_reporte_excel(db: sqlite3.Connection = Depends(get_db)):
    # Obtener datos de empleados con nombre de sucursal
    cursor = db.cursor()
    cursor.execute("""
        SELECT e.id, e.nombre, e.talla, s.nombre as sucursal, s.manager
        FROM empleados e
        JOIN sucursales s ON e.sucursal_id = s.id
        ORDER BY s.nombre, e.nombre
    """)
    
    datos = [dict(row) for row in cursor.fetchall()]
    
    # Crear DataFrame
    df = pd.DataFrame(datos)
    
    # Obtener resumen por talla
    tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    resumen = {}
    for talla in tallas:
        resumen[talla] = len([d for d in datos if d['talla'] == talla])
    
    df_resumen = pd.DataFrame([resumen])
    
    # Generar nombre único para el archivo
    fecha_hora = datetime.now().strftime("%Y%m%d_%H%M%S")
    ruta_archivo = REPORTS_DIR / f"reporte_uniformes_{fecha_hora}.xlsx"
    
    # Crear archivo Excel con múltiples hojas
    with pd.ExcelWriter(ruta_archivo) as writer:
        df.to_excel(writer, sheet_name='Detalle', index=False)
        df_resumen.to_excel(writer, sheet_name='Resumen', index=False)
    
    return {"archivo": str(ruta_archivo)}

# Inicializar la base de datos al inicio
@app.on_event("startup")
def startup():
    init_db()

    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)