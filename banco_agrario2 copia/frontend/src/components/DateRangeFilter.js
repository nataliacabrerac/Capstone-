// components/DateRangeFilter.js

import { useMemo, useState, useEffect } from 'react';
import { generateWeekLabels } from '../utils/weekGenerator';
import { labelToMonday } from '../utils/weekLabel';

export default function DateRangeFilter({ onDateChange }) {
  const weeksOptions = useMemo(() => generateWeekLabels(), []);
  const [startWeek, setStartWeek] = useState(weeksOptions[0] || "");
  const [endWeek, setEndWeek] = useState(weeksOptions[weeksOptions.length - 1] || "");

  useEffect(() => {
    if (startWeek && endWeek) {
      onDateChange?.({
        start: labelToMonday(startWeek),
        end: labelToMonday(endWeek)
      });
    }
  }, [startWeek, endWeek, onDateChange]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-gray-700">
          Semana inicio
        </label>
        <select 
          value={startWeek} 
          onChange={(e) => setStartWeek(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {weeksOptions.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-gray-700">
          Semana fin
        </label>
        <select 
          value={endWeek} 
          onChange={(e) => setEndWeek(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {weeksOptions.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>
    </div>
  );
}