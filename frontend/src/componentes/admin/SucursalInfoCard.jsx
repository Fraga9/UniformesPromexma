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

const SucursalInfoCard = ({ sucursal, onSucursalUpdate, onError, onSuccess }) => {
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

  const handleSaveField = async (field) => {
    try {
      onError('');
      console.log('DEBUG: Guardando campo:', field);
      console.log('DEBUG: Valor actual en editValues:', editValues[field]);
      console.log('DEBUG: Estado actual de sucursal:', sucursal);

      // Preparar los datos para enviar
      const updateData = {};
      
      // Mapear los nombres de campos correctamente
      if (field === 'is_empaquetado') {
        updateData.is_empaquetado = editValues.is_empaquetado;
        console.log('DEBUG: Actualizando is_empaquetado a:', updateData.is_empaquetado);
      } else if (field === 'numero_seguimiento') {
        updateData.numero_seguimiento = editValues.numero_seguimiento;
        console.log('DEBUG: Actualizando numero_seguimiento a:', updateData.numero_seguimiento);
      } else if (field === 'direccion') {
        updateData.direccion = editValues.direccion;
        console.log('DEBUG: Actualizando direccion a:', updateData.direccion);
      } else if (field === 'telefono') {
        updateData.telefono = editValues.telefono;
        console.log('DEBUG: Actualizando telefono a:', updateData.telefono);
      }

      console.log('DEBUG: Datos enviados a API:', updateData);

      // Llamar a la API
      const sucursalActualizada = await updateSucursal(sucursal.id, updateData);
      console.log('DEBUG: Sucursal actualizada recibida:', sucursalActualizada);

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
      console.error('DEBUG: Error al actualizar:', err);
      onError('Error al actualizar: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    console.log('DEBUG: Cancelando edición, restaurando valores originales');
    setEditingField(null);
    setEditValues({
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      is_empaquetado: sucursal.is_empaquetado || false,
      numero_seguimiento: sucursal.numero_seguimiento || ''
    });
  };

  const handleFieldEdit = (field) => {
    console.log('DEBUG: Iniciando edición del campo:', field);
    console.log('DEBUG: Valor actual del campo en sucursal:', sucursal[field]);
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
      
      // Línea separadora inferior
      doc.line(15, yPos, 195, yPos);
      yPos += 8;
      
      if (sucursal.numero_seguimiento) {
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text(`N° Seguimiento: ${sucursal.numero_seguimiento}`, 20, yPos + 6);
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
                console.log('DEBUG: Cambio en direccion:', newValue);
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
                console.log('DEBUG: Cambio en telefono:', newValue);
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
                console.log('DEBUG: Cambio en is_empaquetado:', newValue);
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
                console.log('DEBUG: Cambio en numero_seguimiento:', newValue);
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