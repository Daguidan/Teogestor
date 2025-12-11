// v3.5 FINAL - Program.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { AssemblyProgram, Session } from '../types';
import { Sparkles, Music, HelpCircle, CheckCircle2, Trash2, Plus, Edit3, Save, Users, MinusCircle, PlusCircle, Copy, BookOpen, Award, User, Video, Sun, Moon, Send, Lightbulb, Heart } from 'lucide-react';
import { generateStudyAid } from '../services/geminiService';

interface ProgramProps {
  program: AssemblyProgram;
  notes: Record<string, string>;
  onNoteChange: (id: string, text: string) => void;
  attendance: Record<string, string>;
  onAttendanceChange: (id: string, value: string) => void;
  onUpdateProgram?: (newProgram: AssemblyProgram) => void;
  isAdmin?: boolean;
  onAddSuggestion?: (text: string) => void;
  userName?: string;
}

export const Program: React.FC<ProgramProps> = ({ program, notes, onNoteChange, attendance, onAttendanceChange, onUpdateProgram, isAdmin = false, onAddSuggestion }) => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [activeSession, setActiveSession] = useState<'morning' | 'afternoon'>('morning');
  const [loadingAid, setLoadingAid] = useState<string | null>(null);
  const [studyAids, setStudyAids] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedProgram, setEditedProgram] = useState<AssemblyProgram>(program);
  const [copiedAll, setCopiedAll] = useState(false);
  const [pixFeedback, setPixFeedback] = useState('');
  
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);

  useEffect(() => { if (!isEditing) setEditedProgram(program); }, [program, isEditing]);
  
  useEffect(() => { 
    setCurrentDayIndex(0); 
    setActiveSession('morning');
  }, [program.type]);

  const handleSendSuggestion = () => { 
      if(!suggestion.trim()) return; 
      if (onAddSuggestion) {
          onAddSuggestion(suggestion);
      }
      setSuggestionSent(true); 
      setSuggestion(''); 
      setTimeout(() => setSuggestionSent(false), 3000); 
  };
  const handleCopyPix = () => { navigator.clipboard.writeText("apoio@teogestor.app"); setPixFeedback('Chave Copiada!'); setTimeout(() => setPixFeedback(''), 2000); };

  const displayProgram = isEditing ? editedProgram : program;
  const safeDayIndex = Math.min(currentDayIndex, displayProgram.days.length - 1);
  const currentDay = displayProgram.days[safeDayIndex];
  const sessionParts = activeSession === 'morning' ? currentDay.morning.parts : currentDay.afternoon.parts;
  
  const progressStats = useMemo(() => {
    let total = 0; let filled = 0;
    sessionParts.forEach(part => {
      if (!isSong(part.theme)) {
        total++;
        if ((notes[part.id] && notes[part.id].length > 5) || (notes[`speaker_${part.id}`] && notes[`speaker_${part.id}`].length > 2)) filled++;
        if (part.subpoints) part.subpoints.forEach((_, i) => { total++; if (notes[`${part.id}_sub_${i}`] && notes[`${part.id}_sub_${i}`].length > 5) filled++; });
      }
    });
    return { filled, total, percentage: total === 0 ? 0 : Math.round((filled / total) * 100) };
  }, [notes, sessionParts]);

  function isSong(t: string) { return t.toLowerCase().includes('cântico') || t.toLowerCase().includes('música') || t.toLowerCase().includes('vídeo musical'); }

  const handleGenAIAssist = async (id: string, theme: string) => {
    setLoadingAid(id);
    const result = await generateStudyAid(theme);
    setStudyAids(prev => ({ ...prev, [id]: result }));
    setLoadingAid(null);
  };

  const handleCopyAllNotes = () => {
    let text = `*Minhas Anotações - ${program.theme}*\n\n`;
    sessionParts.forEach(part => {
      const n = notes[part.id]; const s = notes[`speaker_${part.id}`];
      if (n || s) text += `⏰ ${part.time} - ${part.theme}\n${s ? `👤 ${s}\n` : ''}${n ? `📝 ${n}\n` : ''}\n`;
    });
    navigator.clipboard.writeText(text);
    setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000);
  };

  const updatePart = (dayIdx: number, sessionKey: 'morning' | 'afternoon', partIdx: number, field: string, value: string) => { 
     const newProgram = { ...editedProgram }; 
     const session = newProgram.days[dayIdx][sessionKey];
     if (session && session.parts[partIdx]) {
        // @ts-ignore
        session.parts[partIdx][field] = value;
        setEditedProgram(newProgram); 
     }
  };

  const removePart = (dayIdx: number, sessionKey: 'morning' | 'afternoon', partIdx: number) => { 
      const newProgram = { ...editedProgram }; 
      newProgram.days[dayIdx][sessionKey].parts.splice(partIdx, 1); 
      setEditedProgram(newProgram); 
  };

  const addPart = (dayIdx: number, sessionKey: 'morning' | 'afternoon') => { 
      const newProgram = { ...editedProgram }; 
      newProgram.days[dayIdx][sessionKey].parts.push({
          id: `new-${Date.now()}`,
          time: '00:00',
          theme: 'Nova Parte',
          note: ''
      }); 
      setEditedProgram(newProgram); 
  };
  
  const renderNoteBox = (id: string, placeholder: string, minHeight = "160px", bgColor = "bg-[#FFFBF5]") => (
    <div className="relative group w-full mt-2 transition-all">
      <textarea id={`note-${id}`} className={`w-full p-4 rounded-xl border border-slate-200 ${bgColor} focus:bg-white focus:ring-2 focus:ring-brand-300 focus:border-brand-500 outline-none resize-y text-slate-800 text-base shadow-inner`} style={{ minHeight: minHeight }} placeholder={placeholder} value={notes[id] || ''} onChange={(e) => onNoteChange(id, e.target.value)} />
      {notes[id] && <div className="absolute bottom-3 right-3 text-emerald-700 text-[10px] font-bold bg-white border border-emerald-200 px-2 py-1 rounded-full shadow-sm flex items-center gap-1"><CheckCircle2 size={12} /> Salvo</div>}
    </div>
  );

  const attendanceKey = `${program.type}_day${safeDayIndex}_${activeSession}`;
  const handleAttendanceBtn = (amount: number) => { const c = parseInt(attendance[attendanceKey] || '0'); onAttendanceChange(attendanceKey, Math.max(0, c + amount).toString()); };

  const renderSession = (session: Session, dayIdx: number, sessionKey: 'morning' | 'afternoon') => (
    <div className="space-y-8 animate-fade-in pb-4">
      {session.parts.map((part, partIdx) => (
        <div key={part.id} className={`rounded-2xl overflow-hidden transition-all duration-300 ${isSong(part.theme) ? 'bg-brand-500 text-white shadow-md transform hover:scale-[1.01]' : 'bg-white shadow-sm hover:shadow-md border border-slate-100'}`}>
          {isEditing ? (
             <div className="flex gap-2 items-center p-4">
               <input value={part.time} onChange={e=>updatePart(dayIdx,sessionKey,partIdx,'time',e.target.value)} className="w-16 border rounded p-1 text-sm font-bold text-slate-800" />
               <input value={part.theme} onChange={e=>updatePart(dayIdx,sessionKey,partIdx,'theme',e.target.value)} className="flex-1 border rounded p-1 text-sm text-slate-800" />
               <button onClick={()=>removePart(dayIdx,sessionKey,partIdx)} className="text-red-500 p-2"><Trash2 size={16}/></button>
             </div>
          ) : (
            <>
              {isSong(part.theme) ? (
                 <div className="flex flex-col items-center justify-center py-5">
                    <div className="flex items-center gap-3 font-bold text-base"><Music size={20} className="text-brand-100" /> <span className="bg-white/20 px-3 py-1 rounded-full text-white font-mono text-sm">{part.time}</span> <span className="tracking-wide">{part.theme}</span></div>
                 </div>
              ) : (
                 <div>
                    <div className="bg-white p-5 border-b border-slate-100 flex items-start gap-4">
                       <div className="bg-brand-50 text-brand-700 text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm font-mono mt-0.5 border border-brand-100">{part.time}</div>
                       <div className="flex-1"><h4 className="font-bold text-xl text-slate-900 leading-snug">{part.theme}</h4></div>
                       <button onClick={() => handleGenAIAssist(part.id, part.theme)} className="text-slate-300 hover:text-brand-500 transition-colors p-2 rounded-full hover:bg-slate-50">{loadingAid === part.id ? <span className="animate-spin text-xs">⌛</span> : <Sparkles size={20} />}</button>
                    </div>
                    <div className="p-5 pt-4">
                      {part.subpoints ? (
                        <div className="space-y-8">
                          {part.subpoints.map((sub, i) => (
                            <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                              <h5 className="font-bold text-slate-800 mb-4">{sub}</h5>
                              
                              <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-slate-100 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                                <div className="bg-slate-100 p-2 rounded-lg shadow-sm text-brand-500 border border-slate-200"><User size={18} /></div>
                                <input 
                                  type="text" 
                                  className="text-base font-medium text-slate-800 bg-transparent outline-none w-full placeholder-slate-400" 
                                  placeholder="Nome do Orador" 
                                  value={notes[`speaker_${part.id}_sub_${i}`] || ''} 
                                  onChange={(e) => onNoteChange(`speaker_${part.id}_sub_${i}`, e.target.value)} 
                                />
                              </div>
                              
                              {renderNoteBox(`${part.id}_sub_${i}`, `Anotações sobre: ${sub}`, "120px", "bg-[#FFFBF5]")}

                              <div className="mt-4 pt-3 border-t border-slate-200/60">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                  <Video size={14} className="text-purple-500" /> Vídeos ou Entrevistas
                                </label>
                                {renderNoteBox(`media_${part.id}_sub_${i}`, "Detalhes...", "80px", "bg-purple-50/20 border-purple-100")}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 mb-5 bg-[#F5FAFF] p-3 rounded-xl border border-slate-100 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                            <div className="bg-white p-2 rounded-lg shadow-sm text-brand-500 border border-slate-100"><User size={18} /></div>
                            <input 
                              type="text" 
                              className="text-base font-medium text-slate-800 bg-transparent outline-none w-full placeholder-slate-400" 
                              placeholder="Nome do Orador" 
                              value={notes[`speaker_${part.id}`] || ''} 
                              onChange={(e) => onNoteChange(`speaker_${part.id}`, e.target.value)} 
                            />
                          </div>
                          {renderNoteBox(part.id, "Anote os pontos principais aqui...", "160px", "bg-[#FFFBF5]")}
                          <div className="mt-6 pt-4">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                              <Video size={14} className="text-purple-500" /> Vídeos ou Entrevistas
                            </label>
                            {renderNoteBox(`media_${part.id}`, "Detalhes...", "80px", "bg-purple-50/20 border-purple-100")}
                          </div>
                        </>
                      )}
                       {studyAids[part.id] && (<div className="mt-4 bg-amber-50 p-5 rounded-2xl border border-amber-200/50 text-sm text-slate-700 animate-fade-in shadow-sm"><h5 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-base"><BookOpen size={18}/> Pontos para Reflexão:</h5><div dangerouslySetInnerHTML={{ __html: studyAids[part.id] }} className="pl-4 list-disc space-y-2 marker:text-amber-500" /></div>)}
                    </div>
                 </div>
              )}
            </>
          )}
        </div>
      ))}
      {isEditing && <button onClick={()=>addPart(dayIdx,sessionKey)} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-brand-400 hover:text-brand-500 flex justify-center items-center gap-2 font-bold transition-all"><Plus size={20}/> Adicionar Parte</button>}
    </div>
  );

  const conventionDailyRecap = ["O que você aprendeu que fez você se achegar mais a Jeová?", "O que você aprendeu que você pode colocar em prática no ministério?", "O que você aprendeu que você pode colocar em prática na sua vida pessoal?"];

  return (
    <div className="max-w-3xl mx-auto pb-32 px-2 sm:px-4">
      {/* HERO BANNER - CABEÇALHO DO PROGRAMA */}
      <div className="rounded-3xl shadow-2xl border border-slate-100 overflow-hidden mb-8 relative group" style={{ minHeight: '380px' }}>
         {/* Imagem de Fundo (Capa) */}
         <div className="absolute inset-0 bg-slate-900">
            {program.defaultCoverImage && (
               <div 
                  className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url("${program.defaultCoverImage}")` }}
               ></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
         </div>

         {/* Conteúdo Sobreposto */}
         <div className="relative z-10 p-8 flex flex-col justify-end h-full min-h-[380px]">
            <div className="flex justify-between items-start mb-4">
                <div>
                   <span className="inline-block py-1 px-3 rounded-md bg-brand-500/20 text-brand-300 text-[10px] font-extrabold uppercase tracking-[0.2em] mb-3 border border-brand-500/30 backdrop-blur-sm">
                      {currentDay.label} • {activeSession === 'morning' ? 'Manhã' : 'Tarde'}
                   </span>
                   <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg max-w-2xl">
                      {displayProgram.theme}
                   </h1>
                </div>
                <div className="flex gap-2">
                  {onUpdateProgram && !isEditing && isAdmin && (
                    <button onClick={() => setIsEditing(true)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all backdrop-blur-md border border-white/10"><Edit3 size={20}/></button>
                  )}
                  {isEditing && isAdmin && (
                    <button onClick={() => {onUpdateProgram && onUpdateProgram(editedProgram); setIsEditing(false);}} className="p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-lg transition-all"><Save size={20}/></button>
                  )}
                </div>
            </div>
            
            {/* Barra de Progresso */}
            <div className="space-y-2">
               <div className="bg-white/20 rounded-full h-1.5 w-full overflow-hidden relative backdrop-blur-sm">
                  <div className="absolute top-0 left-0 h-full bg-brand-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${progressStats.percentage}%` }}></div>
               </div>
               <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                     <Award size={14} className="text-brand-400" /> 
                     {progressStats.percentage === 100 ? <span className="text-brand-300">Completo!</span> : <span>Progresso: {progressStats.filled}/{progressStats.total}</span>}
                  </p>
                  <button onClick={handleCopyAllNotes} className="text-[10px] font-bold text-white hover:text-brand-200 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all backdrop-blur-sm border border-white/10">
                     {copiedAll ? <CheckCircle2 size={12}/> : <Copy size={12}/>} {copiedAll ? 'Copiado!' : 'Copiar Notas'}
                  </button>
               </div>
            </div>
         </div>
      </div>

      {displayProgram.days.length > 1 && (
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar px-1">{displayProgram.days.map((day, idx) => ( <button key={idx} onClick={() => { setCurrentDayIndex(idx); setActiveSession('morning'); }} className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border shadow-sm ${ safeDayIndex === idx ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800' }`}>{day.label}</button>))}</div>
      )}

      <div className="flex gap-4 mb-10">
         <button onClick={() => setActiveSession('morning')} className={`flex-1 relative overflow-hidden py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 border-2 ${ activeSession === 'morning' ? 'bg-amber-100 border-amber-300 shadow-lg scale-[1.02]' : 'bg-white border-slate-100 hover:border-amber-200' }`}>
            <Sun size={20} className={activeSession === 'morning' ? 'text-amber-600' : 'text-slate-300'} />
            <span className={`font-extrabold text-sm uppercase tracking-wide ${activeSession === 'morning' ? 'text-amber-800' : 'text-slate-400'}`}>Manhã</span>
         </button>
         <button onClick={() => setActiveSession('afternoon')} className={`flex-1 relative overflow-hidden py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 border-2 ${ activeSession === 'afternoon' ? 'bg-blue-100 border-blue-300 shadow-lg scale-[1.02]' : 'bg-white border-slate-100 hover:border-blue-200' }`}>
            <Moon size={20} className={activeSession === 'afternoon' ? 'text-blue-600' : 'text-slate-300'} />
            <span className={`font-extrabold text-sm uppercase tracking-wide ${activeSession === 'afternoon' ? 'text-blue-900' : 'text-slate-400'}`}>Tarde</span>
         </button>
      </div>

      {currentDay ? (
        <>
          {activeSession === 'morning' ? renderSession(currentDay.morning, safeDayIndex, 'morning') : renderSession(currentDay.afternoon, safeDayIndex, 'afternoon')}
          <div className="mt-10 mb-16 mx-2"><div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-1 shadow-2xl text-white animate-fade-in transform transition-all hover:scale-[1.02]"><div className="bg-white/10 backdrop-blur-lg rounded-[1.3rem] p-6 flex flex-col items-center justify-center gap-6 border border-white/10"><div className="flex items-center gap-2 opacity-80"><Users size={20} /><span className="text-xs font-bold uppercase tracking-[0.2em]">Assistência</span></div><div className="flex items-center gap-8"><button onClick={() => handleAttendanceBtn(-1)} className="p-4 bg-black/20 rounded-full hover:bg-black/30 active:scale-90 transition-all border border-white/10 hover:border-white/30"><MinusCircle size={32}/></button><div className="relative"><input type="number" inputMode="numeric" className="w-40 text-center bg-transparent text-6xl font-extrabold outline-none font-mono text-white placeholder-white/20 drop-shadow-xl" placeholder="0" value={attendance[attendanceKey] || ''} onChange={(e) => onAttendanceChange(attendanceKey, e.target.value)} /><p className="text-[10px] text-center opacity-60 font-bold uppercase mt-2 tracking-widest">Presentes</p></div><button onClick={() => handleAttendanceBtn(1)} className="p-4 bg-white/20 rounded-full hover:bg-white/30 active:scale-90 transition-all shadow-lg border border-white/30"><PlusCircle size={32}/></button></div></div></div></div>
          
          <div className="mb-10 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
             <div className="flex items-center gap-3 mb-4"><div className="bg-amber-100 text-amber-600 p-2 rounded-full"><Lightbulb size={24}/></div><h3 className="font-bold text-slate-800 text-lg">Caixa de Sugestões</h3></div>
             <p className="text-sm text-slate-500 mb-4">Tem algo a acrescentar ou melhorar? Envie sua ideia para a equipe.</p>
             <div className="relative"><textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:bg-white transition-all resize-none" rows={3} placeholder="Digite sua sugestão aqui..." value={suggestion} onChange={(e) => setSuggestion(e.target.value)} /><button onClick={handleSendSuggestion} disabled={!suggestion.trim() || suggestionSent} className={`absolute bottom-3 right-3 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${suggestionSent ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50'}`}>{suggestionSent ? <CheckCircle2 size={14}/> : <Send size={14}/>}{suggestionSent ? 'Enviado!' : 'Enviar'}</button></div>
          </div>

          {program.type === 'REGIONAL_CONVENTION' && activeSession === 'afternoon' && (
            <div className="mt-8 bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white"><h3 className="font-bold text-xl flex items-center gap-3"><HelpCircle size={24}/> Recapitulação do Dia</h3></div>
              <div className="p-6 space-y-8">{conventionDailyRecap.map((q, i) => (<div key={i}><p className="text-base font-bold text-slate-800 mb-3 flex gap-3"><span className="bg-emerald-100 text-emerald-700 w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 font-extrabold">{i+1}</span>{q}</p>{renderNoteBox(`daily_recap_${safeDayIndex}_${i}`, 'Sua resposta...', "120px", "bg-emerald-50/30")}</div>))}</div>
            </div>
          )}
        </>
      ) : ( <div className="p-12 text-center text-slate-400">Selecione um dia para ver o programa</div> )}

      {safeDayIndex === displayProgram.days.length - 1 && activeSession === 'afternoon' && displayProgram.recapQuestions && program.type !== 'REGIONAL_CONVENTION' && (
        <div className="mt-8 bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white"><h3 className="font-bold text-xl flex items-center gap-3"><HelpCircle size={24}/> Recapitulação Final</h3></div>
          <div className="p-6 space-y-8">{displayProgram.recapQuestions.map((q, i) => (<div key={i}><p className="text-base font-bold text-slate-800 mb-3 flex gap-3"><span className="bg-brand-100 text-brand-700 w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 font-extrabold">{i+1}</span>{q.question}</p>{renderNoteBox(`recap_${i}`, 'Sua resposta...', "100px", "bg-brand-50/20")}<p className="text-[10px] text-right text-slate-400 mt-2 italic font-medium">{q.reference}</p></div>))}</div>
        </div>
      )}
      
      <div className="space-y-6 mt-16">
          <div className="bg-white rounded-[2rem] shadow-sm border border-emerald-100 p-5 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all"><div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div><div className="bg-emerald-50 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><Heart size={24} className="text-emerald-600 fill-emerald-600"/></div><h3 className="font-bold text-slate-800 text-base mb-1">Donativos para a Obra Mundial</h3><p className="text-xs text-slate-500 mb-4 max-w-xs">Apoie os eventos e a obra mundial das Testemunhas de Jeová através do site oficial.</p><a href="https://donate.jw.org/pt/BRA/home" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">Acessar donate.jw.org <span className="text-emerald-200">↗</span></a></div>
          <div className="text-center px-2 pt-4 border-t border-slate-200/50"><p className="text-[9px] text-slate-400 mb-2 font-medium">Gostou do App? Contribua voluntariamente:</p><button onClick={handleCopyPix} className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-[9px] font-bold hover:bg-white hover:text-slate-700 transition-all shadow-sm w-full justify-center"><Copy size={10}/> {pixFeedback || "Copiar Chave Pix (App)"}</button></div>
      </div>

    </div>
  );
};