import React from 'react';
import { Video, MapPin, CheckCircle2 } from 'lucide-react';
import { AttendanceModality } from '../../types';

export interface AttendanceChoiceProps {
  currentModality?: AttendanceModality;
  selectedTab: 'video' | 'in_person';
  onSelectTab: (tab: 'video' | 'in_person') => void;
  isValidatedInPerson: boolean;
  isVideoCompleted: boolean;
}

export const AttendanceChoice: React.FC<AttendanceChoiceProps> = ({
  selectedTab,
  onSelectTab,
  isValidatedInPerson,
  isVideoCompleted,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Escolha como deseja participar desta palestra:
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Remote option */}
        <button
          type="button"
          onClick={() => onSelectTab('video')}
          className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedTab === 'video'
              ? 'bg-emerald-50/70 border-[#028056] ring-1 ring-[#028056]'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isVideoCompleted
                ? 'bg-emerald-100 text-[#028056]'
                : selectedTab === 'video'
                ? 'bg-[#028056] text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isVideoCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Video className="w-5 h-5" />}
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block font-display">
              Assistir à Palestra Online
            </span>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Assista ao vídeo no portal até 99% para desbloquear as perguntas.
            </p>
          </div>
        </button>

        {/* In-person option */}
        <button
          type="button"
          onClick={() => onSelectTab('in_person')}
          className={`flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all cursor-pointer ${
            selectedTab === 'in_person'
              ? 'bg-emerald-50/70 border-[#028056] ring-1 ring-[#028056]'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isValidatedInPerson
                ? 'bg-emerald-100 text-[#028056]'
                : selectedTab === 'in_person'
                ? 'bg-[#028056] text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isValidatedInPerson ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <MapPin className="w-5 h-5" />}
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block font-display">
              Estou Presencial — Digitar Código
            </span>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Insira o código divulgado no auditório para liberar o questionário de imediato.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
