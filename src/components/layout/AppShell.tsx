import React from 'react';
import { AuthenticatedHeader } from './AuthenticatedHeader';
import { CampaignBanner } from './CampaignBanner';

export const AppShell: React.FC<{
  children: React.ReactNode;
  showBanner?: boolean;
}> = ({ children, showBanner = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#e2e8e8]">
      {showBanner && <CampaignBanner />}
      <AuthenticatedHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">SIPAT Honda 2026</span>
            <span>•</span>
            <span>Semana Interna de Prevenção de Acidentes do Trabalho</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Segurança é um valor • CIPA & SESMT Honda</span>
            <span>•</span>
            <span>Conformidade com a LGPD</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
