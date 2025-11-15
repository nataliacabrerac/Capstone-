import ProgressCell from "../ProgressCell.jsx";

export default function AssignmentTable({ weeks, rows }) {
  // rows: [{nombre, area, data: {'Jul_24:Sem1': 10, ...}}]
  return (
    <div className="card overflow-x-auto">
      <div className="card-body">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">NOMBRE</th>
              <th className="text-left p-2">ÁREA</th>
              {weeks.map(w => <th key={w} className="p-2 text-center">{w}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 font-medium">{r.nombre}</td>
                <td className="p-2">{r.area}</td>
                {weeks.map(w => <td key={w} className="p-1"><ProgressCell pct={r.data[w] ?? 0} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
