// src/utils/transformExcel.js

/* ============================
   Helpers base
   ============================ */

// Etiqueta "Mes_yy:Sem n"
export const weekKey = (mes, semana) => `${String(mes || "").trim()}:${String(semana || "").trim()}`;

// Mapa de meses ES -> índice
const MONTH_INDEX_ES = {
  "Enero": 0, "Febrero": 1, "Marzo": 2, "Abril": 3, "Mayo": 4, "Junio": 5,
  "Julio": 6, "Agosto": 7, "Septiembre": 8, "Octubre": 9, "Noviembre": 10, "Diciembre": 11,
};

// "Agosto_25" -> { y: 2025, m: 7 }
function parseMesKey(mesStr) {
  if (!mesStr) return { y: 0, m: 0 };
  const [mes, yy] = String(mesStr).split("_");
  const y = 2000 + Number(yy);
  const m = MONTH_INDEX_ES[mes] ?? 0;
  return { y, m };
}
function parseSemana(semStr) {
  const n = String(semStr || "").replace(/[^\d]/g, "");
  return Number(n) || 0;
}

/* ============================
   Línea de tiempo de semanas
   ============================ */

// ←——— ESTA FUNCIÓN ES LA QUE FALTABA
export function computeOrderedWeeks(records) {
  const all = new Set();
  for (const r of records || []) {
    if (r?.MES && r?.SEMANA) all.add(weekKey(r.MES, r.SEMANA));
  }
  return Array.from(all).sort((a, b) => {
    const [ma, sa] = a.split(":");
    const [mb, sb] = b.split(":");
    const A = parseMesKey(ma); const B = parseMesKey(mb);
    if (A.y !== B.y) return A.y - B.y;
    if (A.m !== B.m) return A.m - B.m;
    return parseSemana(sa) - parseSemana(sb);
  });
}

/* ============================
   Pivots existentes
   ============================ */

// Capacidad por (clasifica,recurso) x semana
export function buildCapacityRows(records = []) {
  const rowsMap = new Map();
  const weeksSet = new Set();

  for (const r of records) {
    const cls = (r.CLASIFICA || r.CLASIF || r.CLASIFICAION || r.CLASIFICA || "").toString().trim();
    const rec = (r.RECURSO || "").toString().trim();
    const mes = (r.MES || "").toString().trim();
    const sem = (r.SEMANA || "").toString().trim();
    const pct = Number(String(r["%"] ?? "0").toString().replace("%", "")) || 0;

    const k = `${cls}||${rec}`;
    if (!rowsMap.has(k)) rowsMap.set(k, { clasifica: cls, recurso: rec, values: {} });

    const wk = weekKey(mes, sem);
    weeksSet.add(wk);
    rowsMap.get(k).values[wk] = (rowsMap.get(k).values[wk] || 0) + pct;
  }

  const weeks = Array.from(weeksSet);
  // ordenar con el comparador real de semanas
  const ordered = computeOrderedWeeks(
    weeks.map(w => {
      const [m, s] = w.split(":");
      return { MES: m, SEMANA: s };
    })
  );
  // ordered es un array de labels; mantenemos ese orden
  return { weeks: ordered, rows: Array.from(rowsMap.values()) };
}

// Asignación por NOMBRE x semana
export function buildAssignmentRows(records = []) {
  const rowsMap = new Map();
  const weeksSet = new Set();

  for (const r of records) {
    const nombre = (r.NOMBRE || "").toString().trim();
    const area = (r["ÁREA"] || r.AREA || "").toString().trim();
    const mes = (r.MES || "").toString().trim();
    const sem = (r.SEMANA || "").toString().trim();
    const pct = Number(String(r["%"] ?? "0").toString().replace("%", "")) || 0;

    if (!rowsMap.has(nombre)) rowsMap.set(nombre, { nombre, area, values: {} });
    const wk = weekKey(mes, sem);
    weeksSet.add(wk);
    rowsMap.get(nombre).values[wk] = (rowsMap.get(nombre).values[wk] || 0) + pct;
  }

  const weeks = Array.from(weeksSet);
  const ordered = computeOrderedWeeks(
    weeks.map(w => { const [m, s] = w.split(":"); return { MES: m, SEMANA: s }; })
  );
  return { weeks: ordered, rows: Array.from(rowsMap.values()) };
}

