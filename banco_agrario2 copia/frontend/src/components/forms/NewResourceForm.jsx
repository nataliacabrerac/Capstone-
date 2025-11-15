import { useState, useMemo } from "react";
import { createResource } from "../../services/api";  // ⬅️ backend

export default function NewResourceForm({ onClose }) {
  // Mantengo tu lógica de defaultMes aunque el backend no lo usa
  const [nombre, setNombre] = useState("");
  const meses = []; // si luego quieres mostrar algo aquí, lo tienes disponible
  const defaultMes = useMemo(() => meses?.[0] || "", [meses]);

  const submit = async (e) => {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) return;

    try {
      // Backend solo requiere name/unit. Dejo unit vacío.
      await createResource({ name: n, unit: "" });
      alert("Recurso creado ✅");
      onClose?.();
    } catch (err) {
      alert("Error creando recurso: " + (err?.response?.data?.detail || err.message));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm text-gray-700">Nombre de nuevo recurso</label>
        <input
          className="input"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. María Gómez"
          autoFocus
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={!nombre.trim()}>
          Guardar
        </button>
      </div>
    </form>
  );
}
