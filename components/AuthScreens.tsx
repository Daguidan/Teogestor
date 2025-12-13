import React, { useState } from 'react';
import { User, Users, Lock, Key, ShieldCheck, CheckSquare, Eye, EyeOff, Loader2, BookOpen, AlertTriangle, Link as LinkIcon, X } from 'lucide-react';
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

      {/* MODAL ADMIN */}
      {showAdminModal && (
        <div className="absolute inset-0 bg-white z-20 flex flex-col animate-slide-up">
          <div className="bg-brand-900 p-8 text-white flex justify-between items-start">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold">Acesso Restrito</h2>
              <p className="text-brand-300 text-xs font-bold mt-1 uppercase">Gestão do Evento</p>
            </div>
            <button onClick={() => setShowAdminModal(false)} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors">
              <X size={20}/>
            </button>
          </div>

          <form onSubmit={(e) => handleLogin(e, 'admin')} className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="relative group">
              <User className="absolute left-4 top-4 text-slate-300" size={20} />
              <input 
                type="text" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-600 outline-none font-bold text-slate-800 uppercase" 
                placeholder="Ex: GO-003 A" 
                value={loginEventId} 
                onChange={e => setLoginEventId(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Users className="absolute left-4 top-4 text-slate-300" size={20} />
              <input 
                type="text" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-600 outline-none text-slate-800 font-medium" 
                placeholder="Seu Nome" 
                value={loginName} 
                onChange={e => setLoginName(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Key className="absolute left-4 top-4 text-slate-300" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-600 outline-none text-slate-800 font-bold tracking-widest text-lg" 
                placeholder="••••••••" 
                value={loginPin} 
                onChange={e => setLoginPin(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {loginError && (
                <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-3 border border-red-100">
                <AlertTriangle size={18}/> {loginError}
                </div>
            )}

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-3 mt-4">
              <div className="flex items-center gap-2 text-brand-800 font-bold border-b border-slate-200 pb-2 mb-2">
                <ShieldCheck size={16}/> Política de Uso & Privacidade
              </div>
              <p className="leading-relaxed text-[10px] text-justify text-slate-500">
                <strong>Atenção:</strong> Este não é um site oficial das Testemunhas de Jeová.
              </p>
              <label className="flex items-start gap-3 pt-3 border-t border-slate-200 cursor-pointer group">
                <input type="checkbox" className="peer sr-only" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}/>
                <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-brand-900 peer-checked:border-brand-900 flex items-center justify-center bg-white transition-colors">
                  <CheckSquare size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 group-hover:text-brand-900 select-none">
                  Li e concordo com a política de privacidade.
                </span>
              </label>
            </div>

            <button 
              disabled={!acceptedTerms || loginLoading} 
              type="submit" 
              className="w-full bg-brand-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loginLoading ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20}/>} 
              {loginLoading ? 'Conectando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};