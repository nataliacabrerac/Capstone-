// src/components/ResourceQuickSearch.jsx
import { useMemo, useState } from "react";
import useBA from "../services/state";

// Mini Gauge (muestra % de DISPONIBILIDAD promedio)
function MiniGauge({ value = 0, size = 56 }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;

  // colores por DISPONIBILIDAD (más libre = más verde)
  const color =
    clamped <= 10 ? "#ef4444"   // muy poca disponibilidad
    : clamped <= 25 ? "#f59e0b" // baja
    : "#10b981";                // buena

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" strokeWidth="8" fill="none" />
      <circle
        cx={size/2} cy={size/2} r={r}
        stroke={color} strokeWidth="8" fill="none"
        strokeDasharray={`${dash} ${c-dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#111827">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

/**
 * Buscador rápido de recursos con DISPONIBILIDAD promedio (próximas N semanas).
 * Tolerante a estados vacíos o en carga.
 */
export default function ResourceQuickSearch({
  windowWeeks = 5,
  placeholder = "Buscar recurso…",
}) {
  const { availabilityWeeks, availabilityResources } = useBA();
  const [q, setQ] = useState("");

  // Protecciones contra undefined
  const weeksSafe = Array.isArray(availabilityWeeks) ? availabilityWeeks : [];
  const resourcesSafe = Array.isArray(availabilityResources) ? availabilityResources : [];

  const targetWeeks = useMemo(
    () => weeksSafe.slice(0, Math.max(0, Number(windowWeeks) || 0)),
    [weeksSafe, windowWeeks]
  );

  const rows = useMemo(() => {
    const norm = (s) =>
      String(s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    const nq = norm(q);
    return resourcesSafe
      .filter((r) => !nq || norm(r.recurso).includes(nq))
      .map((r) => {
        const vals = targetWeeks.map((w) => Number(r?.availabilityByWeek?.[w] ?? 0));
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return { recurso: r.recurso, avg };
      })
      .sort((a, b) => a.recurso.localeCompare(b.recurso));
  }, [resourcesSafe, targetWeeks, q]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="input w-full"
        />
        <span className="text-xs text-gray-500">
          Promedio {targetWeeks.length} sem
        </span>
      </div>

      {q && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ recurso, avg }) => (
            <div key={recurso} className="flex items-center gap-3 rounded-xl border bg-white p-3">
              <MiniGauge value={avg} />
              <div>
                <div className="font-medium">{recurso}</div>
                <div className="text-xs text-gray-500">
                  Disponibilidad promedio próximas {targetWeeks.length} semanas
                </div>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="text-gray-500 text-sm px-1">
              {resourcesSafe.length === 0
                ? "Esperando datos de disponibilidad…"
                : "Sin coincidencias."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
