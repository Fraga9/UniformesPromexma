// src/components/common/TallasResumen.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Por definir'];
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const TallasResumen = ({ empleados, showChart = true }) => {
  // Contar las tallas
  const contarTallas = () => {
    const contador = {};
    TALLAS.forEach(talla => {
      contador[talla] = 0;
    });

    empleados.forEach(empleado => {
      if (contador[empleado.talla] !== undefined) {
        contador[empleado.talla] += 1;
      }
    });

    return TALLAS.map(talla => ({
      name: talla,
      value: contador[talla]
    }));
  };

  const datosTallas = contarTallas();
  const totalEmpleados = empleados.length;

  // Verificar si hay datos para mostrar
  const hayDatos = datosTallas.some(item => item.value > 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {datosTallas.map((item, index) => (
          <div 
            key={item.name} 
            className="p-3 text-center bg-gray-50 rounded-md border border-gray-200"
            style={{ borderLeftColor: COLORS[index], borderLeftWidth: '4px' }}
          >
            <div className="text-lg font-semibold">{item.name}</div>
            <div className="flex items-end justify-center gap-1">
              <span className="text-2xl font-bold text-blue-700">{item.value}</span>
              {totalEmpleados > 0 && (
                <span className="text-sm text-gray-500">
                  ({Math.round((item.value / totalEmpleados) * 100)}%)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showChart && hayDatos && (
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datosTallas.filter(item => item.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {datosTallas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {!hayDatos && (
        <div className="p-4 text-center bg-gray-50 rounded-md">
          <p className="text-gray-500">No hay datos de tallas disponibles</p>
        </div>
      )}
    </div>
  );
};

export default TallasResumen;