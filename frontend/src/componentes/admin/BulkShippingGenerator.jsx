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

      // Crear documento PDF
      const doc = new jsPDF();
      
      // Configuración de etiquetas por página
      const labelsPerRow = 2;
      const labelsPerColumn = 4;
      const labelsPerPage = labelsPerRow * labelsPerColumn;
      
      // Dimensiones de las etiquetas
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const labelWidth = pageWidth / labelsPerRow;
      const labelHeight = pageHeight / labelsPerColumn;
      
      let currentPage = 0;
      let labelCount = 0;

      sucursalesToProcess.forEach((sucursal, index) => {
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
        
        // Obtener empleados de la sucursal
        const empleados = empleadosPorSucursal?.[sucursal.id] || [];
        
        // Generar etiqueta individual
        generateSingleLabel(doc, sucursal, empleados, xOffset, yOffset, labelWidth, labelHeight);
        
        labelCount++;
      });

      // Descargar el PDF
      const fileName = `etiquetas_envio_masivo_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      onSuccess(`Generadas ${sucursalesToProcess.length} etiquetas de envío correctamente`);

    } catch (error) {
      console.error('Error generando etiquetas masivas:', error);
      onError('Error al generar las etiquetas masivas: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateSingleLabel = (doc, sucursal, empleados = [], xOffset = 0, yOffset = 0, labelWidth = 105, labelHeight = 74.25) => {
    // Configurar fuente
    doc.setFont('helvetica');
    
    const baseX = xOffset;
    const baseY = yOffset;
    const margin = 2;
    const leftMargin = baseX + 5;
    const rightMargin = baseX + labelWidth - 5;
    const availableWidth = labelWidth - 10;

    // Título principal más grande
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ETIQUETA DE ENVÍO', baseX + labelWidth/2, baseY + 8, { align: 'center' });
    
    // Línea separadora superior más gruesa
    doc.setLineWidth(0.5);
    doc.line(baseX + 5, baseY + 10, baseX + labelWidth - 5, baseY + 10);
    
    // Layout en dos columnas
    const leftColumnWidth = availableWidth * 0.55;
    const rightColumnWidth = availableWidth * 0.45;
    const rightColumnX = leftMargin + leftColumnWidth + 3;
    
    let leftY = baseY + 15;
    let rightY = baseY + 15;
    
    // COLUMNA IZQUIERDA - DESTINATARIO
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATARIO', leftMargin, leftY);
    leftY += 4;
    
    // Nombre de la sucursal más grande
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const nombreSucursal = sucursal.nombre || 'Sucursal';
    doc.text(nombreSucursal, leftMargin, leftY);
    leftY += 4;
    
    // Manager
    if (sucursal.manager) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(sucursal.manager, leftMargin, leftY);
      leftY += 3.5;
    }
    
    // Dirección del destinatario
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const direccionDestinatario = sucursal.direccion || 'Dirección no especificada';
    const direccionLines = doc.splitTextToSize(direccionDestinatario, leftColumnWidth);
    
    direccionLines.forEach(line => {
      doc.text(line, leftMargin, leftY);
      leftY += 2.5;
    });
    
    // Teléfono del destinatario
    if (sucursal.telefono) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`Tel: ${sucursal.telefono}`, leftMargin, leftY);
      leftY += 4;
    }
    
    // COLUMNA DERECHA - REMITENTE
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('REMITENTE', rightColumnX, rightY);
    rightY += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Rodrigo Isai Reyna R.', rightColumnX, rightY);
    rightY += 3.5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const direccionRemitente = 'Constitución 444 pte Col Centro, Monterrey, NL, CP 64000';
    const remitenteLines = doc.splitTextToSize(direccionRemitente, rightColumnWidth);
    
    remitenteLines.forEach(line => {
      doc.text(line, rightColumnX, rightY);
      rightY += 2.5;
    });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Tel: 8126220306', rightColumnX, rightY);
    rightY += 4;
    
    // Línea divisoria vertical entre columnas
    doc.setLineWidth(0.3);
    doc.line(rightColumnX - 2, baseY + 12, rightColumnX - 2, Math.max(leftY, rightY) + 2);
    
 

    // SECCIÓN INFERIOR - CONTENIDO (si está habilitada y hay empleados)
    let bottomY = Math.max(leftY, rightY) + 3;
    
    if (showPackageContent && empleados && empleados.length > 0) {
      const resumen = calcularResumenTallas(empleados);
      
      // Línea separadora horizontal
      doc.setLineWidth(0.5);
      doc.line(baseX + 5, bottomY, baseX + labelWidth - 5, bottomY);
      bottomY += 4;
      
      // Título del contenido
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTENIDO DEL PAQUETE', leftMargin, bottomY);
      bottomY += 4;
      
      // Layout en dos columnas para el contenido
      const contentLeftWidth = availableWidth * 0.4;
      const contentRightX = leftMargin + contentLeftWidth + 5;
      
      // Información básica (izquierda)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Empleados: ${empleados.length}`, leftMargin, bottomY);
      
      if (resumen.playerasSeguridad > 0) {
        doc.text(`Playeras: ${resumen.playerasSeguridad}`, leftMargin, bottomY + 3.5);
      }
      
      // Tallas (derecha)
      if (Object.keys(resumen.tallasSeguridad).length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('TALLAS:', contentRightX, bottomY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        const tallasEntries = Object.entries(resumen.tallasSeguridad);
        const tallasPerLine = 4;
        
        for (let i = 0; i < tallasEntries.length; i += tallasPerLine) {
          const lineEntries = tallasEntries.slice(i, i + tallasPerLine);
          const tallasText = lineEntries
            .map(([talla, cantidad]) => `${talla}: ${cantidad}`)
            .join('  ');
          
          doc.text(tallasText, contentRightX, bottomY + 3 + (Math.floor(i / tallasPerLine) * 2.5));
        }
      }
      
      bottomY += 8;
    }
    
    // Número de seguimiento (si existe) - Posición fija en la parte inferior
    if (sucursal.numero_seguimiento) {
      const trackingY = baseY + labelHeight - 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`N° SEGUIMIENTO: ${sucursal.numero_seguimiento}`, baseX + labelWidth/2, trackingY, { align: 'center' });
      
      // Línea superior al número de seguimiento
      doc.setLineWidth(0.3);
      doc.line(baseX + 5, trackingY - 3, baseX + labelWidth - 5, trackingY - 3);
    }
    
    // Borde exterior de la etiqueta más grueso
    doc.setLineWidth(0.8);
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
                Se generarán {sucursalesToProcess.length} etiquetas
              </div>
              <div className="text-xs text-blue-600">
                Formato: {Math.ceil(sucursalesToProcess.length / 8)} página(s) con 8 etiquetas por hoja
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
              {sucursalesToProcess.map(sucursal => (
                <div key={sucursal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">{sucursal.nombre}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sucursal.is_empaquetado 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {sucursal.is_empaquetado ? 'Empaquetado' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {sucursalesToProcess.length > 10 && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <div className="flex items-center">
            <AlertTriangle size={16} className="mr-2 text-blue-500" />
            <span>
              Se generarán {sucursalesToProcess.length} etiquetas en formato optimizado (4 por página).
              {showPackageContent && ' Incluirá información detallada de playeras de seguridad.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkShippingGenerator;