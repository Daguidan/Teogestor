import React, { useState, useEffect } from 'react';
import { OrgStructure, VolunteerData, ParkingSector, CongregationEntry } from '../types';
import { Save, Car, Check, Plus, Trash2, Edit2, Users, Sun, Moon, Hash, StickyNote, X, MapPin, Phone } from 'lucide-react';

interface ParkingManagementProps {
  data: OrgStructure;
  onUpdate: (newData: OrgStructure) => void;
  isAdmin: boolean;
  isEmbedded?: boolean; // Para uso dentro do Organograma
}

// Função auxiliar para formatar telefone (Máscara)
const formatPhone = (value: string) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses em volta dos dois primeiros dígitos
      .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca hífen entre o quarto e o quinto dígitos
      .substring(0, 15); // Limita o tamanho
};

const VolunteerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VolunteerData | null) => void;
  initialData: VolunteerData | null;
  roleTitle: string;
  congregations: CongregationEntry[];
}> = ({ isOpen, onClose, onSave, initialData, roleTitle, congregations }) => {
  const [formData, setFormData] = useState<VolunteerData>({
    name: '', congregation: '', phone: '', email: '', organizationEmail: '', lgpdConsent: false
  });

  useEffect(() => {
    setFormData(initialData || { name: '', congregation: '', phone: '', email: '', organizationEmail: '', lgpdConsent: true });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); onClose(); };
  const handleClear = () => { if (confirm("Remover voluntário?")) { onSave(null); onClose(); } };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in border border-slate-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-lg text-slate-800">{roleTitle}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nome</label><input required className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Congregação</label>
                <select 
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800 bg-white"
                    value={formData.congregation}
                    onChange={e => setFormData({...formData, congregation: e.target.value})}
                >
                    <option value="">-- Selecione --</option>
                    {congregations.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Telefone</label>
                <input className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} />
             </div>
          </div>
          <div className="flex gap-3 pt-2">
             {initialData && <button type="button" onClick={handleClear} className="px-5 py-3 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">Remover</button>}
             <div className="flex-1"></div>
             <button type="button" onClick={onClose} className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
             <button type="submit" disabled={!formData.name} className="px-8 py-3 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 shadow-md transition-all disabled:opacity-50">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VolunteerSlot: React.FC<{ data: VolunteerData | null, onEdit: () => void, isAdmin: boolean, label: string }> = ({ data, onEdit, isAdmin, label }) => (
  <div onClick={isAdmin ? onEdit : undefined} className={`p-2 rounded-lg border flex items-center gap-2 ${isAdmin ? 'cursor-pointer hover:bg-slate-50' : ''} ${data ? 'bg-white border-slate-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
    <div className={`p-1.5 rounded-full ${data ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Users size={14}/></div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
      {data ? (
        <div>
          <p className="text-sm font-bold text-slate-800 truncate">{data.name}</p>
          {!isAdmin && (
            <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
              <p className="flex items-center gap-1"><MapPin size={10}/> {data.congregation || 'N/A'}</p>
              <p className="flex items-center gap-1 font-mono"><Phone size={10}/> {data.phone || '-'}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">Vago</p>
      )}
    </div>
  </div>
);

export const ParkingManagement: React.FC<ParkingManagementProps> = ({ data, onUpdate, isAdmin, isEmbedded = false }) => {
  const [localData, setLocalData] = useState<OrgStructure>(data);
  const [message, setMessage] = useState('');
  const [editingSector, setEditingSector] = useState<{sectorId: string, field: keyof ParkingSector} | null>(null);

  useEffect(() => { setLocalData(data); }, [data]);
  
  const parkingSectors = localData.parkingData || [];

  const handleSave = () => { onUpdate(localData); setMessage('Salvo!'); setTimeout(() => setMessage(''), 2000); };
  
  const updateSector = (sectorId: string, field: keyof ParkingSector, value: any) => {
    const newSectors = parkingSectors.map(s => s.id === sectorId ? { ...s, [field]: value } : s);
    setLocalData(prev => ({ ...prev, parkingData: newSectors }));
  };

  const addSector = () => {
    const newSector: ParkingSector = {
        id: `custom_${Date.now()}`,
        name: 'Novo Setor de Estacionamento',
        passRange: '',
        vehicleCount: 0,
        notes: '',
        morningVol1: null, morningVol2: null,
        afternoonVol1: null, afternoonVol2: null,
        isCustom: true,
    };
    setLocalData(prev => ({...prev, parkingData: [...(prev.parkingData || []), newSector]}));
  };

  const removeSector = (sectorId: string) => {
    if (confirm("Remover este setor?")) {
        const newSectors = parkingSectors.filter(s => s.id !== sectorId);
        setLocalData(prev => ({ ...prev, parkingData: newSectors }));
    }
  };

  const handleSaveVolunteer = (data: VolunteerData | null) => {
    if (editingSector) {
      updateSector(editingSector.sectorId, editingSector.field, data);
    }
  };

  const getEditingVolunteerData = () => {
    if (!editingSector) return null;
    const sector = parkingSectors.find(s => s.id === editingSector.sectorId);
    return sector ? sector[editingSector.field] as VolunteerData : null;
  }
  
  return (
    <div className={`max-w-7xl mx-auto animate-fade-in pb-32 ${!isEmbedded ? 'p-4' : ''}`}>
      {!isEmbedded && (
        <div className="flex justify-between items-center mb-8 sticky top-20 bg-slate-50/90 backdrop-blur-md p-4 z-20 rounded-2xl border border-white/50 shadow-sm">
          <div><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Car className="text-blue-500"/> Gestão de Estacionamento</h2><p className="text-xs font-medium text-slate-500">Voluntários, vagas e crachás.</p></div>
          {isAdmin && (
              <div className="flex items-center gap-2">
                  <button onClick={addSector} className="bg-white text-slate-600 px-4 py-3 rounded-xl text-xs font-bold border border-slate-200 shadow-sm hover:bg-slate-100"><Plus size={16}/></button>
                  <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2"><Save size={18} /> Salvar Alterações</button>
              </div>
          )}
        </div>
      )}
      {message && <div className="fixed top-24 right-6 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2"><Check size={18}/> {message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {parkingSectors.map(sector => (
          <div key={sector.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                {isAdmin ? (
                    <input className="font-bold text-slate-800 text-base bg-transparent w-full outline-none focus:bg-white px-1 rounded" value={sector.name} onChange={e => updateSector(sector.id, 'name', e.target.value)} />
                ) : (
                    <h3 className="font-bold text-slate-800 text-base">{sector.name}</h3>
                )}
                {isAdmin && sector.isCustom && <button onClick={() => removeSector(sector.id)} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={14}/></button>}
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Coluna Manhã */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-amber-600 uppercase flex items-center gap-2"><Sun size={14}/> Turno da Manhã</h4>
                <VolunteerSlot data={sector.morningVol1} onEdit={() => setEditingSector({sectorId: sector.id, field: 'morningVol1'})} isAdmin={isAdmin} label="Voluntário 1" />
                <VolunteerSlot data={sector.morningVol2} onEdit={() => setEditingSector({sectorId: sector.id, field: 'morningVol2'})} isAdmin={isAdmin} label="Voluntário 2" />
              </div>
              {/* Coluna Tarde */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-blue-600 uppercase flex items-center gap-2"><Moon size={14}/> Turno da Tarde</h4>
                <VolunteerSlot data={sector.afternoonVol1} onEdit={() => setEditingSector({sectorId: sector.id, field: 'afternoonVol1'})} isAdmin={isAdmin} label="Voluntário 1" />
                <VolunteerSlot data={sector.afternoonVol2} onEdit={() => setEditingSector({sectorId: sector.id, field: 'afternoonVol2'})} isAdmin={isAdmin} label="Voluntário 2" />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><Hash size={12}/> Crachás</label>
                        <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" placeholder="001-050" value={sector.passRange} onChange={e => updateSector(sector.id, 'passRange', e.target.value)} readOnly={!isAdmin} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><Car size={12}/> Vagas</label>
                        <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" placeholder="50" value={sector.vehicleCount || ''} onChange={e => updateSector(sector.id, 'vehicleCount', parseInt(e.target.value) || 0)} readOnly={!isAdmin}/>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><StickyNote size={12}/> Observações</label>
                    <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} placeholder="Notas sobre este setor..." value={sector.notes} onChange={e => updateSector(sector.id, 'notes', e.target.value)} readOnly={!isAdmin}></textarea>
                </div>
            </div>
          </div>
        ))}
      </div>
      <VolunteerModal 
        isOpen={!!editingSector}
        onClose={() => setEditingSector(null)}
        onSave={handleSaveVolunteer}
        initialData={getEditingVolunteerData()}
        roleTitle="Designar Voluntário"
        congregations={localData.generalInfo?.congregations || []}
      />
    </div>
  );
};
