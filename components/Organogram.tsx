
import React, { useState, useEffect } from 'react';
import { OrgStructure, DepartmentAssignment, VolunteerData, EventType } from '../types';
import { Save, User, Users, X, MapPin, AlertTriangle, Edit2, ChevronDown, Mail, Lock, Check } from 'lucide-react';

interface OrganogramProps {
  data: OrgStructure;
  onUpdate: (newData: OrgStructure) => void;
  isAdmin: boolean;
  eventType?: EventType | null;
  // FIX: Add missing props passed from App.tsx to resolve the type error.
  isAttendantOverseer?: boolean;
  isParkingOverseer?: boolean;
}

const VolunteerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VolunteerData | null) => void;
  initialData: VolunteerData | null;
  roleTitle: string;
}> = ({ isOpen, onClose, onSave, initialData, roleTitle }) => {
  const [formData, setFormData] = useState<VolunteerData>({
    name: '', congregation: '', phone: '', email: '', organizationEmail: '', lgpdConsent: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '', congregation: initialData.congregation || '', phone: initialData.phone || '', email: initialData.email || '', organizationEmail: initialData.organizationEmail || '', lgpdConsent: initialData.lgpdConsent || false
      });
    } else {
      setFormData({ name: '', congregation: '', phone: '', email: '', organizationEmail: '', lgpdConsent: false });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); onClose(); };
  const handleClear = () => { if (confirm("Remover?")) { onSave(null); onClose(); } };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 sticky top-0 z-10 rounded-t-2xl">
          <div><h3 className="font-bold text-lg text-slate-800">{roleTitle}</h3></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nome</label><input required className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Congregação</label><input required className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800" value={formData.congregation} onChange={e => setFormData({...formData, congregation: e.target.value})} /></div>
             <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Telefone</label><input className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">E-mail Pessoal</label>
            <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input type="email" className="w-full border border-slate-300 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="exemplo@email.com" />
            </div>
          </div>
          <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
             <h4 className="text-xs font-bold text-brand-800 mb-2 flex items-center gap-2"><Lock size={14}/> Proteção de Dados (LGPD)</h4>
             <p className="text-[10px] text-brand-900/80 leading-tight mb-3">Dados salvos localmente. Sem nuvem.</p>
             <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-brand-600 w-4 h-4" checked={formData.lgpdConsent} onChange={e => setFormData({...formData, lgpdConsent: e.target.checked})} /><span className="text-xs font-medium text-brand-900">Consentimento obtido</span></label>
          </div>
          <div className="flex gap-3 pt-2">
             {initialData && <button type="button" onClick={handleClear} className="px-5 py-3 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">Remover</button>}
             <div className="flex-1"></div>
             <button type="button" onClick={onClose} className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
             <button type="submit" disabled={!formData.name} className="px-8 py-3 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CommitteeCard: React.FC<{ title: string; subtitle?: string; data: VolunteerData | null; onEdit: () => void; headerColorClass: string; isAdmin: boolean; }> = ({ title, subtitle, data, onEdit, headerColorClass, isAdmin }) => {
  return (
    <div className="rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full bg-white hover:shadow-md transition-all">
      <div className={`p-3 text-center ${headerColorClass} border-b border-black/5`}>
        <h3 className="font-bold text-slate-800 text-sm sm:text-base">{title}</h3>
        {subtitle && <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold opacity-70">{subtitle}</p>}
      </div>
      <div onClick={isAdmin ? onEdit : undefined} className={`flex-1 p-4 flex flex-col justify-center items-center text-center ${isAdmin ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
        {data ? (
          <div className="w-full relative">
             {!data.lgpdConsent && isAdmin && <div className="absolute top-0 right-0 text-amber-500"><AlertTriangle size={14} /></div>}
             <p className="text-lg font-bold text-slate-900">{data.name}</p>
             <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1 mt-1"><MapPin size={10} /> {data.congregation}</p>
             {data.phone && <p className="text-xs font-mono bg-slate-100 text-slate-600 inline-block px-2 py-0.5 rounded mt-2">{data.phone}</p>}
          </div>
        ) : (
          <div className="py-2 text-slate-300 flex flex-col items-center"><User size={24} className="mb-1 opacity-30" /><span className="text-xs italic">Definir Titular</span></div>
        )}
      </div>
    </div>
  );
};

const AssistantCard: React.FC<{ title: string; data: VolunteerData | null; onEdit: () => void; isAdmin: boolean; themeColor: 'cyan' | 'purple' | 'stone' | 'blue'; }> = ({ title, data, onEdit, isAdmin, themeColor }) => {
  let borderColor = 'border-slate-200'; let iconColor = 'text-slate-400'; let bgColor = 'bg-white';
  if (data) {
     switch(themeColor) {
        case 'cyan': borderColor = 'border-brand-200'; iconColor = 'text-brand-600'; bgColor = 'bg-brand-50/30'; break;
        case 'purple': borderColor = 'border-purple-200'; iconColor = 'text-purple-600'; bgColor = 'bg-purple-50/30'; break;
        case 'stone': borderColor = 'border-stone-200'; iconColor = 'text-stone-600'; bgColor = 'bg-stone-50/50'; break;
        case 'blue': borderColor = 'border-blue-200'; iconColor = 'text-blue-600'; bgColor = 'bg-blue-50/30'; break;
     }
  }
  return (
    <div className="mb-2 mt-1 w-full">
       <div className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 ml-1 flex items-center gap-1"><ChevronDown size={10}/> {title}</div>
       <div onClick={isAdmin ? onEdit : undefined} className={`flex items-center p-2.5 rounded-lg border transition-all ${isAdmin ? 'cursor-pointer hover:shadow-sm' : ''} ${bgColor} ${borderColor} bg-white`}>
          <div className={`p-1.5 rounded-full mr-2 bg-white shadow-sm border border-slate-100 ${iconColor}`}><Users size={14} /></div>
          <div className="flex-1 min-w-0 overflow-hidden">
             {data ? (
                <div className="relative pr-2">
                   {!data.lgpdConsent && isAdmin && <div className="absolute right-0 top-0 text-amber-500"><AlertTriangle size={10} /></div>}
                   <p className="text-xs font-bold text-slate-800 truncate">{data.name}</p>
                   <div className="flex items-center gap-2 text-[9px] text-slate-500 truncate"><span className="flex items-center gap-0.5"><MapPin size={8} /> {data.congregation}</span></div>
                </div>
             ) : <p className="text-[10px] text-slate-400 italic">Vago</p>}
          </div>
       </div>
    </div>
  );
};

const VolunteerSlot: React.FC<{ label: string; data: VolunteerData | null; icon: React.ElementType; onEdit: () => void; isAdmin: boolean; }> = ({ label, data, icon: Icon, onEdit, isAdmin }) => {
  if (!data && !isAdmin) return null;
  return (
    <div className="mb-2 last:mb-0">
      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5 pl-1">{label}</label>
      <div onClick={isAdmin ? onEdit : undefined} className={`flex items-center p-2 rounded-lg border transition-all ${isAdmin ? 'cursor-pointer hover:border-brand-300' : ''} ${data ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
        <div className={`p-1.5 rounded-full mr-2.5 ${data ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-300'}`}><Icon size={14} /></div>
        <div className="flex-1 min-w-0">
          {data ? (
            <div className="relative pr-3">
               {!data.lgpdConsent && isAdmin && <div className="absolute right-[-2px] top-0 text-amber-500"><AlertTriangle size={12} /></div>}
               <p className="text-sm font-bold text-slate-800 truncate">{data.name}</p>
               <div className="flex gap-2 text-[10px] text-slate-500"><span className="flex items-center gap-0.5"><MapPin size={8} /> {data.congregation}</span>{data.phone && <span className="font-mono">{data.phone}</span>}</div>
            </div>
          ) : <p className="text-xs text-slate-400 italic">Vago</p>}
        </div>
      </div>
    </div>
  );
};

const DepartmentCard: React.FC<{ dept: DepartmentAssignment; onChange: (updated: DepartmentAssignment) => void; themeColor: 'cyan' | 'stone' | 'purple' | 'blue'; isAdmin: boolean; }> = ({ dept, onChange, themeColor, isAdmin }) => {
  const [editingIndex, setEditingIndex] = useState<number | 'overseer' | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  
  const isEmpty = !dept.overseer && dept.assistants.every(a => a === null);
  if (!isAdmin && isEmpty) return null;

  const handleSave = (data: VolunteerData | null) => {
    if (editingIndex === 'overseer') onChange({ ...dept, overseer: data });
    else if (typeof editingIndex === 'number') {
      const newAssistants = [...dept.assistants];
      newAssistants[editingIndex] = data;
      onChange({ ...dept, assistants: newAssistants });
    }
  };

  let headerBg = 'bg-slate-100 text-slate-800'; let borderColor = 'border-slate-200'; let leftBorder = 'border-l-slate-500';
  switch(themeColor) {
     case 'cyan': headerBg = 'bg-brand-100 text-brand-900'; borderColor = 'border-brand-200'; leftBorder = 'border-l-brand-500'; break;
     case 'purple': headerBg = 'bg-purple-100 text-purple-900'; borderColor = 'border-purple-200'; leftBorder = 'border-l-purple-500'; break;
     case 'stone': headerBg = 'bg-stone-200 text-stone-800'; borderColor = 'border-stone-300'; leftBorder = 'border-l-stone-500'; break;
     case 'blue': headerBg = 'bg-blue-100 text-blue-900'; borderColor = 'border-blue-200'; leftBorder = 'border-l-blue-500'; break;
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-slate-200 border-l-[3px] ${leftBorder} mb-4 break-inside-avoid overflow-hidden`}>
        <div className={`${headerBg} p-2 px-3 border-b ${borderColor} flex justify-between items-center`}>
          {isEditingName && dept.isCustom ? (
             <input autoFocus value={dept.name} onChange={(e) => onChange({...dept, name: e.target.value})} onBlur={() => setIsEditingName(false)} className="bg-white/50 w-full text-sm font-bold uppercase px-1 rounded outline-none" />
          ) : (
             <div className="flex items-center gap-2 w-full">
                <h4 className="font-bold text-sm uppercase tracking-wide truncate">{dept.name}</h4>
                {dept.isCustom && isAdmin && <button onClick={() => setIsEditingName(true)} className="opacity-50 hover:opacity-100 p-1 bg-white/50 rounded"><Edit2 size={12}/></button>}
             </div>
          )}
        </div>
        <div className="p-3">
          <VolunteerSlot label="Encarregado" data={dept.overseer} icon={User} onEdit={() => setEditingIndex('overseer')} isAdmin={isAdmin} />
          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[9px] font-bold text-slate-400 uppercase">Assistentes</label>
              {isAdmin && <button onClick={() => onChange({ ...dept, assistants: [...dept.assistants, null] })} className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">+</button>}
            </div>
            <div className="grid grid-cols-1 gap-1">
              {dept.assistants.map((assistant, idx) => {
                if (!isAdmin && !assistant) return null;
                return (
                  <div key={idx} className="relative group">
                    <VolunteerSlot label={`Assistente ${idx + 1}`} data={assistant} icon={Users} onEdit={() => setEditingIndex(idx)} isAdmin={isAdmin} />
                    {isAdmin && !assistant && idx >= dept.requiredAssistants && <button onClick={() => { const n = [...dept.assistants]; n.splice(idx, 1); onChange({ ...dept, assistants: n }); }} className="absolute top-1 right-1 text-red-300 hover:text-red-500 p-0.5"><X size={12} /></button>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <VolunteerModal isOpen={editingIndex !== null} onClose={() => setEditingIndex(null)} initialData={editingIndex === 'overseer' ? dept.overseer : (typeof editingIndex === 'number' ? dept.assistants[editingIndex] : null)} roleTitle={dept.name} onSave={handleSave} />
    </>
  );
};

export const Organogram: React.FC<OrganogramProps> = ({ data, onUpdate, isAdmin, eventType }) => {
  const [localData, setLocalData] = useState<OrgStructure>(data);
  const [message, setMessage] = useState('');
  const [editingCommittee, setEditingCommittee] = useState<string | null>(null);

  useEffect(() => { setLocalData(data); }, [data]);

  const handleSaveAll = () => { onUpdate(localData); setMessage('Salvo!'); setTimeout(() => setMessage(''), 2000); };
  const handleCommUpd = (role: any, val: any) => setLocalData(prev => ({ ...prev, committee: { ...prev.committee, [role]: val } }));

  const isConvention = eventType === 'REGIONAL_CONVENTION';
  
  // Título dinâmico para o Presidente da Assembleia
  const assemblyPresidentTitle = eventType === 'BETHEL_REP' 
    ? "Representante de Betel" 
    : "Superintendente de Circuito";

  return (
    <div className="max-w-6xl mx-auto p-4 pb-32 animate-fade-in">
      <div className="flex justify-between items-center mb-8 sticky top-20 bg-slate-50/90 backdrop-blur-md p-4 z-20 rounded-2xl border border-white/50 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Estrutura Organizacional</h2>
          <p className="text-xs text-slate-500 font-medium">{isAdmin ? 'Modo Edição' : 'Modo Leitura'}</p>
        </div>
        {isAdmin && <button onClick={handleSaveAll} className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5"><Save size={18} /> Salvar Alterações</button>}
      </div>
      {message && <div className="fixed top-24 right-6 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-bold z-50 animate-bounce-in flex items-center gap-2"><Check size={18}/> {message}</div>}

        {isConvention ? (
         <>
            <div className="w-full md:w-1/3 mx-auto mb-8">
               <CommitteeCard title="Presidente do Congresso" subtitle="Superintendente de Circuito (Betel)" data={localData.committee.president ?? null} onEdit={() => setEditingCommittee('president')} headerColorClass="bg-slate-200 text-slate-800" isAdmin={isAdmin} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="space-y-6">
                  <div>
                    <CommitteeCard title="Coordenador da Comissão" data={localData.committee.conventionCoordinator ?? null} onEdit={() => setEditingCommittee('conventionCoordinator')} headerColorClass="bg-brand-100 text-brand-900" isAdmin={isAdmin} />
                    <AssistantCard title="Assistente do Coordenador" data={localData.committee.assistantCoordinator ?? null} onEdit={() => setEditingCommittee('assistantCoordinator')} themeColor="cyan" isAdmin={isAdmin} />
                  </div>
                  <div className="bg-brand-50/50 rounded-xl p-3 border border-brand-100">
                     <div className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-4 text-center border-b border-brand-200 pb-2">Dept. Coordenação</div>
                     {localData.coordDepartments?.map((d, i) => <DepartmentCard key={i} dept={d} themeColor="cyan" isAdmin={isAdmin} onChange={(u) => { const n = [...(localData.coordDepartments || [])]; n[i] = u; setLocalData(p => ({ ...p, coordDepartments: n })); }} />)}
                  </div>
               </div>
               <div className="space-y-6">
                  <div>
                    <CommitteeCard title="Superintendente do Programa" data={localData.committee.conventionProgramOverseer ?? null} onEdit={() => setEditingCommittee('conventionProgramOverseer')} headerColorClass="bg-purple-100 text-purple-900" isAdmin={isAdmin} />
                    <AssistantCard title="Assistente do Sup. Programa" data={localData.committee.assistantProgramOverseer ?? null} onEdit={() => setEditingCommittee('assistantProgramOverseer')} themeColor="purple" isAdmin={isAdmin} />
                  </div>
                  <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-100">
                     <div className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-4 text-center border-b border-purple-200 pb-2">Dept. Programa</div>
                     {localData.progDepartments?.map((d, i) => <DepartmentCard key={i} dept={d} themeColor="purple" isAdmin={isAdmin} onChange={(u) => { const n = [...(localData.progDepartments || [])]; n[i] = u; setLocalData(p => ({ ...p, progDepartments: n })); }} />)}
                  </div>
               </div>
               <div className="space-y-6">
                  <div>
                    <CommitteeCard title="Superintendente de Hospedagem" data={localData.committee.conventionRoomingOverseer ?? null} onEdit={() => setEditingCommittee('conventionRoomingOverseer')} headerColorClass="bg-stone-200 text-stone-800" isAdmin={isAdmin} />
                    <AssistantCard title="Assistente do Sup. Hospedagem" data={localData.committee.assistantRoomingOverseer ?? null} onEdit={() => setEditingCommittee('assistantRoomingOverseer')} themeColor="stone" isAdmin={isAdmin} />
                  </div>
                  <div className="bg-stone-100/50 rounded-xl p-3 border border-stone-200">
                     <div className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-4 text-center border-b border-stone-300 pb-2">Dept. Hospedagem</div>
                     {localData.roomDepartments?.map((d, i) => <DepartmentCard key={i} dept={d} themeColor="stone" isAdmin={isAdmin} onChange={(u) => { const n = [...(localData.roomDepartments || [])]; n[i] = u; setLocalData(p => ({ ...p, roomDepartments: n })); }} />)}
                  </div>
               </div>
            </div>
         </>
      ) : (
         <>
            <div className="mb-8">
               <div className="w-full md:w-2/3 mx-auto mb-6 space-y-4">
                  <CommitteeCard 
                     title="Presidente da Assembleia" 
                     subtitle={assemblyPresidentTitle}
                     data={localData.committee.president ?? null} 
                     onEdit={() => setEditingCommittee('president')} 
                     headerColorClass="bg-slate-200 text-slate-800" 
                     isAdmin={isAdmin} 
                  />
                  
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <AssistantCard title="Assistente do Sup. Circuito 1" data={localData.committee.presidentAssistant1 ?? null} onEdit={() => setEditingCommittee('presidentAssistant1')} themeColor="blue" isAdmin={isAdmin} />
                      <AssistantCard title="Assistente do Sup. Circuito 2" data={localData.committee.presidentAssistant2 ?? null} onEdit={() => setEditingCommittee('presidentAssistant2')} themeColor="blue" isAdmin={isAdmin} />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CommitteeCard title="Superintendente de Assembleia" data={localData.committee.assemblyOverseer ?? null} onEdit={() => setEditingCommittee('assemblyOverseer')} headerColorClass="bg-blue-100 text-blue-900" isAdmin={isAdmin} />
                  <CommitteeCard title="Sup. Assembleia Ajudante" data={localData.committee.assistantAssemblyOverseer ?? null} onEdit={() => setEditingCommittee('assistantAssemblyOverseer')} headerColorClass="bg-stone-200 text-stone-800" isAdmin={isAdmin} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                  <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-4 text-center border-b border-blue-200 pb-2">Departamento A.O.</div>
                  {localData.aoDepartments.map((d, i) => <DepartmentCard key={i} dept={d} themeColor="blue" isAdmin={isAdmin} onChange={(u) => { const n = [...localData.aoDepartments]; n[i] = u; setLocalData(p => ({ ...p, aoDepartments: n })); }} />)}
               </div>
               <div className="bg-stone-100/50 rounded-xl p-3 border border-stone-200">
                  <div className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-4 text-center border-b border-stone-300 pb-2">Departamento A.A.O.</div>
                  {localData.aaoDepartments.map((d, i) => <DepartmentCard key={i} dept={d} themeColor="stone" isAdmin={isAdmin} onChange={(u) => { const n = [...localData.aaoDepartments]; n[i] = u; setLocalData(p => ({ ...p, aaoDepartments: n })); }} />)}
               </div>
            </div>
         </>
      )}

      <VolunteerModal isOpen={editingCommittee !== null} onClose={() => setEditingCommittee(null)} initialData={editingCommittee ? ((localData.committee as any)[editingCommittee] ?? null) : null} roleTitle="Comissão" onSave={(d) => editingCommittee && handleCommUpd(editingCommittee, d)} />
    </div>
  );
};
