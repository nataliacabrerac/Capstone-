// src/components/MonthlyGrid.jsx  ⭐️ NUEVO
import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const shortMonth = (m) => {
  // "Agosto_25" -> "Ago-25"
  const [mes, yy] = String(m).split("_");
  return `${mes.slice(0,3)}-${yy}`;
};

const formatPercent = (v) => {
  const s = String(v ?? "0").trim();
  if (s.endsWith("%")) return s;
  const n = Number(s);
  return Number.isFinite(n) ? `${n}%` : s;
};

export default function MonthlyGrid({
  months,                // array de meses
  rows,                  // [{ tipo, values: { [month]: number }, isTotal? }]
  windowSize = 5,
  getRowKey = (r) => r.tipo,
  renderLeft = (r) => [r.tipo],
  leftWidth = "w-[14rem]",
  getValue = (r, m) => r.values?.[m] ?? 0,
  isTotalRow = (r) => !!r.isTotal,
}) {
  const [startIdx, setStartIdx] = useState(0);
  const maxStart = Math.max(0, months.length - windowSize);
  const endIdx   = Math.min(startIdx + windowSize, months.length);
  const visible  = months.slice(startIdx, endIdx);

  useEffect(() => {
    if (startIdx > maxStart) setStartIdx(maxStart);
  }, [months.length, windowSize, maxStart, startIdx]);

  const prevBlock = () => setStartIdx(i => Math.max(0, i - windowSize));
  const nextBlock = () => setStartIdx(i => Math.min(maxStart, i + windowSize));

  const cellClass = (n, total=false) => {
    // n puede ser % o número; si es número lo mostramos como %
    const v = parseFloat(n);
    const base = total ? "font-semibold" : "";
    if (isNaN(v)) return base;

    // Escala de color suave por % (asumiendo 0..100)
    if (v >= 100) return `${base} bg-red-100 text-red-700 border border-red-200 rounded-xl px-3 py-1`;
    if (v >= 80)  return `${base} bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-xl px-3 py-1`;
    return `${base} bg-green-100 text-green-700 border border-green-200 rounded-xl px-3 py-1`;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <button className="btn btn-ghost flex items-center gap-1" onClick={prevBlock} disabled={startIdx === 0}>
          <ChevronLeft size={18} /> Anterior
        </button>
        <span className="text-sm text-gray-600">Meses {startIdx + 1}–{endIdx} de {months.length}</span>
        <button className="btn btn-ghost flex items-center gap-1" onClick={nextBlock} disabled={endIdx >= months.length}>
          Siguiente <ChevronRight size={18} />
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className={`sticky left-0 px-3 py-2 text-left ${leftWidth}`}>
                {renderLeft(null)?.[0] ?? "TIPO"}
              </th>
              {visible.map((m) => (
                <th key={m} className="px-2 py-2 text-center">{shortMonth(m)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const total = isTotalRow(r);
              return (
                <tr key={getRowKey(r)} className="border-t">
                  <td className={`sticky left-0 bg-white px-3 py-2 ${total ? "font-semibold" : "font-medium"}`}>
                    {renderLeft(r)?.[0]}
                  </td>
                  {visible.map((m) => {
                    const v = getValue(r, m);
                    return (
                      <td key={m} className="px-2 py-2 text-center">
                        <span className={cellClass(v, total)}>{formatPercent(v)}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
