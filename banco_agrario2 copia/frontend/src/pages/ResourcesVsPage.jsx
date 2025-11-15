// En ResourcesVsPage.jsx - VERSIÓN CORREGIDA
import { useEffect, useMemo, useState, useRef } from "react";
import SelectFilter from "../components/filters/SelectFilter.jsx";
import WeeklyGrid from "../components/WeeklyGrid.jsx";
import RightSheet from "../components/sheets/RightSheet.jsx";
import NewAssignmentFromProject from "../components/forms/NewAssignmentFromProject.jsx";
import ProjectSubprocessesModal from "../components/ProjectSubprocessesModal.jsx";
import useBA from "../services/state.js";

const colorForLoad = (v) => {
  let numericValue;
  if (typeof v === 'string') {
    numericValue = parseFloat(v.replace('%', '')) || 0;
  } else {
    numericValue = Number(v) || 0;
  }
  
  if (numericValue < 1 && numericValue > 0) {
    numericValue = numericValue * 100;
  }
  
  return numericValue >= 80
    ? "bg-red-100 text-red-700 border border-red-200"
    : numericValue >= 50
    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
    : "bg-green-100 text-green-700 border border-green-200";
};

// Componente MiniGauge para las miniaturas
// Componente MiniGauge para las miniaturas - VERSIÓN MEJORADA
const MiniGauge = ({ value = 0, size = 60, label = "", onClick = null, isSelected = false }) => {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  const color = clamped >= 80 ? "#ef4444" : clamped >= 50 ? "#f59e0b" : "#10b981";
  
  return (
    <div 
      className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md mx-1 my-2 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={onClick}
      style={{ minWidth: `${size + 32}px` }} // Espacio mínimo garantizado
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mb-2">
        <circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={`${dash} ${c-dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dominantBaseline="central" 
          fontSize="12" 
          fontWeight="600"
          fill={clamped >= 80 ? "#dc2626" : clamped >= 50 ? "#d97706" : "#059669"}
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <div className="mt-2 text-center w-full">
        <div className="text-xs font-medium text-gray-900 truncate px-1">
          {label}
        </div>
        <div className={`text-xs font-semibold mt-1 ${
          clamped >= 80 ? 'text-red-600' : 
          clamped >= 50 ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {Math.round(clamped)}% carga
        </div>
      </div>
    </div>
  );
};

// Componente ResourceCard para vista de cards
// Componente ResourceCard para vista de cards - VERSIÓN MEJORADA
const ResourceCard = ({ resource, availability, onClick, isSelected }) => {
  const load = 100 - (availability || 0);
  
  return (
    <div 
      className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md mx-1 my-2 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="font-semibold text-gray-900 truncate text-sm">{resource}</h3>
          <p className="text-xs text-gray-600 mt-1">
            {Math.round(load)}% de carga
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-3 h-3 rounded-full ${
            load >= 80 ? 'bg-red-500' : 
            load >= 50 ? 'bg-yellow-500' : 'bg-green-500'
          }`}></div>
          <span className={`text-sm font-semibold ${
            load >= 80 ? 'text-red-600' : 
            load >= 50 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {Math.round(availability || 0)}%
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${
            load >= 80 ? 'bg-red-500' : 
            load >= 50 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${load}%` }}
        ></div>
      </div>
    </div>
  );
};
// Componente para vista de ranking de recursos
const ResourceRankingView = ({ resourcesWithLoad, onResourceSelect, selectedPerson }) => {
  const mostLoaded = [...resourcesWithLoad].sort((a, b) => b.load - a.load).slice(0, 5);
  const leastLoaded = [...resourcesWithLoad].sort((a, b) => a.load - b.load).slice(0, 5);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Recursos más ocupados */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <h3 className="font-semibold text-gray-900">Más Ocupados</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {mostLoaded.map((resource, index) => (
            <div
              key={resource.name}
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors mx-1 ${
                selectedPerson === resource.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onResourceSelect(resource.name)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-red-100 text-red-700' :
                  index === 1 ? 'bg-orange-100 text-orange-700' :
                  index === 2 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{resource.name}</div>
                  <div className="text-xs text-gray-500">{Math.round(resource.load)}% de carga</div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${
                resource.load >= 80 ? 'text-red-600' : 
                resource.load >= 50 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {Math.round(resource.load)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recursos menos ocupados */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold text-gray-900">Menos Ocupados</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {leastLoaded.map((resource, index) => (
            <div
              key={resource.name}
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors mx-1 ${
                selectedPerson === resource.name
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onResourceSelect(resource.name)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-green-100 text-green-700' :
                  index === 1 ? 'bg-emerald-100 text-emerald-700' :
                  index === 2 ? 'bg-teal-100 text-teal-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{resource.name}</div>
                  <div className="text-xs text-gray-500">{Math.round(resource.load)}% de carga</div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${
                resource.load >= 80 ? 'text-red-600' : 
                resource.load >= 50 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {Math.round(resource.load)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente para filtro inteligente
const WorkloadFilter = ({ value, onChange }) => {
  const options = [
    { value: 'all', label: 'Todos los recursos', color: 'gray' },
    { value: 'available', label: 'Disponibles (<50%)', color: 'green' },
    { value: 'moderate', label: 'Moderados (50-80%)', color: 'yellow' },
    { value: 'overloaded', label: 'Sobrecargados (≥80%)', color: 'red' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          className={`px-3 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
            value === option.value
              ? option.value === 'available' ? 'bg-green-100 text-green-700 border-green-300' :
                option.value === 'moderate' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                option.value === 'overloaded' ? 'bg-red-100 text-red-700 border-red-300' :
                'bg-blue-100 text-blue-700 border-blue-300'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => onChange(option.value)}
        >
          <div className={`w-2 h-2 rounded-full ${
            option.value === 'available' ? 'bg-green-500' :
            option.value === 'moderate' ? 'bg-yellow-500' :
            option.value === 'overloaded' ? 'bg-red-500' :
            'bg-gray-500'
          }`}></div>
          {option.label}
        </button>
      ))}
    </div>
  );
};

