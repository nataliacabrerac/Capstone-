import CreateSplitButton from "./actions/CreateSplitButton";
import useBA from "../services/state";

export default function Navbar() {
  const { createResource, createAssignment, createProject } = useBA();

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-ba-green text-white">
      <div className="font-bold">Tablero de Capacidades</div>
      <div className="flex items-center gap-3">
        <CreateSplitButton
          onNewResource={() => createResource({ nombre: "Nuevo Recurso" })}
          onNewAssignment={() => createAssignment({ nombre: "Nueva Asignación", mes: "Agosto_25", semana: "Sem 1" })}
          onNewProject={() => createProject({ nombre: "Nuevo Proyecto" })}
        />
      </div>
    </nav>
  );
}
