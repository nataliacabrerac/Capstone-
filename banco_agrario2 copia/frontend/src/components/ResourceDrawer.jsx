export default function ResourceDrawer({ open, onClose, resource, weeks }) {
    if (!open || !resource) return null;
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute right-0 top-0 h-full w-full max-w-[720px] bg-white shadow-2xl p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-semibold">{resource.recurso}</div>
            <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          </div>
  
          <div className="card">
            <div className="card-header">Disponibilidad próximas semanas</div>
            <div className="card-body overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Semana</th>
                    <th className="text-right p-2">Disponible</th>
                    <th className="text-right p-2">Cargado</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map(w => {
                    const free = resource.availabilityByWeek[w] ?? 0;
                    const load = resource.loadByWeek[w] ?? (100 - free);
                    return (
                      <tr key={w} className="border-t">
                        <td className="p-2">{w}</td>
                        <td className="p-2 text-right">{free.toFixed(0)}%</td>
                        <td className="p-2 text-right">{(load).toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
  
          {/* Aquí puedes agregar otra tarjeta con "Asignaciones que generan la carga" */}
        </div>
      </div>
    );
  }
  