import React, { useState } from 'react';
import { Cloud, CheckCircle2, Unplug, Eye, EyeOff, Key, Database, Loader2, X, Server, AlertTriangle, Copy } from 'lucide-react';
import { CloudService } from '../services/cloud';

interface CloudModalProps {
  onClose: () => void;
  onSuccess: () => void;
  cloudUrl: string;
  setCloudUrl: (val: string) => void;
  cloudKey: string;
  setCloudKey: (val: string) => void;
  cloudPass: string;
  setCloudPass: (val: string) => void;
}

export const CloudModal: React.FC<CloudModalProps> = ({
  onClose,
  onSuccess,
  cloudUrl,
  setCloudUrl,
  cloudKey,
  setCloudKey,
  cloudPass,
  setCloudPass
}) => {
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [showCloudPass, setShowCloudPass] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleDisconnectCloud = () => {
    if(confirm('Tem certeza que deseja desconectar?')) {
        CloudService.disconnect();
        setCloudUrl('');
        setCloudKey('');
        setCloudPass('');
        onClose();
        alert('Nuvem desconectada.');
    }
  };

  const handleCloudConfigSave = async () => { 
    if (!cloudUrl || !cloudKey || !cloudPass) { 
        setErrorMsg("Preencha URL, API Key e a Senha.");
        return; 
    }
    setErrorMsg('');
    setIsTestingCloud(true);
    if (CloudService.configure(cloudUrl, cloudKey, cloudPass)) { 
        const result = await CloudService.testConnection();
        setIsTestingCloud(false);
        if (result.success) {
            onSuccess();
        } else {
            const msg = result.error || 'Erro desconhecido';
            setErrorMsg(msg);
            // Sempre mostra o script SQL se der erro, pois 99% das vezes é falta da tabela ou RLS
            setShowSqlHelp(true);
        }
    } else { 
        setIsTestingCloud(false); 
        setErrorMsg("Erro ao salvar configuração local.");
    }
  };

  const getSqlScript = () => {
    return `-- SCRIPT DEFINITIVO (Rode no SQL Editor do Supabase)

-- 1. Limpa instalações anteriores (CUIDADO: Apaga dados existentes na nuvem)
DROP TABLE IF EXISTS evento;

-- 2. Cria a tabela correta
CREATE TABLE public.evento (
    id text PRIMARY KEY,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    data jsonb
);

-- 3. Habilita segurança (RLS)
ALTER TABLE public.evento ENABLE ROW LEVEL SECURITY;

-- 4. Cria política de acesso TOTAL (Necessário para o App funcionar sem login de usuário)
CREATE POLICY "Acesso Total App" ON public.evento
FOR ALL
USING (true)
WITH CHECK (true);`;
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSqlScript());
    setCopyFeedback('Copiado!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up border border-white/20 flex flex-col max-h-[90vh]">
        <div className="bg-brand-50 p-6 text-center border-b border-brand-100 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-brand-400 hover:text-brand-700 transition-colors bg-white/50 p-1.5 rounded-full"><X size={18}/></button>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white shadow-lg ${cloudUrl ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white'}`}>
                <Cloud size={32}/>
            </div>
            <h3 className="font-bold text-slate-800 text-xl">Conectar Supabase</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Sincronização & Backup Seguro</p>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5"/> <span>{errorMsg}</span>
                    </div>
                    {errorMsg.includes('acordando') && (
                        <p className="text-[10px] text-red-500 ml-6">O projeto gratuito do Supabase "dorme" após inatividade. Aguarde alguns segundos e tente novamente.</p>
                    )}
                </div>
            )}

            {cloudUrl && !errorMsg && (
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500"/>
                <span className="text-xs font-bold text-emerald-800">Conectado</span>
                </div>
                <button onClick={handleDisconnectCloud} className="text-[10px] font-bold text-red-500 bg-white px-2 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 flex items-center gap-1 shadow-sm transition-all">
                <Unplug size={12}/> Desconectar
                </button>
            </div>
            )}

            <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-brand-400 transition-colors">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Server size={10}/> Project URL</label>
                    <input type="text" className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none" placeholder="https://xyz...supabase.co" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-brand-400 transition-colors">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Key size={10}/> API Key (anon public)</label>
                    <input type="text" className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." value={cloudKey} onChange={e => setCloudKey(e.target.value)} />
                </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 relative">
                <label className="block text-[10px] font-bold text-amber-700 uppercase mb-2 flex items-center gap-1">
                    <Key size={12}/> Senha de Criptografia (Local)
                </label>
                <div className="relative">
                    <input type={showCloudPass ? "text" : "password"} className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2.5 pr-10 text-xs font-bold text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50" placeholder="Crie uma senha para proteger seus dados..." value={cloudPass} onChange={e => setCloudPass(e.target.value)} />
                    <button type="button" onClick={() => setShowCloudPass(!showCloudPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1">
                    {showCloudPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
            </div>

            {showSqlHelp && (
            <div className="bg-slate-800 text-slate-300 p-4 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-700 relative mt-2 animate-fade-in">
                <button onClick={() => setShowSqlHelp(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={14}/></button>
                <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                    <p className="text-slate-400 font-bold">SQL Setup (Definitivo):</p>
                    <button onClick={handleCopySql} className="text-[9px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded flex items-center gap-1 text-white transition-colors">
                        {copyFeedback ? <CheckCircle2 size={10}/> : <Copy size={10}/>} {copyFeedback || 'Copiar'}
                    </button>
                </div>
                <pre className="whitespace-pre-wrap select-all text-emerald-400 font-bold">{getSqlScript()}</pre>
                <p className="text-[9px] text-slate-500 mt-2 italic">Cole isso no "SQL Editor" do seu projeto Supabase e clique em "Run".</p>
            </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
                <button onClick={handleCloudConfigSave} disabled={isTestingCloud} className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isTestingCloud ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                    {isTestingCloud ? 'Testando Conexão...' : 'Salvar e Conectar'}
                </button>
                <button onClick={() => setShowSqlHelp(!showSqlHelp)} className={`w-full py-3 border rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors ${showSqlHelp ? 'bg-slate-100 text-slate-600 border-slate-200' : 'text-brand-600 bg-white border-brand-100 hover:bg-brand-50'}`}>
                    <Database size={14}/> {showSqlHelp ? 'Ocultar Script SQL' : 'Ver Script SQL de Configuração'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};