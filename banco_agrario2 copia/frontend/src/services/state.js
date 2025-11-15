// src/services/state.js
import { create } from "zustand";
import {
  api,
  createProject as apiCreateProject,
  createResource as apiCreateResource,
  getCapacityWindow,
  getResourcesVsWeekly,
  getProjectsWeeklyAvg,
} from "./api";

/* ================= utils de fechas ================= */
const mondayOf = (d) => {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = x.getUTCDay(); // 0=Dom, 1=Lun
  const delta = (dow === 0 ? 6 : dow - 1);
  x.setUTCDate(x.getUTCDate() - delta);
  return x.toISOString().slice(0, 10); // YYYY-MM-DD
};
const todayMondayISO = () => mondayOf(new Date(Date.now()));

// Función para convertir valores decimales a porcentajes enteros
const convertValuesToPercentage = (valuesMap) => {
  const converted = {};
  for (const [key, value] of Object.entries(valuesMap)) {
    // Si el valor es menor a 1, asumimos que está en formato decimal y lo convertimos a porcentaje
    converted[key] = value < 1 ? value * 100 : value;
  }
  return converted;
};

// Incluir el ID y convertir valores a porcentaje
const rowFromRes = (id, name, valuesMap) => ({
  id: id,
  clasifica: "Todos",
  recurso: name,
  values: convertValuesToPercentage(valuesMap),
});

// Incluir el ID para proyectos también y convertir valores
const rowForAssignmentPage = (id, name, valuesMap) => ({
  id: id,
  nombre: name,
  area: "",
  values: convertValuesToPercentage(valuesMap),
});

