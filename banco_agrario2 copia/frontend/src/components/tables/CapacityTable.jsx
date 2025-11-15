import ProgressCell from "../ProgressCell.jsx";

export default function CapacityTable({ weeks, rows }) {
  // rows: [{clasifica, recurso, data: {'Ago_25:Sem1': 15, ...}}]
  return (
    <div className="card overflow-x-auto">
      <div className="card-body">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">CLASIF.</th>
              <th className="text-left p-2">RECURSO</th>
              {weeks.map(w => (
                <th key={w} className="p-2 text-center">{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{r.clasifica}</td>
                <td className="p-2 font-medium">{r.recurso}</td>
                {weeks.map(w => (
                  <td key={w} className="p-1"><ProgressCell pct={r.data[w] ?? 0} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
