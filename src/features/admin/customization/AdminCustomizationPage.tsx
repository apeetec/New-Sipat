import React, { useState, useEffect, useRef } from 'react';
import { settingsRepository } from '../../../services/repositories';
import { AppSettings } from '../../../types';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Tabs } from '../../../components/ui/Tabs';
import { Alert } from '../../../components/ui/Alert';
import { toast } from '../../../components/feedback/ToastContainer';
import { applyThemeColors } from '../../../utils/theme';
import {
  Palette,
  Type,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Check,
  Eye,
  ShieldCheck,
  Upload,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface ColorPreset {
  name: string;
  primary: string;
  primaryDark: string;
  action: string;
  bg: string;
}

const PRESETS: ColorPreset[] = [
  {
    name: '🌿 Honda Verde Oficial (Padrão)',
    primary: '#028056',
    primaryDark: '#015237',
    action: '#66bd39',
    bg: '#e2e8e8',
  },
  {
    name: '🔵 Azul Corporativo / Qualidade',
    primary: '#1d4ed8',
    primaryDark: '#1e3a8a',
    action: '#3b82f6',
    bg: '#f1f5f9',
  },
  {
    name: '🔴 Vermelho Segurança / Aço',
    primary: '#b91c1c',
    primaryDark: '#7f1d1d',
    action: '#ef4444',
    bg: '#fef2f2',
  },
  {
    name: '🟣 Roxo Inovação / Tech',
    primary: '#7e22ce',
    primaryDark: '#581c87',
    action: '#a855f7',
    bg: '#faf5ff',
  },
  {
    name: '🟠 Laranja Energia / Saúde',
    primary: '#c2410c',
    primaryDark: '#7c2d12',
    action: '#f97316',
    bg: '#fff7ed',
  },
  {
    name: '⚫ Grafite Minimalista / Executivo',
    primary: '#334155',
    primaryDark: '#0f172a',
    action: '#10b981',
    bg: '#f8fafc',
  },
];

export const AdminCustomizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'colors' | 'login' | 'home' | 'preview'>('colors');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [brandName, setBrandName] = useState('Portal SIPAT Honda');
  const [brandSubtitle, setBrandSubtitle] = useState('Cuidar de você é a nossa maior segurança');
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState('');
  const [logoFileName, setLogoFileName] = useState('');

  // Colors
  const [primaryColor, setPrimaryColor] = useState('#028056');
  const [primaryDarkColor, setPrimaryDarkColor] = useState('#015237');
  const [actionColor, setActionColor] = useState('#66bd39');
  const [backgroundColor, setBackgroundColor] = useState('#e2e8e8');

  // Login Page Texts
  const [loginTitle, setLoginTitle] = useState('Acesse sua conta');
  const [loginSubtitle, setLoginSubtitle] = useState('Utilize sua matrícula funcional da Honda para ingressar no evento.');
  const [loginBadgeText, setLoginBadgeText] = useState('Honda Automóveis do Brasil');
  const [initialPasswordHelpText, setInitialPasswordHelpText] = useState('Senha inicial: data de aniversário sem barras. Exemplo: 01051995');

  // Home Page Texts
  const [homeHeadline, setHomeHeadline] = useState('Semana Interna de Prevenção de Acidentes do Trabalho');
  const [homeDescription, setHomeDescription] = useState('Participe diariamente dos treinamentos presenciais ou assista aos vídeos oficiais para validar sua presença, testar seus conhecimentos e concorrer aos sorteios oficiais da SIPAT.');
  const [supportContact, setSupportContact] = useState('seguranca.trabalho@honda.com.br');

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await settingsRepository.getSettings();
      if (settings) {
        setBrandName(settings.brandName || settings.eventName || 'Portal SIPAT Honda');
        setBrandSubtitle(settings.brandSubtitle || 'Cuidar de você é a nossa maior segurança');
        setPrimaryLogoUrl(settings.primaryLogoUrl || '');
        setPrimaryColor(settings.primaryColor || '#028056');
        setPrimaryDarkColor(settings.primaryDarkColor || '#015237');
        setActionColor(settings.actionColor || '#66bd39');
        setBackgroundColor(settings.backgroundColor || '#e2e8e8');
        setLoginTitle(settings.loginTitle || 'Acesse sua conta');
        setLoginSubtitle(settings.loginSubtitle || 'Utilize sua matrícula funcional da Honda para ingressar no evento.');
        setLoginBadgeText(settings.loginBadgeText || 'Honda Automóveis do Brasil');
        setInitialPasswordHelpText(settings.initialPasswordHelpText || 'Senha inicial: data de aniversário sem barras. Exemplo: 01051995');
        setHomeHeadline(settings.homeHeadline || 'Semana Interna de Prevenção de Acidentes do Trabalho');
        setHomeDescription(settings.homeDescription || 'Participe diariamente dos treinamentos presenciais ou assista aos vídeos oficiais para validar sua presença, testar seus conhecimentos e concorrer aos sorteios oficiais da SIPAT.');
        setSupportContact(settings.supportContact || 'seguranca.trabalho@honda.com.br');

        // Apply immediately
        applyThemeColors(settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: ColorPreset) => {
    setPrimaryColor(preset.primary);
    setPrimaryDarkColor(preset.primaryDark);
    setActionColor(preset.action);
    setBackgroundColor(preset.bg);

    // Live preview theme update
    applyThemeColors({
      primaryColor: preset.primary,
      primaryDarkColor: preset.primaryDark,
      actionColor: preset.action,
      backgroundColor: preset.bg,
    });

    toast.info(`Preset "${preset.name}" aplicado na pré-visualização!`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida (PNG, JPG, SVG).');
      return;
    }

    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPrimaryLogoUrl(reader.result);
        toast.success('Logotipo carregado com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated: Partial<AppSettings> = {
        brandName,
        brandSubtitle,
        primaryLogoUrl,
        primaryColor,
        primaryDarkColor,
        actionColor,
        backgroundColor,
        loginTitle,
        loginSubtitle,
        loginBadgeText,
        initialPasswordHelpText,
        homeHeadline,
        homeDescription,
        supportContact,
      };

      await settingsRepository.updateSettings(updated);
      applyThemeColors(updated);
      toast.success('Configurações visuais e textos salvos com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    handleApplyPreset(PRESETS[0]);
    setBrandName('Portal SIPAT Honda');
    setBrandSubtitle('Cuidar de você é a nossa maior segurança');
    setPrimaryLogoUrl('');
    setLogoFileName('');
    setLoginTitle('Acesse sua conta');
    setLoginSubtitle('Utilize sua matrícula funcional da Honda para ingressar no evento.');
    setLoginBadgeText('Honda Automóveis do Brasil');
    setInitialPasswordHelpText('Senha inicial: data de aniversário sem barras. Exemplo: 01051995');
    setHomeHeadline('Semana Interna de Prevenção de Acidentes do Trabalho');
    setHomeDescription('Participe diariamente dos treinamentos presenciais ou assista aos vídeos oficiais para validar sua presença, testar seus conhecimentos e concorrer aos sorteios oficiais da SIPAT.');
    toast.info('Valores restaurados para o padrão original da SIPAT Honda.');
  };

  return (
    <AdminShell
      title="Cores & Textos do Site (White-Label)"
      subtitle="Personalize facilmente a identidade visual, paleta de cores e textos de cabeçalho para reutilizar o sistema em outras campanhas"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetDefaults} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Restaurar Padrão
          </Button>
          <Button
            variant="action"
            size="sm"
            onClick={handleSave}
            loading={saving}
            icon={<Check className="w-4 h-4" />}
          >
            Salvar Alterações
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-6xl">
        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'colors', label: 'Cores & Logotipo', icon: <Palette className="w-4 h-4" /> },
            { id: 'login', label: 'Textos da Tela de Login', icon: <Type className="w-4 h-4" /> },
            { id: 'home', label: 'Topo da Página Inicial', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'preview', label: 'Pré-Visualização ao Vivo', icon: <Eye className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={id => setActiveTab(id as any)}
          variant="segmented"
        />

        {/* TAB 1: CORES E LOGOTIPO */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            {/* Presets Rápidos */}
            <Card>
              <CardHeader>
                <CardTitle>Paletas Pré-definidas em 1 Clique</CardTitle>
                <CardDescription>
                  Selecione uma combinação pronta para alterar instantaneamente o tema de toda a aplicação:
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all text-left flex flex-col gap-2 group cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: preset.primary }} />
                      <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: preset.primaryDark }} />
                      <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: preset.action }} />
                      <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: preset.bg }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Configuração de Cores Personalizadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cores Personalizadas</CardTitle>
                  <CardDescription>
                    Digite os códigos hexadecimais ou utilize o seletor de cores:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Cor Primária da Marca (Botões principais, links e badges)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => {
                          setPrimaryColor(e.target.value);
                          applyThemeColors({ primaryColor: e.target.value });
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                      />
                      <TextField
                        value={primaryColor}
                        onChange={e => {
                          setPrimaryColor(e.target.value);
                          applyThemeColors({ primaryColor: e.target.value });
                        }}
                        placeholder="#028056"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Cor Primária Escura (Sidebar do admin, faixas superiores)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryDarkColor}
                        onChange={e => {
                          setPrimaryDarkColor(e.target.value);
                          applyThemeColors({ primaryDarkColor: e.target.value });
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                      />
                      <TextField
                        value={primaryDarkColor}
                        onChange={e => {
                          setPrimaryDarkColor(e.target.value);
                          applyThemeColors({ primaryDarkColor: e.target.value });
                        }}
                        placeholder="#015237"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Cor de Ação / Destaque (Botões de confirmação, acertos 100%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={actionColor}
                        onChange={e => {
                          setActionColor(e.target.value);
                          applyThemeColors({ actionColor: e.target.value });
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                      />
                      <TextField
                        value={actionColor}
                        onChange={e => {
                          setActionColor(e.target.value);
                          applyThemeColors({ actionColor: e.target.value });
                        }}
                        placeholder="#66bd39"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Cor de Fundo da Aplicação
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={e => {
                          setBackgroundColor(e.target.value);
                          applyThemeColors({ backgroundColor: e.target.value });
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                      />
                      <TextField
                        value={backgroundColor}
                        onChange={e => {
                          setBackgroundColor(e.target.value);
                          applyThemeColors({ backgroundColor: e.target.value });
                        }}
                        placeholder="#e2e8e8"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload de Logotipo e Nome da Campanha */}
              <Card>
                <CardHeader>
                  <CardTitle>Logotipo e Marca da Campanha</CardTitle>
                  <CardDescription>
                    Envie a logo da empresa ou da campanha atual para exibir no cabeçalho e na tela de login:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TextField
                    label="Nome da Campanha / Marca"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    placeholder="Ex: Portal SIPAT Honda ou Semana da Qualidade"
                  />

                  <TextField
                    label="Subtítulo ou Slogan"
                    value={brandSubtitle}
                    onChange={e => setBrandSubtitle(e.target.value)}
                    placeholder="Ex: Cuidar de você é a nossa maior segurança"
                  />

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2">
                      Arquivo de Logotipo
                    </label>
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />

                    {primaryLogoUrl ? (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                            <img src={primaryLogoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {logoFileName || 'Logotipo personalizado'}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold">Ativo no portal</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="text-xs text-[var(--brand-primary)] font-semibold hover:underline cursor-pointer"
                          >
                            Trocar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPrimaryLogoUrl('');
                              setLogoFileName('');
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                            title="Remover logotipo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-white p-6 rounded-xl text-center cursor-pointer transition-colors"
                      >
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                          Clique para anexar logotipo (PNG transparente, SVG ou JPG)
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Se não anexar, o sistema exibirá o ícone institucional padrão com o nome da campanha.
                        </p>
                      </div>
                    )}
                  </div>

                  <TextField
                    label="Canal / E-mail de Suporte ao Colaborador"
                    value={supportContact}
                    onChange={e => setSupportContact(e.target.value)}
                    placeholder="suporte.campanha@empresa.com.br"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: TEXTOS DA TELA DE LOGIN */}
        {activeTab === 'login' && (
          <Card>
            <CardHeader>
              <CardTitle>Textos da Tela de Login</CardTitle>
              <CardDescription>
                Ajuste todas as mensagens e instruções exibidas aos colaboradores na tela de entrada:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <TextField
                label="Título do Cartão de Login"
                value={loginTitle}
                onChange={e => setLoginTitle(e.target.value)}
                placeholder="Ex: Acesse sua conta ou Bem-vindo à SIPAT"
              />

              <TextField
                label="Subtítulo / Instrução Inicial"
                value={loginSubtitle}
                onChange={e => setLoginSubtitle(e.target.value)}
                placeholder="Ex: Digite sua matrícula funcional para ingressar..."
              />

              <TextField
                label="Rótulo da Unidade / Empresa"
                value={loginBadgeText}
                onChange={e => setLoginBadgeText(e.target.value)}
                placeholder="Ex: Honda Automóveis do Brasil ou Sua Empresa S.A."
              />

              <TextField
                label="Dica para o Primeiro Acesso (Senha Inicial)"
                value={initialPasswordHelpText}
                onChange={e => setInitialPasswordHelpText(e.target.value)}
                placeholder="Ex: Senha inicial: data de aniversário sem barras. Exemplo: 01051995"
                helperText="Explique a regra da senha inicial para novos colaboradores."
              />
            </CardContent>
          </Card>
        )}

        {/* TAB 3: TEXTOS DO TOPO DA HOME */}
        {activeTab === 'home' && (
          <Card>
            <CardHeader>
              <CardTitle>Textos do Topo da Página Inicial (Banner Principal)</CardTitle>
              <CardDescription>
                Personalize o banner de boas-vindas que fica no topo do portal do colaborador:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <TextField
                label="Headline Principal do Topo"
                value={homeHeadline}
                onChange={e => setHomeHeadline(e.target.value)}
                placeholder="Ex: Semana Interna de Prevenção de Acidentes do Trabalho"
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Texto Explicativo de Boas-Vindas
                </label>
                <textarea
                  rows={4}
                  value={homeDescription}
                  onChange={e => setHomeDescription(e.target.value)}
                  placeholder="Instruções sobre como participar, assistir aos vídeos e concorrer aos sorteios..."
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: PRÉ-VISUALIZAÇÃO AO VIVO */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <Alert variant="info" title="Simulação em Tempo Real">
              Veja abaixo como a tela de login e o topo da página inicial aparecerão para os colaboradores com os textos e cores que você definiu.
            </Alert>

            {/* Preview da Tela de Login */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                  Preview 1: Tela de Login
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  className="p-8 rounded-2xl flex flex-col items-center justify-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${primaryDarkColor} 0%, ${primaryColor} 100%)`,
                  }}
                >
                  <div className="flex flex-col items-center mb-6 text-center">
                    {primaryLogoUrl ? (
                      <img src={primaryLogoUrl} alt="Logo" className="h-12 object-contain mb-3 drop-shadow-md" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-3">
                        <ShieldCheck className="w-8 h-8" style={{ color: actionColor }} />
                      </div>
                    )}
                    <h2 className="text-xl font-extrabold font-display">{brandName}</h2>
                    <p className="text-xs text-white/80 mt-0.5">{loginBadgeText} • 2026</p>
                  </div>

                  {/* Card mockup */}
                  <div className="w-full max-w-sm bg-white rounded-xl p-6 text-slate-800 shadow-xl space-y-4">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{loginTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{loginSubtitle}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="h-9 bg-slate-100 rounded-lg border border-slate-200 px-3 flex items-center text-xs text-slate-400">
                        Matrícula do colaborador...
                      </div>
                      <div className="h-9 bg-slate-100 rounded-lg border border-slate-200 px-3 flex items-center text-xs text-slate-400">
                        Senha de acesso...
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                      {initialPasswordHelpText}
                    </div>

                    <button
                      type="button"
                      className="w-full py-2.5 rounded-lg text-white font-bold text-xs shadow-xs"
                      style={{ backgroundColor: actionColor }}
                    >
                      Acessar Portal da Campanha
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview do Topo da Home */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                  Preview 2: Topo da Página Inicial (Home)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, ${primaryDarkColor} 0%, ${primaryColor} 100%)`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
                      style={{ backgroundColor: actionColor, color: primaryDarkColor }}
                    >
                      OFICIAL
                    </span>
                    <span className="text-xs text-white/80 font-medium">{brandName}</span>
                  </div>
                  <h3 className="text-lg font-extrabold font-display">{homeHeadline}</h3>
                  <p className="text-xs text-white/90 mt-1 max-w-xl leading-relaxed">
                    {homeDescription}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminShell>
  );
};