/* ================= store ================= */
const useBA = create((set, get) => ({
  // ----- grids -----
  weeksCapacity: [],
  capacityRows: [],
  capacityRowsFiltrados: [],
  availabilityWeeks: [],
  availabilityResources: [],
  resourcesVsWeeklyWeeks: [],
  resourcesVsWeeklyTypes: [],
  resourcesVsWeeklyByResource: {},
  resourcesVsFiltrados: {},
  people: [],
  weeksAssignment: [],
  assignmentRows: [],
  assignmentRowsFiltrados: [],

  // card: "Resumen de proyectos (promedio semanal)"
  assignmentProjectSummary: [],

  // catálogos que ya usas
  meses: [],
  clasificaciones: ["Proyecto","Anteproyecto","Estrategia","Admon"],
  estados: ["En curso", "Nuevo", "Finalizado"],
  conRecursoOpts: ["Sí", "No"], // Cambiado de "Si" a "Sí"
  tipos: ["PRO", "ADM", "INN", "MANT", "REQ", "OPE", "SOST", "GIRA", "PROC", "TI"],

  // filtros UI
  filtrosAssignment: { 
    phase: [], 
    classification: [], 
    complexity: [], 
    has_resource: "Todos" 
  },
  filtrosCapacity: { 
    mes: "Todos", 
    clasifica: [], 
    recurso: "Todos" 
  },
  filtrosResourcesVs: { 
    tipo: "Todos", 
    recurso: "Todos" 
  },
  projectSubprocesses: null,
  selectedProject: null,
  loadingSubprocesses: false,
  showSubprocessesModal: false,
  // Setters para filtros
  setFiltroAssignment: (key, value) => {
    set(state => ({
      filtrosAssignment: {
        ...state.filtrosAssignment,
        [key]: value
      }
    }));
    get().aplicarFiltrosAssignment();
  },

  setFiltroCapacity: (key, value) => {
    set(state => ({
      filtrosCapacity: {
        ...state.filtrosCapacity,
        [key]: value
      }
    }));
    get().aplicarFiltrosCapacity();
  },

  setFiltroResourcesVs: (key, value) => {
    set(state => ({
      filtrosResourcesVs: {
        ...state.filtrosResourcesVs,
        [key]: value
      }
    }));
    get().aplicarFiltrosResourcesVs();
  },

  // Funciones para aplicar filtros
  aplicarFiltrosCapacity: () => {
    const state = get();
    const { capacityRows, filtrosCapacity } = state;
    
    if (!capacityRows || capacityRows.length === 0) return;

    let filtrados = [...capacityRows];

    // Filtrar por mes
    if (filtrosCapacity.mes !== "Todos") {
      filtrados = filtrados.filter(row => {
        return Object.keys(row.values || {}).some(week => 
          week.includes(filtrosCapacity.mes)
        );
      });
    }

    // Filtrar por clasificación
    if (filtrosCapacity.clasifica && filtrosCapacity.clasifica.length > 0) {
      filtrados = filtrados.filter(row => 
        filtrosCapacity.clasifica.includes(row.clasifica)
      );
    }

    // Filtrar por recurso
    if (filtrosCapacity.recurso !== "Todos") {
      filtrados = filtrados.filter(row => 
        row.recurso === filtrosCapacity.recurso
      );
    }

    set({ capacityRowsFiltrados: filtrados });
  },

  aplicarFiltrosResourcesVs: () => {
    const state = get();
    const { resourcesVsWeeklyByResource, filtrosResourcesVs } = state;
    
    if (!resourcesVsWeeklyByResource) return;

    let filtrados = { ...resourcesVsWeeklyByResource };

    // Filtrar por recurso
    if (filtrosResourcesVs.recurso !== "Todos") {
      const recursoSeleccionado = filtrosResourcesVs.recurso;
      filtrados = Object.keys(filtrados)
        .filter(key => key === recursoSeleccionado)
        .reduce((obj, key) => {
          obj[key] = filtrados[key];
          return obj;
        }, {});
    }

    set({ resourcesVsFiltrados: filtrados });
  },

  aplicarFiltrosAssignment: () => {
    const state = get();
    const { assignmentRows, filtrosAssignment } = state;
    
    if (!assignmentRows || assignmentRows.length === 0) return;

    let filtrados = [...assignmentRows];

    // Filtrar por fase
    if (filtrosAssignment.phase && filtrosAssignment.phase.length > 0) {
      filtrados = filtrados.filter(project => 
        filtrosAssignment.phase.includes(project.phase)
      );
    }

    // Filtrar por clasificación
    if (filtrosAssignment.classification && filtrosAssignment.classification.length > 0) {
      filtrados = filtrados.filter(project => 
        filtrosAssignment.classification.includes(project.classification)
      );
    }

    // Filtrar por complejidad
    if (filtrosAssignment.complexity && filtrosAssignment.complexity.length > 0) {
      filtrados = filtrados.filter(project => 
        filtrosAssignment.complexity.includes(project.complexity)
      );
    }

    // Filtrar por recurso
    if (filtrosAssignment.has_resource !== "Todos") {
      filtrados = filtrados.filter(project => 
        project.has_resource === filtrosAssignment.has_resource
      );
    }

    set({ assignmentRowsFiltrados: filtrados });
  },

  /* =============== carga principal (desde backend) =============== */
  refreshData: async ({ start = todayMondayISO(), weeks = 52 } = {}) => {
    try {
      // OBTENER RECURSOS Y PROYECTOS CON ID PRIMERO
      const [resourcesResponse, projectsResponse] = await Promise.all([
        api.get('/resources'),
        api.get('/projects')
      ]);

      // Crear mapas de nombres a IDs
      const resourcesMap = {};
      resourcesResponse.data.forEach(resource => {
        resourcesMap[resource.name] = resource.id;
      });

      const projectsMap = {};
      projectsResponse.data.forEach(project => {
        projectsMap[project.name] = project.id;
      });

      // 1) Capacidad (por recurso y semana)
      const cap = await getCapacityWindow(start, weeks);
      const weeksCapacity = cap.labels || [];
      const byRes = cap.by_resource || {};

      const capacityRows = Object.keys(byRes).sort((a,b)=>a.localeCompare(b))
        .map(name => rowFromRes(resourcesMap[name], name, byRes[name]));

      // Disponibilidad = 100 - carga (convertir también)
      const availabilityWeeks = weeksCapacity;
      const availabilityResources = Object.keys(byRes).sort((a,b)=>a.localeCompare(b))
        .map(name => {
          const availabilityByWeek = {};
          for (const [week, value] of Object.entries(byRes[name])) {
            // Convertir el valor de carga a porcentaje y luego calcular disponibilidad
            const loadValue = value < 1 ? value * 100 : value;
            availabilityByWeek[week] = Math.max(0, 100 - Number(loadValue || 0));
          }
          return {
            id: resourcesMap[name],
            recurso: name,
            availabilityByWeek,
          };
        });

      // 2) Recursos vs (para la página semanal por persona)
      const rv = await getResourcesVsWeekly(start, weeks);
      const resourcesVsWeeklyWeeks  = rv.labels || [];
      const resourcesVsWeeklyTypes  = rv.types  || [];
      const people                  = rv.people || [];
      const resourcesVsWeeklyByResource = rv.by_person || {};

      const meses = Array.from(new Set((resourcesVsWeeklyWeeks || weeksCapacity).map(lb => String(lb).split(":")[0])));

      // 3) *** Asignación PM y PRO: por PROYECTO ***
      const avg = await getProjectsWeeklyAvg(start, weeks);
      const weeksAssignment = avg.labels || weeksCapacity;

      // Incluir el ID del proyecto en cada fila
      const assignmentRows = (avg.projects || [])
        .map(p => {
          const byWeek = { ...(p.by_week || {}) };
          for (const lb of weeksAssignment) if (!(lb in byWeek)) byWeek[lb] = 0;
          return rowForAssignmentPage(projectsMap[p.name], p.name, byWeek);
        })
        .sort((a,b)=> a.nombre.localeCompare(b.nombre));

      // 4) Card opcional de resumen (también incluir IDs y convertir valores)
      const assignmentProjectSummary = (avg.projects || [])
        .map(p => {
          const convertedByWeek = {};
          for (const [week, value] of Object.entries(p.by_week || {})) {
            convertedByWeek[week] = value < 1 ? value * 100 : value;
          }
          return { 
            id: projectsMap[p.name],
            name: p.name, 
            avg_pct: Number(p.avg_pct || 0) < 1 ? Number(p.avg_pct || 0) * 100 : Number(p.avg_pct || 0),
            by_week: convertedByWeek
          };
        })
        .sort((a,b)=> (b.avg_pct||0) - (a.avg_pct||0));

      // Aplicar filtros iniciales
      set({
        weeksCapacity, 
        capacityRows,
        capacityRowsFiltrados: capacityRows,
        availabilityWeeks, 
        availabilityResources,
        resourcesVsWeeklyWeeks, 
        resourcesVsWeeklyTypes, 
        resourcesVsWeeklyByResource,
        resourcesVsFiltrados: resourcesVsWeeklyByResource,
        people, 
        meses,
        weeksAssignment, 
        assignmentRows,
        assignmentRowsFiltrados: assignmentRows,
        assignmentProjectSummary,
      });

      // Aplicar filtros después de cargar los datos
      get().aplicarFiltrosCapacity();
      get().aplicarFiltrosResourcesVs();
      get().aplicarFiltrosAssignment();

    } catch (error) {
      console.error('Error en refreshData:', error);
    }
  },

  // Función para cargar proyectos específicamente
  refreshProjects: async () => {
    try {
      const response = await api.get('/projects/with-assignments');
      
      console.log('✅ Proyectos cargados:', response.data.projects);
      
      set({
        assignmentRows: response.data.projects || [],
        assignmentRowsFiltrados: response.data.projects || []
      });
      
      // Aplicar filtros después de cargar
      get().aplicarFiltrosAssignment();
      
    } catch (error) {
      console.error('❌ Error cargando proyectos:', error);
      // Si el endpoint no existe, usar refreshData normal
      get().refreshData();
    }
  },

  // compat con tus páginas
  refreshMock: async () => get().refreshData(),

  /* =============== creadores =============== */
  createResource: async ({ nombre, area }) => {
    await apiCreateResource({ name: nombre, unit: area || "" });
    await get().refreshData();
  },

  createProject: async ({ nombre, tipo, clasifica, area }) => {
    await apiCreateProject({
      name: nombre,
      classification: clasifica || "Proyecto",
      phase: "Ejecución",
      complexity: "Baja",
      has_resource: true,
    });
    await get().refreshData();
  },

  // En src/services/state.js
createAssignment: async (assignmentData) => {
  try {
    console.log('📝 Creating assignment with data:', assignmentData);
    
    // Para proyectos de complejidad Media, forzar 100% y 4 semanas
    const isMediumComplexity = assignmentData.complexity === 'Media';
    const allocationPercentage = isMediumComplexity ? 100 : (assignmentData.allocationPercentage || 100);
    const durationWeeks = isMediumComplexity ? 4 : (assignmentData.durationWeeks || 1);

    const response = await api.post('/assignments', {
      project_id: assignmentData.projectId,
      resource_id: assignmentData.resourceId,
      start_week_monday: assignmentData.startDate, // Asegurar que es lunes
      duration_weeks: durationWeeks,
      allocation_percentage: allocationPercentage,
      complexity: assignmentData.complexity,
      subprocess: assignmentData.subprocess || 'Principal', // Campo requerido
      classification: assignmentData.classification || 'Proyecto' // Campo requerido
    });

    console.log('✅ Assignment created:', response.data);
    
    // Refrescar datos específicamente para proyectos con asignaciones
    await get().refreshProjects();
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error creating assignment:', error);
    return { 
      success: false, 
      message: error.response?.data?.detail || 'Error creating assignment' 
    };
  }
},
  
  deleteProject: async (projectId) => {
    if (!projectId) {
      console.error('❌ Error: ID del proyecto es undefined o vacío');
      return { 
        success: false, 
        message: 'ID del proyecto no válido'
      };
    }

    try {
      const response = await api.delete(`/projects/${projectId}`);
      await get().refreshData();
      return { 
        success: true, 
        message: response.data?.message || 'Proyecto eliminado exitosamente',
        details: response.data
      };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Error al eliminar proyecto',
        error: error.response?.data
      };
    }
  },

  deleteResource: async (resourceId) => {
    if (!resourceId) {
      console.error('❌ Error: ID del recurso es undefined o vacío');
      return { 
        success: false, 
        message: 'ID del recurso no válido'
      };
    }

    try {
      const response = await api.delete(`/resources/${resourceId}`);
      await get().refreshData();
      return { 
        success: true, 
        message: response.data?.message || 'Recurso eliminado exitosamente',
        details: response.data
      };
    } catch (error) {
      console.error('Error deleting resource:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Error al eliminar recurso',
        error: error.response?.data
      };
    }
  },

  deleteAssignment: async (assignmentId) => {
    if (!assignmentId) {
      console.error('❌ Error: ID de la asignación es undefined o vacío');
      return { 
        success: false, 
        message: 'ID de la asignación no válido'
      };
    }

    try {
      const response = await api.delete(`/assignments/${assignmentId}`);
      await get().refreshData();
      return { 
        success: true, 
        message: response.data?.message || 'Asignación eliminada exitosamente',
        details: response.data
      };
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Error al eliminar asignación',
        error: error.response?.data
      };
    }
  },
  // Agregar esta función en state.js para debug
  debugAssignments: async () => {
    try {
      const response = await api.get('/assignments');
      console.log('🔍 Todas las asignaciones:', response.data);
      
      const weeksResponse = await api.get('/assignment-weeks');
      console.log('📅 Todas las semanas de asignación:', weeksResponse.data);
      
      return { assignments: response.data, weeks: weeksResponse.data };
    } catch (error) {
      console.error('Error en debug:', error);
    }
  },
// En state.js - modificar fetchProjectSubprocesses
// CORREGIR: Función fetchProjectSubprocesses en state.js
fetchProjectSubprocesses: async (projectId, resourceName = null) => {
    if (!projectId) {
        console.error('❌ Error: projectId es undefined');
        return null;
    }

    set({ loadingSubprocesses: true });
    try {
        const params = new URLSearchParams();
        if (resourceName && resourceName !== "Todos") {
            params.append('resource_name', resourceName);
        }
        
        const url = `/projects/${projectId}/subprocesses/current-month${params.toString() ? `?${params.toString()}` : ''}`;
        
        console.log('🔍 Fetching subprocesses from:', url);
        
        const response = await api.get(url);
        
        set({ 
            projectSubprocesses: response.data,
            selectedProject: projectId,
            loadingSubprocesses: false 
        });
        
        console.log('✅ Subprocesses loaded:', response.data);
        return response.data;
        
    } catch (error) {
        console.error('❌ Error fetching subprocesses:', error);
        console.error('Error details:', error.response?.data);
        set({ 
            loadingSubprocesses: false,
            projectSubprocesses: null 
        });
        return null;
    }
},

// CORREGIR: Función openSubprocessesModal
openSubprocessesModal: (projectId, resourceName = null) => {
    console.log('📂 Opening subprocesses modal for:', { projectId, resourceName });
    set({ 
        showSubprocessesModal: true,
        selectedProject: projectId 
    });
    // Cargar los datos después de abrir el modal
    get().fetchProjectSubprocesses(projectId, resourceName);
},

  closeSubprocessesModal: () => {
    set({ 
      showSubprocessesModal: false,
      projectSubprocesses: null,
      selectedProject: null 
    });
  },
}));

export default useBA;
