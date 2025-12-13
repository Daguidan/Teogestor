import React, { useState } from 'react';
import { User, Users, Lock, Key, CheckSquare, Eye, EyeOff, Loader2, BookOpen, AlertTriangle, Link as LinkIcon, X } from 'lucide-react';
import { APP_CONFIG } from '../constants';
import { AuthSession, UserRole } from '../types';
import { SecureStorage } from '../services/storage';
import { CloudService } from '../services/cloud';

interface AuthScreensProps {
  onLogin: (session: AuthSession) => void;
  availableEvents: string[];
  initialEventId: string;
  isDirectLink: boolean;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ onLogin, availableEvents, initialEventId, isDirectLink }) => {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [loginEventId, setLoginEventId] = useState(initialEventId);
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent, role: UserRole) => {
    e.preventDefault();
    setLoginError('');
    const eventIdInput = loginEventId.trim().toUpperCase();
    
    if (!eventIdInput) {
      setLoginError('Informe o ID do evento.');
      return;
    }

    if (role === 'admin') {
      if (eventIdInput === 'MASTER' && loginPin !== APP_CONFIG.MASTER_PIN) {
        setLoginError('Senha Mestra incorreta.');
        return;
      } else if (eventIdInput !== 'MASTER' && loginPin !== APP_CONFIG.ADMIN_PIN) {
        setLoginError('PIN incorreto.');
        return;
      }
    }

    setLoginLoading(true);
    
    // Tenta carregar dados da nuvem se for admin e não tiver dados locais
    if (role === 'admin') {
        try {
            const config = CloudService.getConfig();
            const conventionKey = `${eventIdInput}_CONVENTION_structure`;
            const assemblyKey = `${eventIdInput}_structure`;
            const localExists = SecureStorage.getItem(conventionKey, null) || SecureStorage.getItem(assemblyKey, null);
            
            if (config && !localExists) {
                CloudService.configure(config.url, config.key, config.encryptionPass || '');
                // O carregamento real dos dados será feito pelo App.tsx após o login
                await CloudService.testConnection(); 
            }
        } catch (e) {
            console.error("Erro pré-login", e);
        }
    }

    setLoginLoading(false);

    const newSession: AuthSession = {
      eventId: eventIdInput,
      role: role,
      timestamp: Date.now(),
      userName: loginName || (role === 'admin' ? 'Administrador' : 'Visitante'),
      isSuperAdmin: eventIdInput === 'MASTER'
    };

    onLogin(newSession);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-100/40 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in border border-white/60 relative z-10">
        <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-8 text-center text-white relative">
          <div className="mx-auto mb-3 drop-shadow-md inline-block p-2 bg-white/20 rounded-xl">
             <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">TeoGestor</h1>
          <p className="text-brand-50 text-xs mt-1 font-bold">Gestão Teocrática Inteligente</p>
        </div>

        <form onSubmit={(e) => handleLogin(e, 'public')} className="p-8 space-y-6">
          {isDirectLink ? (
            <div className="text-center pb-4">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Acessando Evento</p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-50 text-brand-700 rounded-full font-bold text-xl border border-brand-100">
                <LinkIcon size={20}/> {loginEventId}
              </div>
            </div>
          ) : (
            <div className="relative group">
              <User className="absolute left-4 top-4 text-slate-300" size={20} />
              <input 
                type="text" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 outline-none font-bold text-slate-800 uppercase text-lg" 
                placeholder="EVENTO (Ex: GO-003 A)" 
                value={loginEventId} 
                onChange={e => setLoginEventId(e.target.value)} 
                list="local-events"
              />
              <datalist id="local-events">
                {availableEvents.map(ev => <option key={ev} value={ev} />)}
              </datalist>
            </div>
          )}

          <div className="relative group">
            <Users className="absolute left-4 top-4 text-slate-300" size={20} />
            <input 
              type="text" 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 outline-none text-slate-800 font-semibold" 
              placeholder="Seu Nome (Opcional)" 
              value={loginName} 
              onChange={e => setLoginName(e.target.value)}
            />
          </div>

          {loginError && !showAdminModal && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 border border-red-100">
              <AlertTriangle size={18}/> {loginError}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl text-lg flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <BookOpen size={24}/> Entrar no Meu Espaço
          </button>
        </form>

        <div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-between items-center px-8">
          <span className="text-[10px] text-slate-300 font-bold tracking-widest">v{APP_CONFIG.APP_VERSION}</span>
          <button onClick={() => setShowAdminModal(true)} className="text-slate-300 hover:text-slate-500 p-2 transition-colors">
            <Lock size={16}/>
          </button>
        </div>
      </div>

      {/* MODAL ADMIN REDESIGN - Agora centralizado e bonito */}
      {showAdminModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-slate-900/30 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh] border border-white/50">
            
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <h2 className="text-xl font-bold flex items-center gap-2"><Lock size={20} className="text-brand-400"/> Acesso Restrito</h2>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Área Administrativa</p>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors relative z-10">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={(e) => handleLogin(e, 'admin')} className="p-6 space-y-5 overflow-y-auto">
              
              <div className="space-y-3">
                  {/* ID Evento */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                      <div className="flex items-center gap-3">
                          <div className="bg-white p-2.5 rounded-xl text-slate-400 shadow-sm border border-slate-100"><User size={18}/></div>
                          <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">ID do Evento</label>
                              <input 
                                className="w-full bg-transparent font-bold text-slate-800 outline-none uppercase placeholder-slate-300"
                                placeholder="EX: SP-012"
                                value={loginEventId}
                                onChange={e => setLoginEventId(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>

                  {/* Nome */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                      <div className="flex items-center gap-3">
                          <div className="bg-white p-2.5 rounded-xl text-slate-400 shadow-sm border border-slate-100"><Users size={18}/></div>
                          <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Seu Nome</label>
                              <input 
                                className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder-slate-300"
                                placeholder="Identificação"
                                value={loginName}
                                onChange={e => setLoginName(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>

                  {/* Senha */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                      <div className="flex items-center gap-3">
                          <div className="bg-white p-2.5 rounded-xl text-slate-400 shadow-sm border border-slate-100"><Key size={18}/></div>
                          <div className="flex-1 relative">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Senha de Acesso (PIN)</label>
                              <input 
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder-slate-300 tracking-widest text-lg"
                                placeholder="••••••"
                                value={loginPin}
                                onChange={e => setLoginPin(e.target.value)}
                              />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2">
                                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              {loginError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 border border-red-100 animate-bounce-in">
                    <AlertTriangle size={16} className="shrink-0"/> {loginError}
                  </div>
              )}

              <div className="pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white cursor-pointer hover:border-slate-200 transition-all group">
                    <div className="relative flex items-center mt-0.5">
                        <input type="checkbox" className="peer sr-only" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}/>
                        <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-slate-800 peer-checked:border-slate-800 bg-slate-50 transition-all"></div>
                        <CheckSquare size={12} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight select-none">
                        Li e concordo com a <span className="font-bold text-slate-700">Política de Privacidade</span>.
                    </span>
                  </label>
              </div>

              <button 
                disabled={!acceptedTerms || loginLoading} 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20}/>} 
                {loginLoading ? 'Verificando...' : 'Acessar Sistema'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};