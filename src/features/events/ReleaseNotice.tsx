import React from 'react';
import { Clock, Lock } from 'lucide-react';
import { formatDateToSaoPaulo } from '../../utils/formatters';

export const ReleaseNotice: React.FC<{ opensAt: string }> = ({ opensAt }) => {
  const formatted = formatDateToSaoPaulo(opensAt, 'liberacao');

  return (
    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xs">
      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-amber-900 font-display">Sessão Ainda Não Liberada</h3>
      <p className="text-xs sm:text-sm text-amber-800 mt-2 font-medium">
        Data de liberação do vídeo: <strong>{formatted}</strong>
      </p>
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-amber-700">
        <Clock className="w-4 h-4" />
        <span>O acesso ao vídeo e ao questionário será liberado automaticamente no horário programado.</span>
      </div>
    </div>
  );
};
