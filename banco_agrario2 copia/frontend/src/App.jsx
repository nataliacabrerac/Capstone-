import { NavLink, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="bg-[var(--color-ba-green)] text-white p-4">
        <div className="font-bold mb-4">Tablero de Capacidades</div>
        <nav className="flex flex-col gap-2">
          <NavLink to="/" className="bg-white/10 px-3 py-2 rounded-lg">
            Inicio
          </NavLink>
          <NavLink to="/capacidad" className="bg-white/10 px-3 py-2 rounded-lg">
            Capacidad de Recursos
          </NavLink>
          <NavLink to="/recursos-vs" className="bg-white/10 px-3 py-2 rounded-lg">
            Recursos vs PM y PRO
          </NavLink>
          <NavLink to="/asignacion" className="bg-white/10 px-3 py-2 rounded-lg">
            Asignación PM y PRO
          </NavLink>
        </nav>
      </aside>
      <main className="p-6">
        <div className="container-app">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

