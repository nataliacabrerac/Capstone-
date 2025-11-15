const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

function mondayOf(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = d.getUTCDay();             // 0=Dom, 1=Lun, ...
  const delta = (dow === 0 ? 6 : dow - 1);
  d.setUTCDate(d.getUTCDate() - delta);  // retrocede hasta lunes
  return d;
}

export function labelToMonday(label) {
  // "Agosto_25:Sem 2"
  const [mesPart, semPart] = label.split(":");
  const [mesNombre, yy] = mesPart.split("_");
  const sem = parseInt(semPart.replace(/\D+/g, ""), 10);

  const monthIndex = MESES.indexOf(mesNombre);
  if (monthIndex < 0) throw new Error("Mes inválido en label");
  const fullYear = 2000 + parseInt(yy, 10);

  const firstOfMonth = new Date(Date.UTC(fullYear, monthIndex, 1));
  const firstMonday = mondayOf(firstOfMonth);
  const monday = new Date(firstMonday);
  monday.setUTCDate(firstMonday.getUTCDate() + (sem - 1) * 7);

  return monday.toISOString().slice(0, 10); // YYYY-MM-DD
}
