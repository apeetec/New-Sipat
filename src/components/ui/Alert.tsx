import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
}) => {
  const styles = {
    info: {
      container: 'border-blue-200/80 bg-blue-50/60 text-blue-950',
      icon: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
      titleColor: 'text-blue-900',
    },
    success: {
      container: 'border-emerald-200/80 bg-emerald-50/60 text-emerald-950',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-900',
    },
    warning: {
      container: 'border-amber-200/80 bg-amber-50/60 text-amber-950',
      icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-900',
    },
    danger: {
      container: 'border-red-200/80 bg-red-50/60 text-red-950',
      icon: <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />,
      titleColor: 'text-red-900',
    },
  };

  const current = styles[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-4 shadow-2xs flex items-start gap-3 transition-colors text-sm',
        current.container,
        className
      )}
    >
      {current.icon}
      <div className="flex-1 leading-relaxed">
        {title && <h5 className={cn('font-semibold tracking-tight text-sm mb-1', current.titleColor)}>{title}</h5>}
        <div className="text-xs sm:text-sm text-slate-700 leading-normal">{children}</div>
      </div>
    </div>
  );
};
