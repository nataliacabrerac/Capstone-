// utils/dateUtils.js
export function getWeekNumber(date) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const pastDaysOfMonth = (date - firstDayOfMonth) / (24 * 3600 * 1000);
  return Math.ceil((pastDaysOfMonth + firstDayOfMonth.getDay() + 1) / 7);
}

export function formatToWeekLabel(date) {
  const month = date.toLocaleString('es-ES', { month: 'long' });
  const year = date.getFullYear().toString().slice(-2);
  const weekNumber = getWeekNumber(date);
  return `${month.charAt(0).toUpperCase() + month.slice(1)}_${year}:Sem ${weekNumber}`;
}

export function getMonday(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function formatDateForAPI(date) {
  return date.toISOString().split('T')[0];
}



// Función para determinar la semana de inicio
export function getStartWeek(today = new Date()) {
  const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 4 = Jueves
  const currentMonday = getMonday(new Date(today));
  
  // Si es jueves (4) o después, empezar esta semana
  if (dayOfWeek >= 4) {
    return currentMonday;
  }
  // Si es antes del jueves, empezar la siguiente semana
  const nextMonday = addWeeks(currentMonday, 1);
  return nextMonday;
}
// Agregar esta función en utils
const getNextMonday = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 1 : 8 - day; // Si es domingo (0), +1 día; sino, días hasta próximo lunes
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + diff);
  return nextMonday.toISOString().split('T')[0]; // YYYY-MM-DD
};