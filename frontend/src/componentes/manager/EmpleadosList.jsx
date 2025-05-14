"use client"

import { useState, useEffect } from "react"
import { Edit, Trash2, Search, Filter, Download, ArrowUpDown, AlertCircle, Shirt } from "lucide-react"

// Lista ampliada de tallas considerando las necesidades de uniformes
const TALLAS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Por definir"]

const EmpleadosList = ({ empleados, onEditEmpleado, onDeleteEmpleado, onUpdateTalla }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredEmpleados, setFilteredEmpleados] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: "nombre", direction: "ascending" })
  const [filterByTalla, setFilterByTalla] = useState("")
  const [selectedEmpleados, setSelectedEmpleados] = useState([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Estado para manejar el modo de edición inline de tallas
  const [editingTallaId, setEditingTallaId] = useState(null)
  const [editingTallaType, setEditingTallaType] = useState("regular") // 'regular' o 'administrativa'

  useEffect(() => {
    let result = [...empleados]

    // Aplicar búsqueda
    if (searchTerm) {
      result = result.filter((emp) => emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Aplicar filtro por talla
    if (filterByTalla) {
      result = result.filter((emp) => emp.talla === filterByTalla)
    }

    // Aplicar ordenamiento
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    setFilteredEmpleados(result)
  }, [empleados, searchTerm, sortConfig, filterByTalla])

  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmpleados(filteredEmpleados.map((emp) => emp.id))
      setShowBulkActions(true)
    } else {
      setSelectedEmpleados([])
      setShowBulkActions(false)
    }
  }

  const handleSelectEmpleado = (id) => {
    const newSelected = [...selectedEmpleados]
    if (newSelected.includes(id)) {
      const index = newSelected.indexOf(id)
      newSelected.splice(index, 1)
    } else {
      newSelected.push(id)
    }
    setSelectedEmpleados(newSelected)
    setShowBulkActions(newSelected.length > 0)
  }

  const bulkUpdateTalla = (talla, type = "regular") => {
    selectedEmpleados.forEach((id) => {
      const empleado = empleados.find((emp) => emp.id === id)
      if (empleado) {
        if (type === "regular") {
          onUpdateTalla(id, { ...empleado, talla })
        } else if (type === "administrativa" && empleado.requiere_playera_administrativa) {
          onUpdateTalla(id, { ...empleado, talla_administrativa: talla })
        }
      }
    })
    setSelectedEmpleados([])
    setShowBulkActions(false)
  }

  const handleExportCSV = () => {
    // Implementar la exportación a CSV incluyendo talla administrativa
    const selectedData = empleados.filter((emp) => selectedEmpleados.includes(emp.id))

    // Crear el encabezado del CSV
    let csvContent = "data:text/csv;charset=utf-8," + "ID,Nombre,Puesto Homologado,Talla Principal"

    // Añadir columna de talla administrativa si al menos un empleado la requiere
    if (selectedData.some((emp) => emp.requiere_playera_administrativa)) {
      csvContent += ",Requiere Playera Administrativa,Talla Administrativa"
    }
    csvContent += "\n"

    // Añadir los datos de cada empleado
    csvContent += selectedData
      .map((emp) => {
        let row = `${emp.id},"${emp.nombre}","${emp.puesto_homologado || ""}","${emp.talla}"`
        if (selectedData.some((e) => e.requiere_playera_administrativa)) {
          row += `,${emp.requiere_playera_administrativa ? "Sí" : "No"},"${emp.talla_administrativa || ""}"`
        }
        return row
      })
      .join("\n")

    // Crear y hacer clic en un enlace de descarga
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "empleados_uniformes.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleTallaClick = (id, type = "regular") => {
    setEditingTallaId(id)
    setEditingTallaType(type)
  }

  const handleTallaBlur = () => {
    setEditingTallaId(null)
  }

  const handleTallaChange = (id, value, type = "regular") => {
    const empleado = empleados.find((emp) => emp.id === id)
    if (!empleado) return

    if (type === "regular") {
      // Para actualizaciones de talla principal
      onUpdateTalla(id, { ...empleado, talla: value })
    } else if (type === "administrativa") {
      // Para actualizaciones de talla administrativa
      onUpdateTalla(id, { ...empleado, talla_administrativa: value })
    }

    // Cerrar el editor inline después de la actualización
    setEditingTallaId(null)
  }

  const countTallaPorDefinir = () => {
    return empleados.filter((emp) => emp.talla === "Por definir").length
  }

  const countTallaAdministrativaPorDefinir = () => {
    return empleados.filter(
      (emp) =>
        emp.requiere_playera_administrativa &&
        (!emp.talla_administrativa || emp.talla_administrativa === "Por definir"),
    ).length
  }

  if (empleados.length === 0) {
    return (
      <div className="p-4 text-center bg-gray-50 rounded-md shadow-sm border border-gray-200">
        <p className="text-gray-500">No hay empleados registrados. Agrega uno para comenzar.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Alertas para tallas por definir */}
      {(countTallaPorDefinir() > 0 || countTallaAdministrativaPorDefinir() > 0) && (
        <div className="p-2 m-2 md:p-3 md:m-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs md:text-sm">
          {countTallaPorDefinir() > 0 && (
            <div className="flex items-center mb-1 md:mb-2">
              <AlertCircle size={16} className="mr-1 md:mr-2 flex-shrink-0" />
              <span>
                <strong>{countTallaPorDefinir()}</strong> empleado(s) tienen talla principal "Por definir".
              </span>
            </div>
          )}

          {countTallaAdministrativaPorDefinir() > 0 && (
            <div className="flex items-center">
              <AlertCircle size={16} className="mr-1 md:mr-2 flex-shrink-0" />
              <span>
                <strong>{countTallaAdministrativaPorDefinir()}</strong> empleado(s) requieren talla administrativa pero
                no está definida.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="p-2 md:p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex flex-col gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={16} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-xs md:text-sm p-1.5 md:p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Filter size={14} className="mr-1" />
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </button>

            {selectedEmpleados.length > 0 && (
              <span className="text-xs md:text-sm text-blue-700">{selectedEmpleados.length} seleccionado(s)</span>
            )}
          </div>

          {showFilters && (
            <div className="mt-2 p-2 bg-gray-100 rounded-md">
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-grow max-w-[180px]">
                  <select
                    value={filterByTalla}
                    onChange={(e) => setFilterByTalla(e.target.value)}
                    className="p-1.5 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  >
                    <option value="">Todas las tallas</option>
                    {TALLAS.map((talla) => (
                      <option key={talla} value={talla}>
                        {talla}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones masivas */}
        {showBulkActions && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="text-xs md:text-sm text-blue-700">
                {selectedEmpleados.length} empleado(s) seleccionado(s)
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center">
                  <select
                    className="text-xs md:text-sm p-1 border border-blue-300 rounded-md"
                    onChange={(e) => e.target.value && bulkUpdateTalla(e.target.value, "regular")}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Asignar talla
                    </option>
                    {TALLAS.map((talla) => (
                      <option key={talla} value={talla}>
                        {talla}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Solo mostrar esta opción si hay empleados seleccionados con requiere_playera_administrativa */}
                {empleados.some((emp) => selectedEmpleados.includes(emp.id) && emp.requiere_playera_administrativa) && (
                  <div className="flex items-center">
                    <select
                      className="text-xs md:text-sm p-1 border border-blue-300 rounded-md"
                      onChange={(e) => e.target.value && bulkUpdateTalla(e.target.value, "administrativa")}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Talla admin
                      </option>
                      {TALLAS.map((talla) => (
                        <option key={talla} value={talla}>
                          {talla}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={handleExportCSV}
                  className="flex items-center bg-blue-600 text-white text-xs md:text-sm py-1 px-2 rounded-md hover:bg-blue-700"
                >
                  <Download size={14} className="mr-1" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de empleados - Versión móvil (tarjetas) */}
      <div className="md:hidden">
        {filteredEmpleados.map((empleado) => (
          <div key={empleado.id} className="p-3 border-b border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedEmpleados.includes(empleado.id)}
                  onChange={() => handleSelectEmpleado(empleado.id)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">{empleado.nombre}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {empleado.puesto_homologado || "-"}
                    {empleado.requiere_playera_administrativa && (
                      <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        <Shirt size={10} className="mr-0.5" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => onEditEmpleado(empleado)}
                  className="p-1 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  title="Editar empleado"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => onDeleteEmpleado(empleado.id)}
                  className="p-1 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                  title="Eliminar empleado"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Talla Seguridad</div>
                {editingTallaId === empleado.id && editingTallaType === "regular" ? (
                  <select
                    value={empleado.talla || "Por definir"}
                    onChange={(e) => handleTallaChange(empleado.id, e.target.value, "regular")}
                    onBlur={handleTallaBlur}
                    autoFocus
                    className="p-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  >
                    {TALLAS.map((talla) => (
                      <option key={talla} value={talla}>
                        {talla}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    onClick={() => handleTallaClick(empleado.id, "regular")}
                    className={`cursor-pointer p-1.5 rounded-md border border-gray-200 flex items-center justify-between text-sm ${
                      empleado.talla === "Por definir"
                        ? "text-amber-600 font-medium bg-amber-50 border-amber-200"
                        : "text-gray-900 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span>{empleado.talla || "Por definir"}</span>
                    <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Talla Construrama</div>
                {empleado.requiere_playera_administrativa ? (
                  editingTallaId === empleado.id && editingTallaType === "administrativa" ? (
                    <select
                      value={empleado.talla_administrativa || "Por definir"}
                      onChange={(e) => handleTallaChange(empleado.id, e.target.value, "administrativa")}
                      onBlur={handleTallaBlur}
                      autoFocus
                      className="p-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    >
                      {TALLAS.map((talla) => (
                        <option key={talla} value={talla}>
                          {talla}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      onClick={() => handleTallaClick(empleado.id, "administrativa")}
                      className={`cursor-pointer p-1.5 rounded-md border border-gray-200 flex items-center justify-between text-sm ${
                        !empleado.talla_administrativa || empleado.talla_administrativa === "Por definir"
                          ? "text-amber-600 font-medium bg-amber-50 border-amber-200"
                          : "text-gray-900 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <span>{empleado.talla_administrativa || "Por definir"}</span>
                      <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )
                ) : (
                  <span className="text-gray-400 text-xs p-1.5 block">N/A</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de empleados - Versión escritorio */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-3 text-left">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedEmpleados.length === filteredEmpleados.length && filteredEmpleados.length > 0}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th
                className="p-3 text-left text-gray-600 cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort("nombre")}
              >
                <div className="flex items-center">
                  Nombre
                  <ArrowUpDown size={16} className="ml-1 text-gray-400" />
                </div>
              </th>
              <th
                className="p-3 text-left text-gray-600 cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort("puesto_homologado")}
              >
                <div className="flex items-center">
                  Puesto
                  <ArrowUpDown size={16} className="ml-1 text-gray-400" />
                </div>
              </th>
              <th
                className="p-3 text-left text-gray-600 cursor-pointer hover:bg-gray-200"
                onClick={() => requestSort("talla")}
              >
                <div className="flex items-center">
                  Talla Seguridad
                  <ArrowUpDown size={16} className="ml-1 text-gray-400" />
                </div>
              </th>
              <th className="p-3 text-left text-gray-600">Talla Construrama</th>
              <th className="p-3 text-center text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmpleados.map((empleado) => (
              <tr key={empleado.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedEmpleados.includes(empleado.id)}
                    onChange={() => handleSelectEmpleado(empleado.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3">{empleado.nombre}</td>
                <td className="p-3">
                  <div className="flex items-center">
                    {empleado.puesto_homologado || "-"}
                    {empleado.requiere_playera_administrativa && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        <Shirt size={12} className="mr-1" />
                        Admin
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  {editingTallaId === empleado.id && editingTallaType === "regular" ? (
                    <select
                      value={empleado.talla || "Por definir"}
                      onChange={(e) => handleTallaChange(empleado.id, e.target.value, "regular")}
                      onBlur={handleTallaBlur}
                      autoFocus
                      className="p-1 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    >
                      {TALLAS.map((talla) => (
                        <option key={talla} value={talla}>
                          {talla}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      onClick={() => handleTallaClick(empleado.id, "regular")}
                      className={`cursor-pointer p-2 rounded-md border border-gray-200 flex items-center justify-between ${
                        empleado.talla === "Por definir"
                          ? "text-amber-600 font-medium bg-amber-50 border-amber-200"
                          : "text-gray-900 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <span>{empleado.talla || "Por definir"}</span>
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {empleado.requiere_playera_administrativa ? (
                    editingTallaId === empleado.id && editingTallaType === "administrativa" ? (
                      <select
                        value={empleado.talla_administrativa || "Por definir"}
                        onChange={(e) => handleTallaChange(empleado.id, e.target.value, "administrativa")}
                        onBlur={handleTallaBlur}
                        autoFocus
                        className="p-1 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      >
                        {TALLAS.map((talla) => (
                          <option key={talla} value={talla}>
                            {talla}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        onClick={() => handleTallaClick(empleado.id, "administrativa")}
                        className={`cursor-pointer p-2 rounded-md border border-gray-200 flex items-center justify-between ${
                          !empleado.talla_administrativa || empleado.talla_administrativa === "Por definir"
                            ? "text-amber-600 font-medium bg-amber-50 border-amber-200"
                            : "text-gray-900 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <span>{empleado.talla_administrativa || "Por definir"}</span>
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )
                  ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onEditEmpleado(empleado)}
                      className="p-1.5 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      title="Editar empleado"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteEmpleado(empleado.id)}
                      className="p-1.5 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                      title="Eliminar empleado"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación o resumen */}
      <div className="p-2 md:p-3 bg-gray-50 border-t border-gray-200 text-xs md:text-sm text-gray-500 rounded-b-lg flex justify-between items-center">
        <div>
          Mostrando {filteredEmpleados.length} de {empleados.length} empleados
        </div>
        <div>{empleados.length} empleado(s) en total</div>
      </div>
    </div>
  )
}

export default EmpleadosList
