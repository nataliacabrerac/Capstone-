import React, { useMemo, useState, useEffect } from "react";

export default function TimeGridWeekly({
  rows,            // [{ clasif|clasifica, recurso|nombre, values|data: { [weekLabel]: "15%" } }, ...]
  weeks,           // ["Agosto_25:Sem 1", "Agosto_25:Sem 2", ...]  (ORDENADAS y CONTINUAS)
  windowSize = 5   // cantidad de semanas visibles
}) {
  const [startIdx, setStartIdx] = useState(0);
  const maxStart = Math.max(0, (weeks?.length || 0) - windowSize);
  const endIdx = Math.min(startIdx + windowSize, weeks?.length || 0);
  const visibleWeeks = weeks.slice(startIdx, endIdx);

  // reajusta si cambian datos o tamaño de ventana
  useEffect(() => {
    if (startIdx > maxStart) setStartIdx(maxStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks.length, windowSize]);

  // separadores de mes (solo visual)
  const weekSeparatorIdx = useMemo(() => {
    const out = new Set();
    for (let i = startIdx + 1; i < endIdx; i++) {
      const [m1] = weeks[i - 1].split(":")[0].split("_");
      const [m2] = weeks[i].split(":")[0].split("_");
      if (m1 !== m2) out.add(i - startIdx);
    }
    return out;
  }, [weeks, startIdx, endIdx]);

  // Colores (si tus celdas son DISPONIBILIDAD, invierte reglas)
  const colorClass = (pct) => {
    const n = parseInt(String(pct).replace("%", "")) || 0; // % de CARGA
    return n >= 100 ? "bg-red-100 text-red-700"
         : n >= 80  ? "bg-yellow-100 text-yellow-700"
         :            "bg-green-100 text-green-700";
  };

  // navegación
  const prevOne   = () => setStartIdx(i => Math.max(0, i - 1));
  const nextOne   = () => setStartIdx(i => Math.min(maxStart, i + 1));
  const prevBlock = () => setStartIdx(i => Math.max(0, i - windowSize));
  const nextBlock = () => setStartIdx(i => Math.min(maxStart, i + windowSize));

  return (
    <div className="w-full">
      {/* Barra superior (opcional) */}
      <div className="mb-3 flex items-center gap-2">
        <button className="btn btn-ghost" onClick={prevBlock} disabled={startIdx === 0}>⏮︎ {windowSize}</button>
        <button className="btn btn-ghost" onClick={prevOne} disabled={startIdx === 0}>◀ 1</button>
        <div className="flex-1" />
        <span className="text-sm text-gray-500">
          Semanas {startIdx + 1}–{endIdx} / {weeks.length}
        </span>
        <div className="flex-1" />
        <button className="btn btn-ghost" onClick={nextOne} disabled={endIdx >= weeks.length}>1 ▶</button>
        <button className="btn btn-ghost" onClick={nextBlock} disabled={endIdx >= weeks.length}>{windowSize} ⏭︎</button>
      </div>

      <div className="overflow-x-auto border rounded-2xl bg-white">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              {/* columnas fijas de la izquierda */}
              <th className="sticky left-0 bg-white z-20 px-4 py-2 text-left">CLASIF.</th>
              <th className="sticky left-[10rem] bg-white z-20 px-4 py-2 text-left">RECURSO</th>

              {/* NUEVO: columna de control IZQUIERDA (al lado de la primera semana) */}
              <th className="px-1 py-2 text-center w-[3.5rem]">
                <div className="flex items-center justify-center gap-1">
                  <button className="h-7 w-7 rounded-full border text-xs" onClick={prevBlock} disabled={startIdx === 0} title={`Retroceder ${windowSize}`}>⏮︎</button>
                  <button className="h-7 w-7 rounded-full border text-sm" onClick={prevOne}   disabled={startIdx === 0} title="Semana anterior">◀</button>
                </div>
              </th>

              {/* semanas visibles */}
              {visibleWeeks.map((w, idx) => (
                <th key={w} className="px-2 py-2 text-center relative">
                  {w}
                  {weekSeparatorIdx.has(idx) && (
                    <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 h-8 w-px bg-gray-300" />
                  )}
                </th>
              ))}

              {/* NUEVO: columna de control DERECHA (al lado de la última semana) */}
              <th className="px-1 py-2 text-center w-[3.5rem]">
                <div className="flex items-center justify-center gap-1">
                  <button className="h-7 w-7 rounded-full border text-sm" onClick={nextOne}   disabled={endIdx >= weeks.length} title="Semana siguiente">▶</button>
                  <button className="h-7 w-7 rounded-full border text-xs" onClick={nextBlock} disabled={endIdx >= weeks.length} title={`Avanzar ${windowSize}`}>⏭︎</button>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="align-middle">
                <td className="sticky left-0 bg-white z-10 px-4 py-3 border-t">{r.clasif || r.clasifica}</td>
                <td className="sticky left-[10rem] bg-white z-10 px-4 py-3 border-t">{r.recurso || r.nombre}</td>

                {/* celda vacía bajo los controles izquierdos */}
                <td className="px-1 py-2" />

                {visibleWeeks.map((w) => {
                  const val = (r.values?.[w] ?? r.data?.[w] ?? "0%");
                  return (
                    <td key={w} className="px-2 py-2">
                      <div className={`rounded-2xl px-4 py-2 text-center ${colorClass(val)}`}>
                        {val}
                      </div>
                    </td>
                  );
                })}

                {/* celda vacía bajo los controles derechos */}
                <td className="px-1 py-2" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginador inferior (opcional) */}
      <div className="mt-3 flex items-center gap-2">
        <button className="btn btn-ghost" onClick={prevBlock} disabled={startIdx === 0}>⏮︎ {windowSize}</button>
        <button className="btn btn-ghost" onClick={prevOne} disabled={startIdx === 0}>◀ 1</button>
        <button className="btn btn-ghost" onClick={nextOne} disabled={endIdx >= weeks.length}>1 ▶</button>
        <button className="btn btn-ghost" onClick={nextBlock} disabled={endIdx >= weeks.length}>{windowSize} ⏭︎</button>
      </div>
    </div>
  );
}
