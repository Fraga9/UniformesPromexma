# app/models.py
from pydantic import BaseModel, validator, field_validator
from typing import Optional, Union, Any

class EmpleadoBase(BaseModel):
    nombre: str
    sucursal_id: int
    talla: str
    numero_nomina: Optional[int] = None
    puesto_hc: Optional[str] = None
    puesto_homologado: Optional[str] = None
    fecha_ingreso: Optional[str] = None
    fecha_ingreso_puesto: Optional[str] = None
    cumpleanos: Optional[str] = None
    ubicacion_hc: Optional[str] = None
    sexo: Optional[str] = None
    email: Optional[str] = None
    cemex_id: Optional[str] = None
    asesor_rh: Optional[str] = None
    prcrt: Optional[str] = None
    categoria: Optional[str] = None
    area_nom: Optional[str] = None

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

class SucursalCreate(SucursalBase):
    pass

class Sucursal(SucursalBase):
    id: int
    
    class Config:
        orm_mode = True

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