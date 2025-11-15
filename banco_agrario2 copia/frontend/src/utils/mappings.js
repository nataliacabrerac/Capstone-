// utils/mappings.js

export const mapComplejidad = {
  Alta: "danger",
  Media: "warning",
  Baja: "neutral",
};

export const mapRecurso = (valor) =>
  valor === "Sí" ? "success" : "danger";
