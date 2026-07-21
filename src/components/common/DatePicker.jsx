import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

export default function DatePicker({
  label,
  name,
  value,
  onChange,
  error,
  min,
  max,
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 transition-colors">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <FaCalendarAlt className="text-sm" />
        </div>
        <input
          id={name}
          name={name}
          type="date"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          className={`w-full bg-slate-50 dark:bg-slate-950/50 border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors duration-200 pl-10
            ${value ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}
            ${
              error
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50"
                : "border-slate-300 dark:border-slate-800/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            }`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-500/90">{error}</p>}
    </div>
  );
}
