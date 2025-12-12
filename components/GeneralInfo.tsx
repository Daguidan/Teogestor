
import React, { useState, useEffect, useRef } from 'react';
import { OrgStructure, CongregationEntry, AssemblyProgram, EventType } from '../types';
import { Save, Plus, Trash2, Edit2, Info, Check, User, Phone, Sparkles, X, Lock, Download, Upload, MessageSquare, ArrowLeft, Megaphone, RefreshCcw, AlertTriangle, Cloud } from 'lucide-react';

interface GeneralInfoProps {
  data: OrgStructure;
  onUpdate: (newData: OrgStructure) => void;
  isAdmin: boolean;
  onBack?: () => void;
  onForceRestore?: (fullBackup: any) => void;
  isSuperAdmin?: boolean;
  // New props for full backup
  currentProgram?: AssemblyProgram;
  currentNotes?: Record<string, string>;
  currentAttendance?: Record<string, string>;
  currentEventType?: EventType | null;
  onResetProgram?: (type: EventType) => void; // Nova prop
  onOpenCloud?: () => void; // Nova prop para abrir o modal da nuvem
}

export const GeneralInfo: React.FC<GeneralInfoProps> = ({ 
    data, 
    onUpdate, 
    isAdmin, 
    onBack, 
    onForceRestore, 
    currentProgram, 
    currentNotes, 
    currentAttendance,
    currentEventType,
    onResetProgram,
    onOpenCloud
}) => {
  const [localData, setLocalData] = useState<OrgStructure>(data);
  const [message, setMessage] = useState('');
  const [editingCong, setEditingCong] = useState<CongregationEntry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedResetType, setSelectedResetType] = useState<EventType>(currentEventType || 'CIRCUIT_OVERSEER');

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const [formData, setFormData] = useState<{name: string, coordinator: string, phone: string}>({
    name: '', 
    coordinator: '', 
    phone: ''
  });

  const handleSaveAll = () => {
    onUpdate(localData);
    setMessage('Salvo com sucesso!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleInfoChange = (field: 'reminders' | 'publicAnnouncements', value: string) => {
    setLocalData(prev => ({
      ...prev,
      generalInfo: {
        ...prev.generalInfo!,
        congregations: prev.generalInfo?.congregations || [],
        reminders: prev.generalInfo?.reminders || '',
        [field]: value
      }
    }));
  };

  const handleExportBackup = () => {
    // Create a comprehensive backup package
    const fullBackup = {
        version: "6.0",
        timestamp: Date.now(),
        appData: {
            structure: localData,
            program: currentProgram,
            notes: currentNotes,
            attendance: currentAttendance,
            eventType: currentEventType
        }
    };

    const dataStr = JSON.stringify(fullBackup, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0,10);
    link.download = `teogestor_backup_COMPLETO_${date}.json`;
    link.href = url;
    link.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!confirm("ATENÇÃO: Isso substituirá TODOS os dados atuais (Organograma, Notas, Programa) pelos do arquivo. Continuar?")) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            
            // 1. Backup Completo (v6.0+)
            if (json.appData && onForceRestore) {
                onForceRestore(json);
                alert("Backup COMPLETO restaurado com sucesso! O aplicativo será recarregado.");
                window.location.reload();
            } 
            // 2. Backup Legado (Apenas Estrutura/Organograma) - Verificação Relaxada
            // Se tiver 'committee' ou 'aoDepartments', assumimos que é uma estrutura válida
            else if (json.committee || (json.aoDepartments && Array.isArray(json.aoDepartments))) {
                onUpdate(json);
                alert("Estrutura restaurada (Formato antigo/Simples). Notas e Programa não foram alterados.");
            }
            // 3. Backup Nuvem (Raw Data)
            else if (json.data && json.data.org && onForceRestore) {
                 // Tenta reconstruir formato appData a partir do formato nuvem
                 const restoredData = {
                     appData: {
                         structure: json.data.org,
                         program: json.data.program,
                         notes: json.data.notes,
                         attendance: json.data.attendance,
                         eventType: json.data.type
                     }
                 };
                 onForceRestore(restoredData);
                 alert("Dados da nuvem restaurados localmente com sucesso!");
                 window.location.reload();
            }
            else {
                console.error("Conteúdo do arquivo inválido:", json);
                alert("Arquivo de backup não reconhecido. Certifique-se de que é um arquivo .json gerado pelo TeoGestor.");
            }
        } catch (err) {
            alert("Erro ao ler arquivo. O arquivo pode estar corrompido.");
            console.error(err);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const openAddModal = () => { setFormData({ name: '', coordinator: '', phone: '' }); setEditingCong(null); setShowModal(true); };
  const openEditModal = (cong: CongregationEntry) => { setFormData({ name: cong.name, coordinator: cong.coordinator, phone: cong.phone }); setEditingCong(cong); setShowModal(true); };
  
  const saveCongregation = () => {
    const currentCongregations = localData.generalInfo?.congregations || [];
    const newCongregations = [...currentCongregations];
    const existingData = editingCong ? { cleaningResponsable: editingCong.cleaningResponsable, cleaningAssignment: editingCong.cleaningAssignment, accountsAssignment: editingCong.accountsAssignment } : { cleaningResponsable: '', cleaningAssignment: '', accountsAssignment: '' };

    if (editingCong) {
      const index = newCongregations.findIndex(c => c.id === editingCong.id);
      if (index !== -1) newCongregations[index] = { ...formData, id: editingCong.id, ...existingData };
    } else {
      newCongregations.push({ ...formData, id: Date.now().toString(), ...existingData });
    }

    setLocalData(prev => ({ ...prev, generalInfo: { ...prev.generalInfo!, congregations: newCongregations } }));
    setShowModal(false);
  };

  const deleteCongregation = (id: string) => {
    if (confirm('Excluir esta congregação?')) {
      const newCongs = (localData.generalInfo?.congregations || []).filter(c => c.id !== id);
      setLocalData(prev => ({ ...prev, generalInfo: { ...prev.generalInfo!, congregations: newCongs } }));
    }
  };

  const deleteSuggestion = (id: string) => {
      if(!confirm("Apagar esta sugestão?")) return;
      const currentSuggestions = localData.generalInfo?.suggestions || [];
      const newSuggestions = currentSuggestions.filter(s => s.id !== id);
      setLocalData(prev => ({ ...prev, generalInfo: { ...prev.generalInfo!, suggestions: newSuggestions } }));
  };

  const handleResetClick = () => {
      if (!onResetProgram) return;
      if (confirm(`ATENÇÃO: Você tem certeza que deseja forçar o programa para "${selectedResetType}"? Isso irá sobrescrever o programa atual.`)) {
          onResetProgram(selectedResetType);
      }
  };

  const congregations = localData.generalInfo?.congregations || [];
  const reminders = localData.generalInfo?.reminders || '';
  const publicAnnouncements = localData.generalInfo?.publicAnnouncements || '';
  const suggestions = localData.generalInfo?.suggestions || [];

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in pb-32">
      <div className="flex justify-between items-center mb-8 sticky top-20 bg-slate-50/90 backdrop-blur-md p-4 z-20 rounded-2xl border border-white/50 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
               <ArrowLeft size={20} />
            </button>
          )}
          <div><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">Informações Gerais</h2><p className="text-xs font-medium text-slate-500">Configurações e Contatos</p></div>
        </div>
        {isAdmin && <button onClick={handleSaveAll} className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5"><Save size={18} /> Salvar</button>}
      </div>
      {message && <div className="fixed top-24 right-6 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-bold z-50 animate-bounce-in flex items-center gap-2"><Check size={18}/> {message}</div>}

      {/* NOVO CARD: ANÚNCIOS PÚBLICOS */}
      {isAdmin && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
           <div className="bg-blue-50 p-5 border-b border-blue-100 flex items-center gap-2"><Megaphone size={20} className="text-blue-600"/><h3 className="font-bold text-blue-900 text-sm uppercase tracking-wide">Anúncios Públicos</h3></div>
           <div className="p-2">
              <textarea 
                className="w-full min-h-[120px] p-4 text-slate-700 text-sm leading-relaxed outline-none resize-y bg-transparent focus:bg-blue-50/30 transition-colors" 
                placeholder="Digite aqui um aviso que aparecerá para todos os usuários no painel de entrada..." 
                value={publicAnnouncements} 
                onChange={(e) => handleInfoChange('publicAnnouncements', e.target.value)} 
              />
           </div>
        </div>
      )}

      {/* FEEDBACK & SUGESTÕES */}
      {isAdmin && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
             <div className="bg-purple-50 p-5 border-b border-purple-100 flex items-center gap-2">
                <MessageSquare size={20} className="text-purple-600"/>
                <h3 className="font-bold text-purple-900 text-sm uppercase tracking-wide">Caixa de Entrada: Sugestões ({suggestions.length})</h3>
             </div>
             <div className="p-4 max-h-[300px] overflow-y-auto space-y-3 bg-slate-50/50">
                {suggestions.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4 italic">Nenhuma sugestão recebida ainda.</p>
                ) : (
                    suggestions.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-slate-400 font-bold mb-1">{s.date}</p>
                                <p className="text-sm text-slate-700 leading-relaxed">"{s.text}"</p>
                            </div>
                            <button onClick={() => deleteSuggestion(s.id)} className="text-slate-300 hover:text-red-500 self-start p-1"><X size={16}/></button>
                        </div>
                    ))
                )}
             </div>
          </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
         <div className="bg-amber-50 p-5 border-b border-amber-100 flex items-center gap-2"><Sparkles size={20} className="text-amber-600"/><h3 className="font-bold text-amber-900 text-sm uppercase tracking-wide">Lembretes para a Equipe</h3></div>
         <div className="p-2">
            {isAdmin ? ( <textarea className="w-full min-h-[150px] p-4 text-slate-700 text-sm leading-relaxed outline-none resize-y bg-transparent focus:bg-amber-50/30 transition-colors" placeholder="Digite aqui os lembretes gerais para a equipe..." value={reminders} onChange={(e) => handleInfoChange('reminders', e.target.value)} /> ) : ( <div className="p-6 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">{reminders || <span className="text-slate-400 italic">Nenhum lembrete registrado.</span>}</div> )}
         </div>
      </div>

      <div className="space-y-6">
         <div className="flex justify-between items-center bg-slate-100 p-4 rounded-2xl"><h3 className="font-bold text-slate-700 text-base ml-1">Lista de Contatos ({congregations.length})</h3>{isAdmin && (<button onClick={openAddModal} className="bg-white text-brand-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-brand-50 hover:border-brand-200 flex items-center gap-2 shadow-sm transition-all"><Plus size={16} /> Adicionar Nova</button>)}</div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {congregations.map((cong) => (
               <div key={cong.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all relative group">
                  <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3"><h4 className="font-bold text-slate-800 text-lg">{cong.name}</h4>{isAdmin && (<div className="flex gap-2"><button onClick={() => openEditModal(cong)} className="p-2 text-slate-400 hover:text-brand-600 bg-slate-50 rounded-lg hover:bg-brand-50 transition-colors"><Edit2 size={16}/></button><button onClick={() => deleteCongregation(cong.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg hover:bg-rose-50 transition-colors"><Trash2 size={16}/></button></div>)}</div>
                  <div className="space-y-3 text-sm"><div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Coordenador</span><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-slate-700 font-bold"><User size={16} className="text-slate-400"/> {cong.coordinator || 'Não inf.'}</div><div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200"><Phone size={12} className="text-slate-400"/> {cong.phone || '-'}</div></div></div></div>
               </div>
            ))}
            {congregations.length === 0 && ( 
                <div className="col-span-full p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm"><Info size={32} /></div>
                    <h3 className="font-bold text-slate-700 text-lg mb-2">Lista Vazia?</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 max-w-md mx-auto leading-relaxed">
                        Se você acabou de subir o site, seus dados ainda estão no seu computador. Para vê-los aqui, conecte a nuvem e faça o download.
                    </p>
                    <div className="flex justify-center gap-3 flex-wrap">
                        {onOpenCloud && (
                            <button onClick={onOpenCloud} className="px-5 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-700 flex items-center gap-2">
                                <Cloud size={18}/> Conectar Nuvem
                            </button>
                        )}
                        <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 flex items-center gap-2">
                            <Upload size={18}/> Importar Backup
                        </button>
                    </div>
                </div> 
            )}
         </div>
      </div>

      {isAdmin && onResetProgram && (
          <div className="mt-16 bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Configuração Avançada do Evento</h3>
              <p className="text-sm text-red-700 mb-4">Se o programa exibido estiver incorreto (ex: mostrando Congresso em vez de Assembleia), use esta opção para forçar a correção.</p>
              
              <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-red-600 uppercase mb-2">Tipo de Evento Correto</label>
                      <select 
                          className="w-full p-3 rounded-xl border border-red-200 text-sm bg-white outline-none focus:ring-2 focus:ring-red-300"
                          value={selectedResetType}
                          onChange={(e) => setSelectedResetType(e.target.value as EventType)}
                      >
                          <option value="CIRCUIT_OVERSEER">Assembleia com Sup. de Circuito (1 Dia)</option>
                          <option value="BETHEL_REP">Assembleia com Rep. de Betel (1 Dia)</option>
                          <option value="REGIONAL_CONVENTION">Congresso Regional (3 Dias)</option>
                      </select>
                  </div>
                  <button onClick={handleResetClick} className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                      <RefreshCcw size={16}/> Redefinir Programa
                  </button>
              </div>
          </div>
      )}

      {isAdmin && (
         <div className="mt-8 pt-8 border-t border-slate-200">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Lock size={14}/> Migração de Dados (Backup)</h3>
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div>
                    <h4 className="font-bold text-slate-800 mb-1">Backup Completo</h4>
                    <p className="text-xs text-slate-500 max-w-sm">Use isso para transferir seus dados do computador (Localhost) para o site (Netlify). Salva TUDO: Organograma, Programa, Notas e Assistência.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={handleExportBackup} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm"><Download size={16}/> Baixar Backup Completo</button>
                    <div className="relative flex-1 md:flex-none">
                        <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 text-white border border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors shadow-lg"><Upload size={16}/> Restaurar Dados</button>
                    </div>
                </div>
             </div>
         </div>
      )}

      {showModal && (
         <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden border border-slate-200">
               <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center sticky top-0"><h3 className="font-bold text-slate-800 text-lg">{editingCong ? 'Editar Congregação' : 'Nova Congregação'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div>
               <div className="p-6 space-y-5"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nome</label><input className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 text-slate-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Centro" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Coordenador</label><input className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 text-slate-800" value={formData.coordinator} onChange={e => setFormData({...formData, coordinator: e.target.value})} placeholder="Nome" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Telefone</label><input className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 text-slate-800" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(00) 0..." /></div></div><button onClick={saveCongregation} className="w-full bg-brand-500 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-brand-600 mt-2 active:scale-[0.98] transition-all">Salvar</button></div>
            </div>
         </div>
      )}
    </div>
  );
};
