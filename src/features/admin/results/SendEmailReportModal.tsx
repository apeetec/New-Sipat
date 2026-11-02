import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { AppUser, EventDay, Question, Participation } from '../../../types';
import {
  createMultiSheetExcelBlob,
  exportMultiSheetExcel,
} from '../../../services/exports/excel-exporter';
import { createCsvBlob, exportToCsv } from '../../../services/exports/csv-exporter';
import { isNodeBackendEnabled, NodeReportsApi } from '../../../services/api/node-backend-client';
import { toast } from '../../../components/feedback/ToastContainer';
import {
  Mail,
  Send,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Users,
  Calendar,
  X,
  Plus,
} from 'lucide-react';

interface SendEmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredUsers: AppUser[];
  days: EventDay[];
  questions: Question[];
  participations: Participation[];
  partMap: Map<string, Participation>;
  currentUserEmail?: string;
}

export const SendEmailReportModal: React.FC<SendEmailReportModalProps> = ({
  isOpen,
  onClose,
  filteredUsers,
  days,
  questions,
  participations,
  partMap,
  currentUserEmail,
}) => {
  const [recipientInput, setRecipientInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>(() => {
    return currentUserEmail ? [currentUserEmail] : ['gestao.sesmt@honda.com.br'];
  });
  const [subject, setSubject] = useState(
    `[SIPAT] Matriz Geral de Resultados e Respostas - ${new Date().toLocaleDateString('pt-BR')}`
  );
  const [message, setMessage] = useState(
    'Olá,\n\nSegue em anexo o relatório executivo completo da Matriz de Resultados e Respostas da SIPAT, contendo a lista de colaboradores, datas de participação, respostas assinaladas por questão e conferência de gabaritos.'
  );
  const [reportScope, setReportScope] = useState<'all' | 'with_answers' | 'without_answers'>('all');
  const [reportFormat, setReportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState('');

  // Group questions by day
  const questionsByDay: Record<string, Question[]> = {};
  days.forEach(d => {
    questionsByDay[d.id] = questions.filter(q => q.eventDayId === d.id && q.active);
  });

  // Calculate filtered dataset based on scope
  const targetUsers = filteredUsers.filter(u => {
    const userParts = participations.filter(p => p.userId === u.id && p.status === 'submitted');
    if (reportScope === 'with_answers') return userParts.length > 0;
    if (reportScope === 'without_answers') return userParts.length === 0;
    return true;
  });

  const handleAddEmail = () => {
    const raw = recipientInput.trim();
    if (!raw) return;

    // Support comma or semicolon separated
    const parsed = raw
      .split(/[,;\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (parsed.length === 0) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    const unique = Array.from(new Set([...recipients, ...parsed]));
    setRecipients(unique);
    setRecipientInput('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setRecipients(recipients.filter(e => e !== emailToRemove));
  };

  /**
   * Builds the comprehensive multi-sheet datasets
   */
  const generateDatasets = () => {
    // 1. Resumo & Participações
    const summaryData = targetUsers.map(u => {
      const userParts = days
        .map(d => ({ day: d, part: partMap.get(`${u.id}_${d.id}`) }))
        .filter(item => item.part && item.part.status === 'submitted');

      const datesList = userParts
        .map(item => item.day.name)
        .join(', ');

      const totalPct = userParts.length > 0
        ? Math.round(userParts.reduce((acc, curr) => acc + (curr.part?.percentage || 0), 0) / userParts.length)
        : 0;

      return {
        Matricula: u.employeeNumber,
        Nome: u.displayName,
        Email: u.email,
        Unidade: u.unitNameBackup || u.unitSlug?.toUpperCase() || '-',
        Empresa: u.company || 'Honda',
        'Total Dias Participados': userParts.length,
        'Progresso Geral': `${userParts.length} de ${days.length} dias (${Math.round((userParts.length / (days.length || 1)) * 100)}%)`,
        'Datas que Participou': datesList || 'Nenhum dia respondido',
        'Media de Acertos (%)': userParts.length > 0 ? `${totalPct}%` : 'Sem respostas',
        Status: userParts.length === days.length ? 'Concluiu Todos os Dias' : userParts.length > 0 ? 'Parcialmente Respondido' : 'Pendente (Não Iniciou)',
      };
    });

    // 2. Matriz Consolidada de Respostas
    const matrixData = targetUsers.map(u => {
      const row: Record<string, any> = {
        Matricula: u.employeeNumber,
        Nome: u.displayName,
        Unidade: u.unitNameBackup || u.unitSlug?.toUpperCase() || '-',
      };

      days.forEach(d => {
        const dayQ = questionsByDay[d.id] || [];
        const part = partMap.get(`${u.id}_${d.id}`);

        dayQ.forEach((q, idx) => {
          const colName = `${d.name}_P${idx + 1}`;
          const ans = part?.answers?.[q.id];

          if (!ans || (!ans.alternativeId && !ans.text && ans.rating === undefined)) {
            row[colName] = 'Não respondeu';
            return;
          }

          if (q.type === 'single_choice') {
            const selectedAlt = q.alternatives.find(a => a.id === ans.alternativeId);
            const isCorrect = Boolean(selectedAlt?.isCorrect);
            const altLetter = selectedAlt ? String.fromCharCode(65 + q.alternatives.indexOf(selectedAlt)) : '?';

            if (q.scored) {
              row[colName] = isCorrect
                ? `[${altLetter}] CORRETA: ${selectedAlt?.text || ''}`
                : `[${altLetter}] INCORRETA: ${selectedAlt?.text || ''}`;
            } else {
              row[colName] = `[${altLetter}] ${selectedAlt?.text || ''}`;
            }
          } else if (q.type === 'rating') {
            row[colName] = `${ans.rating} estrelas`;
          } else {
            row[colName] = ans.text || 'Respondido';
          }
        });
      });

      return row;
    });

    // 3. Detalhamento Linha a Linha (Raw Data completo)
    const detailedData: Record<string, any>[] = [];

    targetUsers.forEach(u => {
      days.forEach(d => {
        const dayQ = questionsByDay[d.id] || [];
        const part = partMap.get(`${u.id}_${d.id}`);
        const attendedThisDay = Boolean(part && part.status === 'submitted');

        dayQ.forEach((q, qIdx) => {
          const ans = part?.answers?.[q.id];
          const hasAnswer = Boolean(ans && (ans.alternativeId || ans.text || ans.rating !== undefined));

          let selectedAnswerText = 'Não respondeu';
          let correctnessStatus = 'Sem resposta';
          let correctGabaritoText = '-';

          if (q.type === 'single_choice') {
            const correctAlt = q.alternatives.find(a => a.isCorrect);
            if (correctAlt) {
              const cLetter = String.fromCharCode(65 + q.alternatives.indexOf(correctAlt));
              correctGabaritoText = `(${cLetter}) ${correctAlt.text}`;
            }

            if (ans?.alternativeId) {
              const selectedAlt = q.alternatives.find(a => a.id === ans.alternativeId);
              if (selectedAlt) {
                const sLetter = String.fromCharCode(65 + q.alternatives.indexOf(selectedAlt));
                selectedAnswerText = `(${sLetter}) ${selectedAlt.text}`;
                if (q.scored) {
                  correctnessStatus = selectedAlt.isCorrect ? 'CORRETA' : 'INCORRETA';
                } else {
                  correctnessStatus = 'PESQUISA (Sem gabarito)';
                }
              }
            }
          } else if (q.type === 'rating') {
            if (ans?.rating !== undefined) {
              selectedAnswerText = `${ans.rating} Estrelas`;
              correctnessStatus = 'AVALIAÇÃO';
            }
          } else if (q.type === 'free_text') {
            if (ans?.text) {
              selectedAnswerText = ans.text;
              correctnessStatus = 'TEXTO LIVRE';
            }
          }

          detailedData.push({
            Matricula: u.employeeNumber,
            'Nome do Colaborador': u.displayName,
            Email: u.email,
            Unidade: u.unitNameBackup || u.unitSlug?.toUpperCase() || '-',
            'Dia / Sessao': d.name,
            'Data da Sessao': d.dateLabel,
            'Participou Deste Dia?': attendedThisDay ? 'SIM' : 'NÃO',
            'Modalidade': attendedThisDay ? (part?.modality === 'in_person' ? 'Presencial' : 'Remoto') : '-',
            'Data/Hora Envio': part?.submittedAt ? new Date(part.submittedAt).toLocaleString('pt-BR') : '-',
            'Questao Num': `P${qIdx + 1}`,
            'Enunciado da Pergunta': q.title,
            'Tipo da Pergunta': q.scored ? 'Avaliativa (Nota)' : 'Pesquisa de Opinião',
            'Resposta Assinalada': selectedAnswerText,
            'Status da Resposta': correctnessStatus,
            'Gabarito Oficial (Correta)': correctGabaritoText,
            'Nota do Dia (%)': attendedThisDay && part?.percentage !== undefined ? `${part.percentage}%` : '-',
          });
        });
      });
    });

    return { summaryData, matrixData, detailedData };
  };

  const handleDownloadAttachment = async () => {
    const { summaryData, matrixData, detailedData } = generateDatasets();
    const filename = `relatorio_matriz_respostas_${Date.now()}`;

    if (reportFormat === 'xlsx') {
      try {
        await exportMultiSheetExcel(
          [
            { name: 'Resumo_Participacoes', data: summaryData },
            { name: 'Matriz_Respostas', data: matrixData },
            { name: 'Detalhamento_Completo', data: detailedData },
          ],
          filename
        );
        toast.success('Planilha Excel gerada e baixada com sucesso.');
      } catch {
        toast.error('Não foi possível gerar a planilha Excel.');
      }
    } else {
      exportToCsv(detailedData, `${filename}.csv`, ';');
      toast.success('Arquivo CSV baixado com sucesso.');
    }
  };

  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      toast.error('Adicione ao menos um e-mail de destinatário.');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Informe o assunto e a mensagem do e-mail.');
      return;
    }
    if (!isNodeBackendEnabled) {
      toast.error('Configure VITE_API_URL para enviar o relatório pela API.');
      return;
    }

    setSending(true);

    try {
      const { summaryData, matrixData, detailedData } = generateDatasets();
      const baseName = `relatorio_matriz_respostas_${Date.now()}`;
      const attachment = reportFormat === 'xlsx'
        ? await createMultiSheetExcelBlob([
            { name: 'Resumo_Participacoes', data: summaryData },
            { name: 'Matriz_Respostas', data: matrixData },
            { name: 'Detalhamento_Completo', data: detailedData },
          ])
        : createCsvBlob(detailedData, ';');
      const delivery = await NodeReportsApi.sendResultsEmail({
        recipients,
        subject: subject.trim(),
        message: message.trim(),
        attachment,
        filename: `${baseName}.${reportFormat}`,
      });

      setDeliveryMessage(delivery.message);
      setSentSuccess(true);
      toast.success(delivery.message);

      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Falha ao enviar relatório por e-mail:', err);
      toast.error('Erro ao processar envio de e-mail. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenMailto = () => {
    if (recipients.length === 0) {
      toast.error('Adicione ao menos um destinatário.');
      return;
    }

    const { summaryData } = generateDatasets();
    const respondentsCount = targetUsers.filter(u =>
      participations.some(p => p.userId === u.id && p.status === 'submitted')
    ).length;

    const emailBody = `${message}\n\n` +
      `-----------------------------------------\n` +
      `RESUMO EXECUTIVO DO RELATÓRIO:\n` +
      `- Total de Colaboradores Selecionados: ${targetUsers.length}\n` +
      `- Colaboradores com Respostas: ${respondentsCount}\n` +
      `- Pendentes / Sem Resposta: ${targetUsers.length - respondentsCount}\n` +
      `- Total de Dias de Palestra: ${days.length}\n` +
      `- Total de Questões: ${questions.length}\n` +
      `-----------------------------------------\n` +
      `Os dados completos com gabarito e respostas assinaladas foram consolidados no sistema.`;

    const mailtoUrl = `mailto:${encodeURIComponent(recipients.join(','))}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(emailBody)}`;

    window.open(mailtoUrl, '_blank');
    toast.success('Cliente de e-mail padrão aberto.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Dados e Respostas por E-mail"
      description="Dispare ou encaminhe a planilha com as respostas assinaladas, gabarito e participações por data"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs text-slate-700">
        {sentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Relatório Processado com Sucesso!
            </h3>
            <p className="text-slate-500 max-w-md mx-auto text-xs">
              {deliveryMessage}{' '}Destinatário(s):{' '}
              <strong className="text-slate-800">{recipients.join(', ')}</strong>.
            </p>
          </div>
        ) : (
          <>
            {/* Destinatários */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Destinatários do E-mail</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {recipients.length} e-mail(s) configurado(s)
                </span>
              </label>

              <div className="flex gap-2">
                <div className="flex-1">
                  <TextField
                    placeholder="Digite o e-mail (ex: gerencia@empresa.com.br)"
                    value={recipientInput}
                    onChange={e => setRecipientInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    icon={<Mail className="w-4 h-4 text-slate-400" />}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddEmail}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Adicionar
                </Button>
              </div>

              {/* Badges dos Destinatários */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recipients.map(email => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 font-mono text-[11px]"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                      title="Remover destinatário"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Assunto e Mensagem */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Assunto da Mensagem
                </label>
                <TextField
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Assunto do e-mail"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Mensagem de Acompanhamento
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#028056] focus:border-transparent resize-none"
                  placeholder="Insira notas explicativas ou instruções para quem receber o relatório..."
                />
              </div>
            </div>

            {/* Configurações do Relatório */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-3">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                Parâmetros do Relatório Anexo
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Escopo dos Colaboradores
                  </label>
                  <select
                    value={reportScope}
                    onChange={e => setReportScope(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#028056]"
                  >
                    <option value="all">Todos os colaboradores filtrados ({targetUsers.length})</option>
                    <option value="with_answers">Apenas quem já respondeu ao menos 1 dia</option>
                    <option value="without_answers">Apenas quem NÃO respondeu nada (Cobrança)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Formato do Anexo
                  </label>
                  <select
                    value={reportFormat}
                    onChange={e => setReportFormat(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#028056]"
                  >
                    <option value="xlsx">Planilha Excel (.xlsx) Multi-Abas com Gabarito</option>
                    <option value="csv">Arquivo Separado por Vírgulas (.csv)</option>
                  </select>
                </div>
              </div>

              {/* Informações detalhadas do que será anexado */}
              <div className="text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  O anexo conterá com exatidão:
                </span>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-600 text-[10px]">
                  <li>
                    <strong>Respostas Assinaladas:</strong> texto integral da alternativa escolhida pelo colaborador.
                  </li>
                  <li>
                    <strong>Conferência de Gabarito:</strong> indicação clara se a resposta está <span className="text-emerald-700 font-bold">CORRETA</span> ou <span className="text-red-700 font-bold">INCORRETA</span> e qual era o gabarito oficial.
                  </li>
                  <li>
                    <strong>Datas Participadas:</strong> histórico consolidado de todas as sessões e dias com status de envio.
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadAttachment}
                icon={<Download className="w-3.5 h-3.5 text-slate-600" />}
                title="Baixar cópia local do arquivo antes de enviar"
              >
                Baixar Prévia
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenMailto}
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                  title="Abrir no Outlook, Gmail ou app de e-mail do computador"
                >
                  Abrir no Meu E-mail
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={sending}
                  onClick={handleSendEmail}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  {sending ? 'Disparando...' : 'Disparar E-mail'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
