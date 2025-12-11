// v3.5 - CleaningManagement.tsx with Custom Locations & Better UX
import React, { useState, useEffect, useMemo } from 'react';
import { OrgStructure, CongregationEntry } from '../types';
import { Save, UserCheck, Sparkles, FileText, Check, Phone, Building2, Plus, Trash2 } from 'lucide-react';
import { DEFAULT_CLEANING_LOCATIONS } from '../constants';

// Helper para normalização
const normalizeString = (str: string): string => str.trim().toLowerCase();

// FIX: Added missing interface definition for component props.
interface CleaningManagementProps {
  data: OrgStructure;
  onUpdate: (newData: OrgStructure) => void;
  isAdmin: boolean;
}

export const CleaningManagement: React.FC<CleaningManagementProps> = ({ data, onUpdate, isAdmin }) => {
  const [localData, setLocalData] = useState<OrgStructure>(data);
  const [message, setMessage] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => { setLocalData(data); }, [data]);

  const congregations = localData.generalInfo?.congregations || [];
  const customLocations = useMemo(() => localData.generalInfo?.customCleaningLocations || [], [localData.generalInfo]);

  const allLocations = useMemo(() => {
    return [...new Set([...DEFAULT_CLEANING_LOCATIONS, ...customLocations])];
  }, [customLocations]);

  const handleSaveAll = () => {
    onUpdate(localData);
    setMessage('Designações salvas!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleAddLocation = () => {
    if (!newLocation.trim() || !isAdmin) return;
    const normalizedNew = normalizeString(newLocation);
    if (allLocations.some(loc => normalizeString(loc) === normalizedNew)) {
        alert('Este local já existe.');
        return;
    }
    setLocalData(prev => ({
        ...prev,
        generalInfo: {
            ...prev.generalInfo!,
            congregations: prev.generalInfo?.congregations || [],
            reminders: prev.generalInfo?.reminders || '',
            customCleaningLocations: [...customLocations, newLocation.trim()]
        }
    }));
    setNewLocation('');
  };

  const handleRemoveLocation = (locationToRemove: string) => {
    if (!isAdmin) return;
    setLocalData(prev => ({
      ...prev,
      generalInfo: {
        ...prev.generalInfo!,
        congregations: prev.generalInfo?.congregations || [],
        reminders: prev.generalInfo?.reminders || '',
        customCleaningLocations: customLocations.filter(loc => loc !== locationToRemove)
      }
    }));
  };

  const updateCongregation = (id: string, field: keyof CongregationEntry, value: string) => {
    const newCongs = [...congregations];
    const index = newCongs.findIndex(c => c.id === id);
    if (index !== -1) {
      newCongs[index] = { ...newCongs[index], [field]: value };
      setLocalData(prev => ({
        ...prev,
        generalInfo: { ...prev.generalInfo!, congregations: newCongs }
      }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in pb-32">
      <div className="flex justify-between items-center mb-8 sticky top-20 bg-slate-50/90 backdrop-blur-md p-4 z-20 rounded-2xl border border-white/50 shadow-sm">
        <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">Limpeza e Fichas</h2><p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">Designações Operacionais</p></div>
        {isAdmin && <button onClick={handleSaveAll} className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/30 flex items-center gap-2 hover:-translate-y-0.5 transition-all"><Save size={18} /> Salvar Alterações</button>}
      </div>
      {message && <div className="fixed top-24 right-6 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-bold z-50 animate-bounce-in flex items-center gap-2"><Check size={18}/> {message}</div>}

      {isAdmin && (
        <div className="mb-8 p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2"><Plus size={16}/> Adicionar Novo Local de Limpeza</h4>
            <p className="text-xs text-slate-500 mb-3">Adicione locais específicos para seu evento. Eles aparecerão na lista de opções para cada congregação.</p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input 
                    className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none transition-all font-medium border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    placeholder="Ex: Áreas de Apoio" 
                    value={newLocation} 
                    onChange={(e) => setNewLocation(e.target.value)} 
                />
                <button onClick={handleAddLocation} className="px-5 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-sm">Adicionar à Lista</button>
            </div>
        </div>
      )}
      
      {isAdmin && (
        <div className="mb-8 p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-sm text-slate-700 mb-3">Locais de Limpeza Disponíveis</h4>
            <div className="flex flex-wrap gap-2">
            {allLocations.map(loc => {
                const isCustom = customLocations.includes(loc);
                return (
                <div key={loc} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isCustom ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                    <span>{loc}</span>
                    {isAdmin && isCustom && (
                    <button onClick={() => handleRemoveLocation(loc)} className="text-blue-400 hover:text-blue-700">
                        <Trash2 size={12} />
                    </button>
                    )}
                </div>
                );
            })}
            </div>
        </div>
      )}

      {congregations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {congregations.map((cong) => {
            const isComplete = !!cong.cleaningResponsable && !!cong.cleaningAssignment;
            return (
              <div key={cong.id} className={`bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden transition-all duration-300 relative group ${isComplete ? 'ring-1 ring-emerald-500/30' : ''}`}>
                 <div className={`p-5 border-b border-slate-100 relative overflow-hidden ${isComplete ? 'bg-gradient-to-r from-emerald-50/50 to-white' : 'bg-slate-50'}`}>
                    <div className={`absolute top-0 left-0 w-2 h-full ${isComplete ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <div className="flex justify-between items-center pl-2">
                       <h3 className="font-bold text-slate-900 text-lg leading-tight">{cong.name}</h3>
                       {isComplete && <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full shadow-sm"><Check size={16}/></div>}
                    </div>
                 </div>
                 
                 <div className="p-6 space-y-6">
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1 tracking-wider"><Sparkles size={12}/> Local / Designação</label>
                       {isAdmin ? (
                          <select 
                            className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 transition-all font-medium border-slate-200 bg-slate-50 focus:border-brand-500 focus:ring-brand-200 appearance-none"
                            value={cong.cleaningAssignment || ''}
                            onChange={(e) => updateCongregation(cong.id, 'cleaningAssignment', e.target.value)}
                          >
                            <option value="">-- Selecione um Local --</option>
                            {allLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                          </select>
                       ) : (
                          <div className={`text-sm font-bold p-4 rounded-xl border ${cong.cleaningAssignment ? 'bg-brand-50 border-brand-100 text-brand-800' : 'bg-slate-50 border-slate-100 text-slate-400 italic'}`}>{cong.cleaningAssignment || 'Aguardando designação...'}</div>
                       )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-dashed border-slate-200">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1 tracking-wider"><UserCheck size={12}/> Responsável Local</label>
                          {isAdmin ? (
                             <input className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder-slate-300" placeholder="Nome do irmão" value={cong.cleaningResponsable || ''} onChange={(e) => updateCongregation(cong.id, 'cleaningResponsable', e.target.value)}/>
                          ) : (
                             <p className="text-sm font-bold text-slate-800">{cong.cleaningResponsable || <span className="text-slate-400 italic font-medium">Não informado</span>}</p>
                          )}
                       </div>
                       
                       {isAdmin && (
                          <div>
                             <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1 tracking-wider"><Phone size={12}/> Telefone (Interno)</label>
                             <input className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder-slate-300 font-mono" placeholder="(00) 00000..." value={cong.cleaningResponsablePhone || ''} onChange={(e) => updateCongregation(cong.id, 'cleaningResponsablePhone', e.target.value)}/>
                          </div>
                       )}

                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1 tracking-wider"><FileText size={12}/> Fichas</label>
                          {isAdmin ? (
                             <input className="w-full border border-purple-100 bg-purple-50/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-purple-800 font-bold placeholder-purple-200" placeholder="Ex: 15, 16" value={cong.accountsAssignment || ''} onChange={(e) => updateCongregation(cong.id, 'accountsAssignment', e.target.value)}/>
                          ) : (
                             <p className="text-sm font-extrabold text-purple-700 bg-purple-50 inline-block px-2 py-1 rounded">{cong.accountsAssignment || <span className="text-slate-300 font-normal">-</span>}</p>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200 mt-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Building2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Nenhuma Congregação Encontrada</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Para designar a limpeza, primeiro adicione as congregações na seção <strong>"Geral e Contatos"</strong> do painel de administração.
          </p>
        </div>
      )}
    </div>
  );
};