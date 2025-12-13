import React, { useState } from 'react';
import { Cloud, CheckCircle2, Unplug, Eye, EyeOff, Key, Database, Loader2, X } from 'lucide-react';
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
            if (msg.includes('tabela') || msg.includes('42P01') || msg.includes('row level security')) {
                setShowSqlHelp(true);
            }
        }
    } else { 
        setIsTestingCloud(false); 
        setErrorMsg("Erro ao salvar configuração local.");
    }
  };

  const getSqlScript = () => {
    return `-- 1. Cria a tabela 'evento' (se não existir)
create table if not exists evento (
id text primary key,
updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
data jsonb
);

-- 2. Habilita segurança (RLS)
alter table evento enable row level security;

-- 3. Limpa políticas antigas para evitar conflitos
drop policy if exists "Acesso Publico" on evento;
drop policy if exists "Public Access" on evento;
drop policy if exists "Allow Public Access" on evento;

-- 4. Cria política de acesso total (Leitura/Escrita)
create policy "Acesso Publico" on evento for all using (true) with check (true);`;
  };

  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[200] p-8 flex flex-col items-center justify-center animate-fade-in overflow-y-auto">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border shadow-sm ${cloudUrl ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-brand-50 text-brand-600 border-brand-100'}`}>
            <Cloud size={32}/>
          </div>
          <h3 className="font-bold text-slate-800 text-xl">Conectar Supabase</h3>
          <p className="text-xs text-slate-500 mt-1">Sincronize seus dados entre dispositivos.</p>
        </div>

        {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100">
                {errorMsg}
            </div>
        )}

        {cloudUrl && !errorMsg && (
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500"/>
              <span className="text-xs font-bold text-emerald-800">Conectado</span>
            </div>
            <button onClick={handleDisconnectCloud} className="text-[10px] font-bold text-red-500 bg-white px-2 py-1 rounded border border-red-100 hover:bg-red-50 flex items-center gap-1">
              <Unplug size={10}/> Desconectar
            </button>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project URL</label>
            <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-500 focus:bg-white transition-all" placeholder="https://xyz...supabase.co" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">API Key (anon public)</label>
            <input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-500 focus:bg-white transition-all" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." value={cloudKey} onChange={e => setCloudKey(e.target.value)} />
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 relative">
          <label className="block text-[10px] font-bold text-amber-700 uppercase mb-2 flex items-center gap-1">
            <Key size={12}/> Senha de Criptografia (Invente uma)
          </label>
          <div className="relative">
            <input type={showCloudPass ? "text" : "password"} className="w-full border border-amber-200 bg-white rounded-xl px-4 py-3 pr-10 text-sm font-mono outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100" placeholder="Sua senha secreta..." value={cloudPass} onChange={e => setCloudPass(e.target.value)} />
            <button type="button" onClick={() => setShowCloudPass(!showCloudPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
              {showCloudPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {showSqlHelp && (
          <div className="bg-slate-800 text-slate-300 p-4 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-700 relative">
            <button onClick={() => setShowSqlHelp(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={14}/></button>
            <p className="text-slate-400 mb-2 border-b border-slate-700 pb-2">Copie e cole no SQL Editor do Supabase:</p>
            <pre className="whitespace-pre-wrap select-all">{getSqlScript()}</pre>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button onClick={handleCloudConfigSave} disabled={isTestingCloud} className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {isTestingCloud ? <Loader2 size={18} className="animate-spin"/> : null}
            {isTestingCloud ? 'Testando Conexão...' : 'Salvar e Conectar'}
          </button>
          <div className="flex gap-2">
            <button onClick={() => setShowSqlHelp(!showSqlHelp)} className="flex-1 py-3 text-brand-600 bg-brand-50 border border-brand-100 rounded-xl text-xs font-bold hover:bg-brand-100 flex items-center justify-center gap-1">
              <Database size={14}/> Script SQL
            </button>
            <button onClick={onClose} disabled={isTestingCloud} className="flex-1 py-3 text-slate-400 hover:text-slate-600 text-xs font-bold disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
