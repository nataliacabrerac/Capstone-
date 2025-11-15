// components/Chip.jsx
export default function Chip({ label, type = "neutral" }) {
  const colors = {
    neutral: "bg-gray-100 text-gray-700 border-gray-300",
    info: "bg-blue-100 text-blue-700 border-blue-300",
    success: "bg-green-100 text-green-700 border-green-300",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-300",
    danger: "bg-red-100 text-red-700 border-red-300",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs border ${colors[type]}`}
    >
      {label}
    </span>
  );
}
