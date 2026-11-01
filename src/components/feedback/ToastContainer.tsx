import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

let toastsState: ToastMessage[] = [];
const listeners: ToastListener[] = [];

function notify() {
  listeners.forEach(listener => listener([...toastsState]));
}

export const toast = {
  show(msg: Omit<ToastMessage, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = { ...msg, id };
    toastsState = [...toastsState, newToast];
    notify();

    const duration = msg.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
  },
  success(message: string, title?: string) {
    toast.show({ type: 'success', message, title });
  },
  error(message: string, title?: string) {
    toast.show({ type: 'error', message, title, duration: 6000 });
  },
  info(message: string, title?: string) {
    toast.show({ type: 'info', message, title });
  },
  dismiss(id: string) {
    toastsState = toastsState.filter(t => t.id !== id);
    notify();
  },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map(t => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-200 bg-white text-slate-800',
          error: 'border-red-200 bg-white text-slate-800',
          info: 'border-blue-200 bg-white text-slate-800',
        };

        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border ${borders[t.type]} transition-all animate-in slide-in-from-bottom-2`}
          >
            {icons[t.type]}
            <div className="flex-1 text-xs">
              {t.title && <h5 className="font-bold text-slate-900 mb-0.5">{t.title}</h5>}
              <p className="text-slate-600 leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
