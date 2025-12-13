import React, { useState } from 'react';
import { Cloud, CheckCircle2, Unplug, Eye, EyeOff, Key, Database, Loader2, X, Server, AlertTriangle, Copy, WifiOff, HelpCircle, ShieldAlert } from 'lucide-react';
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
    if(confirm('Tem certeza que deseja desconectar e remover as credenciais deste dispositivo?')) {
        CloudService.disconnect();
        setCloudUrl('');
        setCloudKey('');
        setCloudPass('');
        onClose();
    }
  };

  const handleCloudConfigSave = async () => { 
    if (!cloudUrl || !cloudKey || !cloudPass) { 
        setErrorMsg("Preencha URL, API Key e a Senha.");
        return; 
    }
    setErrorMsg('');
    setIsTestingCloud(true);
    
    // 1. Salva configuração local
    if (CloudService.configure(cloudUrl, cloudKey, cloudPass)) { 
        // 2. Testa conexão real
        const result = await CloudService.testConnection();
        setIsTestingCloud(false);
        
        if (result.success) {
            onSuccess();
        } else {
            // Se falhar, mostra erro e abre o script SQL automaticamente se for crítico
            const msg = result.error || 'Erro desconhecido';
            setErrorMsg(msg);
            
            // Se o erro for de tabela não encontrada ou permissão, sugere o script
            if (msg.includes('tabela') || msg.includes('42P01') || msg.includes('Permissão') || msg.includes('401') || msg.includes('42501')) {
               setShowSqlHelp(true);
            }
        }
    } else { 
        setIsTestingCloud(false); 
        setErrorMsg("Erro ao salvar configuração local.");
    }
  };

  const getSqlScript = () => {
    return `-- SCRIPT CORRETOR (Rode este código para corrigir o erro "already exists")

-- 1. Cria a tabela APENAS se ela não existir (Evita o erro 42P07)
CREATE TABLE IF NOT EXISTS public.evento (
    id text PRIMARY KEY,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    data jsonb
);

-- 2. Garante que o RLS está ativo
ALTER TABLE public.evento ENABLE ROW LEVEL SECURITY;

-- 3. Limpa políticas antigas para evitar duplicidade
DROP POLICY IF EXISTS "Acesso Total App" ON public.evento;

-- 4. Cria a permissão correta
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

  // Define a cor e ícone do topo baseado no estado
  const getHeaderState = () => {
    if (errorMsg) return { color: 'bg-red-500', icon: <WifiOff size={32}/>, text: 'Falha na Conexão' };
    if (cloudUrl) return { color: 'bg-brand-500', icon: <Cloud size={32}/>, text: 'Configurar Nuvem' };
    return { color: 'bg-slate-400', icon: <Cloud size={32}/>, text: 'Conectar Supabase' };
  };
  
  const header = getHeaderState();

  const isNetworkError = errorMsg.includes('rede') || errorMsg.includes('fetch') || errorMsg.includes('Load failed');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-white/20 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 p-6 text-center border-b border-slate-100 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors bg-white p-1.5 rounded-full shadow-sm"><X size={18}/></button>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white shadow-lg text-white transition-colors duration-300 ${header.color}`}>
                {header.icon}
            </div>
            <h3 className="font-bold text-slate-800 text-xl">{header.text}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Sincronização & Backup Seguro</p>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
            {/* ÁREA DE ERRO INTELIGENTE */}
            {errorMsg && (
                <div className="bg-red-50 text-red-800 p-4 rounded-xl text-xs font-bold border border-red-100 flex flex-col gap-2 animate-bounce-in shadow-sm">
                    <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600"/> 
                        <span>{errorMsg}</span>
                    </div>
                    {isNetworkError && (
                        <div className="mt-3 pl-2 border-l-2 border-red-200">
                            <p className="mb-1 text-[10px] uppercase tracking-wide opacity-70">Verifique:</p>
                            <ul className="list-disc pl-4 space-y-1 text-[11px] leading-tight">
                                <li>O projeto no Supabase está <strong>PAUSADO</strong>? (Acesse o painel deles para reativar).</li>
                                <li>Você usa <strong>AdBlock</strong> ou VPN? (Desative para este site).</li>
                                <li>A URL está correta (sem espaços no final)?</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-brand-400 transition-colors">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Server size={10}/> Project URL</label>
                    <input type="text" className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none" placeholder="https://xyz...supabase.co" value={cloudUrl} onChange={e => { setCloudUrl(e.target.value.trim()); setErrorMsg(''); }} />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-brand-400 transition-colors">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Key size={10}/> API Key (anon public)</label>
                    <input type="text" className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." value={cloudKey} onChange={e => { setCloudKey(e.target.value.trim()); setErrorMsg(''); }} />
                </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 relative">
                <label className="block text-[10px] font-bold text-amber-700 uppercase mb-2 flex items-center gap-1">
                    <Key size={12}/> Senha de Criptografia (Local)
                </label>
                <div className="relative">
                    <input type={showCloudPass ? "text" : "password"} className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2.5 pr-10 text-xs font-bold text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50" placeholder="Crie uma senha para proteger seus dados..." value={cloudPass} onChange={e => { setCloudPass(e.target.value); setErrorMsg(''); }} />
                    <button type="button" onClick={() => setShowCloudPass(!showCloudPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1">
                    {showCloudPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
            </div>

            {/* BOTÃO E ÁREA DO SCRIPT SQL */}
            {!showSqlHelp ? (
                <button 
                  onClick={() => setShowSqlHelp(true)} 
                  className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  <Database size={14}/> Ajuda com Erros de Banco (SQL)
                </button>
            ) : (
                <div className="bg-slate-800 text-slate-300 p-4 rounded-xl font-mono text-[10px] border border-slate-700 relative mt-2 animate-fade-in shadow-xl">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                        <p className="text-emerald-400 font-bold flex items-center gap-2"><CheckCircle2 size={12}/> Script de Correção:</p>
                        <div className="flex gap-2">
                            <button onClick={handleCopySql} className="text-[9px] bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded flex items-center gap-1 text-white transition-colors font-bold">
                                {copyFeedback ? <CheckCircle2 size={10}/> : <Copy size={10}/>} {copyFeedback || 'Copiar'}
                            </button>
                            <button onClick={() => setShowSqlHelp(false)} className="text-slate-400 hover:text-white"><X size={14}/></button>
                        </div>
                    </div>
                    <pre className="whitespace-pre-wrap select-all text-emerald-300 font-bold bg-slate-900/50 p-2 rounded border border-slate-700/50">{getSqlScript()}</pre>
                    <div className="mt-3 text-[9px] text-white bg-blue-600/20 p-2.5 rounded border border-blue-500/30">
                        <strong className="text-blue-200 block mb-1 uppercase tracking-wide flex items-center gap-1"><HelpCircle size={10}/> Como resolver erros de Tabela/Permissão:</strong>
                        1. Apague TODO o código que está no editor do Supabase.<br/>
                        2. Cole este novo código.<br/>
                        3. Clique em RUN.<br/>
                        4. Volte aqui e clique em "Salvar e Conectar".
                    </div>
                </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
                <button onClick={handleCloudConfigSave} disabled={isTestingCloud} className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isTestingCloud ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                    {isTestingCloud ? 'Testando...' : 'Salvar e Conectar'}
                </button>
                
                {cloudUrl && !errorMsg && (
                     <button onClick={handleDisconnectCloud} className="text-[10px] text-red-400 hover:text-red-600 font-bold underline text-center w-full mt-2 flex items-center justify-center gap-1">
                        <Unplug size={12} /> Desconectar Conta
                     </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};