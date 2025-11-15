// WeekRangeSelector.jsx - Versión mejorada
import { useState, useEffect } from 'react';

export default function WeekRangeSelector({ onRangeChange }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekOptions, setWeekOptions] = useState([]);

  // Generar 52 semanas (1 año completo) a partir de hoy
  useEffect(() => {
    const generateWeekOptions = () => {
      const options = [];
      const today = new Date();
      
      // Comenzar desde el lunes más cercano
      const currentMonday = getMonday(today);
      
      // Generar 52 semanas (1 año)
      for (let i = 0; i < 52; i++) {
        const weekMonday = new Date(currentMonday);
        weekMonday.setDate(currentMonday.getDate() + (7 * i));
        
        const weekFriday = new Date(weekMonday);
        weekFriday.setDate(weekMonday.getDate() + 4);
        
        const label = formatWeekLabel(weekMonday, weekFriday);
        options.push({
          value: weekMonday.toISOString().split('T')[0],
          label: label,
          date: weekMonday
        });
      }
      
      return options;
    };

    const getMonday = (d) => {
      d = new Date(d);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    const formatWeekLabel = (monday, friday) => {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mondayMonth = months[monday.getMonth()];
      const fridayMonth = months[friday.getMonth()];
      
      if (monday.getMonth() === friday.getMonth()) {
        return `${mondayMonth} ${monday.getDate()} - ${friday.getDate()}, ${monday.getFullYear()}`;
      } else {
        return `${mondayMonth} ${monday.getDate()} - ${fridayMonth} ${friday.getDate()}, ${monday.getFullYear()}`;
      }
    };

    setWeekOptions(generateWeekOptions());
    
    // Establecer fechas por defecto: próximas 4 semanas
    const options = generateWeekOptions();
    if (options.length > 0) {
      const defaultStart = options[0].value;
      const defaultEnd = options[3]?.value || options[options.length - 1].value;
      
      setStartDate(defaultStart);
      setEndDate(defaultEnd);
      
      if (onRangeChange) {
        onRangeChange({
          start: defaultStart,
          end: defaultEnd
        });
      }
    }
  }, [onRangeChange]);

  const handleStartChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    
    // Si la fecha de inicio es posterior a la de fin, ajustar la fecha de fin
    if (newStart && endDate && newStart > endDate) {
      const startIndex = weekOptions.findIndex(opt => opt.value === newStart);
      const newEnd = weekOptions[Math.min(startIndex + 3, weekOptions.length - 1)]?.value;
      setEndDate(newEnd);
      
      if (onRangeChange) {
        onRangeChange({
          start: newStart,
          end: newEnd
        });
      }
    } else if (onRangeChange) {
      onRangeChange({
        start: newStart,
        end: endDate
      });
    }
  };

  const handleEndChange = (e) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);
    
    if (onRangeChange && startDate) {
      onRangeChange({
        start: startDate,
        end: newEnd
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semana de inicio
          </label>
          <select 
            value={startDate} 
            onChange={handleStartChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar semana de inicio</option>
            {weekOptions.map((option, index) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={endDate && option.value > endDate}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semana de fin
          </label>
          <select 
            value={endDate} 
            onChange={handleEndChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar semana de fin</option>
            {weekOptions.map((option, index) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={startDate && option.value < startDate}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {startDate && endDate && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Período seleccionado:</strong> {weekOptions.find(opt => opt.value === startDate)?.label} 
            {" hasta "}
            {weekOptions.find(opt => opt.value === endDate)?.label}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Duración: {Math.ceil((new Date(endDate) - new Date(startDate)) / (7 * 24 * 60 * 60 * 1000)) + 1} semanas
          </p>
        </div>
      )}
    </div>
  );
}