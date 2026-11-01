import React, { useState, useEffect } from 'react';
import {
  userRepository,
  eventRepository,
  questionRepository,
  participationRepository,
  unitRepository,
} from '../../../services/repositories';
import { AppUser, EventDay, Question, Participation, Unit } from '../../../types';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { Select } from '../../../components/ui/Select';
import { Drawer } from '../../../components/ui/Drawer';
import { Pagination } from '../../../components/ui/Pagination';
import { exportToCsv, copyTableToClipboard } from '../../../services/exports/csv-exporter';
import { exportToExcel } from '../../../services/exports/excel-exporter';
import { toast } from '../../../components/feedback/ToastContainer';
import { formatDateToSaoPaulo } from '../../../utils/formatters';
import {
  TableProperties,
  Search,
  Download,
  Copy,
  Printer,
  FileSpreadsheet,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Users,
  Calendar,
  HelpCircle,
  Video,
  KeyRound,
} from 'lucide-react';

export const AdminResultsPage: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [days, setDays] = useState<EventDay[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'with_answers' | 'without_answers'>('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Drawer details
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState<AppUser | null>(null);

  useEffect(() => {
    const loadMatrix = async () => {
      try {
        setLoading(true);
        const [allUsers, allDays, allQuestions, allParts, allUnits] = await Promise.all([
          userRepository.list({ role: 'collaborator' }),
          eventRepository.list(),
          questionRepository.listAll(),
          participationRepository.listAll(),
          unitRepository.list(),
        ]);
        setUsers(allUsers);
        setDays(allDays);
        setQuestions(allQuestions);
        setParticipations(allParts);
        setUnits(allUnits);
      } catch (err) {
        console.error('Failed to load matrix:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMatrix();
  }, []);

  // Map participations by `${userId}_${eventDayId}`
  const partMap = new Map<string, Participation>();
  participations.forEach(p => partMap.set(p.id, p));

  // Filtered users
  const filteredUsers = users.filter(u => {
    if (unitFilter !== 'all' && u.unitId !== unitFilter) return false;

    const userParts = participations.filter(p => p.userId === u.id && p.status === 'submitted');
    if (statusFilter === 'with_answers' && userParts.length === 0) return false;
    if (statusFilter === 'without_answers' && userParts.length > 0) return false;

    if (dayFilter !== 'all') {
      const p = partMap.get(`${u.id}_${dayFilter}`);
      if (!p || p.status !== 'submitted') return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.employeeNumber.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  // Group questions by day
  const questionsByDay: Record<string, Question[]> = {};
  days.forEach(d => {
    questionsByDay[d.id] = questions.filter(q => q.eventDayId === d.id && q.active);
  });

  // Unique users with at least one response
  const usersWithResponsesCount = new Set(
    participations.filter(p => p.status === 'submitted').map(p => p.userId)
  ).size;

  // Export handlers
  const prepareExportData = () => {
    return filteredUsers.map(u => {
      const row: Record<string, any> = {
        Matricula: u.employeeNumber,
        Nome: u.displayName,
        Email: u.email,
        Unidade: u.unitNameBackup || u.unitSlug?.toUpperCase() || '-',
        Empresa: u.company || 'Honda',
      };

      days.forEach(d => {
        const p = partMap.get(`${u.id}_${d.id}`);
        row[`${d.name}_Status`] = p ? (p.status === 'submitted' ? 'Respondido' : 'Em Andamento') : 'Não Iniciado';
        row[`${d.name}_Modalidade`] = p?.modality === 'in_person' ? 'Presencial' : p?.modality === 'remote' ? 'Remoto' : '-';
        row[`${d.name}_Nota`] = p?.percentage !== undefined ? `${p.percentage}%` : '-';
        row[`${d.name}_Gabaritou`] = p?.perfectScore ? 'SIM' : 'NÃO';
      });

      return row;
    });
  };

  const handleExportCsv = () => {
    const data = prepareExportData();
    exportToCsv(data, `matriz_resultados_sipat_${Date.now()}.csv`, ';');
    toast.success('Arquivo CSV exportado com sucesso.');
  };

  const handleExportExcel = () => {
    const data = prepareExportData();
    exportToExcel(data, `matriz_resultados_sipat_${Date.now()}.xlsx`);
    toast.success('Planilha Excel exportada com sucesso.');
  };

  const handleCopyClipboard = async () => {
    const data = prepareExportData();
    await copyTableToClipboard(data);
    toast.success('Dados copiados para a área de transferência.');
  };

  return (
    <AdminShell
      title="Matriz Geral de Resultados & Respostas"
      subtitle="Visualização consolidada de participações, notas, modalidades e cruzamento por colaborador"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyClipboard} icon={<Copy className="w-3.5 h-3.5" />}>
            Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}>
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} icon={<Download className="w-3.5 h-3.5 text-blue-600" />}>
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer className="w-3.5 h-3.5" />}>
            Imprimir
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Purple Hero Header from requirements */}
        <div className="rounded-3xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white">
                Métricas Consolidadas de Participação
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
                Acompanhamento da Base de Colaboradores
              </h2>
            </div>
            <span className="text-xs text-purple-200">
              Atualização contínua • Sincronizado
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <span className="text-xs text-purple-200 block">Total de Usuários</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5 block">
                {users.length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <span className="text-xs text-purple-200 block">Com Respostas</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5 block">
                {usersWithResponsesCount}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <span className="text-xs text-purple-200 block">Dias de Palestra</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5 block">
                {days.length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <span className="text-xs text-purple-200 block">Total de Perguntas</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5 block">
                {questions.length}
              </span>
            </div>
          </div>

          {/* Badges for each date and questions count */}
          <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
            <span className="text-xs text-purple-200 font-semibold mr-1">Perguntas por Dia:</span>
            {days.map(d => (
              <span
                key={d.id}
                className="text-xs bg-white/15 px-3 py-1 rounded-lg text-white font-medium"
              >
                {d.name}: <strong>{(questionsByDay[d.id] || []).length}</strong> questões
              </span>
            ))}
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <TextField
              placeholder="Buscar colaborador..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-44">
            <Select
              options={[
                { value: 'all', label: 'Todos os Status' },
                { value: 'with_answers', label: 'Com Respostas' },
                { value: 'without_answers', label: 'Sem Respostas' },
              ]}
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
            />
          </div>

          <div className="w-44">
            <Select
              options={[
                { value: 'all', label: 'Todas as Unidades' },
                ...units.map(u => ({ value: u.id, label: u.name })),
              ]}
              value={unitFilter}
              onChange={e => {
                setUnitFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="w-44">
            <Select
              options={[
                { value: 'all', label: 'Qualquer Dia' },
                ...days.map(d => ({ value: d.id, label: `${d.name} Respondido` })),
              ]}
              value={dayFilter}
              onChange={e => {
                setDayFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Matrix Table with Sticky Columns and 2 Header Rows */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              {/* Header Row 1: Fixed Columns + Group by Date */}
              <thead>
                <tr className="bg-[#323f3c] text-white uppercase text-[10px] tracking-wider border-b border-slate-600">
                  <th
                    rowSpan={2}
                    className="py-3 px-3 sticky left-0 z-20 bg-[#323f3c] w-28 border-r border-slate-600 shadow-xs"
                  >
                    Matrícula
                  </th>
                  <th
                    rowSpan={2}
                    className="py-3 px-4 sticky left-28 z-20 bg-[#323f3c] min-w-[180px] border-r border-slate-600 shadow-xs"
                  >
                    Nome do Colaborador
                  </th>
                  <th rowSpan={2} className="py-3 px-3 min-w-[120px] border-r border-slate-600">
                    Unidade
                  </th>

                  {days.map(d => {
                    const dayQ = questionsByDay[d.id] || [];
                    const colSpan = Math.max(1, dayQ.length);
                    return (
                      <th
                        key={d.id}
                        colSpan={colSpan}
                        className="py-2.5 px-3 text-center border-r border-slate-600 bg-[#252f2d] font-bold"
                      >
                        {d.name} ({dayQ.length} Questões)
                      </th>
                    );
                  })}

                  <th rowSpan={2} className="py-3 px-3 text-center w-16">
                    Ações
                  </th>
                </tr>

                {/* Header Row 2: Individual Questions P1, P2... with Tooltips */}
                <tr className="bg-[#2a3532] text-white text-[10px] uppercase tracking-wider">
                  {days.map(d => {
                    const dayQ = questionsByDay[d.id] || [];
                    if (dayQ.length === 0) {
                      return (
                        <th key={`${d.id}-empty`} className="py-1.5 px-2 text-center text-slate-400">
                          –
                        </th>
                      );
                    }
                    return dayQ.map((q, qIdx) => (
                      <th
                        key={q.id}
                        title={`${q.title} (${q.scored ? 'Avaliativa' : 'Pesquisa'})`}
                        className="py-1.5 px-2 text-center border-r border-slate-600 hover:bg-slate-700 cursor-help whitespace-nowrap"
                      >
                        P{qIdx + 1}
                      </th>
                    ));
                  })}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    {/* Fixed Columns */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 sticky left-0 z-10 bg-white border-r border-slate-200">
                      {u.employeeNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 sticky left-28 z-10 bg-white border-r border-slate-200 truncate max-w-[200px]">
                      {u.displayName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 border-r border-slate-100 truncate max-w-[140px]">
                      {u.unitNameBackup || u.unitSlug?.toUpperCase() || '-'}
                    </td>

                    {/* Question Response Cells */}
                    {days.map(d => {
                      const dayQ = questionsByDay[d.id] || [];
                      const part = partMap.get(`${u.id}_${d.id}`);

                      if (dayQ.length === 0) {
                        return (
                          <td key={`${d.id}-no-q`} className="py-2 px-2 text-center text-slate-300">
                            –
                          </td>
                        );
                      }

                      return dayQ.map(q => {
                        const answer = part?.answers?.[q.id];
                        const hasAnswer = Boolean(answer?.alternativeId || answer?.text);

                        return (
                          <td
                            key={q.id}
                            className="py-2 px-2 text-center border-r border-slate-100"
                            title={
                              hasAnswer
                                ? `Respondido em ${part?.submittedAt ? formatDateToSaoPaulo(part.submittedAt, 'short') : 'Data registrada'}`
                                : 'Sem resposta'
                            }
                          >
                            {hasAnswer ? (
                              <span className="inline-block w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold leading-none">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 select-none">–</span>
                            )}
                          </td>
                        );
                      });
                    })}

                    {/* Drawer trigger action */}
                    <td className="py-3 px-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUserForDrawer(u)}
                        title="Ver detalhes completos do colaborador"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#028056]" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
            />
          </div>
        </div>
      </div>

      {/* User Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedUserForDrawer)}
        onClose={() => setSelectedUserForDrawer(null)}
        title={selectedUserForDrawer?.displayName || 'Detalhes do Colaborador'}
        description={`Matrícula: ${selectedUserForDrawer?.employeeNumber} • ${selectedUserForDrawer?.email}`}
        width="lg"
      >
        {selectedUserForDrawer && (
          <div className="space-y-6 text-xs">
            {/* General Info Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                Dados Cadastrais
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Unidade:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUserForDrawer.unitNameBackup || selectedUserForDrawer.unitSlug || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Empresa:</span>
                  <span className="font-semibold text-slate-800">{selectedUserForDrawer.company || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Regulamento:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUserForDrawer.regulationAcceptedVersion
                      ? `Aceito (v${selectedUserForDrawer.regulationAcceptedVersion})`
                      : 'Pendente'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Primeiro Acesso:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUserForDrawer.mustChangePassword ? 'Senha inicial pendente' : 'Senha alterada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Participations Timeline */}
            <div>
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider mb-3">
                Histórico Diário de Sessões
              </span>

              <div className="space-y-3">
                {days.map(d => {
                  const part = partMap.get(`${selectedUserForDrawer.id}_${d.id}`);

                  return (
                    <div
                      key={d.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {d.name} ({d.dateLabel.split(' de ')[0]})
                        </span>
                        {part?.status === 'submitted' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-[#015237]">
                            Submetido • {part.percentage}%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            Não Submetido
                          </span>
                        )}
                      </div>

                      {part && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Modalidade:</span>
                            <span className="font-semibold text-slate-800">
                              {part.modality === 'in_person' ? 'Presencial (Código)' : 'Remoto (Vídeo)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Progresso do Vídeo:</span>
                            <span className="font-semibold text-slate-800">{part.videoProgressPercent}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Gabarito 100%:</span>
                            <span className={`font-bold ${part.perfectScore ? 'text-[#028056]' : 'text-slate-700'}`}>
                              {part.perfectScore ? 'SIM (Apto)' : 'NÃO'}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-3 text-[10px] text-slate-400">
                            Enviado em:{' '}
                            {part.submittedAt ? formatDateToSaoPaulo(part.submittedAt, 'full') : '-'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
};
