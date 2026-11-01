import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  eventRepository,
  unitRepository,
  drawRepository,
} from '../../../services/repositories';
import { backendService } from '../../../services/api/backend-service';
import { EventDay, Unit, Draw, AppUser, DrawScope } from '../../../types';
import { useAuth } from '../../auth/AuthContext';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Modal } from '../../../components/ui/Modal';
import { Alert } from '../../../components/ui/Alert';
import { toast } from '../../../components/feedback/ToastContainer';
import { formatDateToSaoPaulo } from '../../../utils/formatters';
import {
  Gift,
  Trophy,
  Sparkles,
  Users,
  Search,
  CheckCircle2,
  Medal,
  RefreshCw,
  Ban,
  Clock,
  Award,
  Layers,
} from 'lucide-react';

const COMMON_GROUPS = [
  'Grupo Geral',
  'Grupo Produção',
  'Grupo Administrativo',
  'Grupo Concessionárias',
  'Grupo Sumaré',
  'Grupo Itirapina',
];

export const AdminDrawsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'new_draw' | 'history'>('new_draw');

  const [days, setDays] = useState<EventDay[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);

  // Draw configuration state
  const [prizeName, setPrizeName] = useState('');
  const [prizeImageUrl, setPrizeImageUrl] = useState('');
  const [groupName, setGroupName] = useState('Grupo Geral');
  const [scopeType, setScopeType] = useState<'day' | 'full_week'>('day');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [isAllUnits, setIsAllUnits] = useState(true);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [winnerCount, setWinnerCount] = useState<number>(1);
  const [excludePreviousWinners, setExcludePreviousWinners] = useState(true);

  // Eligible pool preview state
  const [eligiblePool, setEligiblePool] = useState<AppUser[]>([]);
  const [poolSearch, setPoolSearch] = useState('');
  const [isLoadingPool, setIsLoadingPool] = useState(false);

  // Live Draw Animation State
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningUser, setSpinningUser] = useState<AppUser | null>(null);
  const [completedDraw, setCompletedDraw] = useState<Draw | null>(null);

  // Void draw modal state
  const [voidModalDraw, setVoidModalDraw] = useState<Draw | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const loadBaseData = async () => {
    try {
      setLoading(true);
      const [allDays, allUnits, allDraws] = await Promise.all([
        eventRepository.list(),
        unitRepository.list(),
        drawRepository.listAll(),
      ]);
      setDays(allDays);
      setUnits(allUnits);
      setDraws(allDraws);
      if (allDays.length > 0 && !selectedDayId) {
        setSelectedDayId(allDays[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  // Update eligible pool when parameters change
  const refreshEligiblePool = async () => {
    setIsLoadingPool(true);
    try {
      const scope: DrawScope =
        scopeType === 'day' ? { type: 'day', eventDayId: selectedDayId } : { type: 'full_week' };
      const unitIdsParam = isAllUnits ? (['all'] as ['all']) : selectedUnitIds;

      const pool = await backendService.previewEligibleUsers(
        scope,
        unitIdsParam,
        excludePreviousWinners
      );
      setEligiblePool(pool);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPool(false);
    }
  };

  useEffect(() => {
    if (!loading && (selectedDayId || scopeType === 'full_week')) {
      refreshEligiblePool();
    }
  }, [loading, scopeType, selectedDayId, isAllUnits, selectedUnitIds, excludePreviousWinners]);

  // Execute Live Draw
  const handleExecuteDraw = async () => {
    if (!prizeName.trim()) {
      toast.error('Informe o nome do prêmio.');
      return;
    }
    if (eligiblePool.length === 0) {
      toast.error('Não há participantes elegíveis com 100% de acertos para sortear.');
      return;
    }

    // Open live modal and start spinning animation
    setIsLiveModalOpen(true);
    setIsSpinning(true);
    setCompletedDraw(null);

    // Live slot machine animation
    let spinCount = 0;
    const interval = setInterval(() => {
      const randomUser = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
      setSpinningUser(randomUser);
      spinCount++;
      if (spinCount > 25) {
        clearInterval(interval);
      }
    }, 120);

    // Server-side cryptographically secure draw
    try {
      const scope: DrawScope =
        scopeType === 'day' ? { type: 'day', eventDayId: selectedDayId } : { type: 'full_week' };
      const unitIdsParam = isAllUnits ? (['all'] as ['all']) : selectedUnitIds;

      const res = await backendService.executeDraw({
        adminUserId: currentUser?.id || 'admin',
        prizeName: prizeName.trim(),
        prizeImageUrl: prizeImageUrl.trim() || undefined,
        groupName: groupName.trim() || 'Grupo Geral',
        scope,
        unitIds: unitIdsParam,
        winnerCount,
        excludePreviousWinners,
      });

      // Wait 3.5 seconds to finish spinning animation before revealing
      setTimeout(() => {
        clearInterval(interval);
        setIsSpinning(false);

        if (res.success && res.data) {
          setCompletedDraw(res.data);
          loadBaseData();
          try {
            confetti({
              particleCount: 150,
              spread: 90,
              origin: { y: 0.6 },
              colors: ['#028056', '#66bd39', '#f59e0b', '#764ba2'],
            });
          } catch (e) {}
        } else {
          toast.error(res.message || 'Falha ao executar sorteio no servidor.');
          setIsLiveModalOpen(false);
        }
      }, 3500);
    } catch (err: any) {
      clearInterval(interval);
      setIsSpinning(false);
      setIsLiveModalOpen(false);
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleVoidDraw = async () => {
    if (!voidModalDraw || !voidReason.trim()) return;
    setIsVoiding(true);
    try {
      const res = await backendService.voidDraw(
        currentUser?.id || 'admin',
        voidModalDraw.id,
        voidReason.trim()
      );
      if (res.success) {
        toast.info('Sorteio anulado com justificativa e registrado na auditoria.');
        setVoidModalDraw(null);
        setVoidReason('');
        loadBaseData();
      } else {
        toast.error(res.message || 'Erro ao anular sorteio.');
      }
    } finally {
      setIsVoiding(false);
    }
  };

  const filteredPool = eligiblePool.filter(u => {
    if (poolSearch.trim()) {
      const q = poolSearch.trim().toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.employeeNumber.toLowerCase().includes(q) ||
        (u.unitNameBackup && u.unitNameBackup.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <AdminShell
      title="Sorteador Oficial — SIPAT Honda"
      subtitle="Execução server-side criptograficamente segura de sorteios com validação estrita de 100% de acertos"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'new_draw' ? 'action' : 'outline'}
            size="md"
            onClick={() => setActiveTab('new_draw')}
            icon={<Sparkles className="w-4 h-4" />}
          >
            Realizar Novo Sorteio
          </Button>
          <Button
            variant={activeTab === 'history' ? 'action' : 'outline'}
            size="md"
            onClick={() => setActiveTab('history')}
            icon={<Trophy className="w-4 h-4" />}
          >
            Histórico Oficial ({draws.length})
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Banner with stats */}
        <div className="bg-gradient-to-r from-[#014730] via-[#028056] to-[#015237] text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-[#66bd39]" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white">Central de Sorteios Auditáveis</h2>
              <p className="text-xs text-emerald-100">
                Apenas participantes com 100% nas questões avaliativas entram no pool.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/15 px-3 py-1.5 rounded-lg font-semibold">
              Datas Ativas: <strong>{days.filter(d => d.active).length}</strong>
            </span>
            <span className="text-xs bg-white/15 px-3 py-1.5 rounded-lg font-semibold">
              Unidades: <strong>{units.length}</strong>
            </span>
            <span className="text-xs bg-[#66bd39] text-[#014730] px-3 py-1.5 rounded-lg font-bold">
              Sorteios Realizados: <strong>{draws.filter(d => d.status === 'published').length}</strong>
            </span>
          </div>
        </div>

        {activeTab === 'new_draw' ? (
          /* TAB 1: Realizar Novo Sorteio */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Panel 1: Configurar Sorteio (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#028056]" />
                  <span>Configurar Sorteio</span>
                </h3>
                <span className="text-xs text-slate-400">Passo 1 de 2</span>
              </div>

              <div className="space-y-4 text-xs">
                <TextField
                  label="Nome do Prêmio"
                  placeholder="Ex.: Bicicleta Ergométrica Honda ou Smartwatch"
                  required
                  value={prizeName}
                  onChange={e => setPrizeName(e.target.value)}
                />

                <TextField
                  label="URL da Imagem do Prêmio (opcional)"
                  placeholder="https://..."
                  value={prizeImageUrl}
                  onChange={e => setPrizeImageUrl(e.target.value)}
                />

                {/* Group Name & Datalist Chips */}
                <div>
                  <TextField
                    label="Nome do Grupo / Categoria do Sorteio"
                    placeholder="Ex.: Grupo Geral"
                    required
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                  />
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Sugestões:</span>
                    {COMMON_GROUPS.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGroupName(g)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          groupName === g
                            ? 'bg-emerald-50 border-[#028056] text-[#015237] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Escopo do Sorteio
                    </label>
                    <Select
                      options={[
                        { value: 'day', label: 'Dia Específico (Gabaritou a Sessão)' },
                        { value: 'full_week', label: 'Semana Completa (Gabaritou Todas as Datas)' },
                      ]}
                      value={scopeType}
                      onChange={e => setScopeType(e.target.value as any)}
                    />
                  </div>

                  {scopeType === 'day' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Selecione a Data
                      </label>
                      <Select
                        options={days.map(d => ({
                          value: d.id,
                          label: `${d.name} (${d.dateLabel.split(' de ')[0]})`,
                        }))}
                        value={selectedDayId}
                        onChange={e => setSelectedDayId(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Units filter */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 text-xs">Unidades Participantes</label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAllUnits(true);
                          setSelectedUnitIds([]);
                        }}
                        className="text-[#028056] font-bold hover:underline cursor-pointer"
                      >
                        Todas as Unidades
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAllUnits(false);
                          setSelectedUnitIds(units.map(u => u.id));
                        }}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        Selecionar Todas
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      checked={isAllUnits}
                      onChange={e => {
                        setIsAllUnits(e.target.checked);
                        if (e.target.checked) setSelectedUnitIds([]);
                      }}
                      label="Todas as unidades corporativas e fabris (sem restrição)"
                    />
                  </div>

                  {!isAllUnits && (
                    <div className="max-h-36 overflow-y-auto border border-slate-200 bg-white rounded-lg p-2 grid grid-cols-2 gap-1.5 custom-scrollbar">
                      {units.map(u => (
                        <label key={u.id} className="flex items-center gap-2 text-[11px] p-1 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUnitIds.includes(u.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedUnitIds(prev => [...prev, u.id]);
                              } else {
                                setSelectedUnitIds(prev => prev.filter(id => id !== u.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-[#028056] border-slate-300"
                          />
                          <span className="truncate">{u.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Winner count stepper */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Quantidade de Ganhadores
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, eligiblePool.length)}
                      value={winnerCount}
                      onChange={e => setWinnerCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-24 h-10 px-3 text-sm font-bold font-mono border border-slate-300 rounded-lg text-center"
                    />

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 5, 10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setWinnerCount(n)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            winnerCount === n
                              ? 'bg-[#028056] text-white border-[#028056]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exclusion toggle */}
                <div className="py-1">
                  <Checkbox
                    checked={excludePreviousWinners}
                    onChange={e => setExcludePreviousWinners(e.target.checked)}
                    label="Excluir colaboradores que já foram contemplados em sorteios anteriores"
                    description="Garante que uma mesma pessoa não receba dois prêmios oficiais na mesma edição"
                  />
                </div>

                {/* Action buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    loading={isLoadingPool}
                    onClick={refreshEligiblePool}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Atualizar Elegíveis
                  </Button>

                  <Button
                    type="button"
                    variant="action"
                    size="lg"
                    disabled={eligiblePool.length === 0 || !prizeName.trim()}
                    onClick={handleExecuteDraw}
                    icon={<Sparkles className="w-4 h-4" />}
                    className="font-bold tracking-wider px-6 text-sm shadow-md"
                  >
                    SORTEAR AGORA!
                  </Button>
                </div>
              </div>
            </div>

            {/* Panel 2: Participantes Aptos (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Participantes Aptos
                    </h3>
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-[#015237] px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                    {eligiblePool.length} Elegíveis
                  </span>
                </div>

                <div className="mb-3">
                  <TextField
                    placeholder="Filtrar por nome ou matrícula..."
                    value={poolSearch}
                    onChange={e => setPoolSearch(e.target.value)}
                    icon={<Search className="w-3.5 h-3.5" />}
                  />
                </div>

                {/* Pool Table */}
                <div className="max-h-[380px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs custom-scrollbar">
                  {isLoadingPool ? (
                    <div className="p-8 text-center text-slate-400">Atualizando pool...</div>
                  ) : filteredPool.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      Nenhum participante elegível encontrado com estes critérios.
                    </div>
                  ) : (
                    filteredPool.map(u => (
                      <div key={u.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-800 block">{u.displayName}</span>
                          <span className="text-[10px] text-slate-400">
                            Mat: {u.employeeNumber} • {u.unitNameBackup || u.unitSlug?.toUpperCase() || 'Unidade Geral'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-[#28a745]" />
                          <span>100% Acertos</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                ⚖️ <strong>Garantia de Compliance:</strong> O sorteio é executado através de gerador pseudo-aleatório criptográfico diretamente no servidor, impedindo interferências no cliente.
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: Histórico de Sorteios */
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Histórico Completo de Sorteios Oficiais
            </h3>

            {draws.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                Nenhum sorteio registrado no sistema.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {draws.map(draw => {
                  const isVoided = draw.status === 'voided';
                  const dayObj = draw.scope.type === 'day' ? days.find(d => d.id === (draw.scope as { type: 'day'; eventDayId: string }).eventDayId) : null;

                  return (
                    <div
                      key={draw.id}
                      className={`bg-white rounded-2xl border p-6 shadow-2xs space-y-4 ${
                        isVoided ? 'border-red-200 opacity-70 bg-red-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {dayObj ? dayObj.name : 'Semana Completa'}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#015237]">
                              {draw.groupName}
                            </span>
                            {isVoided && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700">
                                ANULADO
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold font-display text-slate-900">
                            {draw.prizeName}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Realizado em {formatDateToSaoPaulo(draw.createdAt, 'full')}
                          </span>
                        </div>

                        {!isVoided && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVoidModalDraw(draw);
                              setVoidReason('');
                            }}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Anular</span>
                          </Button>
                        )}
                      </div>

                      {isVoided && draw.voidReason && (
                        <div className="p-3 bg-red-50 rounded-lg text-xs text-red-800 border border-red-200">
                          <strong>Motivo da Anulação:</strong> {draw.voidReason} (em{' '}
                          {draw.voidedAt ? formatDateToSaoPaulo(draw.voidedAt, 'short') : '-'})
                        </div>
                      )}

                      {/* Winners */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Contemplados ({draw.winners.length}):
                        </span>
                        {draw.winners.map(w => (
                          <div
                            key={w.userId}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                                {w.position}º
                              </span>
                              <span className="font-semibold text-slate-800">{w.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Mat: {w.employeeNumber} • {w.unitName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Sorter Modal */}
      <Modal
        isOpen={isLiveModalOpen}
        onClose={() => {
          if (!isSpinning) setIsLiveModalOpen(false);
        }}
        maxWidth="lg"
      >
        <div className="text-center py-4 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-md">
            <Gift className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase bg-[#028056] text-white px-3 py-1 rounded-full">
              SORTEIO OFICIAL AO VIVO
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 mt-2">
              {prizeName}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Grupo: {groupName}</p>
          </div>

          {/* Slot Machine Roulette Spinner */}
          {isSpinning ? (
            <div className="p-8 bg-slate-900 rounded-2xl text-white shadow-inner border border-slate-700">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse block mb-2">
                SORTEANDO ENTRE {eligiblePool.length} APTOS...
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-white transition-all transform scale-105">
                {spinningUser?.displayName || 'Selecionando...'}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Matrícula: {spinningUser?.employeeNumber || '••••••'} •{' '}
                {spinningUser?.unitNameBackup || 'Unidade Honda'}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-6 overflow-hidden">
                <div className="bg-[#66bd39] h-full animate-[pulse_0.4s_infinite]" />
              </div>
            </div>
          ) : completedDraw ? (
            /* Winners Reveal */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h4 className="text-lg font-extrabold text-emerald-900 font-display">
                  Parabéns aos Ganhadores!
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Sorteio finalizado e gravado na base oficial de dados.
                </p>
              </div>

              <div className="space-y-2 text-left">
                {completedDraw.winners.map(w => (
                  <div
                    key={w.userId}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-400 text-white font-extrabold flex items-center justify-center font-display text-xs shadow-xs">
                        {w.position}º
                      </span>
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{w.name}</span>
                        <span className="text-xs text-slate-500">
                          Matrícula: {w.employeeNumber} • {w.unitName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-center">
                <Button variant="primary" size="lg" onClick={() => setIsLiveModalOpen(false)}>
                  Concluir e Fechar
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Void Draw Modal */}
      <Modal
        isOpen={Boolean(voidModalDraw)}
        onClose={() => setVoidModalDraw(null)}
        title="Anular Sorteio Realizado"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <Alert variant="danger">
            A anulação de um sorteio é uma ação permanente que preservará o registro para auditoria e recalculará os próximos sorteios. Os colaboradores premiados nesta rodada voltarão a ser elegíveis se a exclusão anterior estiver ativa.
          </Alert>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Justificativa Obrigatória da Anulação:
            </label>
            <textarea
              rows={3}
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
              placeholder="Ex.: Colaborador sorteado não pertencia à unidade de produção indicada no regulamento específico do lote..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#028056] text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setVoidModalDraw(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={!voidReason.trim() || isVoiding}
              loading={isVoiding}
              onClick={handleVoidDraw}
            >
              Confirmar Anulação
            </Button>
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
};
