import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel"
}) {
  const active = isOpen;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md p-4 transition-opacity duration-200 ease-out ${
        active ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-100/80 relative text-center flex flex-col items-center overflow-hidden shrink-0 transition-all duration-200 ease-out transform ${
          active ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Title */}
        <div className="w-full min-w-0 mb-2">
          <h3 className="text-lg font-bold text-gray-900 leading-tight [overflow-wrap:anywhere]">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="w-full min-w-0 mb-6">
          <p className="text-sm text-gray-500 leading-relaxed [overflow-wrap:anywhere] whitespace-normal">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-500/20 transition active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
