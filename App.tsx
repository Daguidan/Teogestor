import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AuthSession, 
  OrgStructure, 
  AssemblyProgram, 
  EventType, 
  UserRole,
  SuggestionEntry,
  VolunteerData,
  ProviderEventInfo
} from './types';
import { 
  APP_CONFIG, 
  INITIAL_STRUCTURE, 
  INITIAL_STRUCTURE_CONVENTION, 
  PROGRAM_BETHEL, 
  PROGRAM_CO, 
  PROGRAM_CONVENTION,
  TEMPLATE_EVENT_IDS
} from './constants';
import { SecureStorage } from './services/storage';
import { CloudService } from './services/cloud';
import { Organogram } from './components/Organogram';
import { Program } from './components/Program';
import { CleaningManagement } from './components/CleaningManagement';
import { AttendantManager } from './components/AttendantManager';
import { GeneralInfo } from './components/GeneralInfo';
import { Cover } from './components/Cover';
import { ParkingManagement } from './components/ParkingManagement';
import { SharingCenter } from './components/SharingCenter';
import { 
  User, 
  Lock, 
  Cloud, 
  Key, 
  Share2, 
  Layout, 
  Settings,
  AlertTriangle,
  ChevronDown,
  Smartphone,
  Home,
  Grid,
  Users,
  X,
  BookOpen,
  LogOut as LogoutIcon,
  PenTool,
  Link as LinkIcon,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  Heart,
  Copy,
  Eye,
  EyeOff,
  Briefcase,
  Car,
  UserCheck,
  Send,
  Sun,
  Moon,
  CheckCircle2,
  Megaphone,
  Phone,
  Server,
  Plus,
  ArrowLeft,
  RefreshCw,
  Download,
  Loader2,
  Database,
  Info,
  MapPin,
  Check,
  Building2,
  CloudOff,
  CopyPlus,
  Unplug,
  Wifi,
  ArrowRight
} from 'lucide-react';
import { DEFAULT_SECTORS } from './constants';

// --- HELPER FUNCTIONS ---

const normalizeString = (str: string): string => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').toLowerCase().trim();
};

const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, ''); 
};

const isOrgEmpty = (org: OrgStructure | null) => {
    if (!org) return true;
    const hasCommittee = org.committee && Object.values(org.committee).some(v => v !== null);
    const hasCongregations = org.generalInfo?.congregations && org.generalInfo.congregations.length > 0;
    return !hasCommittee && !hasCongregations;
};

const findDepartmentByName = (org: OrgStructure, deptName: string) => {
  const allDepts = [
    ...(org.aoDepartments || []),
    ...(org.aaoDepartments || []),
    ...(org.coordDepartments || []),
    ...(org.progDepartments || []),
    ...(org.roomDepartments || [])
  ];
  return allDepts.find(d => d.name === deptName);
};

// --- MAIN COMPONENT ---

