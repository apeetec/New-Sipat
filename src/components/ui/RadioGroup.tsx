import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {options.map(opt => {
        const isChecked = value === opt.value;
        const isDisabled = disabled || opt.disabled;

        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              isChecked
                ? 'bg-emerald-50/60 border-[#028056] ring-1 ring-[#028056]'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
            } ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isChecked}
              disabled={isDisabled}
              onChange={() => onChange(opt.value)}
              className="mt-0.5 text-[#028056] focus:ring-[#028056] border-slate-300 cursor-pointer"
            />
            <div className="flex-1 text-xs">
              <span className={`font-semibold block ${isChecked ? 'text-[#015237]' : 'text-slate-800'}`}>
                {opt.label}
              </span>
              {opt.description && <p className="text-slate-500 mt-0.5">{opt.description}</p>}
            </div>
          </label>
        );
      })}
    </div>
  );
};
