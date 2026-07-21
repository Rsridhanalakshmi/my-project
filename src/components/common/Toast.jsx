import { createContext, useContext, useState, useCallback } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from "react-icons/fa";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showSuccess = useCallback((message) => showToast(message, "success"), [showToast]);
  const showWarning = useCallback((message) => showToast(message, "warning"), [showToast]);
  const showError = useCallback((message) => showToast(message, "error"), [showToast]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccess, showWarning, showError, showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => {
          let bgClass = "bg-white/95 dark:bg-slate-900/95 border-emerald-200 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400";
          let icon = <FaCheckCircle className="text-emerald-500 dark:text-emerald-400 text-lg flex-shrink-0" />;
          
          if (t.type === "warning" || t.type === "warn") {
            bgClass = "bg-white/95 dark:bg-slate-900/95 border-amber-200 dark:border-amber-500/50 text-amber-600 dark:text-amber-400";
            icon = <FaExclamationTriangle className="text-amber-500 dark:text-amber-400 text-lg flex-shrink-0" />;
          } else if (t.type === "error") {
            bgClass = "bg-white/95 dark:bg-slate-900/95 border-rose-200 dark:border-rose-500/50 text-rose-600 dark:text-rose-400";
            icon = <FaTimesCircle className="text-rose-500 dark:text-rose-400 text-lg flex-shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 ${bgClass}`}
            >
              {icon}
              <div className="flex-1 text-xs font-semibold text-slate-800 dark:text-slate-100 pr-2 pt-0.5 leading-relaxed">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 p-0.5"
                title="Dismiss"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
