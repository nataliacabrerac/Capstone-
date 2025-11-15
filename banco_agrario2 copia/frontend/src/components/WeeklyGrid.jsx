// src/components/WeeklyGrid.jsx
import React, { useState, useMemo, useEffect } from "react";

/**
 * WeeklyGrid (tabla semanal con ventana y flechas)
 *
 * Props:
 * - weeks: string[]                             // labels "Mes_yy:Sem n"
 * - rows: any[]                                 // [{ ... , values: { [week]: number|string } }]
 * - windowSize?: number                         // columnas visibles (default 5)
 * - getRowKey?: (row)=>string
 * - renderLeft?: (row|null)=>ReactNode[]        // celdas fijas de la izquierda
 * - leftWidths?: string[]                       // ej ["w-[18rem]","w-[6rem]"]
 * - leftStickyOffsets?: string[]                // ej ["left-0","left-[18rem]"]
 * - getValue?: (row, week)=> number|string
 * - colorClass?: (value)=>string                // por defecto: umbrales de CARGA (>=80 rojo, >=50 amarillo, else verde)
 * - formatAsPercent?: boolean                   // si true, formatea 15 -> "15%"
 */
export default function WeeklyGrid({
  weeks = [],
  rows = [],
  windowSize = 4,
  getRowKey = (r) => r?.id ?? Math.random().toString(36).slice(2),
  renderLeft = (r) => (r ? [r.nombre, r.area] : ["NOMBRE", "ÁREA"]),
  leftWidths = ["w-[18rem]", "w-[6rem]"],
  leftStickyOffsets = ["left-0", "left-[18rem]"],
  getValue = (r, w) => r?.values?.[w] ?? r?.data?.[w] ?? "0%",
  // === Por defecto ahora colorea por CARGA: 100–80 rojo, 80–50 amarillo, <50 verde
  colorClass = (v) => {
    const n = parseInt(String(v).replace("%", "")) || 0;
    return n >= 80
      ? "bg-red-100 text-red-700 border border-red-200"
      : n >= 50
      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
      : "bg-green-100 text-green-700 border border-green-200";
  },
  formatAsPercent = true,
}) {
  const [startIdx, setStartIdx] = useState(0);
  const maxStart = Math.max(0, weeks.length - windowSize);
  const endIdx = Math.min(startIdx + windowSize, weeks.length);
  const visibleWeeks = weeks.slice(startIdx, endIdx);

  useEffect(() => {
    if (startIdx > maxStart) setStartIdx(maxStart);
  }, [weeks.length, windowSize, maxStart, startIdx]);

  const prevBlock = () => setStartIdx((i) => Math.max(0, i - windowSize));
  const nextBlock = () => setStartIdx((i) => Math.min(maxStart, i + windowSize));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prevBlock();
      if (e.key === "ArrowRight") nextBlock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxStart]);

  const shortLabel = (w) => {
    const [mes, sem] = String(w).split(":");
    const [m, yy] = (mes || "").split("_");
    return `${(m || "").slice(0, 3)}-${yy}:${(sem || "").replace("Sem ", "S")}`;
  };

  const formatPercent = (v) => {
    if (v == null) return "0%";
    const s = String(v).trim();
    if (s.endsWith("%")) return s;
    const n = Number(s);
    return Number.isFinite(n) ? `${n}%` : s;
  };
  const renderValue = (raw) => (formatAsPercent ? formatPercent(raw) : String(raw));

  const monthBreaks = useMemo(() => {
    const s = new Set();
    for (let i = startIdx + 1; i < endIdx; i++) {
      const [m1] = weeks[i - 1]?.split(":")[0]?.split("_") ?? [""];
      const [m2] = weeks[i]?.split(":")[0]?.split("_") ?? [""];
      if (m1 !== m2) s.add(i - startIdx);
    }
    return s;
  }, [weeks, startIdx, endIdx]);

  const renderLeftHeaderCells = () => {
    const headerNodes = renderLeft(null) || [];
    return headerNodes.map((node, idx) => (
      <th
        key={`h-left-${idx}`}
        className={`sticky ${leftStickyOffsets[idx] || "left-0"} ${leftWidths[idx] || "w-[10rem]"} px-3 py-2 text-left bg-gray-50 text-gray-700 z-20`}
      >
        {node}
      </th>
    ));
  };
  const renderLeftRowCells = (row) => {
    const nodes = renderLeft(row) || [];
    return nodes.map((node, idx) => (
      <td
        key={`c-left-${idx}`}
        className={`sticky ${leftStickyOffsets[idx] || "left-0"} ${leftWidths[idx] || "w-[10rem]"} px-3 py-2 bg-white z-10 ${idx === 0 ? "font-medium" : "text-gray-600"}`}
      >
        {node}
      </td>
    ));
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <button className="btn btn-ghost" onClick={prevBlock} disabled={startIdx === 0}>
          ◀ Anterior
        </button>
        <span className="text-sm text-gray-600">
          Semanas {startIdx + 1}–{endIdx} de {weeks.length}
        </span>
        <button className="btn btn-ghost" onClick={nextBlock} disabled={endIdx >= weeks.length}>
          Siguiente ▶
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {renderLeftHeaderCells()}
              {visibleWeeks.map((w, idx) => (
                <th key={w} className="px-2 py-2 text-center relative text-gray-700">
                  {shortLabel(w)}
                  {monthBreaks.has(idx) && (
                    <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 h-6 w-px bg-gray-300" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={getRowKey(r)} className="border-t">
                {renderLeftRowCells(r)}
                {visibleWeeks.map((w) => {
                  const raw = getValue(r, w);
                  return (
                    <td key={w} className="px-2 py-2 text-center">
                      <span className={`rounded-xl px-3 py-1 ${colorClass(raw)}`}>
                        {renderValue(raw)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
