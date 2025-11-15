// src/pages/AssignmentPage.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import SelectFilter from "../components/filters/SelectFilter.jsx";
import MultiSelectFilter from "../components/filters/MultiSelectFilter.jsx";
import RightSheet from "../components/sheets/RightSheet.jsx";
import NewProjectForm from "../components/forms/NewProjectForm.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import Toast from "../components/Toast.jsx";
import useBA from "../services/state.js";
import { api } from "../services/api.js";

export default function AssignmentPage() {
  const {
    assignmentRows,
    assignmentRowsFiltrados,
    filtrosAssignment, 
    setFiltroAssignment,
    refreshMock, 
    deleteProject
  } = useBA();

  const [openNewProject, setOpenNewProject] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, project: null });
  const [toast, setToast] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado local específico para AssignmentPage
  const [assignmentProjects, setAssignmentProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  // Cargar proyectos específicamente para AssignmentPage
  const loadAssignmentProjects = async () => {
    setLoading(true);
    try {
      console.log("🔄 Cargando proyectos para AssignmentPage...");
      
      // Intenta primero con el endpoint específico
      let response;
      try {
        response = await api.get('/projects/with-assignments');
        console.log("✅ Proyectos cargados:", response.data);
      } catch (error) {
        console.log("⚠️  Endpoint específico falló, usando endpoint básico");
        response = await api.get('/projects');
        // Transformar datos del endpoint básico
        response.data = {
          projects: response.data.map(project => ({
            id: project.id,
            nombre: project.name,
            classification: project.classification,
            phase: project.phase,
            complexity: project.complexity,
            has_resource: project.has_resource ? "Sí" : "No"
          }))
        };
      }

      const projects = response.data.projects || [];
      console.log("📊 Proyectos disponibles:", projects);
      
      setAssignmentProjects(projects);
      setFilteredProjects(projects);
      
    } catch (error) {
      console.error('❌ Error cargando proyectos:', error);
      setToast({
        message: "Error cargando proyectos",
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    loadAssignmentProjects();
  }, []);

  // OPCIONES DE FILTRO BASADAS EN LA BASE DE DATOS
  const opcionesFase = useMemo(() => [
    "Viabilidad",
    "Planeación PY", 
    "Ejecución",
    "Cierre PY",
    "Planeación Estratégica",
    "Monitoreo a la Estrategia",
    "Levantamiento estratégico",
    "Despliegue Estratégico",
    "Alineación",
    "Gestión"
  ], []);

  const opcionesClasificacion = useMemo(() => [
    "Anteproyecto",
    "Proyecto",
    "Estrategia",
    "Admon"
  ], []);

  const opcionesComplejidad = useMemo(() => [
    "Alta", "Media", "Baja"
  ], []);

  const opcionesRecurso = useMemo(() => [
    "Todos", "Sí", "No"
  ], []);

  // Aplicar filtros locales
  useEffect(() => {
    if (assignmentProjects.length === 0) return;

    let filtrados = [...assignmentProjects];

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

    // Filtrar por búsqueda
    if (busqueda) {
      filtrados = filtrados.filter(project => 
        project.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        project.classification?.toLowerCase().includes(busqueda.toLowerCase()) ||
        project.phase?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    setFilteredProjects(filtrados);
  }, [assignmentProjects, filtrosAssignment, busqueda]);

  // Estadísticas para mostrar
  const estadisticas = useMemo(() => {
    const totalProyectos = assignmentProjects.length;
    const proyectosFiltrados = filteredProjects.length;
    
    // Contar por clasificación
    const porClasificacion = {};
    opcionesClasificacion.forEach(clasif => {
      porClasificacion[clasif] = filteredProjects.filter(p => p.classification === clasif).length;
    });

    // Contar por fase
    const porFase = {};
    opcionesFase.forEach(fase => {
      porFase[fase] = filteredProjects.filter(p => p.phase === fase).length;
    });

    return {
      totalProyectos,
      proyectosFiltrados,
      porClasificacion,
      porFase,
      filtrosActivos: 
        (filtrosAssignment.phase && filtrosAssignment.phase.length > 0) ||
        (filtrosAssignment.classification && filtrosAssignment.classification.length > 0) ||
        (filtrosAssignment.complexity && filtrosAssignment.complexity.length > 0) ||
        filtrosAssignment.has_resource !== "Todos" ||
        busqueda
    };
  }, [assignmentProjects, filteredProjects, filtrosAssignment, busqueda, opcionesClasificacion, opcionesFase]);

  const handleDeleteProject = async (project) => {
    setConfirmModal({
      isOpen: true,
      project,
      type: 'danger',
      title: 'Eliminar Proyecto',
      message: `¿Estás seguro de que quieres eliminar el proyecto "${project.nombre}"? 
      
Esta acción eliminará:
• El proyecto "${project.nombre}"
• Todas las asignaciones asociadas
• Todas las semanas de asignación

⚠️ Esta acción no se puede deshacer.`
    });
  };

  const confirmDeleteProject = async () => {
    if (!confirmModal.project) return;
    
    const result = await deleteProject(confirmModal.project.id);
    setConfirmModal({ isOpen: false, project: null });
    
    if (result.success) {
      setToast({
        message: `${result.message}`,
        type: 'success'
      });
      // Recargar proyectos después de eliminar
      loadAssignmentProjects();
    } else {
      setToast({
        message: `${result.message}`,
        type: 'error'
      });
    }
  };

  // Manejar nuevo proyecto
  const handleNewProjectCreated = () => {
    setOpenNewProject(false);
    loadAssignmentProjects();
  };

  return (
    <section className="space-y-6">
      {/* Header con estadísticas y filtros */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          <div>
            <span className="text-lg font-semibold text-gray-900">Gestión de Proyectos</span>
            <p className="text-sm text-gray-600 mt-1">
              {estadisticas.proyectosFiltrados} de {estadisticas.totalProyectos} proyectos
              {filtrosAssignment.phase?.length > 0 && ` · Fases: ${filtrosAssignment.phase.length} seleccionadas`}
              {filtrosAssignment.classification?.length > 0 && ` · Clasificaciones: ${filtrosAssignment.classification.length} seleccionadas`}
              {filtrosAssignment.complexity?.length > 0 && ` · Complejidades: ${filtrosAssignment.complexity.length} seleccionadas`}
              {filtrosAssignment.has_resource !== "Todos" && ` · Con recurso: ${filtrosAssignment.has_resource}`}
              {busqueda && ` · Búsqueda: "${busqueda}"`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="btn btn-primary flex items-center gap-2"
              onClick={() => setOpenNewProject(true)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cargando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Proyecto
                </>
              )}
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar proyecto por nombre, fase o clasificación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50"
              disabled={loading}
            />
            <svg 
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filtros principales */}
        <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MultiSelectFilter
            label="Fase"
            value={filtrosAssignment.phase || []}
            onChange={(v) => setFiltroAssignment("phase", v)}
            options={opcionesFase}
            placeholder="Seleccionar fases..."
            disabled={loading}
          />
          
          <MultiSelectFilter
            label="Clasificación"
            value={filtrosAssignment.classification || []}
            onChange={(v) => setFiltroAssignment("classification", v)}
            options={opcionesClasificacion}
            placeholder="Seleccionar clasificaciones..."
            disabled={loading}
          />
          
          <MultiSelectFilter
            label="Complejidad"
            value={filtrosAssignment.complexity || []}
            onChange={(v) => setFiltroAssignment("complexity", v)}
            options={opcionesComplejidad}
            placeholder="Seleccionar complejidades..."
            disabled={loading}
          />

          <SelectFilter
            label="Con recurso"
            value={filtrosAssignment.has_resource || "Todos"}
            onChange={(v) => setFiltroAssignment("has_resource", v)}
            options={opcionesRecurso}
            disabled={loading}
          />
        </div>

        {/* Botón para limpiar filtros */}
        {estadisticas.filtrosActivos && (
          <div className="p-6 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Filtros activos: 
                {filtrosAssignment.phase?.length > 0 && ` Fases (${filtrosAssignment.phase.length})`}
                {filtrosAssignment.classification?.length > 0 && ` Clasificaciones (${filtrosAssignment.classification.length})`}
                {filtrosAssignment.complexity?.length > 0 && ` Complejidades (${filtrosAssignment.complexity.length})`}
                {filtrosAssignment.has_resource !== "Todos" && ` Recurso: ${filtrosAssignment.has_resource}`}
                {busqueda && ` Búsqueda: "${busqueda}"`}
              </span>
              <button 
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors disabled:opacity-50"
                onClick={() => {
                  setFiltroAssignment("phase", []);
                  setFiltroAssignment("classification", []);
                  setFiltroAssignment("complexity", []);
                  setFiltroAssignment("has_resource", "Todos");
                  setBusqueda("");
                }}
                disabled={loading}
              >
                Limpiar Todos los Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumen de proyectos */}
      {filteredProjects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredProjects.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          {Object.entries(estadisticas.porClasificacion).map(([clasif, count]) => (
            <div key={clasif} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{clasif}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla de proyectos */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          <span className="font-semibold text-gray-900">Lista de Proyectos</span>
          <span className="text-sm text-gray-500">
            {filteredProjects.length} proyectos mostrados
            {loading && " (cargando...)"}
          </span>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2">Cargando proyectos...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {estadisticas.filtrosActivos || busqueda 
                ? "No hay proyectos que coincidan con los filtros aplicados" 
                : "No hay proyectos registrados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Proyecto</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Fase</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Clasificación</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Complejidad</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Con Recurso</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{project.nombre}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {project.phase || "Sin fase"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {project.classification || "Sin clasificación"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {project.complexity || "Sin complejidad"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          project.has_resource === "Sí" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-800"
                        }`}>
                          {project.has_resource || "No"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleDeleteProject(project)}
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded transition-all duration-200"
                          title="Eliminar proyecto"
                          disabled={loading}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Sheet: Nuevo Proyecto */}
      <RightSheet
        title="Nuevo proyecto"
        open={openNewProject}
        onClose={() => setOpenNewProject(false)}
        footer={null}
        size="lg"
      >
        <NewProjectForm 
          onClose={handleNewProjectCreated}
        />
      </RightSheet>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, project: null })}
        onConfirm={confirmDeleteProject}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Eliminar Proyecto"
        type="danger"
      />

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}