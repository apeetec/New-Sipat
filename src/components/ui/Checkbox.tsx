import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className="w-4 h-4 rounded text-[#028056] border-slate-300 focus:ring-[#028056] focus:ring-offset-0 cursor-pointer"
            {...props}
          />
        </div>
        <div className="text-xs leading-normal select-none">
          <label htmlFor={checkboxId} className="font-medium text-slate-800 cursor-pointer">
            {label}
          </label>
          {description && <p className="text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
