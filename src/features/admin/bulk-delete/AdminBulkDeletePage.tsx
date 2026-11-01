import React, { useState } from 'react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { Alert } from '../../../components/ui/Alert';
import { toast } from '../../../components/feedback/ToastContainer';
import { userRepository, auditRepository } from '../../../services/repositories';
import { useAuth } from '../../auth/AuthContext';
import { AppUser } from '../../../types';
import { UserX, ShieldAlert, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

const REQUIRED_CONFIRMATION_PHRASE = 'CONFIRMAR DESATIVACAO EM MASSA';

export const AdminBulkDeletePage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [identifiersText, setIdentifiersText] = useState('');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Analysis Preview State
  const [previewData, setPreviewData] = useState<{
    foundUsers: AppUser[];
    protectedUsers: AppUser[];
    notFoundIdentifiers: string[];
  } | null>(null);

  const [executionResult, setExecutionResult] = useState<{
    deactivatedCount: number;
    protectedCount: number;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!identifiersText.trim()) {
      toast.error('Informe ao menos uma matrícula ou e-mail.');
      return;
    }

    setIsAnalyzing(true);
    setPreviewData(null);
    setExecutionResult(null);

    try {
      const rawLines = identifiersText.split(/\r?\n/);
      const identifiers = rawLines
        .map(l => l.trim())
        .filter(l => l && !l.startsWith(';;')); // ignore comments starting with ;;

      const allUsers = await userRepository.list();
      const userByEmp = new Map(allUsers.map(u => [u.employeeNumber.toLowerCase(), u]));
      const userByEmail = new Map(allUsers.map(u => [u.email.toLowerCase(), u]));

      const foundUsersMap = new Map<string, AppUser>();
      const protectedUsersMap = new Map<string, AppUser>();
      const notFound: string[] = [];

      identifiers.forEach(id => {
        const norm = id.toLowerCase();
        const user = userByEmp.get(norm) || userByEmail.get(norm);

        if (!user) {
          notFound.push(id);
          return;
        }

        // Check protected status
        const isSelf = user.id === currentUser?.id;
        const isAdmin = user.role === 'admin';
        const isSystem = user.employeeNumber === 'admin';

        if (isSelf || isAdmin || isSystem) {
          protectedUsersMap.set(user.id, user);
        } else {
          foundUsersMap.set(user.id, user);
        }
      });

      setPreviewData({
        foundUsers: Array.from(foundUsersMap.values()),
        protectedUsers: Array.from(protectedUsersMap.values()),
        notFoundIdentifiers: notFound,
      });

      toast.info('Pré-visualização gerada. Confira as contas protegidas antes de confirmar.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecute = async () => {
    if (!previewData) return;

    if (confirmationPhrase.trim() !== REQUIRED_CONFIRMATION_PHRASE) {
      toast.error(`Digite exatamente a frase de confirmação: "${REQUIRED_CONFIRMATION_PHRASE}"`);
      return;
    }

    if (previewData.foundUsers.length === 0) {
      toast.error('Nenhuma conta elegível para desativação.');
      return;
    }

    setIsExecuting(true);

    try {
      for (const target of previewData.foundUsers) {
        await userRepository.update(target.id, { active: false });
      }

      await auditRepository.logAudit({
        actorUserId: currentUser?.id || 'admin',
        actorName: currentUser?.displayName || 'Administrador',
        action: 'BULK_DEACTIVATE_USERS',
        entity: 'users',
        entityId: `bulk-${Date.now()}`,
        afterData: {
          deactivatedCount: previewData.foundUsers.length,
          protectedAccountsSkipped: previewData.protectedUsers.length,
          employeeNumbers: previewData.foundUsers.map(u => u.employeeNumber),
        },
      });

      setExecutionResult({
        deactivatedCount: previewData.foundUsers.length,
        protectedCount: previewData.protectedUsers.length,
      });

      toast.success(`${previewData.foundUsers.length} contas de colaboradores foram desativadas com sucesso.`);
    } catch (err: any) {
      toast.error(`Erro durante execução: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AdminShell
      title="Desativação em Massa de Usuários"
      subtitle="Rotina segura para encerramento de acessos com bloqueio irrestrito de administradores e auditoria completa"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="danger" title="Atenção: Ação Administrativa de Impacto">
          Esta ferramenta realiza a desativação (soft delete seguro) de contas de colaboradores em lote. Contas administrativas e seu próprio usuário em sessão são automaticamente protegidos contra desativação.
        </Alert>

        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <label className="text-xs font-bold text-slate-800 block">
            Cole as matrículas ou e-mails dos colaboradores (um por linha):
          </label>
          <p className="text-[11px] text-slate-500">
            Linhas iniciadas por <code>;;</code> são tratadas como comentários e desconsideradas.
          </p>

          <textarea
            rows={6}
            value={identifiersText}
            onChange={e => setIdentifiersText(e.target.value)}
            placeholder={`101010\n101011\n;; Linha de comentário ignorada\ncolaborador@honda.com.br`}
            className="w-full text-xs font-mono p-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#028056] text-slate-800 bg-white leading-relaxed"
          />

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="md"
              loading={isAnalyzing}
              onClick={handleAnalyze}
              icon={<UserX className="w-4 h-4" />}
            >
              Pré-Visualizar Contas
            </Button>
          </div>
        </div>

        {/* Preview Results */}
        {previewData && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Resumo da Pré-Visualização
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-2xl font-extrabold text-amber-800 font-mono block">
                  {previewData.foundUsers.length}
                </span>
                <span className="text-xs font-semibold text-amber-700">Contas a Desativar</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-2xl font-extrabold text-emerald-800 font-mono block">
                  {previewData.protectedUsers.length}
                </span>
                <span className="text-xs font-semibold text-emerald-700">Contas Protegidas (Admins)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-2xl font-extrabold text-slate-700 font-mono block">
                  {previewData.notFoundIdentifiers.length}
                </span>
                <span className="text-xs font-semibold text-slate-600">Não Encontrados</span>
              </div>
            </div>

            {/* Protected Users List */}
            {previewData.protectedUsers.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Shield className="w-4 h-4 text-[#028056]" />
                  <span>Contas Protegidas pelo Sistema (Não serão alteradas):</span>
                </div>
                <ul className="text-xs text-emerald-800 space-y-1 pl-6 list-disc">
                  {previewData.protectedUsers.map(u => (
                    <li key={u.id}>
                      <strong>{u.displayName}</strong> ({u.employeeNumber} - {u.email}) • Motivo: Administrador / Sessão Ativa
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Found Users List */}
            {previewData.foundUsers.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Colaboradores que serão desativados:
                </span>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs custom-scrollbar">
                  {previewData.foundUsers.map(u => (
                    <div key={u.id} className="p-2.5 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {u.displayName} ({u.employeeNumber})
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation Box */}
            {previewData.foundUsers.length > 0 && !executionResult && (
              <div className="p-5 rounded-xl bg-red-50/60 border border-red-200 space-y-4">
                <div>
                  <label className="text-xs font-bold text-red-900 block mb-1">
                    Confirmação de Segurança:
                  </label>
                  <p className="text-xs text-red-700 mb-3">
                    Digite a frase <code>{REQUIRED_CONFIRMATION_PHRASE}</code> para autorizar o procedimento:
                  </p>
                  <TextField
                    placeholder={REQUIRED_CONFIRMATION_PHRASE}
                    value={confirmationPhrase}
                    onChange={e => setConfirmationPhrase(e.target.value.toUpperCase())}
                    className="font-mono text-center uppercase tracking-wider font-bold"
                  />
                </div>

                <Button
                  variant="danger"
                  size="lg"
                  disabled={confirmationPhrase.trim() !== REQUIRED_CONFIRMATION_PHRASE || isExecuting}
                  loading={isExecuting}
                  onClick={handleExecute}
                  className="w-full font-bold tracking-wide"
                >
                  CONFIRMAR E DESATIVAR {previewData.foundUsers.length} CONTAS
                </Button>
              </div>
            )}

            {/* Execution Result */}
            {executionResult && (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#28a745] mx-auto mb-2" />
                <h4 className="text-base font-bold text-emerald-900 font-display">Operação Concluída com Sucesso</h4>
                <p className="text-xs text-emerald-800 mt-1">
                  {executionResult.deactivatedCount} contas foram desativadas e a ação foi registrada na trilha de auditoria.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
};
