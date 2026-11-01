import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'green'
    | 'dark'
    | 'gold'
    | 'gray'
    | 'danger'
    | 'purple'
    | 'blue';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-semibold',
  };

  const variantStyles = {
    default: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    secondary: 'bg-slate-100 text-slate-800 border-slate-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'text-slate-700 border-slate-300 bg-transparent',
    destructive: 'bg-red-50 text-red-700 border-red-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    gold: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
    dark: 'bg-[#323f3c] text-white border-transparent',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border transition-colors select-none whitespace-nowrap',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
