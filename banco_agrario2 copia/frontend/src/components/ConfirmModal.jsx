// src/components/ConfirmModal.jsx
export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  type = "danger" 
}) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200", 
      text: "text-yellow-800",
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
    }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg shadow-xl max-w-md w-full ${styles.bg} ${styles.border} border`}>
        <div className="p-6">
          <h3 className={`text-lg font-semibold ${styles.text}`}>
            {title}
          </h3>
          <p className={`mt-2 ${styles.text}`}>
            {message}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}