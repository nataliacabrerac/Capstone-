// src/services/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 20000,
});

// -------- Recursos --------
export const getResources   = () => api.get("/resources").then(r => r.data);
export const createResource = (p)  => api.post("/resources", p).then(r => r.data);

// -------- Proyectos --------
export const getProjects    = () => api.get("/projects").then(r => r.data);
export const createProject  = (p)  => api.post("/projects", p).then(r => r.data);

// -------- Asignaciones --------
export const createAssignment   = (p)  => api.post("/assignments", p).then(r => r.data);
export const getAssignmentWeeks = (id) => api.get(`/assignments/${id}/weeks`).then(r => r.data);

// -------- Resúmenes simples --------
export const getResourcesSummary = () => api.get("/resources/summary").then(r => r.data);
export const getProjectsSummary  = () => api.get("/projects/summary").then(r => r.data);

// -------- Grids (ventanas semanales) --------
export async function getCapacityWindow(startISO, weeks) {
  const { data } = await api.get("/grid/capacity", { params: { start: startISO, weeks } });
  return data; // { labels, by_resource }
}

export async function getResourcesVsWeekly(startISO, weeks, resource /* string | "Todos" */) {
  const params = { start: startISO, weeks };
  if (resource && resource !== "Todos") params.resource = resource;
  const { data } = await api.get("/grid/resources-vs", { params });
  return data; // { labels, types, people, by_person }
}

/** Promedio semanal por proyecto en la misma ventana (para tu card de "Resumen de proyectos") */
export async function getProjectsWeeklyAvg(startISO, weeks) {
  const { data } = await api.get("/projects/weekly-avg", { params: { start: startISO, weeks } });
  return data; // { labels, projects: [{name, avg_pct, by_week:{label:number}}] }
}
// Agrega esta función
export const createBulkAssignments = (data) => {
  return api.post("/assignments/bulk", data);
};