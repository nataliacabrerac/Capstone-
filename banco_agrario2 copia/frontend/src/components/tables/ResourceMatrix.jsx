import ProgressCell from "../ProgressCell.jsx";

export default function ResourceMatrix({ months, totals, byType }) {
  // months: ["Ene_26","Feb_26",...]
  // totals: { month: pct }
  // byType: { PRO: {month:pct}, ...}
  return (
    <div className="card overflow-x-auto">
      <div className="card-body">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left">TIPO</th>
              {months.map(m => <th key={m} className="p-2 text-center">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.keys(byType).map(t => (
              <tr key={t} className="border-t">
                <td className="p-2 font-medium">{t}</td>
                {months.map(m => <td key={m} className="p-1"><ProgressCell pct={byType[t][m] ?? 0} /></td>)}
              </tr>
            ))}
            <tr className="border-t font-semibold">
              <td className="p-2">Total general</td>
              {months.map(m => <td key={m} className="p-1"><ProgressCell pct={totals[m] ?? 0} /></td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
