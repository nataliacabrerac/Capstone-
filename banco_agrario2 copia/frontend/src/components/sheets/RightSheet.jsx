export default function RightSheet({ title, open, onClose, children, footer }) {
    return (
      <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl transition-transform ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-4 border-b text-lg font-semibold">{title}</div>
          <div className="p-4 overflow-y-auto h-[calc(100%-7rem)]">{children}</div>
          <div className="p-4 border-t flex justify-end gap-2">{footer}</div>
        </div>
      </div>
    );
  }
  