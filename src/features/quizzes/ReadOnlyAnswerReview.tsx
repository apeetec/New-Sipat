import React from 'react';
import { Question, Participation } from '../../types';
import { Check, X, CheckCircle2 } from 'lucide-react';

export interface ReadOnlyAnswerReviewProps {
  questions: Question[];
  participation: Participation;
  showCorrectAnswers: boolean;
}

export const ReadOnlyAnswerReview: React.FC<ReadOnlyAnswerReviewProps> = ({
  questions,
  participation,
  showCorrectAnswers,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-700 flex items-center justify-between border border-slate-200">
        <span className="font-semibold">Modo Leitura — Respostas Enviadas</span>
        <span className="text-slate-500">
          Enviado em {participation.submittedAt ? new Date(participation.submittedAt).toLocaleString('pt-BR') : '-'}
        </span>
      </div>

      {questions.map((q, idx) => {
        const userAnswer = participation.answers[q.id];

        return (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-[#323f3c] text-white p-4 flex items-center justify-between">
              <span className="font-bold text-xs">
                Questão {idx + 1} {q.scored ? '• Avaliativa' : '• Pesquisa'}
              </span>
              {q.scored && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
                  Peso 1.0
                </span>
              )}
            </div>

            <div className="p-5">
              <h4 className="text-sm font-bold text-slate-900 mb-4">{q.title}</h4>

              {q.type === 'single_choice' && (
                <div className="space-y-2">
                  {q.alternatives.map(alt => {
                    const isSelected = userAnswer?.alternativeId === alt.id;
                    const isCorrect = alt.isCorrect;

                    let rowStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                    let icon = null;

                    if (isSelected) {
                      if (showCorrectAnswers && isCorrect !== undefined) {
                        rowStyle = isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300'
                          : 'bg-red-50 border-red-300 text-red-900 ring-1 ring-red-300';
                        icon = isCorrect ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />;
                      } else {
                        rowStyle = 'bg-emerald-50/70 border-[#028056] text-[#015237] font-semibold';
                        icon = <Check className="w-4 h-4 text-[#028056]" />;
                      }
                    } else if (showCorrectAnswers && isCorrect) {
                      rowStyle = 'bg-emerald-50/40 border-emerald-200 text-emerald-800 font-medium';
                      icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                    }

                    return (
                      <div
                        key={alt.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-xs leading-normal ${rowStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-[#028056] bg-[#028056]' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{alt.text}</span>
                        </div>

                        {icon}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'rating' && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Opção selecionada:</span>
                  <span className="font-bold text-slate-900">
                    {q.alternatives.find(a => a.id === userAnswer?.alternativeId)?.text || 'Não avaliado'}
                  </span>
                </div>
              )}

              {q.type === 'free_text' && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Texto enviado:</span>
                  <p className="italic text-slate-800">{userAnswer?.text || 'Sem resposta escrita.'}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
