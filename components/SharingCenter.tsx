import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Globe, Shield, CloudOff, ChevronDown } from 'lucide-react';
import { QRCode } from './QRCode';
import { OrgStructure, EventType } from '../types';
import { APP_CONFIG } from '../constants';

interface SharingCenterProps {
  eventId: string;
  onBack: () => void;
  cloudUrl: string;
  cloudKey: string;
  orgData: OrgStructure;
  cloudPass: string;
}

export const SharingCenter: React.FC<SharingCenterProps> = ({ eventId, onBack, cloudUrl, cloudKey, orgData, cloudPass }) => {
  const [copyFeedback, setCopyFeedback] = useState('');
  const [targetProgramType, setTargetProgramType] = useState<EventType>('CIRCUIT_OVERSEER');

  // TRAVA DE SEGURANÇA: Se não tem nuvem, não mostra nada.
  if (!cloudUrl || !cloudKey) {
    return (
        <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col justify-center animate-fade-in text-center">
            <div className="bg-amber-50 rounded-3xl p-8 border border-amber-200 shadow-xl">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CloudOff size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Sincronização Necessária</h2>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Para gerar um Link Público que funcione para sua esposa e os irmãos, seus dados precisam estar salvos na nuvem.
                </p>
                <div className="space-y-3">
                    <button onClick={onBack} className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
                        <ArrowLeft size={20}/> Voltar e Configurar
                    </button>
                    <p className="text-[10px] text-slate-400">Configure o ícone de Nuvem no topo da tela inicial.</p>
                </div>
            </div>
        </div>
    );
  }

  const baseUrl = window.location.origin;
  
  // GERA TOKEN DE ACESSO BLINDADO
  const tokenConfig = { 
      cId: cloudUrl.replace('https://', '').replace('.supabase.co', ''), 
      cKey: cloudKey,
      cPass: cloudPass 
  };
  
  const json = JSON.stringify(tokenConfig);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  const token = encodeURIComponent(base64);
  
  // LINK INTELIGENTE: Adiciona o parâmetro ?type=... para forçar o programa correto
  const fullUrl = `${baseUrl}/ir/${encodeURIComponent(eventId)}?type=${targetProgramType}#token=${token}`;

  const volunteerPin = orgData.generalInfo?.volunteerAccessPin || APP_CONFIG.VOLUNTEER_PIN;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback('Copiado!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const invitePublic = `👋 *Programa Digital*\nPara anotações, horários e suas designações, acesse:\n${fullUrl}`;
  
  const inviteTeam = `🚀 *Convite Equipe*\n1. Acesse: ${fullUrl}\n2. Use o PIN 🔒: ${volunteerPin}\n\nLembrete: Ao compartilhar, você é responsável por ter o consentimento do voluntário para o uso de seus dados neste sistema.`;

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in pb-32">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Central de Compartilhamento</h2>
            <p className="text-xs text-slate-500 font-medium">Links de acesso e convites</p>
        </div>
      </div>

      {/* SELETOR DE PROGRAMA */}
      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><Globe size={20}/></div>
              <div>
                  <h3 className="font-bold text-indigo-900 text-sm">Qual programa será exibido?</h3>
                  <p className="text-xs text-indigo-700">O link abrirá automaticamente no programa selecionado.</p>
              </div>
          </div>
          <div className="relative w-full md:w-64 group">
              <select 
                  className="w-full appearance-none bg-white border border-indigo-200 text-indigo-900 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
                  value={targetProgramType}
                  onChange={(e) => setTargetProgramType(e.target.value as EventType)}
              >
                  <option value="CIRCUIT_OVERSEER">Assembleia (Sup. Circuito)</option>
                  <option value="BETHEL_REP">Assembleia (Rep. Betel)</option>
                  <option value="REGIONAL_CONVENTION">Congresso Regional</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" size={16}/>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PUBLIC ACCESS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="bg-cyan-50 p-6 border-b border-cyan-100 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-cyan-600 shadow-sm">
                    <Globe size={24}/>
                </div>
                <h3 className="font-bold text-cyan-900 text-lg">Acesso Público</h3>
                <p className="text-xs text-cyan-700 mt-1">Para a assistência em geral</p>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center gap-6">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <QRCode value={fullUrl} />
                </div>
                <div className="text-center w-full">
                    <p className="text-[10px] font-mono bg-slate-100 py-2 px-4 rounded-lg text-slate-500 mb-4 break-all select-all leading-tight max-h-24 overflow-y-auto border border-slate-200">
                        {fullUrl}
                    </p>
                    <button onClick={() => handleCopy(invitePublic)} className="w-full py-3 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95">
                        {copyFeedback ? <Check size={18}/> : <Copy size={18}/>} {copyFeedback || 'Copiar Convite'}
                    </button>
                </div>
            </div>
        </div>

        {/* TEAM ACCESS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="bg-purple-50 p-6 border-b border-purple-100 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600 shadow-sm">
                    <Shield size={24}/>
                </div>
                <h3 className="font-bold text-purple-900 text-lg">Acesso da Equipe</h3>
                <p className="text-xs text-purple-700 mt-1">Para voluntários e encarregados</p>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center gap-6">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative">
                    <QRCode value={fullUrl} />
                    <div className="absolute -bottom-3 -right-3 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm border-2 border-white">
                        PIN: {volunteerPin}
                    </div>
                </div>
                <div className="text-center w-full">
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-[10px] text-amber-800 text-left mb-4">
                        <strong>Aviso LGPD:</strong> Ao enviar este convite, você confirma que tem autorização para compartilhar os dados de acesso com o voluntário.
                    </div>
                    <button onClick={() => handleCopy(inviteTeam)} className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95">
                        {copyFeedback ? <Check size={18}/> : <Copy size={18}/>} {copyFeedback || 'Copiar Convite com PIN'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};