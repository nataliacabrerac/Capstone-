export default function ProgressCell({ pct }) {
    const n = typeof pct === "number" ? pct : 0;
    // color: verde a rojo según carga
    const bg = n <= 80 ? "bg-green-100" : n <= 100 ? "bg-yellow-100" : "bg-red-100";
    const txt = n <= 80 ? "text-green-700" : n <= 100 ? "text-yellow-700" : "text-red-700";
    return (
      <div className={`min-w-[72px] text-center rounded-lg ${bg} ${txt} px-2 py-1`}>
        {n.toFixed(0)}%
      </div>
    );
  }
  