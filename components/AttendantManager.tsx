import React, { useState, useEffect } from 'react';
import { OrgStructure, AttendantData, SectorEntry } from '../types';
import { DEFAULT_SECTORS } from '../constants';
import { Users, Phone, Save, Check, MapPin, Sun, Moon, Edit2, Plus, Trash2, Building2 } from 'lucide-react';

interface AttendantManagerProps {
  data: OrgStructure;
  onUpdate: (newData: OrgStructure) => void;
  isAdmin: boolean;
  isEmbedded?: boolean; // Para uso dentro do Organograma
}

export const AttendantManager: React.FC<AttendantManagerProps> = ({ data, onUpdate, isAdmin, isEmbedded = false }) => {
  const [localData, setLocalData] = useState<OrgStructure>(data);
  const [message, setMessage] = useState('');
  const [editingSectorName, setEditingSectorName] = useState<string | null>(null);
  
  // Estado para controlar qual aba (Manhã/Tarde) está ativa em cada card
  const [activeTabs, setActiveTabs] = useState<Record<string, 'morning' | 'afternoon'>>({});

  const attendantsData = localData.attendantsData || [];
  const congregations = localData.generalInfo?.congregations || [];
  const customSectors = localData.customSectors || [];

  // Combina setores padrão com personalizados
  const allSectors = [...DEFAULT_SECTORS, ...customSectors];

  useEffect(() => { setLocalData(data); }, [data]);

  const handleSave = () => {
    onUpdate(localData);
    setMessage('Dados Salvos!');
    setTimeout(() => setMessage(''), 2000);
  };

  const toggleTab = (sectorId: string, tab: 'morning' | 'afternoon') => {
      setActiveTabs(prev => ({ ...prev, [sectorId]: tab }));
  };

  const handleAddSector = () => {
      const newId = `custom_${Date.now()}`;
      const newSector: SectorEntry = {
          id: newId,
          name: 'Novo Setor',
          colorClass: 'border-l-4 border-l-slate-400'
      };
      setLocalData(prev => ({
          ...prev,
          customSectors: [...(prev.customSectors || []), newSector]
      }));
      setEditingSectorName(newId);
  };

  const handleRemoveSector = (id: string) => {
      if(!confirm("Remover este setor?")) return;
      setLocalData(prev => ({
          ...prev,
          customSectors: (prev.customSectors || []).filter(s => s.id !== id),
          attendantsData: (prev.attendantsData || []).filter(a => a.sectorId !== id)
      }));
  };

  const updateAttendant = (sectorId: string, field: keyof AttendantData, value: string | number) => {
    const newData = [...attendantsData];
    const index = newData.findIndex(a => a.sectorId === sectorId);
    
    if (index !== -1) {
      newData[index] = { ...newData[index], [field]: value };
    } else {
      const newEntry: AttendantData = {
        sectorId,
        countMorning: 0,
        countAfternoon: 0,
        [field]: value
      } as AttendantData;
      newData.push(newEntry);
    }

    setLocalData(prev => ({ ...prev, attendantsData: newData }));
  };

  const getAttendant = (sectorId: string) => attendantsData.find(a => a.sectorId === sectorId);

  const totalMorning = attendantsData.reduce((sum, item) => sum + (item.countMorning || 0), 0);
  const totalAfternoon = attendantsData.reduce((sum, item) => sum + (item.countAfternoon || 0), 0);

  // Função auxiliar para formatar telefone (Máscara)
  const formatPhone = (value: string) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses em volta dos dois primeiros dígitos
      .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca hífen entre o quarto e o quinto dígitos
      .substring(0, 15); // Limita o tamanho
  };

  const renderVolunteerInput = (sectorId: string, prefix: 'morning_vol1' | 'morning_vol2' | 'afternoon_vol1' | 'afternoon_vol2', data: AttendantData | undefined, label: string) => {
      const nameKey = `${prefix}_name` as keyof AttendantData;
      const phoneKey = `${prefix}_phone` as keyof AttendantData;
      const congKey = `${prefix}_congId` as keyof AttendantData;

      const nameVal = data?.[nameKey] as string || '';
      const phoneVal = data?.[phoneKey] as string || '';
      const congVal = data?.[congKey] as string || '';

      const congName = congregations.find(c => c.id === congVal)?.name;

      return (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Users size={10}/> {label}</label>
            </div>
            
            {isAdmin ? (
                <div className="space-y-2">
                    {/* Select Congregação */}
                    <select 
                        className="w-full text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer appearance-none hover:border-blue-200 transition-colors"
                        value={congVal}
                        onChange={(e) => updateAttendant(sectorId, congKey, e.target.value)}
                    >
                        <option value="">-- Selecione a Congregação --</option>
                        {congregations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <input 
                        className="w-full text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-300 placeholder:font-normal" 
                        placeholder="Nome do Irmão" 
                        value={nameVal} 
                        onChange={(e) => updateAttendant(sectorId, nameKey, e.target.value)}
                    />
                    
                    <div className="relative">
                        <Phone className="absolute left-2 top-2 text-slate-300" size={10}/>
                        <input 
                            className="w-full text-xs font-mono text-slate-600 bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-300" 
                            placeholder="Telefone" 
                            value={phoneVal} 
                            onChange={(e) => updateAttendant(sectorId, phoneKey, formatPhone(e.target.value))}
                        />
                    </div>
                </div>
            ) : (
                <div>
                    <p className="text-sm font-bold text-slate-800">{nameVal || <span className="text-slate-400 italic text-xs font-normal">Não designado</span>}</p>
                    {nameVal && (
                       <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                           <p className="flex items-center gap-1"><Building2 size={10}/> {congName || 'Congregação não informada'}</p>
                           <p className="flex items-center gap-1 font-mono"><Phone size={10}/> {phoneVal || '-'}</p>
                       </div>
                    )}
                </div>
            )}
        </div>
      );
  };

  return (
    <div className={`max-w-7xl mx-auto animate-fade-in pb-32 ${!isEmbedded ? 'p-4' : ''}`}>
      {/* HEADER + TOTALIZADORES (só mostra se não estiver embutido) */}
      {!isEmbedded && (
        <div className="flex flex-col xl:flex-row justify-between items-center mb-8 sticky top-20 bg-slate-50/95 backdrop-blur-md p-4 z-20 rounded-2xl border border-white/50 shadow-sm gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2"><Users className="text-orange-500"/> Indicadores</h2>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">Gestão Operacional por Turno</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {isAdmin && (
                <button onClick={handleAddSector} className="bg-white border border-slate-200 text-slate-600 hover:text-slate-800 px-4 py-3 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all whitespace-nowrap">
                    <Plus size={16}/> Add Setor
                </button>
            )}

            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl shadow-sm min-w-[120px]">
                <div className="bg-amber-100 p-1.5 rounded-full text-amber-600"><Sun size={16}/></div>
                <div>
                  <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">Manhã</p>
                  <p className="text-xl font-mono font-bold text-slate-800 leading-none">{totalMorning}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl shadow-sm min-w-[120px]">
                <div className="bg-blue-100 p-1.5 rounded-full text-blue-600"><Moon size={16}/></div>
                <div>
                  <p className="text-[9px] font-bold text-blue-800 uppercase tracking-wider">Tarde</p>
                  <p className="text-xl font-mono font-bold text-slate-800 leading-none">{totalAfternoon}</p>
                </div>
            </div>
            
            {isAdmin && (
                <button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 flex items-center gap-2 hover:-translate-y-0.5 transition-all h-full whitespace-nowrap">
                  <Save size={18} /> Salvar
                </button>
            )}
          </div>
        </div>
      )}
      
      {message && <div className="fixed top-24 right-6 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-bold z-50 animate-bounce-in flex items-center gap-2"><Check size={18}/> {message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
         {allSectors.map((sector) => {
            const data = getAttendant(sector.id);
            const isEditing = editingSectorName === sector.id;
            const currentTab = activeTabs[sector.id] || 'morning';
            const isCustom = !DEFAULT_SECTORS.some(s => s.id === sector.id);
            
            return (
               <div key={sector.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 relative group hover:shadow-md ${sector.colorClass}`}>
                  {/* CARD HEADER */}
                  <div className="p-3 border-b border-black/5 flex justify-between items-center bg-white/60 h-14">
                     {isEditing && isAdmin ? (
                        <input 
                           autoFocus
                           className="text-sm font-bold bg-white border border-slate-300 rounded px-1 outline-none w-full uppercase"
                           value={isCustom ? sector.name : (data?.customName || sector.name)}
                           onChange={(e) => isCustom 
                                ? setLocalData(prev => ({...prev, customSectors: prev.customSectors!.map(s => s.id === sector.id ? {...s, name: e.target.value} : s)}))
                                : updateAttendant(sector.id, 'customName', e.target.value)
                           }
                           onBlur={() => setEditingSectorName(null)}
                        />
                     ) : (
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2 truncate pr-2">
                           <MapPin size={14} className="opacity-50 shrink-0"/> 
                           <span className="truncate">{data?.customName || sector.name}</span>
                           {isAdmin && <button onClick={() => setEditingSectorName(sector.id)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity p-1 bg-slate-100 rounded"><Edit2 size={12}/></button>}
                        </h3>
                     )}
                     {isAdmin && isCustom && (
                         <button onClick={() => handleRemoveSector(sector.id)} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                     )}
                  </div>
                  
                  {/* TABS DE TURNO */}
                  <div className="flex border-b border-slate-100">
                      <button 
                        onClick={() => toggleTab(sector.id, 'morning')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${currentTab === 'morning' ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-400' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                          <Sun size={12}/> Manhã
                      </button>
                      <button 
                        onClick={() => toggleTab(sector.id, 'afternoon')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${currentTab === 'afternoon' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-400' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                          <Moon size={12}/> Tarde
                      </button>
                  </div>

                  <div className="p-4 bg-white">
                     {currentTab === 'morning' ? (
                        <div className="space-y-3 animate-fade-in">
                            {renderVolunteerInput(sector.id, 'morning_vol1', data, 'Indicador 1')}
                            {renderVolunteerInput(sector.id, 'morning_vol2', data, 'Indicador 2')}
                            
                            <div className="pt-3 border-t border-dashed border-slate-200 mt-4">
                                <label className="text-[10px] font-bold text-amber-600 uppercase mb-2 block flex items-center gap-1"><Sun size={12}/> Assistência Manhã</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        className="w-full text-center font-mono text-xl font-bold bg-amber-50/50 border border-amber-200 rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-amber-300 text-slate-800"
                                        placeholder="0"
                                        value={data?.countMorning || ''}
                                        onChange={(e) => isAdmin && updateAttendant(sector.id, 'countMorning', parseInt(e.target.value) || 0)}
                                        disabled={!isAdmin}
                                    />
                                </div>
                            </div>
                        </div>
                     ) : (
                        <div className="space-y-3 animate-fade-in">
                            {renderVolunteerInput(sector.id, 'afternoon_vol1', data, 'Indicador 1')}
                            {renderVolunteerInput(sector.id, 'afternoon_vol2', data, 'Indicador 2')}

                            <div className="pt-3 border-t border-dashed border-slate-200 mt-4">
                                <label className="text-[10px] font-bold text-blue-600 uppercase mb-2 block flex items-center gap-1"><Moon size={12}/> Assistência Tarde</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        className="w-full text-center font-mono text-xl font-bold bg-blue-50/50 border border-blue-200 rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-blue-300 text-slate-800"
                                        placeholder="0"
                                        value={data?.countAfternoon || ''}
                                        onChange={(e) => isAdmin && updateAttendant(sector.id, 'countAfternoon', parseInt(e.target.value) || 0)}
                                        disabled={!isAdmin}
                                    />
                                </div>
                            </div>
                        </div>
                     )}
                  </div>
               </div>
            );
         })}
      </div>
    </div>
  );
};