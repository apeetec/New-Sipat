import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  userRepository,
  eventRepository,
  questionRepository,
  participationRepository,
  drawRepository,
} from '../../../services/repositories';
import { EventDay, Question, Draw } from '../../../types';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Alert } from '../../../components/ui/Alert';
import {
  Users,
  Calendar,
  HelpCircle,
  Trophy,
  Gift,
  Upload,
  TableProperties,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [participatedUsersCount, setParticipatedUsersCount] = useState(0);
  const [days, setDays] = useState<EventDay[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [perfectScoresByDay, setPerfectScoresByDay] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [users, allDays, allQuestions, allParts, allDraws] = await Promise.all([
          userRepository.list({ active: true, role: 'collaborator' }),
          eventRepository.list(),
          questionRepository.listAll(),
          participationRepository.listAll(),
          drawRepository.listAll(),
        ]);

        setActiveUsersCount(users.length);
        const uniqueParticipants = new Set(allParts.map(p => p.userId));
        setParticipatedUsersCount(uniqueParticipants.size);

        setDays(allDays);
        setQuestions(allQuestions);
        setDraws(allDraws);

        const perfectMap: Record<string, number> = {};
        allDays.forEach(d => {
          perfectMap[d.id] = allParts.filter(
            p => p.eventDayId === d.id && p.status === 'submitted' && p.perfectScore
          ).length;
        });
        setPerfectScoresByDay(perfectMap);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Content validation alerts
  const daysWithoutVideo = days.filter(d => !d.videoUrl && d.active);
  const invalidQuestions = questions.filter(
    q => q.scored && q.type === 'single_choice' && !q.alternatives.some(a => a.isCorrect)
  );

  return (
    <AdminShell
      title="Painel de Controle SIPAT Honda"
      subtitle="Monitoramento em tempo real de engajamento, presenças, questionários e sorteios oficiais"
    >
      <div className="space-y-8">
        {/* Editorial & Safety Alerts */}
        {(daysWithoutVideo.length > 0 || invalidQuestions.length > 0) && (
          <div className="space-y-3">
            {invalidQuestions.length > 0 && (
              <Alert variant="warning" title="Atenção Editorial: Questões avaliativas sem gabarito correto">
                <p>
                  Existem <strong>{invalidQuestions.length} pergunta(s)</strong> marcadas como avaliativas sem alternativa correta definida (ex.: <em>{invalidQuestions[0].title}</em>). Elas foram mantidas inativas para não comprometer a nota dos colaboradores até que um administrador defina a resposta correta.
                </p>
                <Link
                  to="/admin/perguntas"
                  className="font-bold text-amber-900 underline mt-2 inline-block text-xs"
                >
                  Corrigir perguntas agora →
                </Link>
              </Alert>
            )}

            {daysWithoutVideo.length > 0 && (
              <Alert variant="info" title="Aviso de Programação">
                <p>
                  {daysWithoutVideo.length} dia(s) ativo(s) ainda não possuem link de transmissão de vídeo cadastrado.
                </p>
              </Alert>
            )}
          </div>
        )}

        {/* 6 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Colaboradores Ativos
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono mt-1 block">
                {activeUsersCount}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                Prontos para acessar
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#028056] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Com Participação Realizada
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono mt-1 block">
                {participatedUsersCount}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {activeUsersCount > 0
                  ? `${Math.round((participatedUsersCount / activeUsersCount) * 100)}% de engajamento`
                  : '0%'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Dias de Palestra
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono mt-1 block">
                {days.length}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {days.filter(d => d.active).length} ativos na semana
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Perguntas Cadastradas
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono mt-1 block">
                {questions.length}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {questions.filter(q => q.scored).length} avaliativas oficiais
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Sorteios Oficiais
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono mt-1 block">
                {draws.filter(d => d.status === 'published').length}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {draws.filter(d => d.status === 'voided').length} anulados
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Aptos a Sorteios (Total)
              </span>
              <span className="text-3xl font-extrabold text-[#028056] font-mono mt-1 block">
                {Object.values(perfectScoresByDay).reduce((a, b) => a + b, 0)}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                100% de acertos acumulados
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#028056] flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Administrative Shortcuts */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Ações Rápidas do Administrador
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/sorteios"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#028056] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                  <Gift className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#028056] font-display">
                  Executar Novo Sorteio
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Filtrar participantes com 100% e rodar o sorteador oficial.
                </p>
              </div>
              <span className="text-xs font-bold text-[#028056] flex items-center gap-1 mt-4">
                Acessar sorteador <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/admin/usuarios/importar"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#028056] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#028056] flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#028056] font-display">
                  Importar Usuários em Massa
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Carregar CSV com matrículas, senhas e unidades fabris.
                </p>
              </div>
              <span className="text-xs font-bold text-[#028056] flex items-center gap-1 mt-4">
                Ir para importador <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/admin/resultados"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#028056] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                  <TableProperties className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#028056] font-display">
                  Matriz de Resultados
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Consultar respostas detalhadas, filtros e exportações CSV/Excel.
                </p>
              </div>
              <span className="text-xs font-bold text-[#028056] flex items-center gap-1 mt-4">
                Ver matriz <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              to="/admin/perguntas"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#028056] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#028056] font-display">
                  Gerenciar Perguntas
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Editar alternativas, gabaritos e pesos das perguntas diárias.
                </p>
              </div>
              <span className="text-xs font-bold text-[#028056] flex items-center gap-1 mt-4">
                Editar perguntas <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>

        {/* 100% Acertos Breakdown by Day */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Desempenho por Dia de Palestra (Colaboradores com 100%)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {days.map(d => (
              <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-800 block truncate">{d.name}</span>
                <span className="text-[11px] text-slate-400 block mb-2">{d.dateLabel.split(' de ')[0]}</span>
                <span className="text-2xl font-extrabold text-[#028056] font-mono block">
                  {perfectScoresByDay[d.id] || 0}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">aptos ao sorteio</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
};
