// NewAssignmentFromProject.jsx - VERSIÓN COMPLETA CORREGIDA
import { useEffect, useMemo, useState } from "react";
import { getProjects, getResources, createAssignment } from "../../services/api";
import WeekRangeSelector from "../WeekRangeSelector.jsx";

// Importa las funciones CORREGIDAS de porcentajes y subprocesos
import { 
  getHighComplexityData, 
  getMediumComplexityData,
  getHighComplexityPercentages, 
  getMediumComplexityPercentages,
  getHighComplexitySubprocesses,
  getMediumComplexitySubprocesses
} from "../../utils/deliverablesMapping";

// Función auxiliar para calcular la semana de inicio
function getStartWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 4 = Jueves
  
  // Obtener el lunes de esta semana
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  
  // Si es jueves (4) o después, empezar esta semana
  if (dayOfWeek >= 4) {
    return currentMonday;
  }
  // Si es antes del jueves, empezar la siguiente semana
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(currentMonday.getDate() + 7);
  return nextMonday;
}

export default function NewAssignmentFromProject({ onClose, selectedPerson = "" }) {
  const [projects, setProjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [percentage, setPercentage] = useState(10);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [ps, rs] = await Promise.all([getProjects(), getResources()]);
        setProjects(ps || []);
        setResources(rs || []);
        
        if (ps?.[0]) {
          setProjectId(String(ps[0].id));
          setSelectedProject(ps[0]);
        }
        if (selectedPerson) {
          const r = (rs || []).find(x => (x.name || "").trim() === String(selectedPerson).trim());
          if (r) setResourceId(String(r.id));
        } else if (rs?.[0]) {
          setResourceId(String(rs[0].id));
        }
      } catch (err) {
        alert("Error cargando datos: " + (err?.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedPerson]);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => String(p.id) === projectId);
      setSelectedProject(project);
    }
  }, [projectId, projects]);

  const handleProjectChange = (e) => {
    const newProjectId = e.target.value;
    setProjectId(newProjectId);
    setDateRange(null);
  };

  const isLowComplexityProject = useMemo(() => {
    return selectedProject?.complexity?.toLowerCase() === "baja";
  }, [selectedProject]);

  const isMediumComplexityProject = useMemo(() => {
    return selectedProject?.complexity?.toLowerCase() === "media";
  }, [selectedProject]);

  const isHighComplexityProject = useMemo(() => {
    return selectedProject?.complexity?.toLowerCase() === "alta";
  }, [selectedProject]);

  const canSubmit = useMemo(() => {
    const baseValidation = projectId && resourceId && !loading;
    
    if (isLowComplexityProject) {
      return baseValidation && dateRange?.start && dateRange?.end && percentage > 0;
    } else {
      return baseValidation;
    }
  }, [projectId, resourceId, dateRange, loading, isLowComplexityProject, percentage]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      if (isLowComplexityProject) {
        // Baja complejidad: usar fechas seleccionadas Y porcentaje personalizado
        await createAssignment({
          project_id: Number(projectId),
          resource_id: Number(resourceId),
          start_week_monday: dateRange.start,
          end_week_monday: dateRange.end,
          subprocess: "General",
          can_ordinal: 1,
          percentage: percentage,
        });
      } else if (isMediumComplexityProject || isHighComplexityProject) {
        // Media o Alta complejidad: usar endpoint NUEVO con subprocesos específicos
        const percentages = isMediumComplexityProject 
          ? getMediumComplexityPercentages()
          : getHighComplexityPercentages();
        
        const subprocesses = isMediumComplexityProject
          ? getMediumComplexitySubprocesses()
          : getHighComplexitySubprocesses();

        const startDate = getStartWeek();
        
        console.log('🚀 Enviando asignación bulk con subprocesos:', {
          project_id: Number(projectId),
          resource_id: Number(resourceId),
          percentages,
          subprocesses, // INCLUIR SUBPROCESOS
          start_date: startDate.toISOString().split('T')[0],
          complexity_type: isMediumComplexityProject ? 'media' : 'alta'
        });

        // Llamar al ENDPOINT NUEVO que acepta subprocesos
        const response = await fetch('http://localhost:8000/api/assignments/bulk-with-subprocesses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: Number(projectId),
            resource_id: Number(resourceId),
            percentages: percentages,
            subprocesses: subprocesses, // ENVIAR SUBPROCESOS
            start_date: startDate.toISOString().split('T')[0],
            complexity_type: isMediumComplexityProject ? 'media' : 'alta'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error creando asignaciones múltiples');
        }

        const result = await response.json();
        console.log('✅ Asignaciones creadas con subprocesos:', result);
      } else {
        // Para proyectos sin complejidad específica (fallback)
        const startDate = getStartWeek();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 28);

        //await createAssignment({
          //project_id: Number(projectId),
          //resource_id: Number(resourceId),
          //start_week_monday: startDate.toISOString().split('T')[0],
          //end_week_monday: endDate.toISOString().split('T')[0],
          //subprocess: "General",
          //can_ordinal: 1,
        //});
      }

      alert("Asignación creada ✅");
      onClose?.();
    } catch (err) {
      console.error('❌ Error:', err);
      if (err.response?.status === 409) {
        const weeks = err.response?.data?.detail?.weeks || [];
        const msg = weeks.map(w => `${w.label} (actual ${w.current}%, nuevo ${w.new}%)`).join("\n");
        alert("El recurso no cuenta con disponibilidad:\n" + msg);
      } else {
        alert("Error creando asignación: " + (err?.message || err?.response?.data?.detail || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Proyecto */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-gray-700">
          Proyecto <span className="text-red-500">*</span>
        </label>
        <select 
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={projectId} 
          onChange={handleProjectChange} 
          required
          disabled={loading}
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} {p.complexity ? `(${p.complexity})` : ''}
            </option>
          ))}
        </select>
        
        {selectedProject && (
          <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {selectedProject.classification}
            </span>
            <span className={`px-2 py-1 rounded ${
              selectedProject.complexity?.toLowerCase() === 'baja' ? 'bg-green-100 text-green-800' :
              selectedProject.complexity?.toLowerCase() === 'media' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Complejidad: {selectedProject.complexity}
            </span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {selectedProject.phase}
            </span>
          </div>
        )}
      </div>

      {/* Recurso */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-gray-700">
          Recurso <span className="text-red-500">*</span>
        </label>
        <select 
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={resourceId} 
          onChange={(e) => setResourceId(e.target.value)} 
          required
          disabled={loading}
        >
          {resources.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Selector condicional basado en complejidad */}
      {isLowComplexityProject ? (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Período de asignación <span className="text-red-500">*</span>
            </label>
            <WeekRangeSelector onRangeChange={setDateRange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Porcentaje de asignación <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Porcentaje de tiempo que dedicará el recurso a este proyecto durante todo el período seleccionado
            </p>
          </div>
        </>
      ) : isMediumComplexityProject ? (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">
                Asignación Automática - Media Complejidad
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Duración: <span className="font-medium">9 meses (36 semanas)</span> con porcentajes específicos por entregable.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Subprocesos: Se asignarán automáticamente según el cronograma de entregables.
              </p>
            </div>
            <div className="text-2xl font-bold text-yellow-600">36</div>
          </div>
          <div className="mt-2 flex items-center text-xs text-yellow-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Las asignaciones comenzarán {new Date().getDay() >= 4 ? "esta semana" : "la próxima semana"}.
          </div>
        </div>
      ) : isHighComplexityProject ? (
        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-red-800">
                Asignación Automática - Alta Complejidad
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Duración: <span className="font-medium">12 meses (48 semanas)</span> con porcentajes específicos por entregable.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Subprocesos: Se asignarán automáticamente según el cronograma de entregables.
              </p>
            </div>
            <div className="text-2xl font-bold text-red-600">48</div>
          </div>
          <div className="mt-2 flex items-center text-xs text-red-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Las asignaciones comenzarán {new Date().getDay() >= 4 ? "esta semana" : "la próxima semana"}.
          </div>
        </div>
      ) : selectedProject ? (
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-green-800">
                Duración automática
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Duración: <span className="font-medium">4 semanas</span> (asignación automática).
              </p>
            </div>
            <div className="text-2xl font-bold text-green-600">4</div>
          </div>
        </div>
      ) : null}

      {/* Información adicional */}
      <div className="p-3 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-medium">Nota:</span> Los subprocesos se asignarán automáticamente según la complejidad del proyecto.
            {isLowComplexityProject && " Para baja complejidad, el porcentaje seleccionado se aplicará a todas las semanas del período."}
            {(isMediumComplexityProject || isHighComplexityProject) && " Para media y alta complejidad, los subprocesos se basan en el cronograma de entregables específicos."}
          </div>
        </div>
      </div>

      {/* Vista previa de subprocesos para alta y media complejidad */}
      {(isMediumComplexityProject || isHighComplexityProject) && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="text-sm font-semibold text-gray-800 mb-2">
            Vista previa de subprocesos (primeras 4 semanas):
          </h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(isMediumComplexityProject ? getMediumComplexitySubprocesses() : getHighComplexitySubprocesses())
              .slice(0, 4)
              .map((subprocess, index) => (
                <div key={index} className="flex justify-between items-center text-xs p-2 bg-white rounded border">
                  <span className="font-medium">Semana {index + 1}:</span>
                  <span className="text-blue-600">{subprocess}</span>
                  <span className="text-green-600 font-medium">
                    {(isMediumComplexityProject ? getMediumComplexityPercentages() : getHighComplexityPercentages())[index]}%
                  </span>
                </div>
              ))
            }
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Mostrando 4 de {isMediumComplexityProject ? '36' : '48'} semanas totales
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button 
          type="button" 
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="btn btn-primary flex items-center gap-2"
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creando...
            </>
          ) : (
            "Guardar Asignación"
          )}
        </button>
      </div>
    </form>
  );
}