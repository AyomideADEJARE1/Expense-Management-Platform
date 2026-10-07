import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, AlertTriangle, X, Info, Trash2 } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, isExiting: false }]);

    // Start exit transition 300ms before removing
    setTimeout(() => {
      dismissToast(id);
    }, 3200);
  };

  const dismissToast = (id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl shadow-xl border text-sm font-medium transition-all duration-300 ease-out transform ${
              toast.isExiting
                ? 'opacity-0 translate-y-4 scale-95'
                : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-5'
            } ${
              toast.type === 'success'
                ? 'bg-slate-900/90 text-emerald-300 border-emerald-500/30 backdrop-blur-xl shadow-emerald-950/20'
                : toast.type === 'delete' || toast.type === 'error'
                ? 'bg-slate-900/90 text-rose-300 border-rose-500/30 backdrop-blur-xl shadow-rose-950/20'
                : 'bg-slate-900/90 text-slate-200 border-slate-700/50 backdrop-blur-xl shadow-slate-950/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              {(toast.type === 'delete' || toast.type === 'error') && <Trash2 className="w-5 h-5 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
              <span className="text-slate-100 font-normal">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}