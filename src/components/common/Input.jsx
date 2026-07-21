import React from "react";

export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  endNode,
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
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon className="text-sm" />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full bg-slate-50 dark:bg-slate-950/50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors duration-200
            ${Icon ? "pl-10" : ""}
            ${endNode ? "pr-10" : ""}
            ${
              error
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50"
                : "border-slate-300 dark:border-slate-800/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            }`}
          {...props}
        />
        {endNode && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {endNode}
          </div>
        )}
      </div>
      {error && <p id={`${name}-error`} className="mt-1.5 text-xs font-semibold text-rose-500/90" role="alert">{error}</p>}
    </div>
  );
}
