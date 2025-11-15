import { useEffect, useState, useMemo, useRef  } from "react";
import useBA from "../services/state";
import ResourceCard from "../components/ResourceCard";
import ResourceDrawer from "../components/ResourceDrawer";


export default function AvailabilityPage() {
  const {
    refreshMock, // cambia por fetch real cuando esté el backend
    availabilityWeeks,
    availabilityResources,
    filtros, setFiltro,
  } = useBA();

const bootedRef = useRef(false);
useEffect(() => {
  if (bootedRef.current) return;
  bootedRef.current = true;
  refreshMock(); // (ya apunta a refreshData real)
}, []);

  // filtro simple por texto (nombre del recurso)
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return availabilityResources;
    return availabilityResources.filter(r => r.recurso.toLowerCase().includes(ql));
  }, [availabilityResources, q]);

  // drawer
  const [selected, setSelected] = useState(null);

  return (
    <section className="space-y-4">
      <div className="card">
        <div className="card-header">Disponibilidad de Recursos</div>
        <div className="card-body grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 md:col-span-1">
            <span className="text-sm font-medium text-slate-600">Buscar recurso</span>
            <input className="input" placeholder="Ej. Catalina, Luis Eduardo..."
                   value={q} onChange={(e)=>setQ(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map(r => (
          <ResourceCard
            key={r.recurso}
            name={r.recurso}
            availability={r.availabilityByWeek}
            onClick={()=>setSelected(r)}
          />
        ))}
      </div>

      <ResourceDrawer
        open={!!selected}
        onClose={()=>setSelected(null)}
        resource={selected}
        weeks={availabilityWeeks}
      />
    </section>
  );
}
