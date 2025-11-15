import { useState } from "react";
import useBA from "../../services/state";

export default function NewResourceForm({ onClose }) {
  const { createResource } = useBA();
  const [nombre, setNombre] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createResource({ nombre });
        onClose();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium">Nombre del recurso</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="input w-full"
          required
        />
      </div>
      <button type="submit" className="btn btn-primary">Guardar</button>
    </form>
  );
}
