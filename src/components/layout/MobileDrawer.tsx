import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppUser } from '../../types';
import { X, LogOut, User } from 'lucide-react';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  links: Array<{ label: string; href: string; icon: React.ReactNode }>;
  user: AppUser | null;
  onLogout: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  links,
  user,
  onLogout,
}) => {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl z-10 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <span className="font-bold text-base text-slate-900 font-display">Portal SIPAT</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {user && (
            <div className="p-3 bg-slate-50 rounded-xl mb-6 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#028056]/15 text-[#028056] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{user.displayName}</h4>
                  <p className="text-[11px] text-slate-500">
                    Matrícula: {user.employeeNumber} {user.role === 'admin' ? '• Admin' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {links.map(link => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-[#028056]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
