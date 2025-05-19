"use client"

import { useState, useEffect } from "react"
import { Save, X, AlertCircle } from "lucide-react"

const TALLAS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Por definir"]

// Lista de puestos homologados disponibles
const PUESTOS_HOMOLOGADOS = [
  "Adve", 
  "Almacenista", 
  "Cargador", 
  "Chofer", 
  "Gerente de Tienda", 
  "Vendedor Calle", 
  "Jefe de Tienda", 
  "Asesor de Servicio de Despacho", 
  "Ayudante General", 
  "Montacarguista", 
  "Supervisor de Area", 
  "Vendedor Mostrador", 
  "Operador de Sencillo"
]

// Lista de puestos que requieren playera administrativa
const PUESTOS_ADMINISTRATIVOS = [
  "gerente de tienda",
  "vendedor calle",
  "jefe de tienda",
  "vendedor mostrador",
  "jefe de tienda sr.",
  "adve"
]

// Función para verificar si un puesto requiere playera administrativa
const requierePlayeraAdministrativa = (puesto) => {
  if (!puesto) return false

  const puestoLower = puesto.toLowerCase()

  // Coincidencia exacta
  if (PUESTOS_ADMINISTRATIVOS.includes(puestoLower)) {
    return true
  }

  // Coincidencia parcial
  return (
    (puestoLower.includes("gerente") && puestoLower.includes("tienda")) ||
    (puestoLower.includes("vendedor") && puestoLower.includes("calle")) ||
    (puestoLower.includes("jefe") && puestoLower.includes("tienda")) ||
    (puestoLower.includes("vendedor") && puestoLower.includes("mostrador"))
  )
}

const EmpleadoForm = ({ empleado, isEditing, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: empleado?.id || null,
    nombre: empleado?.nombre || "",
    talla: empleado?.talla || "M",
    puesto_homologado: empleado?.puesto_homologado || "",
    requiere_playera_administrativa: empleado?.requiere_playera_administrativa || false,
    talla_administrativa: empleado?.talla_administrativa || "M",
    sucursal_id: empleado?.sucursal_id || empleado?.sucursalId || null,
  })

  const [errors, setErrors] = useState({})

  // Actualizar el estado de requiere_playera_administrativa cuando cambia el puesto_homologado
  useEffect(() => {
    if (formData.puesto_homologado) {
      const requiereAdministrativa = requierePlayeraAdministrativa(formData.puesto_homologado)

      if (requiereAdministrativa !== formData.requiere_playera_administrativa) {
        setFormData((prev) => ({
          ...prev,
          requiere_playera_administrativa: requiereAdministrativa,
        }))
      }
    }
  }, [formData.puesto_homologado])

  const validate = () => {
    const newErrors = {}
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }
    if (!formData.talla) {
      newErrors.talla = "La talla es requerida"
    }
    if (!formData.puesto_homologado) {
      newErrors.puesto_homologado = "El puesto homologado es requerido"
    }
    if (!formData.sucursal_id) {
      newErrors.sucursal_id = "La sucursal es requerida"
    }

    // Validar talla administrativa si es requerida
    if (formData.requiere_playera_administrativa && !formData.talla_administrativa) {
      newErrors.talla_administrativa = "La talla administrativa es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === "checkbox" ? checked : value

    if (name === "puesto_homologado") {
      // Actualizar el campo de requiere_playera_administrativa automáticamente
      const requiereAdministrativa = requierePlayeraAdministrativa(value)

      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        requiere_playera_administrativa: requiereAdministrativa,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: newValue }))
    }

    // Limpiar error cuando el campo se edita
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="p-3 md:p-6 mb-4 md:mb-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-semibold text-gray-800">
        {isEditing ? "Editar Empleado" : "Agregar Nuevo Empleado"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-3 md:gap-4 mb-4 md:mb-6 md:grid-cols-2">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block mb-1 md:mb-2 text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.nombre ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
              placeholder="Ingrese el nombre completo"
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
          </div>

          {/* Puesto Homologado como SELECT */}
          <div>
            <label htmlFor="puesto_homologado" className="block mb-1 md:mb-2 text-sm font-medium text-gray-700">
              Puesto Homologado
            </label>
            <select
              id="puesto_homologado"
              name="puesto_homologado"
              value={formData.puesto_homologado}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.puesto_homologado ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
            >
              <option value="">Seleccione un puesto</option>
              {PUESTOS_HOMOLOGADOS.map((puesto) => (
                <option key={puesto} value={puesto}>
                  {puesto}
                </option>
              ))}
            </select>
            {errors.puesto_homologado && <p className="mt-1 text-xs text-red-600">{errors.puesto_homologado}</p>}
            {formData.puesto_homologado && requierePlayeraAdministrativa(formData.puesto_homologado) && (
              <p className="mt-1 text-xs text-blue-600">Este puesto requiere playera administrativa adicional</p>
            )}
          </div>

          {/* Talla Principal */}
          <div>
            <label htmlFor="talla" className="block mb-1 md:mb-2 text-sm font-medium text-gray-700">
              Talla de Uniforme
            </label>
            <select
              id="talla"
              name="talla"
              value={formData.talla}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.talla ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
            >
              {TALLAS.map((talla) => (
                <option key={talla} value={talla}>
                  {talla}
                </option>
              ))}
            </select>
            {errors.talla && <p className="mt-1 text-xs text-red-600">{errors.talla}</p>}
          </div>

          {/* Requiere Playera Administrativa (Checkbox) */}
          <div className="flex items-center h-full mt-4 md:mt-8">
            <input
              type="checkbox"
              id="requiere_playera_administrativa"
              name="requiere_playera_administrativa"
              checked={formData.requiere_playera_administrativa}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="requiere_playera_administrativa" className="ml-2 text-sm font-medium text-gray-700">
              Requiere playera administrativa adicional
            </label>
          </div>
        </div>

        {/* Talla Administrativa (Solo se muestra si requiere_playera_administrativa es true) */}
        {formData.requiere_playera_administrativa && (
          <div className="mb-4 md:mb-6">
            <div className="p-3 md:p-4 border border-blue-100 bg-blue-50 rounded-md">
              <h3 className="text-sm md:text-md font-medium text-blue-800 mb-2">Playera Administrativa</h3>
              <div className="grid gap-3 md:gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="talla_administrativa"
                    className="block mb-1 md:mb-2 text-sm font-medium text-gray-700"
                  >
                    Talla de Playera Administrativa
                  </label>
                  <select
                    id="talla_administrativa"
                    name="talla_administrativa"
                    value={formData.talla_administrativa}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.talla_administrativa ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                  >
                    {TALLAS.map((talla) => (
                      <option key={talla} value={talla}>
                        {talla}
                      </option>
                    ))}
                  </select>
                  {errors.talla_administrativa && (
                    <p className="mt-1 text-xs text-red-600">{errors.talla_administrativa}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <div className="flex items-center p-2 rounded-md bg-blue-100 text-blue-800 text-xs md:text-sm">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                    <p>Esta talla es específica para los puestos administrativos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acciones */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
          >
            <X size={16} className="mr-1" />
            Cancelar
          </button>

          <button
            type="submit"
            className="flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <Save size={16} className="mr-1" />
            {isEditing ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EmpleadoForm
