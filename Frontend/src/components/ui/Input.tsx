import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <input
        className={`w-full px-3 py-2 text-sm border border-[#dbe4ef] rounded-lg bg-white text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4fce] focus:border-transparent transition-colors ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export function Select({ label, error, className = '', children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <select
        className={`w-full px-3 py-2 text-sm border border-[#dbe4ef] rounded-lg bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1b4fce] focus:border-transparent transition-colors ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 text-sm border border-[#dbe4ef] rounded-lg bg-white text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4fce] focus:border-transparent transition-colors resize-none ${className}`}
        {...props}
      />
    </div>
  );
}
