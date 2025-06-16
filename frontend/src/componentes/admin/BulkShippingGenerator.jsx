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
    doc.setFont('times');
    
    const baseX = xOffset;
    const baseY = yOffset;
    const innerMargin = 3;
    const contentStartX = baseX + 8;
    const contentWidth = labelWidth - 16;

    // Título
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.text('ETIQUETA DE ENVÍO', baseX + labelWidth/2, baseY + 7, { align: 'center' });
    
    // Línea separadora superior
    doc.setLineWidth(0.2);
    doc.line(baseX + innerMargin + 2, baseY + 9, baseX + labelWidth - innerMargin - 2, baseY + 9);
    
    // Información del destinatario
    let yPos = baseY + 12;
    doc.setFontSize(7);
    doc.setFont('times', 'bold');
    doc.text('DESTINATARIO', contentStartX, yPos);
    
    yPos += 3;
    doc.setFont('times', 'normal');
    doc.setFontSize(6);
    
    // Nombre de la sucursal
    doc.text(sucursal.nombre || 'Sucursal', contentStartX, yPos);
    yPos += 2.5;
    
    // Manager de la sucursal
    if (sucursal.manager) {
      doc.text(sucursal.manager, contentStartX, yPos);
      yPos += 2.5;
    }
    
    // Dirección del destinatario
    const direccionDestinatario = sucursal.direccion || 'Dirección no especificada';
    const direccionLines = doc.splitTextToSize(direccionDestinatario, contentWidth);
    
    direccionLines.forEach(line => {
      doc.text(line, contentStartX, yPos);
      yPos += 2;
    });
    
    // Teléfono del destinatario
    doc.text(sucursal.telefono || 'Teléfono no especificado', contentStartX, yPos);
    yPos += 3.5;
    
    // Línea separadora central
    doc.setLineWidth(0.15);
    doc.line(baseX + innerMargin + 2, yPos, baseX + labelWidth - innerMargin - 2, yPos);
    yPos += 2.5;
    
    // Información del remitente
    doc.setFontSize(7);
    doc.setFont('times', 'bold');
    doc.text('REMITENTE', contentStartX, yPos);
    yPos += 3;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(6);
    doc.text('Rodrigo Isai Reyna Ramirez', contentStartX, yPos);
    yPos += 2;
    
    const direccionRemitente = 'Constitución 444 pte Col Centro, Monterrey, NL, CP 64000';
    const remitenteLines = doc.splitTextToSize(direccionRemitente, contentWidth);
    
    remitenteLines.forEach(line => {
      doc.text(line, contentStartX, yPos);
      yPos += 2;
    });
    
    doc.text('8126220306', contentStartX, yPos);
    yPos += 3.5;
    
    // SECCIÓN CONDICIONAL: Resumen de Tallas (solo si está habilitada y hay empleados)
    if (showPackageContent && empleados && empleados.length > 0) {
      const resumen = calcularResumenTallas(empleados);
      
      // Línea separadora
      doc.setLineWidth(0.15);
      doc.line(baseX + innerMargin + 2, yPos, baseX + labelWidth - innerMargin - 2, yPos);
      yPos += 2.5;
      
      // Título del resumen
      doc.setFontSize(7);
      doc.setFont('times', 'bold');
      doc.text('CONTENIDO', contentStartX, yPos);
      yPos += 2.5;
      
      doc.setFont('times', 'normal');
      doc.setFontSize(6);
      
      // Resumen compacto - Solo playeras de seguridad
      doc.setFont('times', 'bold');
      doc.text(`Empleados: ${empleados.length}`, contentStartX, yPos);
      yPos += 2;
      
      if (resumen.playerasSeguridad > 0) {
        doc.text(`Playeras Seguridad: ${resumen.playerasSeguridad}`, contentStartX, yPos);
        yPos += 2;
      }
      
      // Tallas de seguridad
      if (Object.keys(resumen.tallasSeguridad).length > 0) {
        doc.setFont('times', 'normal');
        doc.setFontSize(5);
        const tallasSegText = Object.entries(resumen.tallasSeguridad)
          .map(([talla, cantidad]) => `${talla}:${cantidad}`)
          .join(' ');
        doc.text(`Tallas: ${tallasSegText}`, contentStartX, yPos);
        yPos += 1.8;
      }
    }
    
    // Número de seguimiento (si existe)
    if (sucursal.numero_seguimiento && yPos < (baseY + labelHeight - innerMargin - 5)) { 
      yPos += 1.5;
      doc.setFont('times', 'bold');
      doc.setFontSize(6);
      doc.text(`N°: ${sucursal.numero_seguimiento}`, contentStartX, yPos);
    }
    
    // Borde de la etiqueta
    doc.setLineWidth(0.3);
    doc.rect(baseX + innerMargin, baseY + innerMargin, labelWidth - (2 * innerMargin), labelHeight - (2 * innerMargin));
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