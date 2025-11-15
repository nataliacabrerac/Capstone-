import { useMemo, useState, useEffect } from "react";
import { createProject, getResources } from "../../services/api";

// Todas las opciones basadas en nuestro sistema real
const CLASIFICACIONES = ["Proyecto", "Anteproyecto", "Estrategia", "Admon"];
const FASES = [
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
];
const COMPLEJIDADES = ["Alta", "Media", "Baja"];

export default function NewProjectForm({ onClose }) {
  const [form, setForm] = useState({
    nombre: "",
    classification: CLASIFICACIONES[0],
    phase: FASES[0],
    complexity: COMPLEJIDADES[1], // Media por defecto
    has_resource: false // Cambiado a false por defecto
  });

  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar recursos disponibles
  useEffect(() => {
    async function loadResources() {
      try {
        const rs = await getResources();
        setResources(rs || []);
        if (rs?.[0]) setSelectedResource(String(rs[0].id));
      } catch (err) {
        console.error("Error cargando recursos:", err);
      }
    }
    loadResources();
  }, []);

  const canSubmit = useMemo(() => {
    const baseValidation = form.nombre.trim().length > 0 && 
      form.classification && 
      form.phase && 
      form.complexity;
    
    // Si requiere recursos, debe tener un recurso seleccionado
    if (form.has_resource) {
      return baseValidation && selectedResource;
    }
    
    return baseValidation;
  }, [form.nombre, form.classification, form.phase, form.complexity, form.has_resource, selectedResource]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    setError(""); // Limpiar error al cambiar campos
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const projectData = {
        name: form.nombre.trim(),
        classification: form.classification,
        phase: form.phase,
        complexity: form.complexity,
        has_resource: form.has_resource,
      };

      // Solo incluir el recurso si está seleccionado
      if (form.has_resource && selectedResource) {
        projectData.resource_id = Number(selectedResource);
      }

      await createProject(projectData);
      
      // Cerrar el formulario y recargar la lista de proyectos
      onClose?.();
      
    } catch (err) {
      console.error("Error creando proyecto:", err);
      setError(err?.response?.data?.detail || err.message || "Error al crear el proyecto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Campo Nombre */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-gray-700">
          Nombre del proyecto <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={form.nombre}
          onChange={handleChange("nombre")}
          placeholder="Ej. Implementación NIIF 9, Sistema de Gestión Documental..."
          autoFocus
          required
          disabled={loading}
        />
      </div>

      {/* Campos en grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Clasificación */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Clasificación <span className="text-red-500">*</span>
          </label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.classification} 
            onChange={handleChange("classification")}
            disabled={loading}
          >
            {CLASIFICACIONES.map((clasif) => (
              <option key={clasif} value={clasif}>
                {clasif}
              </option>
            ))}
          </select>
        </div>

        {/* Fase */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Fase <span className="text-red-500">*</span>
          </label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.phase} 
            onChange={handleChange("phase")}
            disabled={loading}
          >
            {FASES.map((fase) => (
              <option key={fase} value={fase}>
                {fase}
              </option>
            ))}
          </select>
        </div>

        {/* Complejidad */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700">
            Complejidad <span className="text-red-500">*</span>
          </label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.complexity} 
            onChange={handleChange("complexity")}
            disabled={loading}
          >
            {COMPLEJIDADES.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
        </div>

        {/* Con Recurso - Ahora ocupa toda la fila cuando está activo */}
        <div className={`grid gap-2 ${form.has_resource ? 'md:col-span-2' : ''}`}>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="has_resource"
              checked={form.has_resource}
              onChange={handleChange("has_resource")}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="has_resource" className="ml-2 text-sm font-medium text-gray-700">
              Requiere asignación de recursos
            </label>
          </div>
          
          {/* Selector de recursos que aparece solo cuando la casilla está activa */}
          {form.has_resource && (
            <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg transition-all duration-300">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Seleccionar recurso <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={selectedResource} 
                onChange={(e) => setSelectedResource(e.target.value)}
                required={form.has_resource}
                disabled={loading}
              >
                <option value="">Selecciona un recurso...</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-2">
                💡 El recurso seleccionado será asignado automáticamente al proyecto
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            {form.has_resource 
              ? "El proyecto tendrá un recurso asignado inicialmente" 
              : "El proyecto no tendrá recursos asignados inicialmente"}
          </p>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Información de validación */}
      <div className="p-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
        <strong>Nota:</strong> Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
        La clasificación y complejidad determinan el porcentaje de asignación automática.
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button 
          type="button" 
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creando...
            </div>
          ) : (
            "Crear Proyecto"
          )}
        </button>
      </div>
    </form>
  );
}