import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { settingsRepository } from '../../services/repositories';
import { backendService } from '../../services/api/backend-service';
import { Regulation } from '../../types';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Alert';
import { FileText, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';

export const RegulationPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [regulation, setRegulation] = useState<Regulation | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isAlreadyAccepted = Boolean(user?.regulationAcceptedVersion);

  useEffect(() => {
    settingsRepository.getRegulation().then(reg => {
      setRegulation(reg);
    });
  }, []);

  const handleAccept = async () => {
    if (!user || !regulation || !agreed) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await backendService.acceptRegulation(user.id, regulation.version);
      if (res.success) {
        await refreshUser();
        navigate('/', { replace: true });
      } else {
        setErrorMessage(res.message || 'Erro ao registrar aceite.');
      }
    } catch (err) {
      setErrorMessage('Erro ao comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell showBanner={false}>
      <div className="max-w-3xl mx-auto py-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#028056] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#028056]">
            Termos & Condições de Participação
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 mt-1">
            {regulation?.title || 'Regulamento Oficial — SIPAT Honda'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Versão {regulation?.version} • Vigente para todos os colaboradores participantes
          </p>
        </div>

        {isAlreadyAccepted && (
          <div className="mb-6">
            <Alert variant="success" title="Regulamento Já Aceito">
              Você já aceitou a versão <strong>{user?.regulationAcceptedVersion}</strong> deste regulamento em{' '}
              {user?.regulationAcceptedAt ? new Date(user.regulationAcceptedAt).toLocaleDateString('pt-BR') : 'data anterior'}. O texto abaixo permanece disponível para consulta.
            </Alert>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6">
            <Alert variant="danger">{errorMessage}</Alert>
          </div>
        )}

        {/* Content Box */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-[#028056]" />
              <span>Documento Oficial CIPA / Honda Automóveis do Brasil</span>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>

          <div
            className="prose prose-sm max-w-none text-slate-700 space-y-4"
            dangerouslySetInnerHTML={{
              __html: regulation?.contentHtml || '<p>Carregando regulamento oficial...</p>',
            }}
          />
        </div>

        {/* Acceptance Box */}
        {!isAlreadyAccepted ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <Checkbox
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                label="Declaro que li e concordo integralmente com os termos e regras da SIPAT Honda 2026."
                description="O aceite registra digitalmente seu consentimento para participação e elegibilidade aos sorteios."
              />
            </div>

            <Button
              variant="action"
              size="lg"
              disabled={!agreed}
              loading={loading}
              onClick={handleAccept}
              className="w-full sm:w-auto font-bold tracking-wide"
            >
              LI E CONCORDO COM O REGULAMENTO
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Button variant="primary" size="md" onClick={() => navigate('/')}>
              <CheckCircle2 className="w-4 h-4" />
              <span>Voltar para as Palestras</span>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
};
