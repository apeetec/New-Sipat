import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { backendService } from '../../services/api/backend-service';
import { PasswordField } from '../../components/ui/PasswordField';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { validatePasswordStrength } from '../../utils/security';
import { KeyRound, Check, X, LogOut } from 'lucide-react';

export const FirstAccessPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const strength = validatePasswordStrength(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!strength.valid) {
      setErrorMessage(strength.message || 'Verifique os requisitos de segurança da senha.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('A confirmação da senha não coincide com a nova senha.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await backendService.completeFirstAccess(user.id, newPassword);
      if (res.success) {
        await refreshUser();
        // Next step is regulation
        navigate('/regulamento', { replace: true });
      } else {
        setErrorMessage(res.message || 'Não foi possível atualizar a senha.');
      }
    } catch (err) {
      setErrorMessage('Erro ao salvar nova senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#014730] via-[#028056] to-[#015237] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-[20px] shadow-2xl p-6 sm:p-8 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#028056] flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>

        <h2 className="text-xl font-bold text-slate-900 font-display">Primeiro Acesso — Criar Nova Senha</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
          Olá, <strong>{user?.displayName}</strong>. Por motivos de segurança institucional, é obrigatório cadastrar uma nova senha pessoal antes de acessar o portal.
        </p>

        {errorMessage && (
          <div className="mb-5">
            <Alert variant="danger">{errorMessage}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            label="Nova Senha Pessoal"
            placeholder="Digite sua nova senha"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />

          <PasswordField
            label="Confirme a Nova Senha"
            placeholder="Repita a senha digitada"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />

          {/* Security Checklist */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
            <span className="font-semibold text-slate-700 block mb-1">Requisitos de segurança:</span>
            <div className={`flex items-center gap-2 ${strength.lengthOk ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              {strength.lengthOk ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
              <span>Mínimo de 8 caracteres</span>
            </div>
            <div className={`flex items-center gap-2 ${strength.hasLetter ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              {strength.hasLetter ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
              <span>Pelo menos uma letra</span>
            </div>
            <div className={`flex items-center gap-2 ${strength.hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              {strength.hasNumber ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
              <span>Pelo menos um número</span>
            </div>
            {confirmPassword.length > 0 && (
              <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}`}>
                {passwordsMatch ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-500" />}
                <span>Senhas coincidem</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="action"
            size="lg"
            loading={loading}
            disabled={!strength.valid || !passwordsMatch}
            className="w-full mt-2 font-bold tracking-wide"
          >
            SALVAR SENHA E CONTINUAR
          </Button>
        </form>
      </div>
    </div>
  );
};
