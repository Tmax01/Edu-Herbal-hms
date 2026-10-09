import { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[#1b4fce] hover:bg-[#1640b0] text-white shadow-sm',
  secondary: 'bg-[#e8eef7] hover:bg-[#dce6f4] text-[#1e3a5f]',
  ghost: 'hover:bg-slate-100 text-slate-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  teal: 'bg-[#0d9488] hover:bg-[#0b7a70] text-white shadow-sm',
  outline: 'border border-[#dbe4ef] hover:bg-slate-50 text-slate-700',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, icon, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1b4fce] focus:ring-offset-1 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