// Matriz mensual por TIPO
export function buildResourceMatrix(records = []) {
  const monthsSet = new Set();
  const byType = {};
  const totals = {};

  for (const r of records) {
    const t = (r.TIPO || "").toString().trim();
    const mes = (r.MES || "").toString().trim();
    const pct = Number(String(r["%"] ?? "0").toString().replace("%", "")) || 0;

    monthsSet.add(mes);
    byType[t] ??= {};
    byType[t][mes] = (byType[t][mes] || 0) + pct;
    totals[mes] = (totals[mes] || 0) + pct;
  }

  const months = Array.from(monthsSet).sort((a,b) => {
    const A = parseMesKey(a); const B = parseMesKey(b);
    if (A.y !== B.y) return A.y - B.y;
    return A.m - B.m;
  });
  return { months, byType, totals };
}

/* ============================
   Disponibilidad por recurso
   ============================ */

export function buildResourceAvailability(records = []) {
  const weeks = computeOrderedWeeks(records);
  const byResource = new Map();

  for (const r of records) {
    const res = (r.RECURSO || "Sin Recurso").toString().trim();
    const wk = weekKey(r.MES || "", r.SEMANA || "");
    const pct = Number(String(r["%"] ?? "0").toString().replace("%", "")) || 0;

    if (!byResource.has(res)) byResource.set(res, { recurso: res, byWeek: {} });
    byResource.get(res).byWeek[wk] = (byResource.get(res).byWeek[wk] || 0) + pct;
  }

  const resources = Array.from(byResource.values()).map(r => {
    const availability = {};
    for (const w of weeks) {
      const load = r.byWeek[w] || 0;
      availability[w] = Math.max(0, 100 - load);
    }
    return {
      recurso: r.recurso,
      loadByWeek: r.byWeek,
      availabilityByWeek: availability,
    };
  });

  return { weeks, resources };
}

/* ============================
   NUEVO: semanal por PERSONA y TIPO
   ============================ */
// Estructura de salida:
// {
//   weeks: [...],
//   types: [...],
//   perResource: {
//     [recurso]: {
//       loadByTypeWeek: { [tipo]: { [week]: number } },
//       availByTypeWeek: { [tipo]: { [week]: number } },
//       projectNamesByType: { [tipo]: string[] },
//       projectCountByTypeWeek: { [tipo]: { [week]: number } },
//     }
//   }
// }

export function computePerResourceTypeWeekly(records = []) {
  const weeks = computeOrderedWeeks(records);
  const typesSet = new Set();
  const perResource = new Map();

  for (const r of records) {
    const recurso = String(r.RECURSO || "Sin Recurso").trim();
    const tipo = String(r.TIPO || "OTRO").trim() || "OTRO";
    const nombre = String(r.NOMBRE || "").trim();
    const wk = weekKey(r.MES || "", r.SEMANA || "");
    const pct = Number(String(r["%"] ?? "0").toString().replace("%", "")) || 0;

    typesSet.add(tipo);
    if (!perResource.has(recurso)) {
      perResource.set(recurso, {
        loadByTypeWeek: {},
        availByTypeWeek: {},
        projectNamesByType: {},
        projectCountByTypeWeek: {},
      });
    }
    const bucket = perResource.get(recurso);

    bucket.loadByTypeWeek[tipo] ??= {};
    bucket.availByTypeWeek[tipo] ??= {};
    bucket.projectNamesByType[tipo] ??= new Set();
    bucket.projectCountByTypeWeek[tipo] ??= {};

    // acumula carga
    bucket.loadByTypeWeek[tipo][wk] = (bucket.loadByTypeWeek[tipo][wk] || 0) + pct;

    // registra proyecto
    if (nombre) bucket.projectNamesByType[tipo].add(nombre);
  }

  // derivar disponibilidad y conteos (aprox por presencia de carga)
  for (const bucket of perResource.values()) {
    for (const [tipo, byWeek] of Object.entries(bucket.loadByTypeWeek)) {
      bucket.availByTypeWeek[tipo] = {};
      bucket.projectCountByTypeWeek[tipo] = {};
      for (const w of weeks) {
        const load = byWeek[w] || 0;
        bucket.availByTypeWeek[tipo][w] = Math.max(0, 100 - load);
        bucket.projectCountByTypeWeek[tipo][w] = load > 0 ? 1 : 0;
      }
    }
  }

  // serializa Sets
  const perResourceObj = {};
  for (const [k, v] of perResource.entries()) {
    const projectNamesByType = {};
    for (const [t, s] of Object.entries(v.projectNamesByType)) {
      projectNamesByType[t] = Array.from(s.values()).sort();
    }
    perResourceObj[k] = {
      loadByTypeWeek: v.loadByTypeWeek,
      availByTypeWeek: v.availByTypeWeek,
      projectNamesByType,
      projectCountByTypeWeek: v.projectCountByTypeWeek,
    };
  }

  return {
    weeks,
    types: Array.from(typesSet),
    perResource: perResourceObj,
  };
}
