// src/components/filters/MultiSelectFilter.jsx
import { useState, useRef, useEffect } from 'react';

export default function MultiSelectFilter({ 
  label, 
  value = [], 
  onChange, 
  options = [], 
  placeholder = "Seleccionar..." 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOption = (option) => {
    const newValue = value.includes(option)
      ? value.filter(item => item !== option)
      : [...value, option];
    onChange(newValue);
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === options.length) return `Todos (${value.length})`;
    if (value.length <= 2) return value.join(', ');
    return `${value.length} seleccionados`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="truncate">{getDisplayText()}</span>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Header con seleccionar/limpiar todo */}
          <div className="flex justify-between items-center p-2 border-b bg-gray-50">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Seleccionar todo
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              Limpiar
            </button>
          </div>

          {/* Lista de opciones */}
          <div className="py-1">
            {options.map((option) => (
              <label 
                key={option} 
                className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={value.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}