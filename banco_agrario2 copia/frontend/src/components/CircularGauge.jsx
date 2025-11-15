// porcentajes 0..100
export default function CircularGauge({ value = 0, size = 80, stroke = 10, label }) {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, value));
    const dash = (clamped / 100) * circ;
  
    const color =
      clamped >= 60 ? "#16a34a" : clamped >= 30 ? "#f59e0b" : "#dc2626"; // verde/amarillo/rojo (disponibilidad)
  
    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="#E5E7EB" strokeWidth={stroke} fill="none"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          />
        </svg>
        <div className="mt-2 text-center">
          <div className="text-lg font-semibold">{clamped.toFixed(0)}%</div>
          {label && <div className="text-xs text-slate-500">{label}</div>}
        </div>
      </div>
    );
  }
  