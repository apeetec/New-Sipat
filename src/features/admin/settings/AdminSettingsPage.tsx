import React, { useState, useEffect } from 'react';
import { settingsRepository } from '../../../services/repositories';
import { AppSettings, Regulation } from '../../../types';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Alert } from '../../../components/ui/Alert';
import { toast } from '../../../components/feedback/ToastContainer';
import { Settings, Shield, Sliders, FileText, CheckCircle2 } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [regulation, setRegulation] = useState<Regulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [eventName, setEventName] = useState('');
  const [eventYear, setEventYear] = useState(2026);
  const [initialPasswordHelpText, setInitialPasswordHelpText] = useState('');
  const [videoThreshold, setVideoThreshold] = useState(99);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [maskEmployeeNumber, setMaskEmployeeNumber] = useState(true);
  const [regulationVersion, setRegulationVersion] = useState('2026.1');
  const [regulationTitle, setRegulationTitle] = useState('');
  const [regulationHtml, setRegulationHtml] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [appSettings, activeReg] = await Promise.all([
          settingsRepository.getSettings(),
          settingsRepository.getRegulation(),
        ]);
        setSettings(appSettings);
        setRegulation(activeReg);

        setEventName(appSettings.eventName);
        setEventYear(appSettings.eventYear);
        setInitialPasswordHelpText(appSettings.initialPasswordHelpText);
        setVideoThreshold(appSettings.videoCompletionThresholdPercent);
        setShowCorrectAnswers(appSettings.showCorrectAnswersAfterSubmit);
        setMaskEmployeeNumber(appSettings.maskEmployeeNumberInWinners);

        if (activeReg) {
          setRegulationVersion(activeReg.version);
          setRegulationTitle(activeReg.title);
          setRegulationHtml(activeReg.contentHtml);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsRepository.updateSettings({
        eventName,
        eventYear,
        initialPasswordHelpText,
        videoCompletionThresholdPercent: videoThreshold,
        showCorrectAnswersAfterSubmit: showCorrectAnswers,
        maskEmployeeNumberInWinners: maskEmployeeNumber,
        activeRegulationVersion: regulationVersion,
      });

      if (regulationTitle && regulationHtml) {
        await settingsRepository.saveRegulation({
          version: regulationVersion,
          title: regulationTitle,
          contentHtml: regulationHtml,
          published: true,
          effectiveFrom: new Date().toISOString(),
          createdAt: regulation?.createdAt || new Date().toISOString(),
        });
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Configurações Gerais">
        <div className="p-8 text-center text-slate-400">Carregando configurações...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Configurações Gerais do Portal"
      subtitle="Parâmetros de campanha, políticas de segurança, privacidade LGPD e termos do regulamento"
    >
      <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-8 text-xs">
        {/* Campaign Identification */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-4 h-4 text-[#028056]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Identificação da Campanha
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Nome do Evento"
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              required
            />
            <TextField
              type="number"
              label="Ano da Edição"
              value={eventYear}
              onChange={e => setEventYear(parseInt(e.target.value, 10) || 2026)}
              required
            />
          </div>

          <TextField
            label="Instrução de Senha Inicial (Exibida no Card de Login)"
            value={initialPasswordHelpText}
            onChange={e => setInitialPasswordHelpText(e.target.value)}
          />
        </div>

        {/* Security & Experience Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-[#028056]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Regras de Avaliação & Privacidade
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              type="number"
              label="Percentual de Vídeo para Desbloquear Questionário (%)"
              value={videoThreshold}
              onChange={e => setVideoThreshold(parseInt(e.target.value, 10) || 99)}
              helperText="Padrão de integridade: 99%"
            />
          </div>

          <div className="space-y-3 pt-2">
            <Checkbox
              checked={showCorrectAnswers}
              onChange={e => setShowCorrectAnswers(e.target.checked)}
              label="Exibir gabarito com respostas corretas após o envio do questionário"
              description="Quando desmarcado, o colaborador visualiza apenas suas próprias respostas enviadas"
            />

            <Checkbox
              checked={maskEmployeeNumber}
              onChange={e => setMaskEmployeeNumber(e.target.checked)}
              label="Mascarar parcialmente a matrícula dos vencedores na galeria pública (Conformidade LGPD)"
              description="Exemplo de exibição: 10****10 em vez da matrícula completa"
            />
          </div>
        </div>

        {/* Official Regulation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-[#028056]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Regulamento Oficial Vigente
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Versão do Regulamento"
              value={regulationVersion}
              onChange={e => setRegulationVersion(e.target.value)}
              helperText="Ex.: 2026.1 (atualizar invalida o aceite antigo e exige novo aceite dos colaboradores)"
            />
            <TextField
              label="Título do Documento"
              value={regulationTitle}
              onChange={e => setRegulationTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Conteúdo HTML do Regulamento:
            </label>
            <textarea
              rows={8}
              value={regulationHtml}
              onChange={e => setRegulationHtml(e.target.value)}
              className="w-full font-mono text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#028056] text-slate-800 bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" variant="action" size="lg" loading={saving} className="font-bold tracking-wide">
            Salvar Todas as Configurações
          </Button>
        </div>
      </form>
    </AdminShell>
  );
};
