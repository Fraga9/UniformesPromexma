# app/main.py
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from passlib.context import CryptContext
import logging 
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import dotenv

# Cargar variables de entorno
dotenv.load_dotenv()

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
from .routes import sucursales, empleados, usuarios, reportes


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
    "http://localhost:5173",
    "https://uniformesbackend.onrender.com",
    "*",  # Esto permitirá temporalmente todas las solicitudes para diagnóstico
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Añadir esto
    max_age=86400,  # Añadir esto (tiempo de caché en segundos)
)


# Incluir rutas
app.include_router(sucursales.router)
app.include_router(empleados.router)
app.include_router(usuarios.router)
app.include_router(reportes.router)

# Crear carpeta para reportes si no existe
REPORTS_DIR = Path(__file__).parent.parent / "reportes"
os.makedirs(REPORTS_DIR, exist_ok=True)


@app.get("/test-cors")
def test_cors():
    return {"message": "CORS is working!"}


# Inicializar la base de datos al inicio
@app.on_event("startup")
def startup():
    logger.info("Iniciando aplicación y verificando conexión a Supabase")
    init_db()
    logger.info("Aplicación iniciada correctamente")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)