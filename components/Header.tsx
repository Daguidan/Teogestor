import React from 'react';
import { Home, ArrowLeft, RefreshCw, Cloud, AlertTriangle, Wifi, CloudOff, Download, LogOut } from 'lucide-react';
import { AuthSession } from '../types';

interface HeaderProps {
  authSession: AuthSession;
  showPublicDashboard: boolean;
  onNavigateHome: () => void;
  onReturnToProvider?: () => void;
  onOpenCloud?: () => void;
  onSync?: () => void;
  onLogout: () => void;
  cloudUrl: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isMaster: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  authSession,
  showPublicDashboard,
  onNavigateHome,
  onReturnToProvider,
  onOpenCloud,
  onSync,
  onLogout,
  cloudUrl,
  syncStatus,
  isAdmin,
  isSuperAdmin,
  isMaster
}) => {
  return (
    <header className="fixed top-4 left-4 right-4 z-40 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl px-4 py-3 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-3">
        <button onClick={onNavigateHome} className="p-2.5 rounded-xl bg-slate-100/50 hover:bg-white text-slate-600 transition-all active:scale-95">
          <Home size={20} />
        </button>
        <div className="flex flex-col ml-1 pl-3 h-9 justify-center border-l border-slate-200/50">
          <h1 className="font-bold text-slate-800 text-base md:text-lg leading-tight truncate max-w-[140px] md:max-w-[300px]">
            {!showPublicDashboard ? authSession.eventId : 'Programação / Anotações'}
          </h1>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 leading-none flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
            {authSession.userName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {authSession.isTemplate ? (
          <button onClick={onReturnToProvider} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200 font-bold text-xs flex items-center gap-2">
            <ArrowLeft size={16} /> Voltar ao Painel
          </button>
        ) : (
          <>
            {(isAdmin || isSuperAdmin || isMaster) && (
              <button 
                onClick={isMaster || isSuperAdmin ? onOpenCloud : onSync} 
                disabled={!cloudUrl && !isMaster && !isSuperAdmin} 
                className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 shadow-sm relative active:scale-95 ${cloudUrl ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' : (isMaster || isSuperAdmin ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100 animate-pulse' : 'bg-transparent border-transparent opacity-0 pointer-events-none')}`} 
                title={isMaster || isSuperAdmin ? (cloudUrl ? 'Configurar Nuvem' : 'Conectar Nuvem') : 'Sincronizar'}
              >
                {cloudUrl ? (
                  <>
                    {syncStatus === 'syncing' && <RefreshCw size={20} className="animate-spin text-amber-500" />}
                    {syncStatus === 'success' && <Cloud size={20} className="text-emerald-500" />}
                    {syncStatus === 'error' && <AlertTriangle size={20} className="text-red-500" />}
                    {syncStatus === 'idle' && (isMaster || isSuperAdmin ? <Cloud size={20} className="text-slate-400" /> : <Wifi size={20} className="text-emerald-500" />)}
                    <span className="text-[10px] font-bold uppercase hidden sm:inline w-20 text-center">
                      {syncStatus === 'syncing' ? 'Salvando...' : syncStatus === 'success' ? 'Salvo' : syncStatus === 'error' ? 'Erro' : (isMaster || isSuperAdmin ? 'Nuvem' : 'Online')}
                    </span>
                  </>
                ) : (
                  (isMaster || isSuperAdmin) && (
                    <>
                      <CloudOff size={20} />
                      <span className="text-[10px] font-bold uppercase hidden sm:inline">Conectar</span>
                    </>
                  )
                )}
                {isMaster && (!cloudUrl || syncStatus === 'error') && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
              </button>
            )}
            
            {cloudUrl && (isAdmin || isSuperAdmin) && (
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 ml-1 hidden md:flex">
                <button 
                  title="Baixar dados da Nuvem (Download)" 
                  onClick={onSync} 
                  disabled={syncStatus === 'syncing'} 
                  className="p-2 rounded-lg bg-white text-blue-600 shadow-sm hover:bg-blue-50 transition-colors border border-slate-100 active:scale-95"
                >
                  <Download size={16}/>
                </button>
              </div>
            )}
            
            <button onClick={onLogout} className="ml-1 p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100 active:scale-95">
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
};