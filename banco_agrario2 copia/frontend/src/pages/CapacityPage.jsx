// src/pages/CapacityPage.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import SelectFilter from "../components/filters/SelectFilter.jsx";
import ChipsFilter from "../components/filters/ChipsFilter.jsx";
import WeeklyGrid from "../components/WeeklyGrid.jsx";
import ResourceQuickSearch from "../components/ResourceQuickSearch.jsx";
import RightSheet from "../components/sheets/RightSheet.jsx";
import NewResourceForm from "../components/forms/NewResourceForm.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import Toast from "../components/Toast.jsx";
import useBA from "../services/state.js";

const colorForLoad = (v) => {
  const n = parseInt(String(v)) || 0;
  return n >= 80
    ? "bg-red-100 text-red-700 border border-red-200"
    : n >= 50
    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
    : "bg-green-100 text-green-700 border border-green-200";
};

export default function CapacityPage() {
  const {
    weeksCapacity, 
    capacityRows,
    capacityRowsFiltrados,
    meses, 
    clasificaciones,
    people,
    filtrosCapacity, 
    setFiltroCapacity,
    refreshMock, 
    deleteResource
  } = useBA();

  const [openNew, setOpenNew] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, resource: null });
  const [toast, setToast] = useState(null);

  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    refreshMock();
  }, []);

  // Usar datos filtrados
  const datosParaMostrar = capacityRowsFiltrados.length > 0 ? capacityRowsFiltrados : capacityRows;

  // CORREGIDO: Filtrar las semanas basado en el mes seleccionado
  const weeksParaMostrar = useMemo(() => {
    if (!filtrosCapacity.mes || filtrosCapacity.mes === "Todos") {
      return weeksCapacity;
    }
    
    // Filtrar semanas que pertenezcan al mes seleccionado
    return weeksCapacity.filter(week => {
      // Asumiendo que el formato de las semanas es "Mes:Semana" o similar
      const [mes] = week.split(':');
      return mes === filtrosCapacity.mes;
    });
  }, [weeksCapacity, filtrosCapacity.mes]);

  // Extraer meses disponibles de los datos
  const mesesDisponibles = useMemo(() => {
    const mesesSet = new Set();
    capacityRows?.forEach(row => {
      Object.keys(row.values || {}).forEach(week => {
        const [mes] = week.split(':');
        mesesSet.add(mes);
      });
    });
    return ["Todos", ...Array.from(mesesSet).sort()];
  }, [capacityRows]);

  // Extraer recursos disponibles
  const recursosDisponibles = useMemo(() => {
    const recursosSet = new Set(capacityRows?.map(row => row.recurso).filter(Boolean));
    return ["Todos", ...Array.from(recursosSet).sort()];
  }, [capacityRows]);

  // Obtener el mes actualmente seleccionado para mostrar
  const mesSeleccionado = useMemo(() => {
    return filtrosCapacity.mes && filtrosCapacity.mes !== "Todos" 
      ? filtrosCapacity.mes 
      : null;
  }, [filtrosCapacity.mes]);

  // Obtener el recurso actualmente seleccionado para mostrar
  const recursoSeleccionado = useMemo(() => {
    return filtrosCapacity.recurso && filtrosCapacity.recurso !== "Todos" 
      ? filtrosCapacity.recurso 
      : null;
  }, [filtrosCapacity.recurso]);

  const handleDeleteResource = (resource) => {
    setConfirmModal({
      isOpen: true,
      resource,
      type: 'danger',
      title: 'Eliminar Recurso',
      message: `¿Estás seguro de que quieres eliminar el recurso "${resource.recurso}"? 
      
Esta acción eliminará:
• El recurso "${resource.recurso}"
• Todas las asignaciones asociadas
• Todas las semanas de asignación

⚠️ Esta acción no se puede deshacer.`
    });
  };

  const confirmDeleteResource = async () => {
    if (!confirmModal.resource) return;
    
    const result = await deleteResource(confirmModal.resource.id);
    setConfirmModal({ isOpen: false, resource: null });
    
    if (result.success) {
      setToast({
        message: `${result.message}`,
        type: 'success'
      });
    } else {
      setToast({
        message: `${result.message}`,
        type: 'error'
      });
    }
  };

  const renderLeftWithDelete = (row) => {
    if (!row) return ["CLASIF.", "RECURSO"];
    
    return [
      <div key="clasifica">{row.clasifica || "Todos"}</div>,
      <div key="recurso" className="flex items-center justify-between w-full group relative">
        <span className="truncate flex-1 pr-8">{row.recurso || "Sin nombre"}</span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteResource(row);
          }}
          className="absolute right-0 opacity-70 hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all duration-200"
          title="Eliminar recurso y todas sus asignaciones"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    ];
  };

  return (
    <section className="space-y-6">
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold">Capacidad de Recursos</span>
            <p className="text-sm text-gray-600 mt-1">
              {/* MOSTRAR EL MES FILTRADO DE FORMA MÁS VISIBLE */}
              {mesSeleccionado ? (
                <span className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                    Mes: {mesSeleccionado}
                  </span>
                  <span>Mostrando {datosParaMostrar.length} de {capacityRows?.length || 0} recursos</span>
                </span>
              ) : (
                <span>Mostrando {datosParaMostrar.length} de {capacityRows?.length || 0} recursos</span>
              )}
              
              {/* MOSTRAR RECURSO FILTRADO SI HAY UNO */}
              {recursoSeleccionado && (
                <span className="ml-2 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                  Recurso: {recursoSeleccionado}
                </span>
              )}
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
              Nuevo Recurso
            </button>
          </div>
        </div>
        
        {/* Filtros mejorados */}
        <div className="card-body grid gap-4 md:grid-cols-3">
          <SelectFilter
            label="Mes"
            value={filtrosCapacity.mes}
            onChange={(v) => setFiltroCapacity("mes", v)}
            options={mesesDisponibles}
          />
          
          <SelectFilter
            label="Recurso"
            value={filtrosCapacity.recurso}
            onChange={(v) => setFiltroCapacity("recurso", v)}
            options={recursosDisponibles}
          />
        </div>

        {/* MOSTRAR INDICADOR DE FILTROS ACTIVOS MÁS VISIBLE */}
        {(mesSeleccionado || recursoSeleccionado) && (
          <div className="card-body grid gap-4 ml-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filtros activos:</span>
                {mesSeleccionado && (
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200">
                    📅 {mesSeleccionado}
                  </span>
                )}
                {recursoSeleccionado && (
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-200">
                    👤 {recursoSeleccionado}
                  </span>
                )}
              </div>
              <button 
                className="btn btn-secondary text-sm"
                onClick={() => {
                  setFiltroCapacity("mes", "Todos");
                  setFiltroCapacity("recurso", "Todos");
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          Buscar recurso (disponibilidad)
          {/* INDICADOR ADICIONAL DEL MES ACTUAL EN EL TÍTULO */}
          {mesSeleccionado && (
            <span className="ml-2 text-sm font-normal text-blue-600">
              - Filtrado por: {mesSeleccionado}
            </span>
          )}
        </div>
        <div className="card-body">
          <ResourceQuickSearch windowWeeks={5} />
        </div>
      </div>

      {/* AÑADIR INDICADOR VISIBLE SOBRE LA TABLA PRINCIPAL */}
      {mesSeleccionado && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-blue-900">Vista filtrada por mes</div>
              <div className="text-sm text-blue-700">
                Mostrando {weeksParaMostrar.length} semanas del mes: <strong>{mesSeleccionado}</strong>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setFiltroCapacity("mes", "Todos")}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            Ver todos los meses
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
      )}

      {/* CORREGIDO: Pasar weeksParaMostrar en lugar de weeksCapacity */}
      <WeeklyGrid
        weeks={weeksParaMostrar} 
        rows={datosParaMostrar} 
        windowSize={4}
        getRowKey={(r) => `${r.clasifica}||${r.recurso}`}
        renderLeft={renderLeftWithDelete}
        leftWidths={["w-[10rem]", "w-[18rem]"]}
        leftStickyOffsets={["left-0", "left-[10rem]"]}
        getValue={(r, w) => r.values?.[w] ?? "0%"}
        colorClass={colorForLoad}
        formatAsPercent={true}
      />

      {/* Resto del código permanece igual */}
      <RightSheet
        title="Nuevo recurso"
        open={openNew}
        onClose={() => setOpenNew(false)}
        footer={null}
      >
        <NewResourceForm onClose={() => setOpenNew(false)} />
      </RightSheet>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, resource: null })}
        onConfirm={confirmDeleteResource}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Eliminar Recurso"
        type="danger"
      />

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