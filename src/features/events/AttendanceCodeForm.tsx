import React, { useState } from 'react';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { KeyRound, CheckCircle2 } from 'lucide-react';

export interface AttendanceCodeFormProps {
  daySortOrder: number;
  onValidate: (code: string) => Promise<{ valid: boolean; message: string }>;
  isValidated: boolean;
}

export const AttendanceCodeForm: React.FC<AttendanceCodeFormProps> = ({
  daySortOrder,
  onValidate,
  isValidated,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await onValidate(code.trim());
      if (res.valid) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'danger', message: res.message });
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Erro ao validar código. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  if (isValidated) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-8 h-8 text-[#28a745] mx-auto mb-2" />
        <h4 className="text-sm font-bold text-emerald-900 font-display">Presença Presencial Confirmada!</h4>
        <p className="text-xs text-emerald-700 mt-1">
          Sua presença presencial já foi registrada com sucesso. O questionário avaliativo abaixo está liberado! O vídeo da palestra é opcional.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
      <div className="max-w-md mx-auto text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#028056] flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-900 font-display">Validação de Presença no Local</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Digite o código de presença informado pelo facilitador da sessão para liberar seu questionário imediatamente.
        </p>
      </div>

      {feedback && (
        <div className="max-w-md mx-auto mb-4">
          <Alert variant={feedback.type}>{feedback.message}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
        <TextField
          placeholder={`Ex.: SIPAT0${daySortOrder}`}
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="uppercase tracking-widest text-center font-bold"
          required
        />
        <Button
          type="submit"
          variant="action"
          loading={loading}
          disabled={!code.trim()}
          className="font-bold tracking-wide shrink-0"
        >
          VALIDAR CÓDIGO
        </Button>
      </form>

      <div className="mt-4 text-center">
        <span className="text-[11px] text-slate-400">
          Código de teste para avaliação: <code>SIPAT0{daySortOrder}</code>
        </span>
      </div>
    </div>
  );
};