export const App: React.FC = () => {
  // STATE
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  
  const isAdmin = useMemo(() => authSession?.role === 'admin', [authSession]);
  const isSuperAdmin = useMemo(() => authSession?.isSuperAdmin === true, [authSession]);
  const isMaster = useMemo(() => authSession?.eventId === 'MASTER', [authSession]);

  const [view, setView] = useState<'dashboard' | 'cover' | 'program' | 'organogram' | 'cleaning' | 'general_info' | 'attendants' | 'parking' | 'sharing'>('dashboard');
  
  const [program, setProgram] = useState<AssemblyProgram>(PROGRAM_BETHEL);
  const [orgData, setOrgData] = useState<OrgStructure>(INITIAL_STRUCTURE);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [loginEventId, setLoginEventId] = useState('');
  const [loginName, setLoginName] = useState(''); 
  const [loginPin, setLoginPin] = useState('');
  const [isDirectLink, setIsDirectLink] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCloudPass, setShowCloudPass] = useState(false);
  
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  
  const [isRepairingSession, setIsRepairingSession] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);

  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudUrl, setCloudUrl] = useState('');
  const [cloudKey, setCloudKey] = useState('');
  const [cloudPass, setCloudPass] = useState('');
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  
  const [providerEventList, setProviderEventList] = useState<ProviderEventInfo[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState('');
  
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [providerNewEventId, setProviderNewEventId] = useState('');
  const [providerNewEventType, setProviderNewEventType] = useState<EventType>('BETHEL_REP');
  
  const [duplicateTargetId, setDuplicateTargetId] = useState('');
  const [duplicateTargetType, setDuplicateTargetType] = useState<EventType>('CIRCUIT_OVERSEER');
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [pixFeedback, setPixFeedback] = useState('');
  const [toastMessage, setToastMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportValue, setReportValue] = useState('');
  const [reportSectorId, setReportSectorId] = useState('');
  const [reportPeriod, setReportPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [reportSent, setReportSent] = useState(false);
  
  const [showOrganogramPinModal, setShowOrganogramPinModal] = useState(false);
  const [organogramPinInput, setOrganogramPinInput] = useState('');
  const [organogramPinError, setOrganogramPinError] = useState('');
  
  const [selectedUserCongId, setSelectedUserCongId] = useState(() => SecureStorage.getItem('user_congregation_id', ''));

  const [isDisambiguationRequired, setIsDisambiguationRequired] = useState(false);
  const [disambiguationPhoneInput, setDisambiguationPhoneInput] = useState('');
  const [confirmedVolunteer, setConfirmedVolunteer] = useState<VolunteerData | null>(null);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
      setToastMessage({ type, text });
      setTimeout(() => setToastMessage(null), 4000);
  };

  const getSqlScript = () => {
      return `-- 1. Cria a tabela 'evento' (se não existir)
create table if not exists evento (
  id text primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  data jsonb
);

-- 2. Habilita segurança (RLS)
alter table evento enable row level security;

-- 3. Limpa políticas antigas para evitar conflitos
drop policy if exists "Acesso Publico" on evento;
drop policy if exists "Public Access" on evento;
drop policy if exists "Allow Public Access" on evento;

-- 4. Cria política de acesso total (Leitura/Escrita)
create policy "Acesso Publico" on evento for all using (true) with check (true);`;
  };

  const processCloudData = (eventId: string, cloudData: any) => {
      if (!cloudData) return;
      const params = new URLSearchParams(window.location.search);
      const urlType = params.get('type') as EventType | null;

      if (urlType) {
          setSelectedEventType(urlType);
          SecureStorage.setItem(`${eventId}_last_event_type`, urlType);
          if (urlType === 'BETHEL_REP') setProgram(PROGRAM_BETHEL);
          else if (urlType === 'CIRCUIT_OVERSEER') setProgram(PROGRAM_CO);
          else if (urlType === 'REGIONAL_CONVENTION') setProgram(PROGRAM_CONVENTION);
      } else {
          if (cloudData.type) {
              const type = cloudData.type as EventType;
              setSelectedEventType(type);
              SecureStorage.setItem(`${eventId}_last_event_type`, type);
          }
          if (cloudData.program) {
              setProgram(cloudData.program as AssemblyProgram);
              SecureStorage.setItem(`${eventId}_program_${cloudData.program.type}`, cloudData.program);
          }
      }

      if (cloudData.org) {
          const isConvention = (urlType || cloudData.type) === 'REGIONAL_CONVENTION';
          const structKey = isConvention ? `${eventId}_CONVENTION_structure` : `${eventId}_structure`;
          SecureStorage.setItem(structKey, cloudData.org);
          setOrgData(cloudData.org);
      }

      if (cloudData.notes) { setNotes(cloudData.notes); SecureStorage.setItem(`${eventId}_notes`, cloudData.notes); }
      if (cloudData.attendance) { setAttendance(cloudData.attendance); SecureStorage.setItem(`${eventId}_attendance`, cloudData.attendance); }
  };

  const handleOpenCloudModal = () => {
      setEventsError('');
      const config = CloudService.getConfig();
      if (config) {
          setCloudUrl(config.url);
          setCloudKey(config.key);
          setCloudPass(config.encryptionPass || '');
      }
      setShowCloudModal(true);
  };

  const handleDisconnectCloud = () => {
      if(confirm('Tem certeza que deseja desconectar?')) {
          CloudService.disconnect();
          setCloudUrl(''); setCloudKey(''); setCloudPass('');
          setShowCloudModal(false);
          showToast('Nuvem desconectada.', 'success');
      }
  };
  
  const handleQuickReconnect = async () => {
      setEventsError('');
      setIsLoadingEvents(true);
      const config = CloudService.getConfig();
      if (config) {
          CloudService.configure(config.url, config.key, config.encryptionPass || '');
          const res = await CloudService.testConnection();
          if (res.success) {
              showToast('Reconectado com sucesso!', 'success');
              if (authSession?.isSuperAdmin) fetchProviderEvents();
          } else {
              setEventsError(res.error || 'Falha ao reconectar.');
          }
      } else {
          setEventsError('Configurações perdidas. Reconfigure.');
      }
      setIsLoadingEvents(false);
  };

  useEffect(() => {
    if (!cloudUrl || !cloudKey || !authSession || (authSession.role !== 'admin' && !authSession.isSuperAdmin) || !dataLoaded) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSyncStatus('syncing');

    autoSaveTimerRef.current = setTimeout(async () => {
       const payload = { org: orgData, notes: authSession.isTemplate ? {} : notes, attendance: authSession.isTemplate ? {} : attendance, program, type: selectedEventType, version: APP_CONFIG.APP_VERSION };
       const res = await CloudService.saveEvent(authSession.eventId, payload);
       if (res.error) { setSyncStatus('error'); console.error("Auto-save failed:", res.error); } 
       else { setSyncStatus('success'); }
    }, 3000);

    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [orgData, program, notes, attendance, cloudUrl, cloudKey, authSession, selectedEventType, dataLoaded]);

  const preLoadEventData = async (eventId: string) => {
    if (CloudService.getConfig()) {
        try {
            const res = await CloudService.loadEvent(eventId);
            if (res.data) processCloudData(eventId, res.data);
        } catch (e) { console.error("Pre-load failed", e); }
    }
  };

  useEffect(() => {
    const handleRedirect = async () => {
      const path = window.location.pathname;
      if (path.startsWith('/ir/')) {
        setIsInitializing(true);
        try {
            const segments = path.split('/'); 
            let eventId = segments[2] ? decodeURIComponent(segments[2]).trim() : '';
            if (eventId) {
              eventId = eventId.toUpperCase();
              setLoginEventId(eventId);
              setIsDirectLink(true);

              const params = new URLSearchParams(window.location.search);
              let tokenParam = '';
              const urlType = params.get('type') as EventType | null;

              if (window.location.hash && window.location.hash.includes('token=')) {
                 const hashStr = window.location.hash.substring(1); 
                 const hashParams = new URLSearchParams(hashStr);
                 tokenParam = hashParams.get('token') || '';
                 if (!tokenParam && hashStr.includes('token=')) {
                     const parts = hashStr.split('token=');
                     if (parts.length > 1) tokenParam = parts[1].split('&')[0];
                 }
              }
              if (!tokenParam) tokenParam = params.get('token') || '';

              if (urlType) { setSelectedEventType(urlType); SecureStorage.setItem(`${eventId}_last_event_type`, urlType); }

              let configConfigured = false;
              if (tokenParam) {
                 try {
                    const base64 = decodeURIComponent(tokenParam);
                    const binaryStr = atob(base64);
                    const jsonStr = decodeURIComponent(escape(binaryStr));
                    const config = JSON.parse(jsonStr);
                    if (config.cId && config.cKey) {
                       const finalUrl = config.cId.includes('http') ? config.cId : `https://${config.cId}.supabase.co`;
                       setCloudUrl(finalUrl); setCloudKey(config.cKey); setCloudPass(config.cPass || '');
                       CloudService.configure(finalUrl, config.cKey, config.cPass || ''); 
                       configConfigured = true;
                       await preLoadEventData(eventId);
                    }
                 } catch (e) { console.error("Error parsing token", e); }
              }
              if (!configConfigured) {
                 const savedConfig = CloudService.getConfig();
                 if (savedConfig) {
                    setCloudUrl(savedConfig.url); setCloudKey(savedConfig.key); setCloudPass(savedConfig.encryptionPass || '');
                    CloudService.init(); await preLoadEventData(eventId);
                 }
              }
              window.history.replaceState({}, '', '/');
            }
        } catch (error) { console.error("Redirect error", error); } finally { setIsInitializing(false); }
      }
    };
    handleRedirect();
  }, []);

  const handleLogout = () => {
    setAuthSession(null); setOrgData(INITIAL_STRUCTURE); setProgram(PROGRAM_BETHEL); setNotes({}); setAttendance({});
    setLoginPin(''); setLoginError(''); setShowTypeSelection(false); setSelectedEventType(null); setShowAdminModal(false); 
    setAcceptedTerms(false); setConfirmedVolunteer(null); setIsDisambiguationRequired(false); setSelectedUserCongId('');
    setView('dashboard'); setDataLoaded(false); 
    SecureStorage.setItem('active_session', null); SecureStorage.setItem('user_congregation_id', '');
    const params = new URLSearchParams(window.location.search);
    const publicId = params.get('id') || params.get('event');
    if (publicId) { setLoginEventId(publicId); setIsDirectLink(true); } else { setLoginEventId(''); setIsDirectLink(false); }
  };

  const fetchProviderEvents = async () => {
    if (!CloudService.getConfig()) return;
    setIsLoadingEvents(true); setEventsError('');
    const result = await CloudService.listAllEvents();
    if (result.data) setProviderEventList(result.data);
    else setEventsError(result.error || 'Erro desconhecido');
    setIsLoadingEvents(false);
  };

  useEffect(() => { if (authSession?.isSuperAdmin) fetchProviderEvents(); }, [authSession?.isSuperAdmin]);

  useEffect(() => {
    let activeSession = SecureStorage.getItem<AuthSession | null>('active_session', null);
    if (activeSession) {
      if (activeSession.eventId === 'MASTER' && !activeSession.isSuperAdmin) { activeSession.isSuperAdmin = true; activeSession.role = 'admin'; SecureStorage.setItem('active_session', activeSession); }
      const isLegacySession = activeSession.role !== 'public' && !activeSession.isSuperAdmin && !activeSession.managementType;
      if (isLegacySession) { setIsRepairingSession(true); setAuthSession(activeSession); return; }
      
      const isValid = (Date.now() - activeSession.timestamp) < (7 * 24 * 60 * 60 * 1000);
      if (isValid) {
        setAuthSession(activeSession);
        if (activeSession.role !== 'public' && !activeSession.isTemplate) {
          const lastType = SecureStorage.getItem<EventType | null>(`${activeSession.eventId}_last_event_type`, null);
          if (lastType) setSelectedEventType(lastType);
          else { if (activeSession.managementType === 'CONVENTION') setSelectedEventType('REGIONAL_CONVENTION'); else if (activeSession.managementType === 'ASSEMBLY') setShowTypeSelection(true); }
        }
      } else { handleLogout(); }
    }
    const savedConfig = CloudService.getConfig();
    if (savedConfig) { setCloudUrl(savedConfig.url); setCloudKey(savedConfig.key); setCloudPass(savedConfig.encryptionPass || ''); CloudService.init(); }
    setAvailableEvents(SecureStorage.listLocalEvents());
  }, []);

  useEffect(() => {
    const loadDataForSession = async () => {
      let eventKey = authSession ? authSession.eventId : loginEventId;
      if (!eventKey) return;
      let eventTypeForLoading = selectedEventType;
      
      if (!eventTypeForLoading && (authSession?.role === 'public' || isDirectLink)) {
         eventTypeForLoading = SecureStorage.getItem<EventType | null>(`${eventKey}_last_event_type`, null);
         if (eventTypeForLoading) setSelectedEventType(eventTypeForLoading);
         else if (CloudService.getConfig()) {
             const cloudData = await CloudService.loadEvent(eventKey);
             if (cloudData.data?.type) { eventTypeForLoading = cloudData.data.type as EventType; SecureStorage.setItem(`${eventKey}_last_event_type`, eventTypeForLoading); setSelectedEventType(eventTypeForLoading); }
         }
      }
      
      if (!authSession && !isDirectLink) return;
      if (showTypeSelection && authSession?.managementType === 'ASSEMBLY') return;
      if (isRepairingSession) return;
      const isTemplateEdit = authSession?.isTemplate;
      if (!isTemplateEdit && !eventTypeForLoading && authSession?.role !== 'public' && !authSession?.isSuperAdmin && !isDirectLink) return;

      if (!isOrgEmpty(orgData)) { setDataLoaded(true); return; }

      let baseProgram = PROGRAM_BETHEL;
      let isConventionType = eventTypeForLoading === 'REGIONAL_CONVENTION' || authSession?.managementType === 'CONVENTION';
      const correctStructKey = isConventionType ? `${eventKey}_CONVENTION_structure` : `${eventKey}_structure`;
      let loadedOrg = SecureStorage.getItem<OrgStructure | null>(correctStructKey, null);

      if (isOrgEmpty(loadedOrg)) {
          const altKey = !isConventionType ? `${eventKey}_CONVENTION_structure` : `${eventKey}_structure`;
          const altOrg = SecureStorage.getItem<OrgStructure | null>(altKey, null);
          if (!isOrgEmpty(altOrg)) {
              loadedOrg = altOrg;
              const realType = !isConventionType ? 'REGIONAL_CONVENTION' : 'BETHEL_REP';
              setSelectedEventType(realType);
              isConventionType = !isConventionType;
              if (authSession?.role === 'public') SecureStorage.setItem(`${eventKey}_last_event_type`, realType);
          }
      }

      if (isOrgEmpty(loadedOrg) && (authSession?.role === 'public' || isDirectLink)) {
         const variations = [eventKey.replace(/ /g, '-'), eventKey.replace(/-/g, ' '), eventKey.trim()];
         for (const variant of variations) {
             if (variant === eventKey) continue;
             let attempt = SecureStorage.getItem<OrgStructure | null>(`${variant}_structure`, null);
             if (!isOrgEmpty(attempt)) { loadedOrg = attempt; eventKey = variant; if (authSession) { authSession.eventId = variant; SecureStorage.setItem('active_session', authSession); } if (isConventionType) { setSelectedEventType('BETHEL_REP'); isConventionType = false; } break; }
             attempt = SecureStorage.getItem<OrgStructure | null>(`${variant}_CONVENTION_structure`, null);
             if (!isOrgEmpty(attempt)) { loadedOrg = attempt; eventKey = variant; if (authSession) { authSession.eventId = variant; SecureStorage.setItem('active_session', authSession); } setSelectedEventType('REGIONAL_CONVENTION'); isConventionType = true; break; }
         }
      }

      let loadedProgram: AssemblyProgram | null = eventTypeForLoading ? SecureStorage.getItem<AssemblyProgram | null>(`${eventKey}_program_${eventTypeForLoading}`, null) : null;

      if (isOrgEmpty(loadedOrg) && CloudService.getConfig()) {
          try {
              const cloudRes = await CloudService.loadEvent(eventKey);
              if (cloudRes.data) {
                  if (cloudRes.data.org) loadedOrg = cloudRes.data.org;
                  if (cloudRes.data.program) loadedProgram = cloudRes.data.program;
                  if (cloudRes.data.type) {
                      const cloudType = cloudRes.data.type as EventType;
                      setSelectedEventType(cloudType);
                      isConventionType = cloudType === 'REGIONAL_CONVENTION';
                      SecureStorage.setItem(`${eventKey}_last_event_type`, cloudType);
                  }
                  if(loadedOrg) SecureStorage.setItem(isConventionType ? `${eventKey}_CONVENTION_structure` : `${eventKey}_structure`, loadedOrg);
                  if(loadedProgram && cloudRes.data.type) SecureStorage.setItem(`${eventKey}_program_${cloudRes.data.type}`, loadedProgram);
              }
          } catch (e) { console.error("Cloud rescue failed", e); }
      }

      if(eventTypeForLoading) {
        switch (eventTypeForLoading) { case 'CIRCUIT_OVERSEER': baseProgram = PROGRAM_CO; break; case 'REGIONAL_CONVENTION': baseProgram = PROGRAM_CONVENTION; break; default: baseProgram = PROGRAM_BETHEL; break; }
      }
      
      const baseStructure = isConventionType ? INITIAL_STRUCTURE_CONVENTION : INITIAL_STRUCTURE;
      let finalOrgData: OrgStructure;
      
      if (loadedOrg) {
        const mergeWithDefaults = (data: any, defaults: any): any => {
          if (typeof defaults !== 'object' || defaults === null) return data;
          let result = { ...data };
          for (const key in defaults) { if (!(key in result) || result[key] === undefined) { result[key] = defaults[key]; } else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) { result[key] = mergeWithDefaults(result[key], defaults[key]); } }
          return result;
        };
        finalOrgData = mergeWithDefaults(loadedOrg, baseStructure);
      } else { finalOrgData = JSON.parse(JSON.stringify(baseStructure)); }
      
      if (finalOrgData) {
        const isConventionData = finalOrgData.coordDepartments !== undefined; 
        if (isConventionData) {
            if (!finalOrgData.coordDepartments || finalOrgData.coordDepartments.length === 0) finalOrgData.coordDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE_CONVENTION.coordDepartments));
            if (!finalOrgData.progDepartments || finalOrgData.progDepartments.length === 0) finalOrgData.progDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE_CONVENTION.progDepartments));
            if (!finalOrgData.roomDepartments || finalOrgData.roomDepartments.length === 0) finalOrgData.roomDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE_CONVENTION.roomDepartments));
        } else {
            if (!finalOrgData.aoDepartments || finalOrgData.aoDepartments.length === 0) finalOrgData.aoDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE.aoDepartments));
            if (!finalOrgData.aaoDepartments || finalOrgData.aaoDepartments.length === 0) finalOrgData.aaoDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE.aaoDepartments));
        }
      }
      
      if (JSON.stringify(finalOrgData) !== JSON.stringify(loadedOrg)) SecureStorage.setItem(correctStructKey, finalOrgData);
      setOrgData(finalOrgData);
      setProgram((loadedProgram || baseProgram) as AssemblyProgram);
      
      if (authSession && !authSession.isTemplate) {
        const savedNotes = SecureStorage.getItem<Record<string, string>>(`${eventKey}_notes`, {});
        const savedAttendance = SecureStorage.getItem<Record<string, string>>(`${eventKey}_attendance`, {});
        setNotes(savedNotes); setAttendance(savedAttendance);
      }
      setDataLoaded(true);
    };
    loadDataForSession();
  }, [authSession, selectedEventType, showTypeSelection, isDirectLink, loginEventId, isRepairingSession]);

  const handleUpdateOrg = (newOrg: OrgStructure) => {
    setOrgData(newOrg);
    if (authSession) {
      const isConvention = selectedEventType === 'REGIONAL_CONVENTION' || authSession.managementType === 'CONVENTION';
      const key = isConvention ? `${authSession.eventId}_CONVENTION_structure` : `${authSession.eventId}_structure`;
      SecureStorage.setItem(key, newOrg);
    }
  };

  const handleUpdateAttendant = (sId: string, f: string, v: any) => {
      const cAtt = orgData.attendantsData || [];
      const idx = cAtt.findIndex(a => a.sectorId === sId);
      const nData = [...cAtt];
      if (idx !== -1) nData[idx] = { ...nData[idx], [f]: v };
      else nData.push({ sectorId: sId, countMorning: 0, countAfternoon: 0, [f]: v } as any);
      handleUpdateOrg({ ...orgData, attendantsData: nData });
  };

  const handleReportAttendance = () => {
      if (!reportValue) return;
      handleUpdateAttendant(reportSectorId, reportPeriod === 'morning' ? 'countMorning' : 'countAfternoon', parseInt(reportValue) || 0);
      setReportSent(true); setTimeout(() => { setReportSent(false); setShowReportModal(false); setReportValue(''); }, 1500);
  };

  const handleAddSuggestion = (text: string) => {
     const newS: SuggestionEntry = { id: Date.now().toString(), text, date: new Date().toLocaleString(), isRead: false };
     const nData = { ...orgData };
     if (!nData.generalInfo) nData.generalInfo = { reminders: '', congregations: [], suggestions: [] };
     if (!nData.generalInfo.suggestions) nData.generalInfo.suggestions = [];
     nData.generalInfo.suggestions.unshift(newS);
     handleUpdateOrg(nData);
  };

  const handleUpdateNotes = (id: string, text: string) => {
      const n = { ...notes, [id]: text }; setNotes(n);
      if (authSession) SecureStorage.setItem(`${authSession.eventId}_notes`, n);
  };

  const handleUpdateAttendance = (id: string, val: string) => {
      const a = { ...attendance, [id]: val }; setAttendance(a);
      if (authSession) SecureStorage.setItem(`${authSession.eventId}_attendance`, a);
  };

  const handleUpdateProgram = (nP: AssemblyProgram) => {
      if(!nP) return; setProgram(nP);
      if (authSession) SecureStorage.setItem(`${authSession.eventId}_program_${program.type}`, nP);
  };
  
  const handleResetEventConfig = (newType: EventType) => {
      let newProg = PROGRAM_BETHEL;
      if (newType === 'CIRCUIT_OVERSEER') newProg = PROGRAM_CO;
      if (newType === 'REGIONAL_CONVENTION') newProg = PROGRAM_CONVENTION;
      setProgram(newProg); setSelectedEventType(newType);
      if (authSession) { SecureStorage.setItem(`${authSession.eventId}_last_event_type`, newType); SecureStorage.setItem(`${authSession.eventId}_program_${newType}`, newProg); }
      showToast('Programa redefinido para o padrão correto!', 'success');
  };

  const handleCloudConfigSave = async () => { 
      if (!cloudUrl || !cloudKey || !cloudPass) { showToast("Preencha URL, API Key e a Senha.", 'error'); return; }
      setIsTestingCloud(true);
      if (CloudService.configure(cloudUrl, cloudKey, cloudPass)) { 
          const result = await CloudService.testConnection();
          setIsTestingCloud(false);
          if (result.success) {
              setShowCloudModal(false); setSyncStatus('idle'); setEventsError('');
              showToast("✅ Conexão estabelecida!", 'success');
              if (authSession?.isSuperAdmin) fetchProviderEvents();
          } else {
              const errorMsg = result.error || 'Erro desconhecido';
              showToast(`⚠️ ${errorMsg}`, 'error');
              if (errorMsg.includes('tabela') || errorMsg.includes('42P01') || errorMsg.includes('row level security')) setShowSqlHelp(true);
          }
      } else { setIsTestingCloud(false); showToast("Erro ao salvar configuração local.", 'error'); }
  };
  
  const handleSync = async (direction: 'up' | 'down') => {
    if (!authSession) return; 
    setSyncStatus('syncing'); 
    CloudService.configure(cloudUrl, cloudKey, cloudPass);
    if (direction === 'up') {
       const payload = { org: orgData, notes: authSession.isTemplate ? {} : notes, attendance: authSession.isTemplate ? {} : attendance, program, type: selectedEventType, version: APP_CONFIG.APP_VERSION };
       const res = await CloudService.saveEvent(authSession.eventId, payload);
       if (res.error) { showToast(`Erro ao enviar: ${res.error}`, 'error'); setSyncStatus('error'); } else { showToast('Dados salvos na nuvem!', 'success'); setSyncStatus('success'); }
    } else {
       const res = await CloudService.loadEvent(authSession.eventId);
       if (res.error) { showToast(`Erro ao baixar: ${res.error}`, 'error'); setSyncStatus('error'); } 
       else if (res.data) {
          if (res.data.type) setSelectedEventType(res.data.type as EventType);
          if (res.data.org) handleUpdateOrg(res.data.org);
          if (res.data.program) handleUpdateProgram(res.data.program);
          if (!authSession.isTemplate) {
            if (res.data.notes) { setNotes(res.data.notes); SecureStorage.setItem(`${authSession.eventId}_notes`, res.data.notes); }
            if (res.data.attendance) { setAttendance(res.data.attendance); SecureStorage.setItem(`${authSession.eventId}_attendance`, res.data.attendance); }
          }
          setSyncStatus('success'); showToast('Dados atualizados da nuvem!', 'success'); setTimeout(() => window.location.reload(), 1500);
       } else { showToast("Nenhum dado encontrado na nuvem.", 'error'); setSyncStatus('idle'); }
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleGenerateInvite = (targetId: string, type: 'provider' | 'admin' | 'public', eventType?: EventType) => {
    if (!cloudUrl || !cloudKey) { alert("⚠️ CONECTE A NUVEM PRIMEIRO!"); return; }
    const baseUrl = window.location.origin;
    const tokenConfig = { cId: cloudUrl.replace('https://', '').replace('.supabase.co', ''), cKey: cloudKey, cPass: cloudPass };
    const json = JSON.stringify(tokenConfig);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const token = encodeURIComponent(base64);
    
    let shortUrl = `${baseUrl}/ir/${encodeURIComponent(targetId)}`;
    if (eventType) shortUrl += `?type=${eventType}`;
    shortUrl += `#token=${token}`;

    let text = type === 'admin' ? `🚀 *Convite Equipe*\n1. Acesse: ${shortUrl}\n2. Use o PIN 🔒: ${orgData.generalInfo?.volunteerAccessPin || APP_CONFIG.VOLUNTEER_PIN}` : `👋 *Programa Digital*\n${shortUrl}`;
    if (type === 'provider') text = `🔐 *Convite Admin*\nID: ${targetId}\nLink: ${shortUrl}`;
    navigator.clipboard.writeText(text); setCopyFeedback('Copiado!'); setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleCreateEventAndGenerateLink = async () => {
    if (!providerNewEventId) { alert("Insira um ID."); return; }
    setIsCreatingEvent(true); setCopyFeedback('Criando...');
    try {
      const newEventId = providerNewEventId.trim().toUpperCase();
      const existingEvent = await CloudService.loadEvent(newEventId);
      if (existingEvent.data) {
        if (!confirm(`O evento "${newEventId}" já existe. Gerar novo link?`)) { setIsCreatingEvent(false); setCopyFeedback(''); return; }
        handleGenerateInvite(newEventId, 'provider', providerNewEventType); return;
      }
      let templateId = providerNewEventType === 'REGIONAL_CONVENTION' ? TEMPLATE_EVENT_IDS.CONVENTION_REGIONAL : (providerNewEventType === 'CIRCUIT_OVERSEER' ? TEMPLATE_EVENT_IDS.ASSEMBLY_CO : TEMPLATE_EVENT_IDS.ASSEMBLY_BETHEL);
      const templateRes = await CloudService.loadEvent(templateId);
      if(!templateRes.data) { alert("Modelo base não encontrado."); setIsCreatingEvent(false); setCopyFeedback(''); return; }
      const saveRes = await CloudService.saveEvent(newEventId, templateRes.data);
      if (saveRes.error) throw new Error(saveRes.error);
      handleGenerateInvite(newEventId, 'provider', providerNewEventType);
    } catch (error) { alert(`Falha: ${error instanceof Error ? error.message : 'Erro'}`); setCopyFeedback('Erro.'); } finally { setIsCreatingEvent(false); setTimeout(() => setCopyFeedback(''), 4000); }
  };

  const handleDuplicateCurrentEvent = async () => {
      if (!duplicateTargetId || duplicateTargetId === authSession?.eventId) { alert("Insira um ID válido e diferente."); return; }
      setIsDuplicating(true); setCopyFeedback("Criando...");
      try {
          let newProgram = PROGRAM_BETHEL;
          if (duplicateTargetType === 'CIRCUIT_OVERSEER') newProgram = PROGRAM_CO;
          if (duplicateTargetType === 'REGIONAL_CONVENTION') newProgram = PROGRAM_CONVENTION;
          const newPayload = { org: orgData, program: newProgram, notes: {}, attendance: {}, type: duplicateTargetType, version: APP_CONFIG.APP_VERSION };
          const saveRes = await CloudService.saveEvent(duplicateTargetId.toUpperCase(), newPayload);
          if (saveRes.error) throw new Error(saveRes.error);
          if (confirm(`Sucesso! Evento "${duplicateTargetId}" criado. Sair e acessar?`)) { handleLogout(); setLoginEventId(duplicateTargetId.toUpperCase()); } else { setDuplicateTargetId(''); }
      } catch (error) { alert(`Erro: ${error instanceof Error ? error.message : 'Erro'}`); } finally { setIsDuplicating(false); setCopyFeedback(""); }
  };

  const handleCopyPix = () => { navigator.clipboard.writeText("apoio@teogestor.app"); setPixFeedback('Chave Copiada!'); setTimeout(() => setPixFeedback(''), 2000); };
  
  const isPublic = useMemo(() => authSession?.role === 'public', [authSession]);
  const isConfirmedAttendantOverseer = useMemo(() => {
    if (authSession?.role !== 'public' || !confirmedVolunteer || !orgData) return false;
    const overseer = findDepartmentByName(orgData, 'Indicadores')?.overseer;
    return !!(overseer && normalizeString(overseer.name) === normalizeString(confirmedVolunteer.name));
  }, [authSession, confirmedVolunteer, orgData]);
  const isConfirmedParkingOverseer = useMemo(() => {
    if (authSession?.role !== 'public' || !confirmedVolunteer || !orgData) return false;
    const overseer = findDepartmentByName(orgData, 'Estacionamento')?.overseer;
    return !!(overseer && normalizeString(overseer.name) === normalizeString(confirmedVolunteer.name));
  }, [authSession, confirmedVolunteer, orgData]);
  const isAttendantOverseer = authSession?.departmentAccess === 'attendants' || isConfirmedAttendantOverseer;
  const isParkingOverseer = authSession?.departmentAccess === 'parking' || isConfirmedParkingOverseer;
  const showPublicDashboard = isPublic && !isAttendantOverseer && !isParkingOverseer;
  const myOverseerDepartments = useMemo(() => {
      if (!confirmedVolunteer) return [];
      const depts: string[] = [];
      const normalizedPhone = normalizePhone(confirmedVolunteer.phone);
      const checkDept = (list: any[]) => { list.forEach(d => { if (d.overseer && normalizePhone(d.overseer.phone) === normalizedPhone) depts.push(d.name); }); };
      checkDept(orgData.aoDepartments || []); checkDept(orgData.aaoDepartments || []); checkDept(orgData.coordDepartments || []); checkDept(orgData.progDepartments || []); checkDept(orgData.roomDepartments || []);
      return depts;
  }, [confirmedVolunteer, orgData]);
  const hasOverseerPrivileges = myOverseerDepartments.length > 0;
  const unreadSuggestionsCount = useMemo(() => orgData.generalInfo?.suggestions?.length || 0, [orgData.generalInfo?.suggestions]);

  const handleLogin = async (e: React.FormEvent, role: UserRole) => {
    e.preventDefault(); setLoginError('');
    const eventIdInput = loginEventId.trim().toUpperCase();
    if (!eventIdInput) { setLoginError('Informe o ID.'); return; }
    if (role === 'admin') {
      if (eventIdInput === 'MASTER' && loginPin !== APP_CONFIG.MASTER_PIN) { setLoginError('Senha Mestra incorreta.'); return; }
      else if (eventIdInput !== 'MASTER' && loginPin !== APP_CONFIG.ADMIN_PIN) { setLoginError('PIN incorreto.'); return; }
    }
    setLoginLoading(true);
    try {
        if (role === 'admin') {
            const config = CloudService.getConfig();
            const conventionKey = `${eventIdInput}_CONVENTION_structure`;
            const assemblyKey = `${eventIdInput}_structure`;
            const localExists = SecureStorage.getItem(conventionKey, null) || SecureStorage.getItem(assemblyKey, null);
            if (config && !localExists) {
                CloudService.configure(config.url, config.key, config.encryptionPass || '');
                const cloudRes = await CloudService.loadEvent(eventIdInput);
                if (cloudRes.data) processCloudData(eventIdInput, cloudRes.data);
            }
        }
    } catch (e) { console.error("Erro login", e); } finally { setLoginLoading(false); }
    const newSession: AuthSession = { eventId: eventIdInput, role: role, timestamp: Date.now(), userName: loginName || (role === 'admin' ? 'Administrador' : 'Visitante'), isSuperAdmin: eventIdInput === 'MASTER' };
    setAuthSession(newSession); SecureStorage.setItem('active_session', newSession); setShowAdminModal(false); setLoginPin(''); setLoginError('');
  };

  const handleRepairSession = (type: 'ASSEMBLY' | 'CONVENTION') => {
    if (!authSession) return;
    const repairedSession = { ...authSession, managementType: type };
    setAuthSession(repairedSession); SecureStorage.setItem('active_session', repairedSession); setIsRepairingSession(false);
    if (type === 'CONVENTION') setSelectedEventType('REGIONAL_CONVENTION'); else setShowTypeSelection(true);
  };

  const handleSelectEventType = (type: EventType) => { setSelectedEventType(type); if (authSession) SecureStorage.setItem(`${authSession.eventId}_last_event_type`, type); setShowTypeSelection(false); };
  const handleReturnToProviderPanel = () => { const masterSession: AuthSession = { eventId: 'MASTER', role: 'admin', timestamp: Date.now(), userName: 'Provedor Master', isSuperAdmin: true }; setAuthSession(masterSession); SecureStorage.setItem('active_session', masterSession); setSelectedEventType(null); };
  const handleCongregationSelect = (congId: string) => { setSelectedUserCongId(congId); SecureStorage.setItem('user_congregation_id', congId); setConfirmedVolunteer(null); setIsDisambiguationRequired(!!congId); };
  
  const handleEditTemplate = (type: EventType) => {
    let templateId = type === 'CIRCUIT_OVERSEER' ? TEMPLATE_EVENT_IDS.ASSEMBLY_CO : (type === 'REGIONAL_CONVENTION' ? TEMPLATE_EVENT_IDS.CONVENTION_REGIONAL : TEMPLATE_EVENT_IDS.ASSEMBLY_BETHEL);
    const templateSession: AuthSession = { eventId: templateId, role: 'admin', timestamp: Date.now(), userName: 'Editor de Modelo', isSuperAdmin: true, isTemplate: true };
    setAuthSession(templateSession); SecureStorage.setItem('active_session', templateSession); setSelectedEventType(type);
  };

  const handleDisambiguationSubmit = () => {
      if (!disambiguationPhoneInput) return;
      const normalizedInput = normalizePhone(disambiguationPhoneInput);
      let foundVol: VolunteerData | null = null;
      const searchInDepts = (depts: any[]) => { for (const d of depts) { if (d.overseer && normalizePhone(d.overseer.phone) === normalizedInput) return d.overseer; for (const a of d.assistants) { if (a && normalizePhone(a.phone) === normalizedInput) return a; } } return null; };
      foundVol = searchInDepts(orgData.aoDepartments || []) || searchInDepts(orgData.aaoDepartments || []) || searchInDepts(orgData.coordDepartments || []) || searchInDepts(orgData.progDepartments || []) || searchInDepts(orgData.roomDepartments || []);
      if (!foundVol && orgData.committee) { const c = orgData.committee; const committeeMembers = [c.president, c.assemblyOverseer, c.assistantAssemblyOverseer, c.presidentAssistant1, c.presidentAssistant2, c.conventionCoordinator, c.assistantCoordinator, c.conventionProgramOverseer, c.assistantProgramOverseer, c.conventionRoomingOverseer, c.assistantRoomingOverseer]; foundVol = committeeMembers.find(m => m && normalizePhone(m.phone) === normalizedInput) || null; }
      if (!foundVol && orgData.attendantsData) { for (const att of orgData.attendantsData) { if (normalizePhone(att.morning_vol1_phone || '') === normalizedInput) { foundVol = { name: att.morning_vol1_name!, phone: att.morning_vol1_phone!, congregation: '', email: '', lgpdConsent: true }; break; } if (normalizePhone(att.morning_vol2_phone || '') === normalizedInput) { foundVol = { name: att.morning_vol2_name!, phone: att.morning_vol2_phone!, congregation: '', email: '', lgpdConsent: true }; break; } if (normalizePhone(att.afternoon_vol1_phone || '') === normalizedInput) { foundVol = { name: att.afternoon_vol1_name!, phone: att.afternoon_vol1_phone!, congregation: '', email: '', lgpdConsent: true }; break; } if (normalizePhone(att.afternoon_vol2_phone || '') === normalizedInput) { foundVol = { name: att.afternoon_vol2_name!, phone: att.afternoon_vol2_phone!, congregation: '', email: '', lgpdConsent: true }; break; } } }
      if (!foundVol && orgData.parkingData) { for (const p of orgData.parkingData) { if (p.morningVol1 && normalizePhone(p.morningVol1.phone) === normalizedInput) { foundVol = p.morningVol1; break; } if (p.morningVol2 && normalizePhone(p.morningVol2.phone) === normalizedInput) { foundVol = p.morningVol2; break; } if (p.afternoonVol1 && normalizePhone(p.afternoonVol1.phone) === normalizedInput) { foundVol = p.afternoonVol1; break; } if (p.afternoonVol2 && normalizePhone(p.afternoonVol2.phone) === normalizedInput) { foundVol = p.afternoonVol2; break; } } }
      if (foundVol) { setConfirmedVolunteer(foundVol); setIsDisambiguationRequired(false); showToast(`Bem-vindo, ${foundVol.name}!`); } else { showToast("Telefone não encontrado.", "error"); }
  };

  const handleForceRestoreFromBackup = (fullBackup: any) => {
     if (!fullBackup.appData) return;
     const { structure, program: prog, notes: nts, attendance: att, eventType } = fullBackup.appData;
     if (structure) { setOrgData(structure); const key = eventType === 'REGIONAL_CONVENTION' ? `${authSession?.eventId || 'RESTORED'}_CONVENTION_structure` : `${authSession?.eventId || 'RESTORED'}_structure`; SecureStorage.setItem(key, structure); }
     if (prog) { setProgram(prog); if (authSession?.eventId) SecureStorage.setItem(`${authSession.eventId}_program_${prog.type}`, prog); }
     if (nts && authSession?.eventId) { setNotes(nts); SecureStorage.setItem(`${authSession.eventId}_notes`, nts); }
     if (att && authSession?.eventId) { setAttendance(att); SecureStorage.setItem(`${authSession.eventId}_attendance`, att); }
     if (eventType) { setSelectedEventType(eventType); if (authSession?.eventId) SecureStorage.setItem(`${authSession.eventId}_last_event_type`, eventType); }
     showToast("Dados restaurados com sucesso!", 'success');
  };

  const handleOrganogramPinSubmit = (e: React.FormEvent) => {
      e.preventDefault(); const correctPin = orgData.generalInfo?.teamAccessPin || APP_CONFIG.VOLUNTEER_PIN;
      if (organogramPinInput === correctPin || organogramPinInput === APP_CONFIG.ADMIN_PIN) { setView('organogram'); setShowOrganogramPinModal(false); setOrganogramPinInput(''); } else { setOrganogramPinError('PIN incorreto'); }
  };

  const openReportModal = (sectorId: string, period: 'morning' | 'afternoon') => { setReportSectorId(sectorId); setReportPeriod(period); setReportValue(''); setShowReportModal(true); };
  const publicAnnouncements = orgData.generalInfo?.publicAnnouncements || '';
  const selectedCong = useMemo(() => orgData.generalInfo?.congregations?.find(c => c.id === selectedUserCongId), [orgData.generalInfo, selectedUserCongId]);
  const myAttendantAssignments = useMemo(() => { if (!confirmedVolunteer) return []; const assignments: any[] = []; const normalizedPhone = normalizePhone(confirmedVolunteer.phone); orgData.attendantsData?.forEach(att => { if (normalizePhone(att.morning_vol1_phone || '') === normalizedPhone || normalizePhone(att.morning_vol2_phone || '') === normalizedPhone) assignments.push({ sectorId: att.sectorId, customName: att.customName, period: 'Manhã', rawPeriod: 'morning', canReport: true }); if (normalizePhone(att.afternoon_vol1_phone || '') === normalizedPhone || normalizePhone(att.afternoon_vol2_phone || '') === normalizedPhone) assignments.push({ sectorId: att.sectorId, customName: att.customName, period: 'Tarde', rawPeriod: 'afternoon', canReport: true }); }); return assignments; }, [confirmedVolunteer, orgData.attendantsData]);
  const myOrganogramAssignments = useMemo(() => { if (!confirmedVolunteer) return []; const assignments: any[] = []; const normalizedPhone = normalizePhone(confirmedVolunteer.phone); const checkDept = (list: any[]) => { list.forEach(d => { if (d.overseer && normalizePhone(d.overseer.phone) === normalizedPhone) assignments.push({ dept: d.name, role: 'Encarregado' }); d.assistants.forEach((a: any, idx: number) => { if (a && normalizePhone(a.phone) === normalizedPhone) assignments.push({ dept: d.name, role: `Assistente ${idx + 1}` }); }); }); }; checkDept(orgData.aoDepartments || []); checkDept(orgData.aaoDepartments || []); checkDept(orgData.coordDepartments || []); checkDept(orgData.progDepartments || []); checkDept(orgData.roomDepartments || []); orgData.parkingData?.forEach(p => { if ((p.morningVol1 && normalizePhone(p.morningVol1.phone) === normalizedPhone) || (p.morningVol2 && normalizePhone(p.morningVol2.phone) === normalizedPhone)) assignments.push({ dept: `Estacionamento - ${p.name}`, role: 'Voluntário (Manhã)' }); if ((p.afternoonVol1 && normalizePhone(p.afternoonVol1.phone) === normalizedPhone) || (p.afternoonVol2 && normalizePhone(p.afternoonVol2.phone) === normalizedPhone)) assignments.push({ dept: `Estacionamento - ${p.name}`, role: 'Voluntário (Tarde)' }); }); return assignments; }, [confirmedVolunteer, orgData]);
  const hasOrganogramRole = myOrganogramAssignments.length > 0;

  if (isInitializing) return ( <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4"><div className="w-16 h-16 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-6 shadow-lg shadow-brand-200/50"></div><p className="text-slate-500 font-extrabold text-lg animate-pulse tracking-wide uppercase">Iniciando Sistema...</p></div> );

  if (!authSession) {
    return ( <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden"><div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-100/40 rounded-full blur-[100px] pointer-events-none"></div><div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in border border-white/60 relative z-10"><div className="bg-gradient-to-br from-brand-500 to-brand-600 p-8 text-center text-white relative"><Layout size={42} className="mx-auto mb-3 drop-shadow-md" /><h1 className="text-2xl font-extrabold">TeoGestor</h1><p className="text-brand-50 text-xs mt-1 font-bold">Gestão Teocrática Inteligente</p></div><form onSubmit={(e) => handleLogin(e, 'public')} className="p-8 space-y-6">{isDirectLink ? (<div className="text-center pb-4"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Acessando Evento</p><div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-50 text-brand-700 rounded-full font-bold text-xl border border-brand-100"><LinkIcon size={20}/> {loginEventId}</div></div>) : (<div className="relative group"><User className="absolute left-4 top-4 text-slate-300" size={20} /><input type="text" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 outline-none font-bold text-slate-800 uppercase text-lg" placeholder="EVENTO (Ex: GO-003 A)" value={loginEventId} onChange={e => setLoginEventId(e.target.value)} list="local-events"/><datalist id="local-events">{availableEvents.map(ev => <option key={ev} value={ev} />)}</datalist></div>)}<div className="relative group"><Users className="absolute left-4 top-4 text-slate-300" size={20} /><input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 outline-none text-slate-800 font-semibold" placeholder="Seu Nome" value={loginName} onChange={e => setLoginName(e.target.value)}/></div>{loginError && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 border border-red-100"><AlertTriangle size={18}/> {loginError}</div>}<button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl text-lg flex items-center justify-center gap-3"><BookOpen size={24}/> Entrar no Meu Espaço</button></form><div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-between items-center px-8"><span className="text-[10px] text-slate-300 font-bold tracking-widest">v{APP_CONFIG.APP_VERSION}</span><button onClick={() => setShowAdminModal(true)} className="text-slate-300 hover:text-slate-500 p-2"><Lock size={16}/></button></div>{showAdminModal && (<div className="absolute inset-0 bg-white z-20 flex flex-col animate-slide-up"><div className="bg-brand-900 p-8 text-white flex justify-between items-start"><div className="relative z-10"><h2 className="text-2xl font-bold">Acesso Restrito</h2><p className="text-brand-300 text-xs font-bold mt-1 uppercase">Gestão do Evento</p></div><button onClick={() => setShowAdminModal(false)} className="bg-white/10 p-2 rounded-full text-white"><X size={20}/></button></div><form onSubmit={(e) => handleLogin(e, 'admin')} className="flex-1 p-8 overflow-y-auto space-y-6"><div className="relative group"><User className="absolute left-4 top-4 text-slate-300" size={20} /><input type="text" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-600 outline-none font-bold text-slate-800 uppercase" placeholder="Ex: GO-003 A" value={loginEventId} onChange={e => setLoginEventId(e.target.value)}/></div><div className="relative group"><Users className="absolute left-4 top-4 text-slate-300" size={20} /><input type="text" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-600 outline-none text-slate-800 font-medium" placeholder="Seu Nome" value={loginName} onChange={e => setLoginName(e.target.value)}/></div><div className="relative group"><Key className="absolute left-4 top-4 text-slate-300" size={20} /><input type={showPassword ? "text" : "password"} className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-600 outline-none text-slate-800 font-bold tracking-widest text-lg" placeholder="••••••••" value={loginPin} onChange={e => setLoginPin(e.target.value)}/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div><div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-3 mt-4"><div className="flex items-center gap-2 text-brand-800 font-bold border-b border-slate-200 pb-2 mb-2"><ShieldCheck size={16}/> Política de Uso & Privacidade</div><p className="leading-relaxed text-[10px] text-justify text-slate-500"><strong>Atenção:</strong> Este não é um site oficial das Testemunhas de Jeová.</p><label className="flex items-start gap-3 pt-3 border-t border-slate-200 cursor-pointer group"><input type="checkbox" className="peer sr-only" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}/><div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-brand-900 peer-checked:border-brand-900 flex items-center justify-center bg-white"><CheckSquare size={12} className="text-white opacity-0 peer-checked:opacity-100" /></div><span className="text-[11px] font-bold text-slate-600 group-hover:text-brand-900 select-none">Li e concordo com a política de privacidade.</span></label></div><button disabled={!acceptedTerms || loginLoading} type="submit" className="w-full bg-brand-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2">{loginLoading ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20}/>} {loginLoading ? 'Conectando...' : 'Entrar no Sistema'}</button></form></div>)}{showCloudModal && (<div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] p-8 flex flex-col items-center justify-center animate-fade-in overflow-y-auto"><div className="w-full max-w-sm space-y-5"><div className="text-center"><div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border shadow-sm ${cloudUrl ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-brand-50 text-brand-600 border-brand-100'}`}><Cloud size={32}/></div><h3 className="font-bold text-slate-800 text-xl">Conectar Supabase</h3><p className="text-xs text-slate-500 mt-1">Sincronize seus dados entre dispositivos.</p></div>{cloudUrl && (<div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between"><div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/><span className="text-xs font-bold text-emerald-800">Conectado</span></div><button onClick={handleDisconnectCloud} className="text-[10px] font-bold text-red-500 bg-white px-2 py-1 rounded border border-red-100 hover:bg-red-50 flex items-center gap-1"><Unplug size={10}/> Desconectar</button></div>)}<div className="space-y-3"><div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project URL</label><input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-500 focus:bg-white transition-all" placeholder="https://xyz...supabase.co" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} /></div><div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">API Key (anon public)</label><input type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-500 focus:bg-white transition-all" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." value={cloudKey} onChange={e => setCloudKey(e.target.value)} /></div></div><div className="bg-amber-50 p-4 rounded-xl border border-amber-100 relative"><label className="block text-[10px] font-bold text-amber-700 uppercase mb-2 flex items-center gap-1"><Key size={12}/> Senha de Criptografia (Invente uma)</label><div className="relative"><input type={showCloudPass ? "text" : "password"} className="w-full border border-amber-200 bg-white rounded-xl px-4 py-3 pr-10 text-sm font-mono outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100" placeholder="Sua senha secreta..." value={cloudPass} onChange={e => setCloudPass(e.target.value)} /><button type="button" onClick={() => setShowCloudPass(!showCloudPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showCloudPass ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
    {showSqlHelp && (<div className="bg-slate-800 text-slate-300 p-4 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-700 relative"><button onClick={() => setShowSqlHelp(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={14}/></button><p className="text-slate-400 mb-2 border-b border-slate-700 pb-2">Copie e cole no SQL Editor do Supabase:</p><pre className="whitespace-pre-wrap select-all">{getSqlScript()}</pre></div>)}
    <div className="space-y-2 pt-2"><button onClick={handleCloudConfigSave} disabled={isTestingCloud} className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">{isTestingCloud ? <Loader2 size={18} className="animate-spin"/> : null}{isTestingCloud ? 'Testando Conexão...' : 'Salvar e Conectar'}</button><div className="flex gap-2"><button onClick={() => setShowSqlHelp(!showSqlHelp)} className="flex-1 py-3 text-brand-600 bg-brand-50 border border-brand-100 rounded-xl text-xs font-bold hover:bg-brand-100 flex items-center justify-center gap-1"><Database size={14}/> Script SQL</button><button onClick={() => setShowCloudModal(false)} disabled={isTestingCloud} className="flex-1 py-3 text-slate-400 hover:text-slate-600 text-xs font-bold disabled:opacity-50">Cancelar</button></div></div></div></div>)}
    {toastMessage && (<div className={`fixed top-24 right-6 px-6 py-4 rounded-2xl shadow-2xl z-[150] animate-bounce-in flex items-center gap-3 font-bold text-sm ${toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{toastMessage.type === 'success' ? <CheckCircle2 size={20}/> : <AlertTriangle size={20}/>}{toastMessage.text}</div>)}
    </div></div>)
  }
  
  if (isRepairingSession) { return ( <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"><div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-4 animate-fade-in"><h2 className="text-center text-slate-800 font-extrabold mb-2 text-lg">Reparar Sessão</h2><button onClick={() => handleRepairSession('ASSEMBLY')} className="w-full p-4 bg-white border-2 border-slate-100 hover:border-brand-400 hover:bg-brand-50/50 rounded-2xl flex items-center gap-4 transition-all group shadow-sm"><Layout size={24} className="text-brand-600"/><span className="font-bold text-slate-900 text-sm">Gestão de Assembleia</span></button><button onClick={() => handleRepairSession('CONVENTION')} className="w-full p-4 bg-white border-2 border-slate-100 hover:border-purple-400 hover:bg-purple-50/50 rounded-2xl flex items-center gap-4 transition-all group shadow-sm"><Grid size={24} className="text-purple-600"/><span className="font-bold text-slate-900 text-sm">Gestão de Congresso</span></button><button onClick={handleLogout} className="w-full mt-4 py-3 text-slate-400 text-xs font-bold hover:text-slate-700">Cancelar e Sair</button></div></div> ); }
  if (showTypeSelection) { return ( <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"><div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-4 animate-fade-in"><h2 className="text-center text-slate-800 font-extrabold mb-6 text-lg">Qual programa?</h2><button onClick={() => handleSelectEventType('BETHEL_REP')} className="w-full p-4 bg-white border-2 border-slate-100 hover:border-brand-400 hover:bg-brand-50/50 rounded-2xl flex items-center gap-4 transition-all group shadow-sm"><Smartphone size={24} className="text-brand-600"/><span className="font-bold text-slate-900 text-sm">Assembleia com Rep. de Betel</span></button><button onClick={() => handleSelectEventType('CIRCUIT_OVERSEER')} className="w-full p-4 bg-white border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl flex items-center gap-4 transition-all group shadow-sm"><Briefcase size={24} className="text-blue-600"/><span className="font-bold text-slate-900 text-sm">Assembleia com Sup. de Circuito</span></button><button onClick={handleLogout} className="w-full mt-4 py-3 text-slate-400 text-xs font-bold hover:text-slate-700">Cancelar e Sair</button></div></div> ); }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
       <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0"><div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-brand-100/30 rounded-full blur-[120px]"></div><div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-100/30 rounded-full blur-[120px]"></div></div>
       
       <header className="fixed top-4 left-4 right-4 z-40 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl px-4 py-3 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3"><button onClick={() => setView('dashboard')} className="p-2.5 rounded-xl bg-slate-100/50 hover:bg-white text-slate-600 transition-all"><Home size={20} /></button><div className="flex flex-col ml-1 pl-3 h-9 justify-center border-l border-slate-200/50"><h1 className="font-bold text-slate-800 text-base md:text-lg leading-tight truncate max-w-[140px] md:max-w-[300px]">{!showPublicDashboard ? authSession.eventId : 'Programação / Anotações'}</h1><span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 leading-none flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>{authSession.userName}</span></div></div>
          <div className="flex items-center gap-2">{authSession.isTemplate ? (<button onClick={handleReturnToProviderPanel} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200 font-bold text-xs flex items-center gap-2"><ArrowLeft size={16} /> Voltar ao Painel</button>) : (<>{(isAdmin || isSuperAdmin || isMaster) && (<button onClick={isMaster || isSuperAdmin ? handleOpenCloudModal : () => handleSync('down')} disabled={!cloudUrl && !isMaster && !isSuperAdmin} className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 shadow-sm relative ${cloudUrl ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' : (isMaster || isSuperAdmin ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100 animate-pulse' : 'bg-transparent border-transparent opacity-0 pointer-events-none')}`} title={isMaster || isSuperAdmin ? (cloudUrl ? 'Configurar Nuvem (Master)' : 'Conectar Nuvem (Master)') : 'Sincronizado'}>{cloudUrl ? (<>{syncStatus === 'syncing' && <RefreshCw size={20} className="animate-spin text-amber-500" />}{syncStatus === 'success' && <Cloud size={20} className="text-emerald-500" />}{syncStatus === 'error' && <AlertTriangle size={20} className="text-red-500" />}{syncStatus === 'idle' && (isMaster || isSuperAdmin ? <Cloud size={20} className="text-slate-400" /> : <Wifi size={20} className="text-emerald-500" />)}<span className="text-[10px] font-bold uppercase hidden sm:inline w-20 text-center">{syncStatus === 'syncing' ? 'Salvando...' : syncStatus === 'success' ? 'Salvo' : syncStatus === 'error' ? 'Erro' : (isMaster || isSuperAdmin ? 'Nuvem' : 'Online')}</span></>) : ((isMaster || isSuperAdmin) && (<><CloudOff size={20} /><span className="text-[10px] font-bold uppercase hidden sm:inline">Conectar</span></>))}{isMaster && (!cloudUrl || syncStatus === 'error') && (<span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>)}</button>)}{cloudUrl && (isAdmin || isSuperAdmin) && (<div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 ml-1 hidden md:flex"><button title="Baixar dados da Nuvem (Download)" onClick={() => handleSync('down')} disabled={syncStatus === 'syncing'} className="p-2 rounded-lg bg-white text-blue-600 shadow-sm hover:bg-blue-50 transition-colors border border-slate-100"><Download size={16}/></button></div>)}<button onClick={handleLogout} className="ml-1 p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100"><LogoutIcon size={18} /></button></>)}</div>
       </header>
       
       <main className="relative z-10 pt-24 pb-32 md:pb-8 animate-fade-in max-w-7xl mx-auto px-4">
          {view === 'dashboard' && (
             <div className="max-w-3xl mx-auto">
                <div className={`rounded-[2rem] p-6 md:p-8 mb-6 relative overflow-hidden shadow-xl ${selectedEventType === 'REGIONAL_CONVENTION' ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-brand-500 to-blue-700'} text-white`}>
                   <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div><h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">Olá, {authSession.userName}</h2><p className="text-white/90 text-sm font-medium">{showPublicDashboard ? 'Bem-vindo ao seu guia digital.' : (isSuperAdmin && !authSession.isTemplate ? 'Painel do Provedor Master' : `${authSession.isTemplate ? 'Modo de Edição de Modelo' : (selectedEventType === 'REGIONAL_CONVENTION' ? 'Gestão de Congresso' : 'Gestão de Assembleia')}`)}</p></div>
                      {showPublicDashboard && ( <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 w-full md:w-56 shrink-0 mt-2 md:mt-0"><label className="block text-[10px] font-bold text-white/80 mb-1.5 uppercase tracking-wider">Sua Congregação</label><div className="relative group"><select className="w-full p-2 rounded-lg border border-white/30 bg-transparent text-sm font-bold text-white outline-none appearance-none cursor-pointer" value={selectedUserCongId} onChange={(e) => handleCongregationSelect(e.target.value)}><option value="" style={{ color: 'black' }}>-- Ver designações --</option>{(orgData.generalInfo?.congregations || []).map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.name}</option>)}</select><div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/80"><ChevronDown size={18}/></div></div>{(!orgData.generalInfo?.congregations || orgData.generalInfo.congregations.length === 0) && (<div className="mt-2 text-center"><p className="text-[9px] text-white/60 italic mb-2">Nenhuma congregação.</p><button onClick={() => handleSync('down')} className="text-[10px] font-bold bg-white text-brand-600 px-3 py-1.5 rounded-lg w-full flex items-center justify-center gap-1 hover:bg-brand-50 transition-colors shadow-sm"><RefreshCw size={10} className={syncStatus === 'syncing' ? 'animate-spin' : ''} /> Buscar Dados</button></div>)}</div> )}
                   </div>
                </div>
                {showPublicDashboard && !selectedUserCongId && orgData.generalInfo?.congregations && orgData.generalInfo.congregations.length > 0 && ( <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"><div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative overflow-hidden border border-white/20"><div className="text-center mb-6"><div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-100 shadow-sm"><Building2 size={32}/></div><h2 className="text-2xl font-extrabold text-slate-800">Bem-vindo! 👋</h2><p className="text-slate-500 text-sm mt-2">Para ver as designações, selecione sua congregação:</p></div><div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 -mr-2 custom-scrollbar">{orgData.generalInfo.congregations.map(cong => (<button key={cong.id} onClick={() => handleCongregationSelect(cong.id)} className="w-full p-4 rounded-xl border-2 border-slate-100 hover:border-brand-500 hover:bg-brand-50 transition-all flex items-center justify-between group active:scale-[0.98]"><span className="font-bold text-slate-700 group-hover:text-brand-700 text-left">{cong.name}</span><div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-brand-500 group-hover:bg-brand-500 flex items-center justify-center transition-colors"><Check size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div></button>))}</div><div className="mt-6 pt-4 border-t border-slate-100 text-center"><button onClick={() => { handleCongregationSelect('VISITOR_GUEST'); }} className="text-xs text-slate-400 font-bold hover:text-slate-600 uppercase tracking-wider">Sou Visitante (Apenas assistir)</button></div></div></div> )}
                
                {isSuperAdmin && !authSession.isTemplate ? (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4"><Plus size={18} /> Criar Novo Evento</h3><div className="flex flex-col sm:flex-row gap-3"><input className="flex-1 px-4 py-3 text-sm border border-slate-200 bg-slate-50 rounded-xl outline-none shadow-sm focus:ring-1 focus:ring-brand-400 font-mono uppercase" placeholder="ID do Evento (ex: SP-123-A)" value={providerNewEventId} onChange={e => setProviderNewEventId(e.target.value)} /><select className="px-4 py-3 text-sm border border-slate-200 bg-slate-50 rounded-xl outline-none shadow-sm focus:ring-1 focus:ring-brand-400 font-bold" value={providerNewEventType} onChange={e => setProviderNewEventType(e.target.value as EventType)}><option value="BETHEL_REP">Assembleia (Rep. Betel)</option><option value="CIRCUIT_OVERSEER">Assembleia (Sup. Circuito)</option><option value="REGIONAL_CONVENTION">Congresso</option></select><button onClick={handleCreateEventAndGenerateLink} disabled={!providerNewEventId || isCreatingEvent} className="bg-brand-600 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"><LinkIcon size={14}/> Gerar Link Admin</button></div><p className="text-xs text-slate-400 mt-3">{copyFeedback || 'Cria um novo evento na nuvem a partir do modelo base e gera o link de convite.'}</p></div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4"><PenTool size={18} /> Gerenciar Modelos Base</h3><p className="text-xs text-slate-500 mb-4">Edite os programas e estruturas padrão.</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><button onClick={() => handleEditTemplate('BETHEL_REP')} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-brand-50 hover:border-brand-200 transition-colors text-left">Assembleia (Rep. Betel)</button><button onClick={() => handleEditTemplate('CIRCUIT_OVERSEER')} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left">Assembleia (Sup. Circuito)</button><button onClick={() => handleEditTemplate('REGIONAL_CONVENTION')} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-purple-50 hover:border-purple-200 transition-colors text-left">Congresso</button></div></div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Server size={18} /> Eventos Registrados</h3><button onClick={fetchProviderEvents} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><RefreshCw size={16}/></button></div><div className="mb-4 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between"><span>Conectado a: <strong>{cloudUrl ? cloudUrl.replace('https://', '').split('.')[0] + '...' : 'Não configurado'}</strong></span><button onClick={handleOpenCloudModal} className="text-brand-600 hover:underline font-bold uppercase tracking-wide">Editar</button></div>{eventsError ? (<div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 mb-4 flex flex-col md:flex-row items-center justify-between gap-3 animate-fade-in"><div className="flex items-center gap-3"><AlertTriangle size={18} className="shrink-0"/> <span>{eventsError}</span></div><div className="flex gap-2"><button onClick={handleQuickReconnect} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors flex items-center gap-2 whitespace-nowrap"><RefreshCw size={14}/> Reconectar</button><button onClick={handleOpenCloudModal} className="px-4 py-2 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors shadow-sm whitespace-nowrap text-xs flex items-center gap-2 font-extrabold uppercase tracking-wide"><Settings size={14}/> Configurar</button></div></div>) : null}{isLoadingEvents ? <p className="text-center text-slate-400 py-8">Carregando...</p> : (<div className="space-y-2 max-h-96 overflow-y-auto pr-2">{providerEventList.map(event => (<div key={event.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100"><div className="flex-1 min-w-0"><strong className="font-mono text-slate-700 truncate block">{event.id}</strong><p className="text-xs text-slate-500">Atualizado em: {new Date(event.updated_at).toLocaleString('pt-BR')}</p></div></div>))}</div>)}</div>
                  </div>
                ) : showPublicDashboard ? (
                  <div className="space-y-6">
                     {publicAnnouncements && (<div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl shadow-sm animate-fade-in relative overflow-hidden"><div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div><h3 className="text-blue-900 font-bold flex items-center gap-2 mb-3"><Megaphone size={20}/> Avisos Importantes</h3><p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">{publicAnnouncements}</p></div>)}
                     {isDisambiguationRequired && (<div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl shadow-sm animate-fade-in"><h3 className="text-amber-800 font-bold mb-3 flex items-center gap-2"><UserCheck size={20}/> Confirme sua Identidade</h3><p className="text-sm text-amber-700 mb-4">Para ver suas designações, confirme seu telefone (apenas números).</p><div className="flex gap-2 relative"><div className="relative flex-1"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input type="tel" placeholder="Ex: 11999998888" className="w-full p-3 pl-10 rounded-xl border border-amber-300 text-sm outline-none focus:ring-2 focus:ring-amber-500" value={disambiguationPhoneInput} onChange={(e) => setDisambiguationPhoneInput(e.target.value)}/></div><button onClick={handleDisambiguationSubmit} className="bg-amber-600 text-white px-6 rounded-xl font-bold text-sm shadow-md hover:bg-amber-700">Confirmar</button></div></div>)}
                     
                     {confirmedVolunteer && (
                         <div className="space-y-4">
                             <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center gap-4"><div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">{confirmedVolunteer.name.charAt(0)}</div><div><h3 className="font-bold text-slate-800 text-lg">{confirmedVolunteer.name}</h3><p className="text-xs text-slate-500 font-medium flex items-center gap-1"><MapPin size={12}/> {selectedCong?.name}</p></div><button onClick={() => { setConfirmedVolunteer(null); setIsDisambiguationRequired(true); }} className="ml-auto text-xs text-red-400 hover:text-red-600 font-bold border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50">Sair</button></div>
                             {(isConfirmedAttendantOverseer || isConfirmedParkingOverseer) && (
                                 <div className="grid grid-cols-2 gap-3 animate-fade-in"><button onClick={() => setView(isConfirmedAttendantOverseer ? 'attendants' : 'parking')} className="p-4 bg-white border-2 border-indigo-100 rounded-2xl flex flex-col items-center gap-2 shadow-sm hover:border-indigo-300 transition-all group"><div className="bg-indigo-100 p-3 rounded-full text-indigo-600 group-hover:scale-110 transition-transform">{isConfirmedAttendantOverseer ? <Users size={24} /> : <Car size={24} />}</div><span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wide text-center">Gerenciar Equipe</span></button><button onClick={() => { setOrganogramPinInput(''); setShowOrganogramPinModal(true); }} className="p-4 bg-white border-2 border-slate-100 rounded-2xl flex flex-col items-center gap-2 shadow-sm hover:border-slate-300 transition-all group"><div className="bg-slate-100 p-3 rounded-full text-slate-600 group-hover:scale-110 transition-transform"><Grid size={24} /></div><span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide text-center">Ver Organograma</span></button></div>
                             )}
                             {hasOrganogramRole && (
                                 <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl shadow-sm"><h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2"><Briefcase size={20}/> Suas Designações</h3><div className="space-y-2">{myOrganogramAssignments.map((assign, idx) => (<div key={idx} className="bg-white p-3 rounded-xl border border-indigo-100 flex justify-between items-center"><span className="text-sm font-bold text-slate-700">{assign.dept}</span><span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{assign.role}</span></div>))}</div>{!isConfirmedAttendantOverseer && !isConfirmedParkingOverseer && (<button onClick={() => { setOrganogramPinInput(''); setShowOrganogramPinModal(true); }} className="w-full mt-4 py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 shadow-sm transition-all"><Lock size={14}/> Acessar Área Restrita (Organograma)</button>)}</div>
                             )}
                             {myAttendantAssignments.length > 0 && (
                                 <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl shadow-sm"><h3 className="text-orange-900 font-bold mb-4 flex items-center gap-2"><Users size={20}/> Indicadores - Seus Postos</h3><div className="space-y-3">{myAttendantAssignments.map((assign, idx) => (<div key={idx} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-slate-800">{assign.customName || DEFAULT_SECTORS.find(s => s.id === assign.sectorId)?.name || `Setor ${assign.sectorId}`}</h4><span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${assign.rawPeriod === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{assign.period}</span></div>{assign.canReport && (<button onClick={() => openReportModal(assign.sectorId, assign.rawPeriod)} className="w-full mt-2 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 flex items-center justify-center gap-2 shadow-sm"><Send size={12}/> Informar Assistência</button>)}</div>))}</div></div>
                             )}
                             {(!hasOrganogramRole && myAttendantAssignments.length === 0) && ( <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400 text-sm">Nenhuma designação encontrada para você.</p></div> )}
                         </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button onClick={() => setView('program')} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform"><BookOpen size={32}/></div><h3 className="font-bold text-slate-800">Programa e Anotações</h3><p className="text-xs text-slate-500">Acompanhe os discursos.</p></button><button onClick={() => setView('general_info')} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform"><Info size={32}/></div><h3 className="font-bold text-slate-800">Informações Gerais</h3><p className="text-xs text-slate-500">Lembretes e locais de limpeza.</p></button></div>
                     {selectedCong && (<div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles size={18} className="text-brand-500"/> Designação da Congregação</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Limpeza</span><p className="font-bold text-slate-800">{selectedCong.cleaningAssignment || 'Não definido'}</p><p className="text-xs text-slate-500 mt-1">Resp: {selectedCong.cleaningResponsable || '-'}</p></div><div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contas (Fichas)</span><p className="font-bold text-slate-800">{selectedCong.accountsAssignment || 'Não definido'}</p></div></div></div>)}
                     <div className="bg-white rounded-[2rem] shadow-sm border border-emerald-100 p-5 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all"><div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div><div className="bg-emerald-50 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><Heart size={24} className="text-emerald-600 fill-emerald-600"/></div><h3 className="font-bold text-slate-800 text-base mb-1">Donativos para a Obra Mundial</h3><p className="text-xs text-slate-500 mb-4 max-w-xs">Apoie os eventos e a obra mundial das Testemunhas de Jeová através do site oficial.</p><a href="https://donate.jw.org/pt/BRA/home" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">Acessar donate.jw.org <span className="text-emerald-200">↗</span></a></div><div className="text-center px-2 pt-4 border-t border-slate-200/50"><p className="text-[9px] text-slate-400 mb-2 font-medium">Gostou do App? Contribua voluntariamente:</p><button onClick={handleCopyPix} className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-[9px] font-bold hover:bg-white hover:text-slate-700 transition-all shadow-sm w-full justify-center"><Copy size={10}/> {pixFeedback || "Copiar Chave Pix (App)"}</button></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {isAdmin && !isSuperAdmin && (<div className="col-span-full bg-indigo-50 rounded-3xl shadow-sm border border-indigo-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-2"><div className="flex-1"><h3 className="font-bold text-indigo-900 text-lg flex items-center gap-2"><CopyPlus size={20}/> Preparar Próxima Assembleia</h3><p className="text-xs text-indigo-700 mt-1 max-w-lg">Terminou o evento atual? Clone toda a estrutura para um novo ID.</p></div><div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-end"><div className="w-full md:w-40"><label className="block text-[10px] font-bold text-indigo-500 uppercase mb-1">Novo ID (Ex: GO-003-B)</label><input className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold uppercase text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-300" placeholder="NOVO ID" value={duplicateTargetId} onChange={(e) => setDuplicateTargetId(e.target.value)} /></div><div className="w-full md:w-48"><label className="block text-[10px] font-bold text-indigo-500 uppercase mb-1">Novo Programa</label><select className="w-full p-3 rounded-xl border border-indigo-200 text-sm font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-300" value={duplicateTargetType} onChange={(e) => setDuplicateTargetType(e.target.value as EventType)}><option value="CIRCUIT_OVERSEER">Assembleia (Sup. Circuito)</option><option value="BETHEL_REP">Assembleia (Rep. Betel)</option><option value="REGIONAL_CONVENTION">Congresso</option></select></div><button onClick={handleDuplicateCurrentEvent} disabled={isDuplicating || !duplicateTargetId} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50">{isDuplicating ? <Loader2 size={18} className="animate-spin"/> : <ArrowRight size={18}/>} {isDuplicating ? 'Criando...' : 'Criar'}</button></div></div>)}
                     <button onClick={() => setView('cover')} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform"><Layout size={28}/></div><h3 className="font-bold text-slate-800 text-sm">Capa do Evento</h3></button><button onClick={() => setView('program')} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><BookOpen size={28}/></div><h3 className="font-bold text-slate-800 text-sm">Programa</h3></button><button onClick={() => { if(isAdmin || hasOverseerPrivileges) { setView('organogram'); } else { setOrganogramPinInput(''); setShowOrganogramPinModal(true); } }} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform"><Users size={28}/></div><h3 className="font-bold text-slate-800 text-sm">Organograma</h3></button><button onClick={() => setView('cleaning')} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><Sparkles size={28}/></div><h3 className="font-bold text-slate-800 text-sm">Limpeza e Fichas</h3></button><button onClick={() => setView('general_info')} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group relative overflow-hidden"><div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform"><Info size={28}/></div><h3 className="font-bold text-slate-800 text-sm">Geral e Contatos</h3>{unreadSuggestionsCount > 0 && isAdmin && (<div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">{unreadSuggestionsCount}</div>)}</button><button onClick={() => setView('attendants')} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><Users size={28}/></div><h3 className="font-bold text-slate-800 text-sm">Indicadores</h3></button><button onClick={() => setView('parking')} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform"><Car size={28}/></div><h3 className="font-bold text-slate-800 text-sm">Estacionamento</h3></button><button onClick={() => setView('sharing')} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"><div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform"><Share2 size={28}/></div><h3 className="font-bold text-slate-800 text-sm">Compartilhar</h3></button>
                  </div>
                )}
             </div>
          )}

          {view === 'cover' && <Cover program={program} onEnter={() => setView('program')} onBack={() => setView('dashboard')} initialCircuitId={authSession.eventId !== 'MASTER' ? authSession.eventId : undefined} />}
          {view === 'program' && (<div className="animate-fade-in relative"><button onClick={() => setView('dashboard')} className="fixed top-24 left-4 z-30 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-500 hover:text-slate-800"><ArrowLeft size={20}/></button><Program program={program} notes={notes} onNoteChange={handleUpdateNotes} attendance={attendance} onAttendanceChange={handleUpdateAttendance} onUpdateProgram={isAdmin ? handleUpdateProgram : undefined} isAdmin={isAdmin} onAddSuggestion={handleAddSuggestion} userName={authSession.userName} /></div>)}
          {view === 'organogram' && (<div className="relative"><button onClick={() => setView('dashboard')} className="fixed top-24 left-4 z-30 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-500 hover:text-slate-800"><ArrowLeft size={20}/></button><Organogram data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin} eventType={selectedEventType} isAttendantOverseer={isAttendantOverseer} isParkingOverseer={isParkingOverseer} allowedDepartments={hasOverseerPrivileges ? myOverseerDepartments : []} /></div>)}
          {view === 'cleaning' && (<div className="relative"><button onClick={() => setView('dashboard')} className="fixed top-24 left-4 z-30 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-500 hover:text-slate-800"><ArrowLeft size={20}/></button><CleaningManagement data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin} /></div>)}
          {view === 'general_info' && <GeneralInfo data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin} onBack={() => setView('dashboard')} onForceRestore={handleForceRestoreFromBackup} isSuperAdmin={isSuperAdmin} currentProgram={program} currentNotes={notes} currentAttendance={attendance} currentEventType={selectedEventType} onResetProgram={handleResetEventConfig} onOpenCloud={handleOpenCloudModal} />}
          {view === 'attendants' && (<div className="relative"><button onClick={() => setView('dashboard')} className="fixed top-24 left-4 z-30 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-500 hover:text-slate-800"><ArrowLeft size={20}/></button><AttendantManager data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin || isAttendantOverseer} /></div>)}
          {view === 'parking' && (<div className="relative"><button onClick={() => setView('dashboard')} className="fixed top-24 left-4 z-30 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-500 hover:text-slate-800"><ArrowLeft size={20}/></button><ParkingManagement data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin || isParkingOverseer} /></div>)}
          {view === 'sharing' && <SharingCenter eventId={authSession.eventId} onBack={() => setView('dashboard')} cloudUrl={cloudUrl} cloudKey={cloudKey} cloudPass={cloudPass} orgData={orgData} />}
       </main>

       {showOrganogramPinModal && (<div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in relative overflow-hidden"><button onClick={() => { setShowOrganogramPinModal(false); setOrganogramPinError(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button><div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-500"><Lock size={32}/></div><h3 className="text-xl font-bold text-slate-800 mb-2">Acesso Restrito</h3><p className="text-sm text-slate-500 mb-6">Digite o PIN da equipe.</p><form onSubmit={handleOrganogramPinSubmit}><input type="password" inputMode="numeric" className="w-full text-center text-2xl font-bold tracking-widest py-3 border-b-2 border-slate-200 outline-none focus:border-brand-500 bg-transparent mb-4 text-slate-800" placeholder="••••" maxLength={10} value={organogramPinInput} onChange={(e) => { setOrganogramPinInput(e.target.value); setOrganogramPinError(''); }} autoFocus />{organogramPinError && <p className="text-xs font-bold text-red-500 mb-4 animate-pulse">{organogramPinError}</p>}<button type="submit" className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 transition-all">Acessar</button></form></div></div>)}
       {showReportModal && (<div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fade-in"><h3 className="font-bold text-slate-800 text-lg mb-4 text-center flex items-center justify-center gap-2">{reportPeriod === 'morning' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-500" />} Informar Assistência</h3><div className="mb-4 text-center"><span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${reportPeriod === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{reportPeriod === 'morning' ? 'Turno da Manhã' : 'Turno da Tarde'}</span></div><input type="number" className="w-full text-center text-4xl font-bold text-slate-800 py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-brand-500 outline-none mb-6" placeholder="0" autoFocus value={reportValue} onChange={(e) => setReportValue(e.target.value)} /><div className="flex gap-3"><button onClick={() => setShowReportModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button><button onClick={handleReportAttendance} disabled={!reportValue || reportSent} className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-2">{reportSent ? <Check size={20}/> : <Send size={18}/>}{reportSent ? 'Enviado!' : 'Enviar'}</button></div></div></div>)}
    </div>
  );
};
