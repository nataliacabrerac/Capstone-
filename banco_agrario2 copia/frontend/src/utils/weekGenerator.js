// utils/weekGenerator.js
export function generateWeekLabels(startDate = new Date(), weeksCount = 104) {
  const weeks = [];
  const currentDate = new Date(startDate);
  
  // Ajustar al lunes de esta semana
  const day = currentDate.getDay();
  const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
  currentDate.setDate(diff);
  
  for (let i = 0; i < weeksCount; i++) {
    const weekDate = new Date(currentDate);
    weekDate.setDate(currentDate.getDate() + (i * 7));
    
    const month = weekDate.toLocaleString('es-ES', { month: 'long' });
    const year = weekDate.getFullYear().toString().slice(-2);
    
    // Calcular número de semana en el mes
    const firstDayOfMonth = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);
    const pastDaysOfMonth = (weekDate - firstDayOfMonth) / (24 * 3600 * 1000);
    const weekNumber = Math.ceil((pastDaysOfMonth + firstDayOfMonth.getDay() + 1) / 7);
    
    weeks.push(`${month}_${year}:Sem ${weekNumber}`);
  }
  
  return weeks;
}