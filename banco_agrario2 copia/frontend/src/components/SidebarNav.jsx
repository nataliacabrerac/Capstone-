// src/components/SidebarNav.jsx
import { NavLink } from "react-router-dom";

const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block w-full text-left px-4 py-3 rounded-2xl mb-2 ${
        isActive
          ? "bg-white text-[var(--color-ba-blue)]"
          : "bg-[var(--color-ba-green)] text-white"
      }`
    }
  >
    {label}
  </NavLink>
);

export default function SidebarNav() {
  return (
    <aside className="bg-[var(--color-ba-green)] text-white p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-white/80" />
        <div className="font-bold">Tablero de Capacidades</div>
      </div>
      <NavItem to="/" label="Inicio" />
      <NavItem to="/capacidad" label="Capacidad de Recursos" />
      <NavItem to="/recursos-vs" label="Recursos vs PM y PRO" />
      <NavItem to="/asignacion" label="Asignación PM y PRO" />
    </aside>
  );
}
