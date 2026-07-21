import { useEffect, useRef } from "react";
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

export default function Modal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "info", // "info", "success", "warning", "danger"
  closeOnOutsideClick = true,
}) {
  const modalRef = useRef(null);

  // Handle escape key to close modal and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Icon and button style setup based on modal type
  let icon = <FaInfoCircle className="text-blue-400 text-2xl" />;
  let btnClass = "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30";
  let iconBg = "bg-blue-950/60 border-blue-900/40 text-blue-400";

  if (type === "danger") {
    icon = <FaExclamationTriangle className="text-rose-400 text-2xl" />;
    btnClass = "bg-rose-600 hover:bg-rose-500 shadow-rose-900/30";
    iconBg = "bg-rose-950/60 border-rose-900/40 text-rose-400";
  } else if (type === "warning") {
    icon = <FaExclamationTriangle className="text-amber-400 text-2xl" />;
    btnClass = "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30";
    iconBg = "bg-amber-950/60 border-amber-900/40 text-amber-400";
  } else if (type === "success") {
    icon = <FaCheckCircle className="text-emerald-400 text-2xl" />;
    btnClass = "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30";
    iconBg = "bg-emerald-950/60 border-emerald-900/40 text-emerald-400";
  }

  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      onClick={handleOutsideClick}
      className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transform transition-all duration-300 scale-100 flex flex-col relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
      >
        {/* Header decoration */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full" />
        
        {/* Modal Close Icon */}
        <button
          onClick={onCancel}
          aria-label="Close modal"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors duration-150 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Close Modal"
        >
          <FaTimes className="text-sm" />
        </button>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${iconBg}`}>
            {icon}
          </div>
          
          <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-2 transition-colors">
            {title}
          </h3>
          
          <p id="modal-message" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mb-6 transition-colors">
            {message}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-semibold tracking-wide transition-colors duration-150"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-semibold tracking-wide shadow-lg transition duration-150 ${btnClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
