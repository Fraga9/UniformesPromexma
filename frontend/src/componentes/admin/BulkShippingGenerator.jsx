// src/components/admin/BulkShippingGenerator.jsx
import React, { useState } from 'react';
import { 
  Download, 
  Truck, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Building,
  Package,
  Eye,
  EyeOff
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const BulkShippingGenerator = ({ sucursales, empleadosPorSucursal = {}, onSuccess, onError }) => {
  const [generating, setGenerating] = useState(false);
  const [selectedSucursales, setSelectedSucursales] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    includeAll: true,
    onlyPending: false,
    onlyPackaged: false
  });
  const [showPackageContent, setShowPackageContent] = useState(true);

  // Función para calcular el resumen de tallas de una sucursal (SOLO PLAYERAS DE SEGURIDAD)
  const calcularResumenTallas = (empleados) => {
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

  // Filtrar sucursales según las opciones seleccionadas
  const getFilteredSucursales = () => {
    if (filterOptions.includeAll) {
      return sucursales;
    }
    
    return sucursales.filter(sucursal => {
      if (filterOptions.onlyPending) {
        return !sucursal.is_empaquetado;
      }
      if (filterOptions.onlyPackaged) {
        return sucursal.is_empaquetado;
      }
      return selectedSucursales.includes(sucursal.id);
    });
  };

  const generateBulkShippingLabels = async () => {
    try {
      setGenerating(true);
      
      const sucursalesToProcess = getFilteredSucursales();
      
      if (sucursalesToProcess.length === 0) {
        onError('No hay sucursales seleccionadas para generar etiquetas');
        return;
      }
      
      // Calcular el número total de etiquetas considerando múltiples cajas
      let totalEtiquetasGeneradas = 0;

      // Crear documento PDF
      const doc = new jsPDF();
      
      // Configuración de etiquetas por página (4 etiquetas: 2x2)
      const labelsPerRow = 2;
      const labelsPerColumn = 2;
      const labelsPerPage = labelsPerRow * labelsPerColumn;
      
      // Dimensiones de las etiquetas
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const labelWidth = pageWidth / labelsPerRow;
      const labelHeight = pageHeight / labelsPerColumn;
      
      let currentPage = 0;
      let labelCount = 0;

      // Procesar cada sucursal y determinar cuántas cajas necesita
      sucursalesToProcess.forEach((sucursal, index) => {
        // Obtener empleados de la sucursal
        const empleados = empleadosPorSucursal?.[sucursal.id] || [];
        const resumen = calcularResumenTallas(empleados);
        
        // Calcular número de cajas necesarias (12 playeras por caja)
        const PLAYERAS_POR_CAJA = 12;
        const numCajas = Math.ceil(resumen.playerasSeguridad / PLAYERAS_POR_CAJA) || 1;
        
        // Generar una etiqueta por cada caja
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
          const cajaInfo = {
            numeroActual: cajaNum,
            totalCajas: numCajas,
            playerasEnEstaCaja: cajaNum < numCajas ? PLAYERAS_POR_CAJA : (resumen.playerasSeguridad - (numCajas - 1) * PLAYERAS_POR_CAJA)
          };
          
          // Generar etiqueta individual
          generateSingleLabel(doc, sucursal, empleados, xOffset, yOffset, labelWidth, labelHeight, cajaInfo);
          
          labelCount++;
          totalEtiquetasGeneradas++;
        }
      });

      // Descargar el PDF
      const fileName = `etiquetas_envio_masivo_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      onSuccess(`Generadas ${totalEtiquetasGeneradas} etiquetas de envío para ${sucursalesToProcess.length} sucursales`);

    } catch (error) {
      console.error('Error generando etiquetas masivas:', error);
      onError('Error al generar las etiquetas masivas: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateSingleLabel = (doc, sucursal, empleados = [], xOffset = 0, yOffset = 0, labelWidth = 105, labelHeight = 148.5, cajaInfo = null) => {
    // Configurar fuente
    doc.setFont('helvetica');
    
    const baseX = xOffset;
    const baseY = yOffset;
    const margin = 2;
    const leftMargin = baseX + 5;
    const rightMargin = baseX + labelWidth - 5;
    const availableWidth = labelWidth - 10;

    // Encabezado con título
    let currentY = baseY + 10;
    
    // Título principal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ETIQUETA DE ENVÍO', baseX + labelWidth/2, currentY, { align: 'center' });
    currentY += 8;
    
    // Indicador de caja (si hay múltiples cajas) - Posicionado debajo del título
    if (cajaInfo && cajaInfo.totalCajas > 1) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Solo texto negro
      doc.text(`CAJA ${cajaInfo.numeroActual}/${cajaInfo.totalCajas}`, baseX + labelWidth/2, currentY + 3, { align: 'center' });
      currentY += 10;
    }
    
    // Línea separadora principal
    doc.setLineWidth(0.8);
    doc.line(leftMargin, currentY, rightMargin, currentY);
    currentY += 6;
    
    // SECCIÓN DESTINATARIO
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATARIO:', leftMargin, currentY);
    currentY += 5;
    
    // Nombre de la sucursal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const nombreSucursal = sucursal.nombre || 'Sucursal';
    doc.text(nombreSucursal, leftMargin, currentY);
    currentY += 5;
    
    // Manager
    if (sucursal.manager) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(sucursal.manager, leftMargin, currentY);
      currentY += 5;
    }
    
    // Dirección del destinatario (más compacta)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const direccionDestinatario = sucursal.direccion || 'Dirección no especificada';
    const direccionLines = doc.splitTextToSize(direccionDestinatario, availableWidth);
    
    // Limitar a máximo 3 líneas para la dirección
    const maxDireccionLines = Math.min(direccionLines.length, 3);
    for (let i = 0; i < maxDireccionLines; i++) {
      doc.text(direccionLines[i], leftMargin, currentY);
      currentY += 5;
    }
    
    // Teléfono del destinatario
    if (sucursal.telefono) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Tel: ${sucursal.telefono}`, leftMargin, currentY);
      currentY += 6;
    }
    
    // Línea divisoria
    doc.setLineWidth(0.5);
    doc.line(leftMargin, currentY, rightMargin, currentY);
    currentY += 5;
    
    // SECCIÓN REMITENTE (más compacta)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REMITENTE:', leftMargin, currentY);
    currentY += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Rodrigo Isai Reyna R.', leftMargin, currentY);
    currentY += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Constitución 444 pte Col Centro, Monterrey, NL', leftMargin, currentY);
    currentY += 4;
    doc.text('CP 64000  Tel: 8126220306', leftMargin, currentY);
    currentY += 8;
    
    // SECCIÓN CONTENIDO (si está habilitada y hay espacio)
    if (showPackageContent && empleados && empleados.length > 0) {
      const resumen = calcularResumenTallas(empleados);
      
      // Verificar si hay espacio suficiente (reservar al menos 20mm para el final)
      const espacioRestante = (baseY + labelHeight - 20) - currentY;
      
      if (espacioRestante > 25) { // Solo mostrar si hay espacio suficiente
        // Línea divisoria
        doc.setLineWidth(0.5);
        doc.line(leftMargin, currentY, rightMargin, currentY);
        currentY += 5;
        
        // Título del contenido
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('CONTENIDO:', leftMargin, currentY);
        currentY += 7;
        
        // Información básica con fuente más grande
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        
        const infoText = [`Empleados: ${empleados.length}`];
        
        // Mostrar playeras según la caja
        if (cajaInfo && cajaInfo.totalCajas > 1) {
          infoText.push(`Playeras: ${cajaInfo.playerasEnEstaCaja}`);
          infoText.push(`(Total: ${resumen.playerasSeguridad})`);
        } else if (resumen.playerasSeguridad > 0) {
          infoText.push(`Playeras: ${resumen.playerasSeguridad}`);
        }
        
        doc.text(infoText.join(' • '), leftMargin, currentY);
        currentY += 7;
        
        // Tallas - Formato tabular profesional
        if (Object.keys(resumen.tallasSeguridad).length > 0 && (!cajaInfo || cajaInfo.numeroActual === 1)) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('TALLAS:', leftMargin, currentY);
          currentY += 8;
          
          const tallasEntries = Object.entries(resumen.tallasSeguridad);
          
          // Crear formato de tabla/grid para las tallas
          const columnWidth = 20; // Ancho de cada columna
          const startX = leftMargin + 5;
          let currentX = startX;
          let rowCount = 0;
          const maxColumns = Math.floor(availableWidth / columnWidth) - 1; // Máximo 4 columnas
          
          // Dibujar marco de tallas
          const tallasBoxStartY = currentY - 4;
          doc.setLineWidth(0.3);
          doc.setFillColor(248, 248, 248); // Fondo gris muy claro
          doc.rect(leftMargin + 2, tallasBoxStartY, availableWidth - 4, 14, 'FD');
          
          tallasEntries.forEach(([talla, cantidad], index) => {
            // Si llegamos al límite de columnas, pasar a la siguiente fila
            if (index > 0 && index % maxColumns === 0) {
              currentY += 6;
              currentX = startX;
              rowCount++;
              
              // Máximo 2 filas para mantener el diseño compacto
              if (rowCount >= 2) return;
            }
            
            // Dibujar talla y cantidad con mejor formato
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(talla, currentX, currentY);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text(`(${cantidad})`, currentX + 8, currentY);
            
            currentX += columnWidth;
          });
          
          currentY += 8; // Espacio después de las tallas
        }
      }
    }
    
    // Número de seguimiento (si existe) - Posición fija en la parte inferior
    if (sucursal.numero_seguimiento) {
      const trackingY = baseY + labelHeight - 12;
      
      // Línea superior al número de seguimiento
      doc.setLineWidth(0.5);
      doc.line(leftMargin, trackingY - 4, rightMargin, trackingY - 4);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`SEGUIMIENTO: ${sucursal.numero_seguimiento}`, baseX + labelWidth/2, trackingY, { align: 'center' });
    }
    
    // Borde exterior de la etiqueta
    doc.setLineWidth(1);
    doc.rect(baseX + margin, baseY + margin, labelWidth - (2 * margin), labelHeight - (2 * margin));
  };

  const handleFilterChange = (filterType) => {
    setFilterOptions(prev => ({
      includeAll: filterType === 'all',
      onlyPending: filterType === 'pending',
      onlyPackaged: filterType === 'packaged'
    }));
  };

  const sucursalesToProcess = getFilteredSucursales();
  
  // Calcular el número total de etiquetas considerando múltiples cajas
  const calcularTotalEtiquetas = () => {
    let total = 0;
    sucursalesToProcess.forEach(sucursal => {
      const empleados = empleadosPorSucursal?.[sucursal.id] || [];
      const resumen = calcularResumenTallas(empleados);
      const numCajas = Math.ceil(resumen.playerasSeguridad / 12) || 1;
      total += numCajas;
    });
    return total;
  };
  
  const totalEtiquetas = calcularTotalEtiquetas();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FileText size={20} className="mr-2 text-blue-600" />
          Generador Masivo de Etiquetas
        </h2>
        <div className="flex items-center text-sm text-gray-500">
          <Building size={16} className="mr-1" />
          {sucursales.length} sucursales totales
        </div>
      </div>

      {/* Opciones de filtrado */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros de Sucursales:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="filter"
              checked={filterOptions.includeAll}
              onChange={() => handleFilterChange('all')}
              className="text-blue-600"
            />
            <div className="flex-grow">
              <div className="text-sm font-medium text-gray-800">Todas las sucursales</div>
              <div className="text-xs text-gray-500">{sucursales.length} sucursales</div>
            </div>
          </label>
          
          <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="filter"
              checked={filterOptions.onlyPending}
              onChange={() => handleFilterChange('pending')}
              className="text-amber-600"
            />
            <div className="flex-grow">
              <div className="text-sm font-medium text-gray-800">Solo pendientes</div>
              <div className="text-xs text-gray-500">
                {sucursales.filter(s => !s.is_empaquetado).length} sucursales
              </div>
            </div>
          </label>
          
          <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="filter"
              checked={filterOptions.onlyPackaged}
              onChange={() => handleFilterChange('packaged')}
              className="text-green-600"
            />
            <div className="flex-grow">
              <div className="text-sm font-medium text-gray-800">Solo empaquetadas</div>
              <div className="text-xs text-gray-500">
                {sucursales.filter(s => s.is_empaquetado).length} sucursales
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Nueva opción: Mostrar contenido del paquete */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Opciones de Contenido:</h3>
        <div className="p-4 border rounded-lg bg-gray-50">
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
                    ? 'Se mostrará el número de empleados y playeras de seguridad por talla'
                    : 'Solo se mostrará información básica de envío'
                  }
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Resumen de selección */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Package size={20} className="mr-2 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-blue-800">
                Se generarán {totalEtiquetas} etiquetas {totalEtiquetas !== sucursalesToProcess.length && `(${sucursalesToProcess.length} sucursales)`}
              </div>
              <div className="text-xs text-blue-600">
                Formato: {Math.ceil(totalEtiquetas / 4)} página(s) con 4 etiquetas por hoja
                {showPackageContent && ' • Incluye contenido de playeras de seguridad'}
              </div>
            </div>
          </div>
          
          <button
            onClick={generateBulkShippingLabels}
            disabled={generating || sucursalesToProcess.length === 0}
            className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${
              generating || sucursalesToProcess.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando...
              </>
            ) : (
              <>
                <Truck size={16} className="mr-2" />
                <Download size={16} className="mr-1" />
                Generar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de sucursales que se procesarán */}
      {sucursalesToProcess.length > 0 && sucursalesToProcess.length <= 10 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Sucursales que se incluirán:
          </h4>
          <div className="max-h-40 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sucursalesToProcess.map(sucursal => {
                const empleados = empleadosPorSucursal?.[sucursal.id] || [];
                const resumen = calcularResumenTallas(empleados);
                const numCajas = Math.ceil(resumen.playerasSeguridad / 12) || 1;
                
                return (
                  <div key={sucursal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{sucursal.nombre}</span>
                      {numCajas > 1 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {numCajas} cajas
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      sucursal.is_empaquetado 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {sucursal.is_empaquetado ? 'Empaquetado' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {sucursalesToProcess.length > 10 && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <div className="flex items-center">
            <AlertTriangle size={16} className="mr-2 text-blue-500" />
            <span>
              Se generarán {totalEtiquetas} etiquetas en formato optimizado (4 por página).
              {totalEtiquetas !== sucursalesToProcess.length && ` Algunas sucursales requieren múltiples cajas (más de 12 playeras).`}
              {showPackageContent && ' Incluirá información detallada de playeras de seguridad.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkShippingGenerator;