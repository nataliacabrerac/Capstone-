// deliverablesMapping.js - VERSIÓN CORREGIDA

export const DELIVERABLES_MAPPING = {
  1: { percentage: 5, name: "Documento Diagnóstico", subprocess: "Diagnóstico" },
  2: { percentage: 7, name: "Doc. Especificación", subprocess: "Especificación" },
  3: { percentage: 7, name: "Modelo operativo V1", subprocess: "Modelo Operativo" },
  4: { percentage: 2, name: "Riesgos preliminares", subprocess: "Análisis de Riesgos" },
  5: { percentage: 9, name: "RFP", subprocess: "RFP" },
  6: { percentage: 2, name: "Estimaciones costo y tiempo", subprocess: "Estimaciones" },
  7: { percentage: 10, name: "Caso de Negocio", subprocess: "Caso Negocio" },
  8: { percentage: 10, name: "Gestión Jurídica", subprocess: "Jurídico" },
  9: { percentage: 5, name: "Desarrollo", subprocess: "Desarrollo" },
  10: { percentage: 8, name: "Pruebas", subprocess: "Pruebas" },
  11: { percentage: 5, name: "Producción", subprocess: "Producción" },
  12: { percentage: 10, name: "Estabilización", subprocess: "Estabilización" },
  13: { percentage: 5, name: "Gestión de Riesgos", subprocess: "Gestión Riesgos" },
  14: { percentage: 8, name: "Gestión de Procesos", subprocess: "Gestión Procesos" },
  15: { percentage: 10, name: "Gestión del Cambio", subprocess: "Gestión Cambio" },
  16: { percentage: 10, name: "Entrega operación y soporte", subprocess: "Entrega Operación" },
  17: { percentage: 8, name: "Recorrido Modelo Operativo", subprocess: "Recorrido Modelo" }
};

// Matriz de 12 meses (48 semanas) para complejidad alta
export const HIGH_COMPLEXITY_SCHEDULE = [
  // Mes 1
  [[1], [1], [1], [1]],
  // Mes 2
  [[1, 2], [3, 2], [4, 3, 2], [3, 2]],
  // Mes 3
  [[5], [5], [7, 5], [5]],
  // Mes 4
  [[5], [7, 6], [6], [7]],
  // Mes 5
  [[], [8], [8], [8]], // OT = vacío (descanso)
  // Mes 6
  [[8], [8], [8], [9]],
  // Mes 7
  [[14, 13, 9], [9], [13, 9], [15, 9]],
  // Mes 8
  [[13, 9], [9], [9], [16, 9]],
  // Mes 9
  [[9], [14, 9], [9], [15, 10]],
  // Mes 10
  [[15, 10], [10], [10], [10]],
  // Mes 11
  [[10], [11], [15, 11], [16, 15, 14, 12]],
  // Mes 12
  [[16, 12], [17, 16, 12], [12], []] // OT = vacío
];

// Matriz de 9 meses (36 semanas) para complejidad media
export const MEDIUM_COMPLEXITY_SCHEDULE = [
  // Mes 1
  [[1], [1], [1], [2, 3]],
  // Mes 2
  [[2, 3, 4], [3], [5], [5, 7]],
  // Mes 3
  [[5], [6], [6], [7]],
  // Mes 4
  [[], [8], [8], [8]], // OT = vacío (descanso)
  // Mes 5
  [[8], [8], [8], [9]],
  // Mes 6
  [[9], [9, 13], [9, 14], [9, 13]],
  // Mes 7
  [[14, 9], [9], [9], [10, 15]],
  // Mes 8
  [[10, 15], [10], [11, 15], [12, 14, 15]],
  // Mes 9
  [[12, 16], [12, 14], [12, 16, 17], []] // OT = vacío
];

// Función para calcular el porcentaje total y subprocesos de una semana
export function calculateWeekPercentageAndSubprocess(weekDeliverables) {
  const deliverables = weekDeliverables.map(deliverableId => 
    DELIVERABLES_MAPPING[deliverableId]
  );
  
  const totalPercentage = deliverables.reduce((total, deliverable) => {
    return total + (deliverable?.percentage || 0);
  }, 0);

  // Crear string de subprocesos concatenados
  const subprocessString = deliverables
    .map(d => d?.subprocess)
    .filter(Boolean)
    .join(', ');

  return {
    percentage: totalPercentage,
    subprocess: subprocessString || "General"
  };
}

// Función para obtener todos los porcentajes y subprocesos de 48 semanas (alta complejidad)
export function getHighComplexityData() {
  return HIGH_COMPLEXITY_SCHEDULE.flat().map(weekDeliverables => 
    calculateWeekPercentageAndSubprocess(weekDeliverables)
  );
}

// Función para obtener todos los porcentajes y subprocesos de 36 semanas (media complejidad)
export function getMediumComplexityData() {
  return MEDIUM_COMPLEXITY_SCHEDULE.flat().map(weekDeliverables => 
    calculateWeekPercentageAndSubprocess(weekDeliverables)
  );
}

// Funciones de compatibilidad (para no romper código existente)
export function getHighComplexityPercentages() {
  return getHighComplexityData().map(week => week.percentage);
}

export function getMediumComplexityPercentages() {
  return getMediumComplexityData().map(week => week.percentage);
}

// Función para obtener los subprocesos
export function getHighComplexitySubprocesses() {
  return getHighComplexityData().map(week => week.subprocess);
}

export function getMediumComplexitySubprocesses() {
  return getMediumComplexityData().map(week => week.subprocess);
}

// Función para obtener los nombres de los entregables de una semana
export function getDeliverableNames(weekDeliverables) {
  return weekDeliverables.map(deliverableId => {
    const deliverable = DELIVERABLES_MAPPING[deliverableId];
    return deliverable?.name || `Entregable ${deliverableId}`;
  });
}

// Función para obtener la matriz completa con nombres de entregables
export function getScheduleWithDeliverableNames(schedule) {
  return schedule.map(month => 
    month.map(week => ({
      deliverables: week,
      deliverableNames: getDeliverableNames(week),
      ...calculateWeekPercentageAndSubprocess(week)
    }))
  );
}