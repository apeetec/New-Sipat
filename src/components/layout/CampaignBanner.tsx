import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { settingsRepository } from '../../services/repositories';
import { AppSettings } from '../../types';

export const CampaignBanner: React.FC<{
  title?: string;
  year?: number;
  subtitle?: string;
  badge?: string;
}> = ({ title, year, subtitle, badge }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    settingsRepository.getSettings().then(setSettings).catch(console.error);
  }, []);

  const displayTitle = title || settings?.homeHeadline || settings?.brandName || 'SIPAT Honda 2026';
  const displayYear = year || settings?.eventYear || 2026;
  const displaySubtitle = subtitle || settings?.homeDescription || settings?.brandSubtitle || 'Segurança e Bem-Estar: Um Valor Compartilhado no Nosso Dia a Dia';
  const displayBadge = badge || settings?.brandName || 'Honda Automóveis do Brasil';

  return (
    <div
      className="relative w-full overflow-hidden text-white shadow-md transition-colors"
      style={{
        background: `linear-gradient(90deg, var(--brand-primary-deep, #014730) 0%, var(--brand-primary, #028056) 50%, var(--brand-primary-dark, #015237) 100%)`,
      }}
    >
      {/* Decorative geometric background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sipat-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sipat-grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {settings?.primaryLogoUrl ? (
              <div className="w-14 h-12 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0 p-1">
                <img
                  src={settings.primaryLogoUrl}
                  alt={displayTitle}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck className="w-7 h-7 text-[var(--brand-action,#66bd39)]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm"
                  style={{
                    backgroundColor: 'var(--brand-action, #66bd39)',
                    color: 'var(--brand-primary-deep, #014730)',
                  }}
                >
                  {displayYear} • OFICIAL
                </span>
                <span className="text-xs text-white/80 font-medium">{displayBadge}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display text-white mt-0.5">
                {displayTitle}
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-xs text-white/90">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Assista aos vídeos, responda às pesquisas e concorra a brindes oficiais!</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 font-medium max-w-2xl leading-relaxed line-clamp-3">
          {displaySubtitle}
        </p>
      </div>
    </div>
  );
};
