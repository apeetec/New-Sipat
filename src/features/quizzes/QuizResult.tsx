import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, Award, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export interface QuizResultProps {
  correctCount: number;
  scoredQuestionCount: number;
  percentage: number;
  perfectScore: boolean;
  onReviewAnswers: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  correctCount,
  scoredQuestionCount,
  percentage,
  perfectScore,
  onReviewAnswers,
}) => {
  useEffect(() => {
    if (perfectScore) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#028056', '#66bd39', '#f59e0b', '#ffffff'],
        });
      } catch (e) {
        // Safe confetti fallback
      }
    }
  }, [perfectScore]);

  return (
    <div
      className={`rounded-2xl p-6 sm:p-8 text-center border shadow-sm ${
        perfectScore
          ? 'bg-gradient-to-b from-emerald-50 via-white to-amber-50/40 border-amber-300 ring-1 ring-amber-300/60'
          : 'bg-white border-slate-200'
      }`}
    >
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm ${
          perfectScore ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-[#028056]'
        }`}
      >
        {perfectScore ? <Trophy className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
      </div>

      <div className="flex items-center justify-center gap-2 mb-1">
        <span
          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
            perfectScore
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {perfectScore ? '100% de Acertos • Parabéns!' : 'Participação Concluída'}
        </span>
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 mt-2">
        {perfectScore
          ? 'Você Gabaritou e Está Concorrendo aos Prêmios!'
          : 'Obrigado por sua Participação na SIPAT Honda!'}
      </h3>

      <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
        {perfectScore
          ? `Excelente! Você acertou todas as ${scoredQuestionCount} perguntas avaliativas deste dia e seu nome foi incluído no pool oficial de sorteios.`
          : `Você acertou ${correctCount} de ${scoredQuestionCount} perguntas avaliativas (${percentage}%). Conforme o regulamento, somente acertos de 100% concorrem a brindes, mas sua presença e feedback foram computados com sucesso!`}
      </p>

      {/* Metrics Row */}
      <div className="flex items-center justify-center gap-6 my-6 py-4 border-y border-slate-100 max-w-md mx-auto">
        <div>
          <span className="text-2xl font-extrabold text-[#028056] block font-mono">
            {correctCount} / {scoredQuestionCount}
          </span>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Acertos</span>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div>
          <span className="text-2xl font-extrabold text-slate-900 block font-mono">
            {percentage}%
          </span>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Aproveitamento</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="outline" size="md" onClick={onReviewAnswers}>
          Revisar Minhas Respostas
        </Button>
        <Link to="/ganhadores">
          <Button variant="action" size="md">
            <Award className="w-4 h-4" />
            <span>Acompanhar Sorteios Oficiais</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