// Función auxiliar para formatear valores - DEFINIR ANTES DE USAR
const formatValueForDisplay = (value) => {
  if (value === null || value === undefined) return 0;
  
  let numericValue = typeof value === 'string' ? 
    parseFloat(value.replace('%', '')) : 
    Number(value);
  
  if (numericValue < 1 && numericValue > 0) {
    numericValue = numericValue * 100;
  }
  
  return numericValue;
};

export default function ResourcesVsPage() {
  const {
    resourcesVsWeeklyWeeks,
    resourcesVsWeeklyTypes,
    resourcesVsWeeklyByResource,
    resourcesVsFiltrados,
    people,
    filtrosResourcesVs,
    setFiltroResourcesVs,
    availabilityWeeks,
    availabilityResources,
    refreshMock,
    
    projectSubprocesses,
    loadingSubprocesses,
    showSubprocessesModal,
    fetchProjectSubprocesses,
    openSubprocessesModal,
    closeSubprocessesModal,
  } = useBA();

  const [openNew, setOpenNew] = useState(false);
  const [viewMode, setViewMode] = useState('gauges'); // 'gauges', 'cards', 'ranking'
  const [workloadFilter, setWorkloadFilter] = useState('all'); // 'all', 'available', 'moderate', 'overloaded'
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    refreshMock();
  }, []);

  // Usar datos filtrados o todos los datos
  const datosParaMostrar = Object.keys(resourcesVsFiltrados || {}).length > 0 
    ? resourcesVsFiltrados 
    : resourcesVsWeeklyByResource || {};

  // CORREGIDO: Calcular carga promedio para cada recurso con manejo de errores
  const resourcesWithLoad = useMemo(() => {
    try {
      // Verificar que las variables estén inicializadas
      if (!availabilityResources || !Array.isArray(availabilityResources) || availabilityResources.length === 0) {
        return [];
      }
      
      const weeksSlice = (availabilityWeeks && Array.isArray(availabilityWeeks)) 
        ? availabilityWeeks.slice(0, 4) 
        : [];
      
      return availabilityResources.map(resource => {
        // Verificar que el recurso tenga la estructura esperada
        if (!resource || typeof resource !== 'object') {
          return { name: 'Unknown', load: 0, availability: 100 };
        }

        const loadValues = weeksSlice.map((week) => {
          const free = formatValueForDisplay(resource.availabilityByWeek?.[week] ?? 0);
          return 100 - free;
        });
        
        const avgLoad = loadValues.length ? loadValues.reduce((a, b) => a + b, 0) / loadValues.length : 0;
        
        return {
          name: resource.recurso || 'Unknown',
          load: avgLoad,
          availability: 100 - avgLoad
        };
      }).sort((a, b) => b.load - a.load); // Ordenar por carga (mayor a menor)
    } catch (error) {
      console.error('Error calculating resources load:', error);
      return [];
    }
  }, [availabilityResources, availabilityWeeks]);

  // Filtrar recursos por carga de trabajo
  const filteredResourcesWithLoad = useMemo(() => {
    try {
      let filtered = resourcesWithLoad;
      
      switch (workloadFilter) {
        case 'available':
          filtered = resourcesWithLoad.filter(r => r.load < 50);
          break;
        case 'moderate':
          filtered = resourcesWithLoad.filter(r => r.load >= 50 && r.load < 80);
          break;
        case 'overloaded':
          filtered = resourcesWithLoad.filter(r => r.load >= 80);
          break;
        default:
          filtered = resourcesWithLoad;
      }
      
      return filtered;
    } catch (error) {
      console.error('Error filtering resources:', error);
      return [];
    }
  }, [resourcesWithLoad, workloadFilter]);

  // Persona seleccionada
  const selectedPerson = useMemo(() => {
    if (filtrosResourcesVs?.recurso && filtrosResourcesVs.recurso !== "Todos") {
      return filtrosResourcesVs.recurso;
    }
    return null;
  }, [filtrosResourcesVs]);

  const bucket = selectedPerson ? (datosParaMostrar?.[selectedPerson] || {
    loadByTypeWeek: {},
    projectNamesByType: {},
    projectCountByTypeWeek: {},
  }) : {
    loadByTypeWeek: {},
    projectNamesByType: {},
    projectCountByTypeWeek: {},
  };

  // Tipos disponibles para filtrar
  const tiposDisponibles = ["Todos", ...(resourcesVsWeeklyTypes || [])];

  // Personas disponibles para el dropdown
  const personasDisponibles = useMemo(() => {
    return ["Todos", ...(people || [])];
  }, [people]);

  // Gauge de CARGA promedio - SOLO cuando hay recurso seleccionado
  const gaugeWeeksWindow = 4;
  const gaugeValue = useMemo(() => {
    if (!selectedPerson) return 0;
    try {
      const rec = (availabilityResources || []).find(
        (r) => String(r.recurso || "").trim() === String(selectedPerson).trim()
      );
      if (!rec) return 0;
      const weeksSlice = (availabilityWeeks && Array.isArray(availabilityWeeks)) 
        ? availabilityWeeks.slice(0, gaugeWeeksWindow) 
        : [];
      const vals = weeksSlice.map((w) => {
        const free = formatValueForDisplay(rec.availabilityByWeek?.[w] ?? 0);
        return 100 - free;
      });
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    } catch (error) {
      console.error('Error calculating gauge value:', error);
      return 0;
    }
  }, [selectedPerson, availabilityWeeks, availabilityResources]);

  // 1) Carga por tipo (semanal) - SOLO cuando hay recurso seleccionado
  const rowsLoad = useMemo(() => {
    if (!selectedPerson) return [];
    
    try {
      let tipos = resourcesVsWeeklyTypes || [];
      
      if (filtrosResourcesVs.tipo && filtrosResourcesVs.tipo !== "Todos") {
        tipos = [filtrosResourcesVs.tipo];
      }

      return tipos.map((t) => ({
        tipo: t,
        values: Object.fromEntries(
          Object.entries(bucket.loadByTypeWeek?.[t] || {}).map(([week, value]) => [
            week,
            formatValueForDisplay(value)
          ])
        ),
      }));
    } catch (error) {
      console.error('Error creating load rows:', error);
      return [];
    }
  }, [resourcesVsWeeklyTypes, bucket, filtrosResourcesVs.tipo, selectedPerson]);

  // 2) # Proyectos por tipo (semanal) - SOLO cuando hay recurso seleccionado
  const rowsProjCount = useMemo(() => {
    if (!selectedPerson) return [];
    
    try {
      let tipos = resourcesVsWeeklyTypes || [];
      
      if (filtrosResourcesVs.tipo && filtrosResourcesVs.tipo !== "Todos") {
        tipos = [filtrosResourcesVs.tipo];
      }

      return tipos.map((t) => ({
        tipo: t,
        values: bucket.projectCountByTypeWeek?.[t] || {},
      }));
    } catch (error) {
      console.error('Error creating project count rows:', error);
      return [];
    }
  }, [resourcesVsWeeklyTypes, bucket, filtrosResourcesVs.tipo, selectedPerson]);

  const resumenByType = bucket.projectNamesByType || {};

  const getVal = (row, w) => {
    const value = row.values?.[w] ?? 0;
    return formatValueForDisplay(value);
  };

  // Función para seleccionar recurso desde las cards/gauges
  const handleResourceSelect = (resourceName) => {
    setFiltroResourcesVs("recurso", resourceName);
  };

  // Función para manejar clic en proyecto
  const handleProjectClick = (project) => {
    if (project && project.id && selectedPerson) {
      openSubprocessesModal(project.id, selectedPerson);
    } else {
      console.warn('⚠️ Project ID no disponible o no hay recurso seleccionado:', project);
    }
  };

  // Estadísticas para mostrar
  const estadisticas = useMemo(() => {
    try {
      const totalPersonas = filteredResourcesWithLoad.length;
      const totalProyectos = Object.values(resumenByType).reduce((acc, projects) => {
        return acc + (Array.isArray(projects) ? projects.length : 0);
      }, 0);
      
      // Métricas generales
      const totalLoad = filteredResourcesWithLoad.reduce((sum, resource) => sum + resource.load, 0);
      const avgLoad = filteredResourcesWithLoad.length > 0 ? totalLoad / filteredResourcesWithLoad.length : 0;
      const overloadedResources = filteredResourcesWithLoad.filter(r => r.load >= 80).length;
      const availableResources = filteredResourcesWithLoad.filter(r => r.load < 50).length;
      const moderateResources = filteredResourcesWithLoad.filter(r => r.load >= 50 && r.load < 80).length;
      
      return {
        totalPersonas,
        totalProyectos,
        personaSeleccionada: selectedPerson,
        avgLoad,
        overloadedResources,
        availableResources,
        moderateResources
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        totalPersonas: 0,
        totalProyectos: 0,
        personaSeleccionada: selectedPerson,
        avgLoad: 0,
        overloadedResources: 0,
        availableResources: 0,
        moderateResources: 0
      };
    }
  }, [filteredResourcesWithLoad, resumenByType, selectedPerson]);

  return (
    <section className="space-y-8">
      {/* Header con filtros */}
      <div className="card">
        <div className="card-header flex items-center justify-between px-6">
          <div>
            <span className="text-lg font-semibold">Recursos vs PM y PRO</span>
            <p className="text-sm text-gray-600 mt-1">
              {selectedPerson 
                ? `Vista individual · ${selectedPerson}` 
                : `Vista general · ${estadisticas.totalPersonas} recursos activos`
              }
              {filtrosResourcesVs.tipo !== "Todos" && ` · Filtrado por: ${filtrosResourcesVs.tipo}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="btn btn-primary flex items-center gap-2"
              onClick={() => setOpenNew(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Asignación
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="card-body grid gap-4 md:grid-cols-2">
          <SelectFilter
            label="Recurso"
            value={filtrosResourcesVs.recurso || "Todos"}
            onChange={(v) => setFiltroResourcesVs("recurso", v)}
            options={personasDisponibles}
          />
          
          <SelectFilter
            label="Tipo de Proyecto"
            value={filtrosResourcesVs.tipo || "Todos"}
            onChange={(v) => setFiltroResourcesVs("tipo", v)}
            options={tiposDisponibles}
          />
        </div>

        {/* NUEVO: Filtro inteligente por carga de trabajo */}
        {!selectedPerson && (
          <div className="card-body grid gap-4 place-items-center">
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-700 block mb-2">Filtrar por carga de trabajo</span>
              <WorkloadFilter 
                value={workloadFilter} 
                onChange={setWorkloadFilter} 
              />
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>Mostrando {filteredResourcesWithLoad.length} de {resourcesWithLoad.length} recursos</span>
                {workloadFilter !== 'all' && (
                  <button 
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setWorkloadFilter('all')}
                  >
                    Limpiar filtro
                  </button>
                )}
              </div>
            </div>

            {/* Selector de vista y métricas generales */}
            <div className="card-body grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Vista de recursos:</span>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      viewMode === 'gauges' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                    onClick={() => setViewMode('gauges')}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Gauges
                    </div>
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      viewMode === 'cards' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                    onClick={() => setViewMode('cards')}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      Cards
                    </div>
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      viewMode === 'ranking' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                    onClick={() => setViewMode('ranking')}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Ranking
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Métricas generales */}
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{Math.round(estadisticas.avgLoad)}%</div>
                  <div className="text-gray-500">Carga promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{estadisticas.overloadedResources}</div>
                  <div className="text-gray-500">Sobrecargados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{estadisticas.moderateResources}</div>
                  <div className="text-gray-500">Moderados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{estadisticas.availableResources}</div>
                  <div className="text-gray-500">Disponibles</div>
                </div>
              </div>
            </div>

            {/* Grid de recursos */}
            {viewMode === 'ranking' ? (
              <ResourceRankingView 
                resourcesWithLoad={filteredResourcesWithLoad}
                onResourceSelect={handleResourceSelect}
                selectedPerson={selectedPerson}
              />
            ) : (
              // En la sección del grid de recursos - BUSCAR ESTA PARTE Y REEMPLAZAR:
              <div className={`grid gap-6 ${
                viewMode === 'gauges' 
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {filteredResourcesWithLoad.map((resource) => (
                  viewMode === 'gauges' ? (
                    <MiniGauge
                      key={resource.name}
                      value={resource.load}
                      label={resource.name}
                      onClick={() => handleResourceSelect(resource.name)}
                      isSelected={selectedPerson === resource.name}
                    />
                  ) : (
                    <ResourceCard
                      key={resource.name}
                      resource={resource.name}
                      availability={resource.availability}
                      onClick={() => handleResourceSelect(resource.name)}
                      isSelected={selectedPerson === resource.name}
                    />
                  )
                ))}
              </div>
            )}

            {filteredResourcesWithLoad.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {resourcesWithLoad.length === 0 
                  ? 'No hay recursos disponibles para mostrar'
                  : 'No hay recursos que coincidan con el filtro aplicado'
                }
              </div>
            )}
          </div>
        )}

        {/* Botón para limpiar filtros */}
        {(filtrosResourcesVs.recurso !== "Todos" || filtrosResourcesVs.tipo !== "Todos") && (
          <div className="card-footer border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Filtros activos: 
                {filtrosResourcesVs.recurso !== "Todos" && ` Recurso: ${filtrosResourcesVs.recurso}`}
                {filtrosResourcesVs.tipo !== "Todos" && ` Tipo: ${filtrosResourcesVs.tipo}`}
              </span>
              <button 
                className="btn btn-secondary text-sm"
                onClick={() => {
                  setFiltroResourcesVs("recurso", "Todos");
                  setFiltroResourcesVs("tipo", "Todos");
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTENIDO CONDICIONAL: Mostrar solo cuando hay recurso seleccionado */}
      {selectedPerson ? (
        <>
          {/* Gauge de carga individual */}
          <div className="rounded-2xl border bg-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <MiniGauge 
                value={gaugeValue} 
                size={80}
                label={`Carga promedio de ${selectedPerson}`}
              />
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-900">
                  {selectedPerson}
                </div>
                <div className="text-xs text-gray-500">
                  Próximas {gaugeWeeksWindow} semanas
                </div>
                <div className={`text-sm font-semibold ${
                  gaugeValue >= 80 ? 'text-red-600' : 
                  gaugeValue >= 50 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {Math.round(gaugeValue)}% de carga
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Disponibilidad</div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(100 - gaugeValue)}%
              </div>
            </div>
          </div>

          {/* 1) Carga por tipo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700 px-1">
                Carga por tipo (semanal) - {selectedPerson}
              </div>
              <div className="text-xs text-gray-500">
                {resourcesVsWeeklyWeeks?.length || 0} semanas mostradas
              </div>
            </div>
            <WeeklyGrid
              weeks={resourcesVsWeeklyWeeks}
              rows={rowsLoad}
              windowSize={4}
              getRowKey={(r) => r.tipo}
              renderLeft={(r) => (r ? [r.tipo] : ["TIPO"])}
              leftWidths={["w-[12rem]"]}
              leftStickyOffsets={["left-0"]}
              getValue={(r, w) => getVal(r, w)}
              colorClass={colorForLoad}
              formatAsPercent={true}
              emptyMessage="No hay datos de carga para este recurso"
            />
          </div>

          {/* 2) # Proyectos por tipo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700 px-1">
                Proyectos por tipo (semanal) - {selectedPerson}
              </div>
              <div className="text-xs text-gray-500">
                Conteo de proyectos activos por semana
              </div>
            </div>
            <WeeklyGrid
              weeks={resourcesVsWeeklyWeeks}
              rows={rowsProjCount}
              windowSize={4}
              getRowKey={(r) => r.tipo}
              renderLeft={(r) => (r ? [r.tipo] : ["TIPO"])}
              leftWidths={["w-[12rem]"]}
              leftStickyOffsets={["left-0"]}
              getValue={(r, w) => getVal(r, w)}
              formatAsPercent={false}
              colorClass={(v) => (Number(v) > 0
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-600 border border-gray-200")}
              emptyMessage="No hay proyectos asignados para este recurso"
            />
          </div>

          {/* Resumen de proyectos */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span>Resumen de proyectos - {selectedPerson}</span>
              <span className="text-sm text-gray-500">
                {estadisticas.totalProyectos} proyectos totales
              </span>
            </div>
            <div className="card-body">
              {Object.keys(resumenByType).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay proyectos asignados a este recurso
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(resumenByType).map(([tipo, projects]) => (
                    <div key={tipo} className="rounded-xl border bg-white p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-700">{tipo}</div>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {Array.isArray(projects) ? projects.length : 0} {Array.isArray(projects) && projects.length === 1 ? 'proyecto' : 'proyectos'}
                        </span>
                      </div>
                      <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {Array.isArray(projects) && projects.map((project) => (
                          <li 
                            key={project.id} 
                            className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer"
                            onClick={() => handleProjectClick(project)}
                          >
                            <div className="text-left w-full hover:text-blue-600">
                              {project.name}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Mensaje cuando no hay recurso seleccionado */
        <div className="rounded-2xl border bg-blue-50 border-blue-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Selecciona un recurso
            </h3>
            <p className="text-blue-700">
              Haz clic en cualquier recurso de la lista superior para ver su carga detallada, 
              proyectos asignados y métricas específicas.
            </p>
          </div>
        </div>
      )}

      {/* Sheet: Nueva Asignación */}
      <RightSheet
        title="Nueva asignación"
        open={openNew}
        onClose={() => setOpenNew(false)}
        footer={null}
        size="lg"
      >
        <NewAssignmentFromProject
          onClose={() => setOpenNew(false)}
          selectedPerson={selectedPerson}
          weeksOptions={resourcesVsWeeklyWeeks || []}
        />
      </RightSheet>

      {/* Modal de subprocesos */}
      <ProjectSubprocessesModal
        isOpen={showSubprocessesModal}
        onClose={closeSubprocessesModal}
        projectSubprocesses={projectSubprocesses}
        loadingSubprocesses={loadingSubprocesses}
      />
    </section>
  );
}