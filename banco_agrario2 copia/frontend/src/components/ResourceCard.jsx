import CircularGauge from "./CircularGauge";

export default function ResourceCard({ name, availability, onClick }) {
  // disponibilidad promedio de las próximas N semanas
  const values = Object.values(availability || {});
  const avg = values.length ? values.reduce((a,b)=>a+b,0) / values.length : 0;

  return (
    <button onClick={onClick} className="card p-4 text-left hover:shadow-lg transition w-full">
      <div className="flex items-center gap-4">
        <CircularGauge value={avg} size={72} stroke={10} label="prom." />
        <div>
          <div className="text-base font-semibold">{name}</div>
          <div className="text-xs text-slate-500">Disponibilidad promedio próximas semanas</div>
        </div>
      </div>
    </button>
  );
}
