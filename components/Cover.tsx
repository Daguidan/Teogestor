
import React, { useState, useEffect, useRef } from 'react';
import { AssemblyProgram } from '../types';
import { Upload, Image as ImageIcon, ArrowLeft, RefreshCcw } from 'lucide-react';
import { SecureStorage } from '../services/storage';

interface CoverProps {
  program: AssemblyProgram;
  onEnter: () => void;
  onBack: () => void;
  initialCircuitId?: string;
}

export const Cover: React.FC<CoverProps> = ({ program, onEnter, onBack, initialCircuitId }) => {
  const [date, setDate] = useState('');
  const [circuitId, setCircuitId] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prefix = program.type;
    setDate(SecureStorage.getItem(`${prefix}_date`, ''));
    setCircuitId(SecureStorage.getItem(`${prefix}_circuit`, initialCircuitId || 'GO-003 A'));
    setCoverImage(SecureStorage.getItem(`${prefix}_cover_img`, null));
  }, [program.type, initialCircuitId]);

  const saveDate = (val: string) => { setDate(val); SecureStorage.setItem(`${program.type}_date`, val); };
  const saveCircuit = (val: string) => { setCircuitId(val); SecureStorage.setItem(`${program.type}_circuit`, val); };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
         const result = e.target?.result as string;
         setCoverImage(result);
         SecureStorage.setItem(`${program.type}_cover_img`, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Restaurar imagem original da pasta?")) {
        setCoverImage(null);
        SecureStorage.setItem(`${program.type}_cover_img`, null);
    }
  };

  // Lógica Simplificada: Se tiver imagem salva (upload), usa ela. Se não, usa a padrão do constants.ts
  const displayImage = coverImage || program.defaultCoverImage;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-32 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-brand-50 rounded-full blur-[150px] opacity-60 pointer-events-none"></div>
      
      <div className="absolute top-6 left-6 z-20">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-md text-slate-600 rounded-full text-sm font-bold shadow-sm border border-slate-200 hover:bg-white hover:text-brand-600 transition-all">
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto z-10 animate-fade-in">
        
        {/* IMAGEM COM MOLDURA - Estilo Inline Forçado */}
        <div 
           className="w-full max-w-4xl aspect-video bg-white mb-12 rounded-sm relative group shadow-2xl flex items-center justify-center transform hover:scale-[1.01] transition-transform duration-500"
           style={{
              border: '20px solid white',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              backgroundImage: displayImage ? `url("${displayImage}")` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#e2e8f0'
           }}
        >
           {!displayImage && (
             <div className="flex flex-col items-center justify-center text-slate-300">
                <ImageIcon size={80} className="mb-4 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-50">Imagem não carregada</p>
                <p className="text-xs text-red-300 mt-2">{program.defaultCoverImage}</p>
             </div>
           )}
           
           <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
               {/* Botão Restaurar Padrão */}
               <button 
                 onClick={handleResetImage} 
                 className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white text-slate-600 hover:text-red-600 transition-all border border-slate-100"
                 title="Restaurar Imagem Padrão"
               >
                 <RefreshCcw size={24} />
               </button>

               {/* Botão Upload */}
               <button 
                 onClick={() => fileInputRef.current?.click()} 
                 className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white text-brand-600 transition-all border border-slate-100"
                 title="Trocar Imagem"
               >
                 <Upload size={24} />
                 <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
               </button>
           </div>
        </div>

        {/* TÍTULO - Estilo Inline Forçado para Gradiente e Tamanho */}
        <div className="text-center max-w-4xl mx-auto mb-12">
           <h2 className="text-sm md:text-base font-extrabold text-brand-600 uppercase tracking-[0.4em] mb-6">
              {program.type === 'REGIONAL_CONVENTION' ? 'Congresso Regional' : 
               program.type === 'CIRCUIT_OVERSEER' ? 'Assembleia de Circuito (Sup. Circuito)' : 'Assembleia de Circuito (Rep. Betel)'}
           </h2>
           
           <h1 
             style={{ 
               fontFamily: '"Playfair Display", serif',
               fontSize: 'clamp(3rem, 6vw, 6rem)', 
               lineHeight: '1.1',
               fontWeight: '900',
               background: 'linear-gradient(to right, #0f172a, #00BCD4, #0f172a)',
               WebkitBackgroundClip: 'text',
               WebkitTextFillColor: 'transparent',
               marginBottom: '2rem',
               textShadow: '0px 2px 4px rgba(0,0,0,0.1)'
             }}
           >
              {program.theme}
           </h1>
           
           {program.scriptureReference && (
             <div className="inline-block px-8 py-3 border-y-2 border-brand-200 bg-brand-50/30">
                <p className="text-base font-bold tracking-[0.3em] uppercase text-slate-600">{program.scriptureReference}</p>
             </div>
           )}
        </div>

        <div className="w-full max-w-md space-y-6">
           <div className="group relative">
             <input className="w-full text-center text-2xl md:text-3xl font-bold text-slate-800 bg-transparent outline-none uppercase tracking-tight py-2 border-b-2 border-transparent focus:border-brand-300" placeholder="DEFINIR DATA" value={date} onChange={e => saveDate(e.target.value)} />
             <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200 group-hover:bg-slate-300"></div>
           </div>
           <div className="group relative">
             <textarea rows={1} className="w-full text-center text-lg font-medium text-slate-500 bg-transparent outline-none resize-none py-2" placeholder="LOCAL OU CIRCUITO" value={circuitId} onChange={e => saveCircuit(e.target.value)} />
           </div>
        </div>

        <button onClick={onEnter} className="mt-16 px-16 py-6 bg-brand-600 hover:bg-brand-700 text-white text-xl font-bold rounded-full shadow-2xl shadow-brand-600/40 transition-all hover:-translate-y-1 active:scale-95">
           Entrar no Programa
        </button>
      </div>
    </div>
  );
};
