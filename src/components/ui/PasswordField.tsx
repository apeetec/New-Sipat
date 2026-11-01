import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { TextField, TextFieldProps } from './TextField';

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'rightElement'> {}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>((props, ref) => {
  const [show, setShow] = useState(false);

  return (
    <TextField
      {...props}
      ref={ref}
      type={show ? 'text' : 'password'}
      icon={props.icon || <Lock className="w-4 h-4" />}
      rightElement={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(prev => !prev)}
          className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
          aria-label={show ? 'Ocultar senha' : 'Exibir senha'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
});

PasswordField.displayName = 'PasswordField';
