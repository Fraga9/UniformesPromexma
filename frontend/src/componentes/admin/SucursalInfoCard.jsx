// src/components/admin/SucursalInfoCard.jsx
import React, { useState } from 'react';
import {
  Building,
  Edit,
  Save,
  X,
  Truck,
  Download
} from 'lucide-react';
import { updateSucursal } from '../../api';
import { jsPDF } from 'jspdf';

const SucursalInfoCard = ({ sucursal, empleados = [], onSucursalUpdate, onError, onSuccess }) => {
  // Estados para edición
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({
    direccion: sucursal?.direccion || '',
    telefono: sucursal?.telefono || '',
    is_empaquetado: sucursal?.is_empaquetado || false,
    numero_seguimiento: sucursal?.numero_seguimiento || ''
  });

  // Actualizar editValues cuando cambie la sucursal
  React.useEffect(() => {
    if (sucursal) {
      setEditValues({
        direccion: sucursal.direccion || '',
        telefono: sucursal.telefono || '',
        is_empaquetado: sucursal.is_empaquetado || false,
        numero_seguimiento: sucursal.numero_seguimiento || ''
      });
    }
  }, [sucursal]);

  // Función para calcular el resumen de tallas
  const calcularResumenTallas = () => {
    const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const emptyLabel = 'Por definir';
    
    let playerasSeguridad = 0;
    let polosConstrurama = 0;
    let camisasMezclilla = 0;
    
    const tallasSeguridad = {};
    const tallasAdministrativas = {};

    empleados.forEach(emp => {
      if (emp.requiere_playera_administrativa) {
        if (emp.talla && emp.talla !== emptyLabel) {
          playerasSeguridad += 1;
          tallasSeguridad[emp.talla] = (tallasSeguridad[emp.talla] || 0) + 1;
        }
        if (emp.talla_administrativa && emp.talla_administrativa !== emptyLabel) {
          polosConstrurama += 2;
          camisasMezclilla += 1;
          tallasAdministrativas[emp.talla_administrativa] = (tallasAdministrativas[emp.talla_administrativa] || 0) + 3;
        }
      } else {
        if (emp.talla && emp.talla !== emptyLabel) {
          playerasSeguridad += 3;
          tallasSeguridad[emp.talla] = (tallasSeguridad[emp.talla] || 0) + 3;
        }
      }
    });

    return {
      playerasSeguridad,
      polosConstrurama,
      camisasMezclilla,
      tallasSeguridad,
      tallasAdministrativas
    };
  };

  const handleSaveField = async (field) => {
    try {
      onError('');

      // Preparar los datos para enviar
      const updateData = {};
      
      // Mapear los nombres de campos correctamente
      if (field === 'is_empaquetado') {
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
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      is_empaquetado: sucursal.is_empaquetado || false,
      numero_seguimiento: sucursal.numero_seguimiento || ''
    });
  };

  const handleFieldEdit = (field) => {
    setEditingField(field);
  };

  const generateShippingLabel = () => {
    try {
      // Crear un nuevo documento PDF
      const doc = new jsPDF();
      
      // Configurar fuente más atractiva
      doc.setFont('times');
      
      // Título
      doc.setFontSize(18);
      doc.setFont('times', 'bold');
      doc.text('ETIQUETA DE ENVÍO', 105, 15, { align: 'center' });
      
      // Línea separadora superior
      doc.setLineWidth(0.8);
      doc.line(15, 20, 195, 20);
      
      // Información del destinatario
      let yPos = 30;
      doc.setFontSize(13);
      doc.setFont('times', 'bold');
      doc.text('DESTINATARIO', 20, yPos);
      
      yPos += 8;
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      
      // Nombre de la sucursal
      doc.text(sucursal.nombre || 'Sucursal', 20, yPos);
      yPos += 6;
      
      // Manager de la sucursal
      if (sucursal.manager) {
        doc.setFont('times', 'italic');
        doc.setFontSize(10);
        doc.text(`${sucursal.manager}`, 20, yPos);
        yPos += 6;
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
      }
      
      // Dirección del destinatario
      const direccionDestinatario = sucursal.direccion || 'Dirección no especificada';
      const maxWidth = 170;
      const direccionLines = doc.splitTextToSize(direccionDestinatario, maxWidth);
      
      direccionLines.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
      
      // Teléfono del destinatario
      doc.text(sucursal.telefono || 'Teléfono no especificado', 20, yPos + 2);
      yPos += 12;
      
      // Línea separadora central
      doc.setLineWidth(0.5);
      doc.line(15, yPos, 195, yPos);
      yPos += 10;
      
      // Información del remitente
      doc.setFontSize(13);
      doc.setFont('times', 'bold');
      doc.text('REMITENTE', 20, yPos);
      yPos += 8;
      
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text('Rodrigo Isai Reyna Ramirez', 20, yPos);
      yPos += 6;
      
      const direccionRemitente = 'Constitución 444 pte Col Centro, Monterrey, Nuevo León, CP 64000';
      const remitenteLines = doc.splitTextToSize(direccionRemitente, maxWidth);
      
      remitenteLines.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
      
      doc.text('8126220306', 20, yPos + 2);
      yPos += 15;
      
      // NUEVA SECCIÓN: Resumen de Tallas
      if (empleados && empleados.length > 0) {
        const resumen = calcularResumenTallas();
        
        // Línea separadora
        doc.setLineWidth(0.5);
        doc.line(15, yPos, 195, yPos);
        yPos += 8;
        
        // Título del resumen
        doc.setFontSize(13);
        doc.setFont('times', 'bold');
        doc.text('CONTENIDO DEL PEDIDO', 20, yPos);
        yPos += 8;
        
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        
        // Resumen total
        doc.setFont('times', 'bold');
        doc.text(`Empleados: ${empleados.length}`, 20, yPos);
        yPos += 5;
        
        if (resumen.playerasSeguridad > 0) {
          doc.text(`Playeras Seguridad: ${resumen.playerasSeguridad}`, 20, yPos);
          yPos += 4;
        }
        
        if (resumen.polosConstrurama > 0) {
          doc.text(`Polos Construrama: ${resumen.polosConstrurama}`, 20, yPos);
          yPos += 4;
        }
        
        if (resumen.camisasMezclilla > 0) {
          doc.text(`Camisas Mezclilla: ${resumen.camisasMezclilla}`, 20, yPos);
          yPos += 4;
        }
        
        yPos += 3;
        
        // Desglose por tallas - Seguridad
        if (Object.keys(resumen.tallasSeguridad).length > 0) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.text('Tallas Seguridad:', 20, yPos);
          yPos += 4;
          
          doc.setFont('times', 'normal');
          const tallasSegText = Object.entries(resumen.tallasSeguridad)
            .map(([talla, cantidad]) => `${talla}: ${cantidad}`)
            .join(', ');
          
          const tallasSegLines = doc.splitTextToSize(tallasSegText, maxWidth);
          tallasSegLines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += 3.5;
          });
          yPos += 2;
        }
        
        // Desglose por tallas - Administrativas
        if (Object.keys(resumen.tallasAdministrativas).length > 0) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.text('Tallas Admin:', 20, yPos);
          yPos += 4;
          
          doc.setFont('times', 'normal');
          const tallasAdminText = Object.entries(resumen.tallasAdministrativas)
            .map(([talla, cantidad]) => `${talla}: ${cantidad}`)
            .join(', ');
          
          const tallasAdminLines = doc.splitTextToSize(tallasAdminText, maxWidth);
          tallasAdminLines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += 3.5;
          });
        }
      }
      
      // Línea separadora inferior
      yPos += 5;
      doc.setLineWidth(0.5);
      doc.line(15, yPos, 195, yPos);
      yPos += 8;
      
      if (sucursal.numero_seguimiento) {
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text(`N° Seguimiento: ${sucursal.numero_seguimiento}`, 20, yPos);
      }
      
      // Descargar el PDF
      const fileName = `etiqueta_envio_${sucursal.nombre?.replace(/\s+/g, '_') || 'sucursal'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      onSuccess('Etiqueta de envío generada correctamente');
      
    } catch (error) {
      console.error('Error generando etiqueta:', error);
      onError('Error al generar la etiqueta de envío: ' + error.message);
    }
  };

  if (!sucursal) {
    return null;
  }

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
          Generar Etiqueta
        </button>
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