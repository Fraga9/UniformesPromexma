// src/components/admin/SucursalInfoCard.jsx
import React, { useState } from 'react';
import {
  Building,
  Edit,
  Save,
  X,
  Truck,
  Download,
  Eye,
  EyeOff,
  Package
} from 'lucide-react';
import { updateSucursal } from '../../api';
import { jsPDF } from 'jspdf';

const SucursalInfoCard = ({ sucursal, empleados = [], onSucursalUpdate, onError, onSuccess }) => {
  // Estados para edición
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({
    nombre: sucursal?.nombre || '',
    direccion: sucursal?.direccion || '',
    telefono: sucursal?.telefono || '',
    is_empaquetado: sucursal?.is_empaquetado || false,
    numero_seguimiento: sucursal?.numero_seguimiento || ''
  });
  
  // Nuevo estado para controlar si mostrar contenido del paquete
  const [showPackageContent, setShowPackageContent] = useState(true);

  // Actualizar editValues cuando cambie la sucursal
  React.useEffect(() => {
    if (sucursal) {
      setEditValues({
        nombre: sucursal.nombre || '',
        direccion: sucursal.direccion || '',
        telefono: sucursal.telefono || '',
        is_empaquetado: sucursal.is_empaquetado || false,
        numero_seguimiento: sucursal.numero_seguimiento || ''
      });
    }
  }, [sucursal]);

  // Función para calcular el resumen de tallas (SOLO PLAYERAS DE SEGURIDAD)
  const calcularResumenTallas = () => {
    const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const emptyLabel = 'Por definir';
    
    let playerasSeguridad = 0;
    const tallasSeguridad = {};

    empleados.forEach(emp => {
      if (emp.requiere_playera_administrativa) {
        // Solo cuenta 1 playera de seguridad para empleados administrativos
        if (emp.talla && emp.talla !== emptyLabel) {
          playerasSeguridad += 1;
          tallasSeguridad[emp.talla] = (tallasSeguridad[emp.talla] || 0) + 1;
        }
      } else {
        // Cuenta 3 playeras de seguridad para empleados operativos
        if (emp.talla && emp.talla !== emptyLabel) {
          playerasSeguridad += 3;
          tallasSeguridad[emp.talla] = (tallasSeguridad[emp.talla] || 0) + 3;
        }
      }
    });

    return {
      playerasSeguridad,
      tallasSeguridad
    };
  };

  const handleSaveField = async (field) => {
    try {
      onError('');

      // Preparar los datos para enviar
      const updateData = {};
      
      // Mapear los nombres de campos correctamente
      if (field === 'nombre') {
        updateData.nombre = editValues.nombre;
      } else if (field === 'is_empaquetado') {
        updateData.is_empaquetado = editValues.is_empaquetado;
      } else if (field === 'numero_seguimiento') {
        updateData.numero_seguimiento = editValues.numero_seguimiento;
      } else if (field === 'direccion') {
        updateData.direccion = editValues.direccion;
      } else if (field === 'telefono') {
        updateData.telefono = editValues.telefono;
      }

      // Llamar a la API
      const sucursalActualizada = await updateSucursal(sucursal.id, updateData);

      // Actualizar el estado en el componente padre
      if (onSucursalUpdate) {
        onSucursalUpdate(sucursalActualizada);
      }
      
      setEditingField(null);
      
      // Mensaje de éxito más específico
      const fieldNames = {
        'nombre': 'Nombre',
        'direccion': 'Dirección',
        'telefono': 'Teléfono',
        'is_empaquetado': 'Estado de empaquetado',
        'numero_seguimiento': 'Número de seguimiento'
      };
      
      onSuccess(`${fieldNames[field]} actualizado correctamente`);

    } catch (err) {
      onError('Error al actualizar: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValues({
      nombre: sucursal.nombre || '',
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      is_empaquetado: sucursal.is_empaquetado || false,
      numero_seguimiento: sucursal.numero_seguimiento || ''
    });
  };

  const handleFieldEdit = (field) => {
    setEditingField(field);
  };

  const generateSingleLabel = (doc, sucursal, empleados = [], xOffset = 0, yOffset = 0, labelWidth = 200, labelHeight = 280, cajaInfo = null) => {
    // Configurar fuente
    doc.setFont('helvetica');
    
    const baseX = xOffset;
    const baseY = yOffset;
    const margin = 2;
    const leftMargin = baseX + 5;
    const rightMargin = baseX + labelWidth - 5;
    const availableWidth = labelWidth - 10;

    // Encabezado con título
    let currentY = baseY + 15;
    
    // Título principal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ETIQUETA DE ENVÍO', baseX + labelWidth/2, currentY, { align: 'center' });
    currentY += 10;
    
    // Indicador de caja (si hay múltiples cajas) - Posicionado debajo del título
    if (cajaInfo && cajaInfo.totalCajas > 1) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Solo texto negro
      doc.text(`CAJA ${cajaInfo.numeroActual}/${cajaInfo.totalCajas}`, baseX + labelWidth/2, currentY + 3, { align: 'center' });
      currentY += 12;
    }
    
    // Línea separadora principal
    doc.setLineWidth(0.8);
    doc.line(leftMargin, currentY, rightMargin, currentY);
    currentY += 8;
    
    // SECCIÓN DESTINATARIO
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATARIO:', leftMargin, currentY);
    currentY += 8;
    
    // Nombre de la sucursal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const nombreSucursal = sucursal.nombre || 'Sucursal';
    doc.text(nombreSucursal, leftMargin, currentY);
    currentY += 8;
    
    // Manager
    if (sucursal.manager) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.text(sucursal.manager, leftMargin, currentY);
      currentY += 7;
    }
    
    // Dirección del destinatario (más compacta)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    const direccionDestinatario = sucursal.direccion || 'Dirección no especificada';
    const direccionLines = doc.splitTextToSize(direccionDestinatario, availableWidth);
    
    // Limitar a máximo 3 líneas para la dirección
    const maxDireccionLines = Math.min(direccionLines.length, 3);
    for (let i = 0; i < maxDireccionLines; i++) {
      doc.text(direccionLines[i], leftMargin, currentY);
      currentY += 6;
    }
    
    // Teléfono del destinatario
    if (sucursal.telefono) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Tel: ${sucursal.telefono}`, leftMargin, currentY);
      currentY += 8;
    }
    
    // Línea divisoria
    doc.setLineWidth(0.5);
    doc.line(leftMargin, currentY, rightMargin, currentY);
    currentY += 7;
    
    // SECCIÓN REMITENTE (más compacta)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REMITENTE:', leftMargin, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Rodrigo Isai Reyna R.', leftMargin, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Constitución 444 pte Col Centro, Monterrey, NL', leftMargin, currentY);
    currentY += 6;
    doc.text('CP 64000  Tel: 8126220306', leftMargin, currentY);
    currentY += 12;
    
    // SECCIÓN CONTENIDO (si está habilitada y hay espacio)
    if (showPackageContent && empleados && empleados.length > 0) {
      const resumen = calcularResumenTallas();
      
      // Verificar si hay espacio suficiente (reservar al menos 30mm para el final)
      const espacioRestante = (baseY + labelHeight - 30) - currentY;
      
      if (espacioRestante > 30) { // Solo mostrar si hay espacio suficiente
        // Línea divisoria
        doc.setLineWidth(0.5);
        doc.line(leftMargin, currentY, rightMargin, currentY);
        currentY += 7;
        
        // Título del contenido
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('CONTENIDO:', leftMargin, currentY);
        currentY += 10;
        
        // Información básica con fuente más grande
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(13);
        
        const infoText = [`Empleados: ${empleados.length}`];
        
        // Mostrar playeras según la caja
        if (cajaInfo && cajaInfo.totalCajas > 1) {
          infoText.push(`Playeras: ${cajaInfo.playerasEnEstaCaja}`);
          infoText.push(`(Total: ${resumen.playerasSeguridad})`);
        } else if (resumen.playerasSeguridad > 0) {
          infoText.push(`Playeras: ${resumen.playerasSeguridad}`);
        }
        
        doc.text(infoText.join(' • '), leftMargin, currentY);
        currentY += 10;
        
        // Tallas - Formato tabular profesional
        if (Object.keys(resumen.tallasSeguridad).length > 0 && (!cajaInfo || cajaInfo.numeroActual === 1)) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text('TALLAS:', leftMargin, currentY);
          currentY += 10;
          
          const tallasEntries = Object.entries(resumen.tallasSeguridad);
          
          // Crear formato de tabla/grid para las tallas
          const columnWidth = 30; // Ancho de cada columna
          const startX = leftMargin + 5;
          let currentX = startX;
          let rowCount = 0;
          const maxColumns = Math.floor(availableWidth / columnWidth) - 1; // Máximo columnas según el ancho
          
          // Dibujar marco de tallas
          const tallasBoxStartY = currentY - 6;
          doc.setLineWidth(0.3);
          doc.setFillColor(248, 248, 248); // Fondo gris muy claro
          doc.rect(leftMargin + 2, tallasBoxStartY, availableWidth - 4, 20, 'FD');
          
          tallasEntries.forEach(([talla, cantidad], index) => {
            // Si llegamos al límite de columnas, pasar a la siguiente fila
            if (index > 0 && index % maxColumns === 0) {
              currentY += 8;
              currentX = startX;
              rowCount++;
              
              // Máximo 2 filas para mantener el diseño compacto
              if (rowCount >= 2) return;
            }
            
            // Dibujar talla y cantidad con mejor formato
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(talla, currentX, currentY);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(`(${cantidad})`, currentX + 12, currentY);
            
            currentX += columnWidth;
          });
          
          currentY += 12; // Espacio después de las tallas
        }
      }
    }
    
    // Número de seguimiento (si existe) - Posición fija en la parte inferior
    if (sucursal.numero_seguimiento) {
      const trackingY = baseY + labelHeight - 15;
      
      // Línea superior al número de seguimiento
      doc.setLineWidth(0.5);
      doc.line(leftMargin, trackingY - 6, rightMargin, trackingY - 6);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`SEGUIMIENTO: ${sucursal.numero_seguimiento}`, baseX + labelWidth/2, trackingY, { align: 'center' });
    }
    
    // Borde exterior de la etiqueta
    doc.setLineWidth(1);
    doc.rect(baseX + margin, baseY + margin, labelWidth - (2 * margin), labelHeight - (2 * margin));
  };

  const generateShippingLabel = () => {
    try {
      // Calcular resumen para determinar número de cajas
      const resumen = calcularResumenTallas();
      const PLAYERAS_POR_CAJA = 12;
      const numCajas = Math.ceil(resumen.playerasSeguridad / PLAYERAS_POR_CAJA) || 1;
      
      // Crear documento PDF
      const doc = new jsPDF();
      
      // Configuración de etiquetas por página (4 etiquetas: 2x2) - IGUAL AL GENERADOR MASIVO
      const labelsPerRow = 2;
      const labelsPerColumn = 2;
      const labelsPerPage = labelsPerRow * labelsPerColumn;
      
      // Dimensiones de las etiquetas - IGUALES AL GENERADOR MASIVO
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const labelWidth = pageWidth / labelsPerRow;
      const labelHeight = pageHeight / labelsPerColumn;
      
      let currentPage = 0;
      let labelCount = 0;
      
      // Generar etiquetas para cada caja
      for (let cajaNum = 1; cajaNum <= numCajas; cajaNum++) {
        // Calcular posición en la página
        const positionInPage = labelCount % labelsPerPage;
        const row = Math.floor(positionInPage / labelsPerRow);
        const col = positionInPage % labelsPerRow;
        
        // Si es el primer label de una nueva página
        if (positionInPage === 0 && labelCount > 0) {
          doc.addPage();
          currentPage++;
        }
        
        // Calcular offsets
        const xOffset = col * labelWidth;
        const yOffset = row * labelHeight;
        
        // Información de la caja
        const cajaInfo = numCajas > 1 ? {
          numeroActual: cajaNum,
          totalCajas: numCajas,
          playerasEnEstaCaja: cajaNum < numCajas ? PLAYERAS_POR_CAJA : (resumen.playerasSeguridad - (numCajas - 1) * PLAYERAS_POR_CAJA)
        } : null;
        
        // Generar etiqueta individual
        generateSingleLabel(doc, sucursal, empleados, xOffset, yOffset, labelWidth, labelHeight, cajaInfo);
        
        labelCount++;
      }
      
      // Descargar el PDF
      const fileName = `etiqueta_envio_${sucursal.nombre?.replace(/\s+/g, '_') || 'sucursal'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      const mensaje = numCajas > 1 
        ? `Etiquetas de envío generadas correctamente (${numCajas} cajas)`
        : 'Etiqueta de envío generada correctamente';
      
      onSuccess(mensaje);
      
    } catch (error) {
      console.error('Error generando etiqueta:', error);
      onError('Error al generar la etiqueta de envío: ' + error.message);
    }
  };

  if (!sucursal) {
    return null;
  }

  // Calcular resumen para mostrar en la UI
  const resumen = empleados.length > 0 ? calcularResumenTallas() : null;
  const numCajas = resumen ? Math.ceil(resumen.playerasSeguridad / 12) || 1 : 1;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Building size={20} className="mr-2 text-blue-600" />
          Información de la Sucursal
        </h2>
        
        <button
          onClick={generateShippingLabel}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          title="Generar etiqueta de envío PDF"
        >
          <Truck size={16} className="mr-2" />
          <Download size={16} className="mr-1" />
          Generar Etiqueta{numCajas > 1 ? 's' : ''}
        </button>
      </div>

      {/* Nueva opción: Mostrar contenido del paquete */}
      {empleados.length > 0 && (
        <div className="mb-6 p-4 border rounded-lg bg-blue-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Opciones de Etiqueta:</h3>
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={showPackageContent}
                onChange={(e) => setShowPackageContent(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${
                showPackageContent ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                  showPackageContent ? 'translate-x-5' : 'translate-x-1'
                } mt-1`}></div>
              </div>
            </div>
            <div className="flex items-center">
              {showPackageContent ? <Eye size={16} className="mr-2 text-blue-600" /> : <EyeOff size={16} className="mr-2 text-gray-400" />}
              <div>
                <div className="text-sm font-medium text-gray-800">
                  Incluir contenido del paquete
                </div>
                <div className="text-xs text-gray-500">
                  {showPackageContent 
                    ? 'La etiqueta incluirá información de empleados y playeras de seguridad'
                    : 'Solo se mostrará información básica de envío'
                  }
                </div>
              </div>
            </div>
          </label>
          
          {/* Mostrar resumen actual si hay empleados */}
          {resumen && showPackageContent && (
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <div className="flex items-center mb-2">
                <Package size={16} className="mr-2 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Resumen del Contenido:</span>
              </div>
              <div className="text-sm text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <strong>Empleados:</strong> {empleados.length}
                  </div>
                  <div>
                    <strong>Playeras Seguridad:</strong> {resumen.playerasSeguridad}
                  </div>
                  {numCajas > 1 && (
                    <div>
                      <strong>Cajas requeridas:</strong> {numCajas}
                    </div>
                  )}
                </div>
                {Object.keys(resumen.tallasSeguridad).length > 0 && (
                  <div className="mt-2">
                    <strong>Tallas:</strong> {
                      Object.entries(resumen.tallasSeguridad)
                        .map(([talla, cantidad]) => `${talla}:${cantidad}`)
                        .join(', ')
                    }
                  </div>
                )}
                {numCajas > 1 && (
                  <div className="mt-2 text-xs text-blue-600">
                    Formato: {Math.ceil(numCajas / 4)} página(s) con hasta 4 etiquetas por hoja
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nombre de la Sucursal */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Sucursal</label>
        {editingField === 'nombre' ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editValues.nombre}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditValues(prev => ({ ...prev, nombre: newValue }));
              }}
              className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa el nombre de la sucursal"
            />
            <button
              onClick={() => handleSaveField('nombre')}
              className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <span className="text-gray-800 font-medium">
              {sucursal.nombre || 'Sin nombre especificado'}
            </span>
            <button
              onClick={() => handleFieldEdit('nombre')}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            >
              <Edit size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Dirección */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
        {editingField === 'direccion' ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editValues.direccion}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditValues(prev => ({ ...prev, direccion: newValue }));
              }}
              className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa la dirección de la sucursal"
            />
            <button
              onClick={() => handleSaveField('direccion')}
              className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <span className="text-gray-800">
              {sucursal.direccion || 'No especificada'}
            </span>
            <button
              onClick={() => handleFieldEdit('direccion')}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            >
              <Edit size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Teléfono */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
        {editingField === 'telefono' ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editValues.telefono}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditValues(prev => ({ ...prev, telefono: newValue }));
              }}
              className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa el teléfono de la sucursal"
            />
            <button
              onClick={() => handleSaveField('telefono')}
              className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <span className="text-gray-800">
              {sucursal.telefono || 'No especificado'}
            </span>
            <button
              onClick={() => handleFieldEdit('telefono')}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            >
              <Edit size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Estado de empaquetado */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Empaquetado</label>
        {editingField === 'is_empaquetado' ? (
          <div className="flex items-center space-x-2">
            <select
              value={editValues.is_empaquetado.toString()}
              onChange={(e) => {
                const newValue = e.target.value === 'true';
                setEditValues(prev => ({ ...prev, is_empaquetado: newValue }));
              }}
              className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="false">Pendiente</option>
              <option value="true">Empaquetado</option>
            </select>
            <button
              onClick={() => handleSaveField('is_empaquetado')}
              className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <span className={`px-3 py-1 text-sm rounded-full ${
              sucursal.is_empaquetado 
                ? 'bg-green-100 text-green-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              {sucursal.is_empaquetado ? 'Empaquetado' : 'Pendiente'}
            </span>
            <button
              onClick={() => handleFieldEdit('is_empaquetado')}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            >
              <Edit size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Número de seguimiento */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Número de Seguimiento</label>
        {editingField === 'numero_seguimiento' ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editValues.numero_seguimiento}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditValues(prev => ({ ...prev, numero_seguimiento: newValue }));
              }}
              className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa el número de seguimiento"
            />
            <button
              onClick={() => handleSaveField('numero_seguimiento')}
              className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <span className="text-gray-800 font-mono">
              {sucursal.numero_seguimiento || 'No asignado'}
            </span>
            <button
              onClick={() => handleFieldEdit('numero_seguimiento')}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            >
              <Edit size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SucursalInfoCard;