import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../services/api"; // Ajusta la ruta según tu estructura

const Tile = ({ to, title, subtitle, onClick, isButton = false }) => (
  isButton ? (
    <button 
      onClick={onClick}
      className="card p-6 hover:shadow-lg transition cursor-pointer w-full text-left"
    >
      <div className="text-xl font-semibold mb-1">{title}</div>
      <div className="text-slate-500">{subtitle}</div>
    </button>
  ) : (
    <Link to={to} className="card p-6 hover:shadow-lg transition">
      <div className="text-xl font-semibold mb-1">{title}</div>
      <div className="text-slate-500">{subtitle}</div>
    </Link>
  )
);

export default function HomePage() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleImportExcel = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    setImportResult({
      type: 'error',
      message: '❌ Formato no válido',
      details: 'Solo se permiten archivos Excel (.xlsx, .xls)'
    });
    return;
  }

  setImporting(true);
  setImportResult(null);

  try {
    const formData = new FormData();
    formData.append('file', file);

    // URL CORREGIDA - maneja correctamente la base URL
    let baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    
    // Asegurar que la base URL no termine con /api si ya lo tiene
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.replace('/api', '');
    }
    
    const response = await fetch(`${baseUrl}/api/import/excel`, {
      method: 'POST',
      body: formData,
    });

    console.log('Uploading to:', `${baseUrl}/api/import/excel`);
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response result:', result);
    
    if (response.ok) {
      setImportResult({
        type: 'success',
        message: `✅ Importación exitosa!`,
        details: `Proyectos: ${result.stats?.projects_created || 0}, Recursos: ${result.stats?.resources_created || 0}, Asignaciones: ${result.stats?.assignments_created || 0}, Semanas: ${result.stats?.weeks_created || 0}`
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setImportResult({
        type: 'error',
        message: '❌ Error en importación',
        details: result.detail || result.message || 'Error desconocido'
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    setImportResult({
      type: 'error',
      message: '❌ Error de conexión',
      details: error.message
    });
  } finally {
    setImporting(false);
    event.target.value = '';
  }
};

  return (
    <div className="space-y-6">
      {/* Resultado de importación */}
      {importResult && (
        <div className={`p-4 rounded-lg ${
          importResult.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="font-semibold">{importResult.message}</div>
          <div className="text-sm mt-1">{importResult.details}</div>
        </div>
      )}

      {/* Grid de opciones */}
      <div className="grid gap-4 md:grid-cols-2">
        <Tile 
          to="/capacidad" 
          title="Capacidad de Recursos" 
          subtitle="% por semana y por recurso, filtrable por Mes/Clasifica." 
        />
        <Tile 
          to="/recursos-vs" 
          title="Recursos vs PM y PRO" 
          subtitle="Matriz por mes y tipo con total general." 
        />
        <Tile 
          to="/asignacion" 
          title="Asignación PM y PRO" 
          subtitle="Proyectos/Área vs Semanas, con filtros de estado y recurso." 
        />
        
        {/* Botón para importar Excel */}
        <div className="relative">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={importing}
          />
          <Tile
            title={importing ? "Importando..." : "Importar Excel"}
            subtitle="Cargar datos desde archivo Excel"
            isButton={true}
          />
        </div>
      </div>

      {/* Estado de carga */}
      {importing && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Procesando archivo...</span>
        </div>
      )}
    </div>
  );
}
