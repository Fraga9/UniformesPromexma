# app/models.py
from pydantic import BaseModel, validator, field_validator
from typing import Optional, Union, Any
from datetime import date, datetime


class MensajeRespuesta(BaseModel):
    message: str

class EmpleadoBase(BaseModel):
    nombre: str
    sucursal_id: int
    talla: str
    numero_nomina: Optional[int] = None
    puesto_hc: Optional[str] = None
    puesto_homologado: Optional[str] = None
    fecha_ingreso: Optional[Union[str, date]] = None  # Acepta str o date
    fecha_ingreso_puesto: Optional[Union[str, date]] = None  # Acepta str o date
    cumpleanos: Optional[str] = None
    ubicacion_hc: Optional[str] = None
    sexo: Optional[str] = None
    email: Optional[str] = None
    cemex_id: Optional[str] = None
    asesor_rh: Optional[str] = None
    prcrt: Optional[str] = None
    categoria: Optional[str] = None
    area_nom: Optional[str] = None
    requiere_playera_administrativa: Optional[bool] = False
    talla_administrativa: Optional[str] = None
   
    @field_validator('requiere_playera_administrativa')
    def validar_requiere_administrativa(cls, v):
        return False if v is None else v
    
    @field_validator('talla_administrativa')
    def validar_talla_administrativa(cls, v, info):
        # Si requiere playera administrativa y no se proporciona talla, usar la talla principal
        if 'requiere_playera_administrativa' in info.data and info.data['requiere_playera_administrativa']:
            if not v and 'talla' in info.data and info.data['talla']:
                return info.data['talla']
        return v
    
    @field_validator('puesto_homologado')
    def validar_puesto_homologado(cls, v, info):
        # Lista de puestos que requieren playera administrativa
        puestos_administrativos = [
            'gerente de tienda',
            'vendedor de calle',
            'jefe de tienda',
            'vendedor mostrador',
            'jefe de tienda sr.'
        ]
        
        # Verificar el puesto homologado de manera insensible a mayúsculas/minúsculas
        if v:
            puesto_lower = v.lower()
            
            # Verificar coincidencias exactas
            if puesto_lower in puestos_administrativos:
                info.data['requiere_playera_administrativa'] = True
            
            # Verificar coincidencias parciales (por si hay variaciones)
            elif ('gerente' in puesto_lower and 'tienda' in puesto_lower) or \
                 ('vendedor' in puesto_lower and 'calle' in puesto_lower) or \
                 ('jefe' in puesto_lower and 'tienda' in puesto_lower) or \
                 ('vendedor' in puesto_lower and 'mostrador' in puesto_lower):
                info.data['requiere_playera_administrativa'] = True
        
        return v
    class Config:
        from_attributes = True
        json_encoders = {
            # Personalizar la serialización de date a string
            date: lambda v: v.isoformat() if v else None
        }


   

class EmpleadoCreate(EmpleadoBase):
    pass

class Empleado(EmpleadoBase):
    id: int
    
    class Config:
        orm_mode = True

class SucursalBase(BaseModel):
    nombre: str
    manager: str
    zona: str
    gerencia: Optional[str] = None
    region: Optional[str] = None
    pdv: Optional[str] = None
    ubicacion_pdv: Optional[str] = None


class SucursalUpdate(BaseModel):
    nombre: Optional[str] = None
    manager: Optional[str] = None
    zona: Optional[str] = None
    gerencia: Optional[str] = None
    region: Optional[str] = None
    pdv: Optional[str] = None
    ubicacion_pdv: Optional[str] = None


class SucursalCreate(SucursalBase):
    pass

class Sucursal(SucursalBase):
    id: int
    
    class Config:
        orm_mode = True


from pydantic import BaseModel
from typing import Optional



class UsuarioBase(BaseModel):
    username: str
    rol: str
    # Permitir que sucursal_id sea un entero, None, o una cadena que podamos convertir
    sucursal_id: Optional[Any] = None

    @field_validator('sucursal_id')
    def validar_sucursal_segun_rol(cls, v, info):
        # Convertir cadenas vacías o "null" a None
        if v == "" or v == "null" or v == "undefined":
            return None
        
        # Intentar convertir a entero si es una cadena numérica
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return None
        
        # Si es administrador, la sucursal_id debe ser None
        values = info.data
        if 'rol' in values and values['rol'] == 'admin':
            return None
        # Si es manager, la sucursal_id es requerida
        elif 'rol' in values and values['rol'] == 'manager' and v is None:
            raise ValueError('Los usuarios de tipo manager requieren una sucursal_id')
        return v
        return v

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioLogin(BaseModel):
    username: str
    password: str

class Usuario(UsuarioBase):
    id: int
    
    class Config:
        from_attributes = True


class Reporte(BaseModel):
    id: int
    nombre_archivo: str
    fecha_generacion: datetime
    tipo: str
    url_descarga: Optional[str] = None
    expiracion: Optional[datetime] = None