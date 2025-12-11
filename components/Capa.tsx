import React, { useState, useEffect, useRef } from 'react';
import { AssemblyProgram } from '../types';
import { ChevronRight, Upload, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { SecureStorage } from '../services/storage';

interface CoverProps {
  program: AssemblyProgram;
  onEnter: () => void;
  onBack: () => void;
}

export const Cover: React.FC<CoverProps> = ({ program, onEnter, onBack }) => {
  const [date, setDate] = useState('');
  const [circuitId, setCircuitId] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prefix = program.type;
    setDate(SecureStorage.getItem(`${prefix}_date`, ''));
    setCircuitId(SecureStorage.getItem(`${prefix}_circuit`, 'GO-003 A'));
    setCoverImage(SecureStorage.getItem(`${prefix}_cover_img`, null));
  }, [program.type]);

  const saveDate = (val: string) => { setDate(val); SecureStorage.setItem(`${program.type}_date`, val); };
  const saveCircuit = (val: string) => { setCircuitId(val); SecureStorage.setItem(`${program.type}_circuit`, val); };
  const saveImage = (val: string | null) => { setCoverImage(val); SecureStorage.setItem(`${program.type}_cover_img`, val); };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => saveImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const displayImage = coverImage || program.defaultCoverImage;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 pb-20">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur text-slate-600 rounded-full text-sm font-medium shadow-sm border border-slate-200 hover:bg-slate-50">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center p-6 w-full max-w-2xl mx-auto mt-12">
        <div className="w-full aspect-video bg-slate-100 mb-8 rounded-2xl overflow-hidden relative group shadow-sm border border-slate-100 flex items-center justify-center">
           {displayImage ? <img src={displayImage} className="w-full h-full object-contain" /> : <div className="flex flex-col items-center text-slate-300"><ImageIcon size={32} /><p className="text-xs mt-2">Adicionar Capa</p></div>}
           <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-full shadow hover:bg-white text-brand-600 transition-opacity opacity-0 group-hover:opacity-100"><Upload size={18} /><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></button>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif text-brand-900 leading-tight mb-2 text-center">{program.theme}</h1>
        {program.scriptureReference && <p className="text-xs font-bold tracking-widest uppercase text-brand-600/70 mb-8">{program.scriptureReference}</p>}

        <div className="text-center mb-8">
           <h2 className="text-base font-bold text-slate-600">{program.type === 'REGIONAL_CONVENTION' ? 'Congresso Regional' : 'Assembleia de Circuito'}</h2>
           <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Testemunhas de Jeová</p>
        </div>

        <div className="w-full space-y-6">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Data do Evento</span>
             <textarea rows={1} className="text-lg text-slate-800 font-medium bg-transparent text-center w-full outline-none resize-none" placeholder="Definir data..." value={date} onChange={e => saveDate(e.target.value)} />
           </div>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Identificação</span>
             <textarea rows={1} className="text-xl font-bold text-brand-700 bg-transparent text-center w-full outline-none resize-none uppercase" placeholder="LOCAL / CIRCUITO" value={circuitId} onChange={e => saveCircuit(e.target.value)} />
           </div>
        </div>

        <button onClick={onEnter} className="mt-10 w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all flex items-center justify-center gap-2 group">
           Abrir Programa <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
        </button>
      </div>
    </div>
  );
};