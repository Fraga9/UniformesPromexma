// src/components/common/TallasResumen.jsx
import React, { useMemo } from 'react';

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Por definir'];
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TallasResumen = ({ empleados, compact = false }) => {
  const emptyLabel = 'Por definir';

  const datosTallasSeguridadConteoPlayeras = useMemo(() => {
    const resultado = [];
    TALLAS.forEach(tallaValue => {
      let employeeCount = 0;
      let shirtCount = 0;
      empleados.forEach(emp => {
        if (emp.talla === tallaValue && emp.talla !== emptyLabel) {
          employeeCount++;
          if (emp.requiere_playera_administrativa) {
            shirtCount += 1;
          } else {
            shirtCount += 3;
          }
        }
      });
      if (employeeCount > 0) {
        resultado.push({
          name: tallaValue,
          employeeCount: employeeCount,
          value: shirtCount // value es el número total de playeras para esta talla
        });
      }
    });
    return resultado;
  }, [empleados, emptyLabel]);

  const datosTallasAdministrativasDetallado = useMemo(() => {
    const resultado = [];
    TALLAS.forEach(tallaValue => {
      let employeeCount = 0;
      empleados.forEach(emp => {
        if (
          emp.requiere_playera_administrativa &&
          emp.talla_administrativa === tallaValue &&
          emp.talla_administrativa !== emptyLabel
        ) {
          employeeCount++;
        }
      });

      if (employeeCount > 0) {
        resultado.push({
          name: tallaValue,
          employeeCount: employeeCount,
          value: employeeCount * 3 // value es total de items admin (2 polos + 1 camisa)
        });
      }
    });
    return resultado;
  }, [empleados, emptyLabel]);

  const calcularItemsNecesarios = () => {
    let playerasSeguridad = 0;
    let polosConstrurama = 0;
    let camisasMezclilla = 0;

    empleados.forEach(emp => {
      if (emp.requiere_playera_administrativa) {
        if (emp.talla && emp.talla !== emptyLabel) {
          playerasSeguridad += 1;
        }
        if (emp.talla_administrativa && emp.talla_administrativa !== emptyLabel) {
          polosConstrurama += 2;
          camisasMezclilla += 1;
        }
      } else {
        if (emp.talla && emp.talla !== emptyLabel) {
          playerasSeguridad += 3;
        }
      }
    });
    return { playerasSeguridad, polosConstrurama, camisasMezclilla };
  };

  const itemsNecesarios = useMemo(calcularItemsNecesarios, [empleados]);

  const renderResumenSeccion = (titulo, datosTallas, totalItemsGlobal, nombreItemSingular, nombreItemPlural, isAdmin = false) => {
    const hayDatos = datosTallas.some(item => item.employeeCount > 0);

    return (
      <div className={`${compact ? 'mb-4' : 'mb-6'} border border-gray-200 rounded-lg bg-white ${compact ? 'shadow' : 'shadow-sm'}`}>
        <div className={`${compact ? 'p-3' : 'p-4'}`}>
          <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-gray-700 ${compact ? 'mb-3' : 'mb-4'} flex items-center`}>
            {compact && (
              <div 
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: isAdmin ? '#8b5cf6' : '#3b82f6' }}
              ></div>
            )}
            {titulo}
          </h3>
          
          {hayDatos ? (
            <>
              {/* Grid responsive mejorado */}
              <div className={`grid gap-${compact ? '2' : '3'} ${
                compact 
                  ? 'grid-cols-2 sm:grid-cols-3' // Para espacios compactos: máximo 3 columnas
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' // Para espacios amplios
              }`}>
                {datosTallas.map((item, index) => (
                  <div
                    key={item.name}
                    className={`${compact ? 'p-2' : 'p-3'} rounded-md border bg-gray-50 hover:bg-gray-100 transition-colors`}
                    style={{ borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: '3px' }}
                  >
                    <div className={`${compact ? 'text-sm' : 'text-md'} font-semibold text-gray-800`}>
                      {item.name}
                    </div>
                    <div className="mt-1">
                      <span className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-blue-600`}>
                        {item.employeeCount}
                      </span>
                      <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 mt-0.5`}>
                        {item.value} {item.value === 1 ? nombreItemSingular : nombreItemPlural}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalItemsGlobal > 0 && (
                <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 ${compact ? 'mt-3 pt-2' : 'mt-4 pt-3'} border-t border-gray-200 bg-gray-50 -mx-${compact ? '3' : '4'} px-${compact ? '3' : '4'} py-2 rounded-b-lg`}>
                  <span className="font-medium">Total {nombreItemPlural}:</span>
                  <span className="font-bold text-gray-800 ml-1">{totalItemsGlobal}</span>
                </div>
              )}
            </>
          ) : (
            <div className={`${compact ? 'p-3' : 'p-4'} text-center bg-gray-50 rounded-md`}>
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
                No hay datos de tallas disponibles para este tipo.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResumenTotal = () => (
    <div className={`${compact ? 'mt-4' : 'mt-6'} border border-gray-200 rounded-lg bg-white ${compact ? 'shadow' : 'shadow-sm'}`}>
      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-gray-700 ${compact ? 'mb-2' : 'mb-3'} flex items-center`}>
          {compact && <div className="w-3 h-3 rounded-full mr-2 bg-green-500 flex-shrink-0"></div>}
          Resumen de Pedido Total
        </h3>
        
        {compact ? (
          // Vista compacta en formato de tabla
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-600">Playeras Seguridad:</span>
              <span className="text-sm font-bold text-gray-800">{itemsNecesarios.playerasSeguridad}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-600">Polos Construrama:</span>
              <span className="text-sm font-bold text-gray-800">{itemsNecesarios.polosConstrurama}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-gray-600">Camisas Mezclilla:</span>
              <span className="text-sm font-bold text-gray-800">{itemsNecesarios.camisasMezclilla}</span>
            </div>
          </div>
        ) : (
          // Vista normal con lista
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Playeras de Seguridad: <span className="font-bold text-gray-800">{itemsNecesarios.playerasSeguridad}</span></li>
            <li>Polos Construrama: <span className="font-bold text-gray-800">{itemsNecesarios.polosConstrurama}</span></li>
            <li>Camisas de Mezclilla: <span className="font-bold text-gray-800">{itemsNecesarios.camisasMezclilla}</span></li>
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {renderResumenSeccion(
        compact ? "Seguridad" : "Playeras de Seguridad",
        datosTallasSeguridadConteoPlayeras,
        itemsNecesarios.playerasSeguridad,
        "Playera",
        "Playeras",
        false
      )}

      {renderResumenSeccion(
        compact ? "Administrativos" : "Uniformes Administrativos (Polos y Camisas)",
        datosTallasAdministrativasDetallado,
        itemsNecesarios.polosConstrurama + itemsNecesarios.camisasMezclilla,
        "Uniforme",
        "Uniformes",
        true
      )}
      
      {renderResumenTotal()}
    </div>
  );
};

export default TallasResumen;