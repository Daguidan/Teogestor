import React, { useState, useEffect, useMemo } from 'react';
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
  Upload,
  RefreshCw,
  Download
} from 'lucide-react';
import { DEFAULT_SECTORS } from './constants';

// Helper functions for robust matching
const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^\w\s]/gi, '') // Remove non-alphanumeric chars except space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .toLowerCase()
    .trim();
};

const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, ''); // Remove all non-digit characters
};

const nameMatches = (loginName: string, fullName: string): boolean => {
  if (!loginName || !fullName) return false;
  return normalizeString(fullName).startsWith(normalizeString(loginName));
};

// FIX: Relaxed empty check. Event is NOT empty if it has congregations, even if committee is null.
const isOrgEmpty = (org: OrgStructure | null) => {
    if (!org) return true;
    const hasCommittee = org.committee && Object.values(org.committee).some(v => v !== null);
    const hasCongregations = org.generalInfo?.congregations && org.generalInfo.congregations.length > 0;
    // It is empty ONLY if NO committee members AND NO congregations.
    return !hasCommittee && !hasCongregations;
};

// Helper to find a department across all possible lists (Assembly & Convention)
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

const App: React.FC = () => {
  // --- STATE ---
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
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
  
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [initialManagementType, setInitialManagementType] = useState<'ASSEMBLY' | 'CONVENTION' | null>(null);
  
  const [isRepairingSession, setIsRepairingSession] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const [loginError, setLoginError] = useState('');
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);

  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudUrl, setCloudUrl] = useState('');
  const [cloudKey, setCloudKey] = useState('');
  const [cloudPass, setCloudPass] = useState('');
  
  const [providerEventList, setProviderEventList] = useState<ProviderEventInfo[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [providerNewEventId, setProviderNewEventId] = useState('');
  const [providerNewEventType, setProviderNewEventType] = useState<'ASSEMBLY' | 'CONVENTION'>('ASSEMBLY');
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [pixFeedback, setPixFeedback] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportValue, setReportValue] = useState('');
  const [reportSectorId, setReportSectorId] = useState('');
  const [reportPeriod, setReportPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [reportSent, setReportSent] = useState(false);
  
  const [showOrganogramPinModal, setShowOrganogramPinModal] = useState(false);
  const [organogramPinInput, setOrganogramPinInput] = useState('');
  const [organogramPinError, setOrganogramPinError] = useState('');
  
  const [selectedUserCongId, setSelectedUserCongId] = useState(() => SecureStorage.getItem('user_congregation_id', ''));

  const [potentialMatches, setPotentialMatches] = useState<VolunteerData[]>([]);
  const [isDisambiguationRequired, setIsDisambiguationRequired] = useState(false);
  const [disambiguationPhoneInput, setDisambiguationPhoneInput] = useState('');
  const [confirmedVolunteer, setConfirmedVolunteer] = useState<VolunteerData | null>(null);

  // --- PRE-LOAD DATA FUNCTION ---
  const preLoadEventData = async (eventId: string) => {
    if (CloudService.getConfig()) {
        try {
            const res = await CloudService.loadEvent(eventId);
            
            if (res.error) {
               console.error("Cloud Error:", res.error);
               return; 
            }

            if (res.data) {
                // Determine event type first
                let type = res.data.type as EventType;
                if (type) {
                    setSelectedEventType(type);
                    SecureStorage.setItem(`${eventId}_last_event_type`, type);
                } else {
                    type = 'BETHEL_REP'; 
                }

                if (res.data.org) {
                    setOrgData(res.data.org as OrgStructure);
                    const isConventionType = type === 'REGIONAL_CONVENTION';
                    const structKey = isConventionType ? `${eventId}_CONVENTION_structure` : `${eventId}_structure`;
                    SecureStorage.setItem(structKey, res.data.org);
                }
                
                if (res.data.program) {
                    setProgram(res.data.program as AssemblyProgram);
                    SecureStorage.setItem(`${eventId}_program_${res.data.program.type}`, res.data.program);
                }
            }
        } catch (e) {
            console.error("Pre-load failed", e);
        }
    }
  };

  // --- SHORT LINK REDIRECT LOGIC ---
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

              let tokenParam = '';
              if (window.location.hash && window.location.hash.includes('token=')) {
                 const hashStr = window.location.hash.substring(1); 
                 const hashParams = new URLSearchParams(hashStr);
                 tokenParam = hashParams.get('token') || '';
                 if (!tokenParam && hashStr.includes('token=')) {
                     const parts = hashStr.split('token=');
                     if (parts.length > 1) tokenParam = parts[1].split('&')[0];
                 }
              }
              if (!tokenParam) {
                 const params = new URLSearchParams(window.location.search);
                 tokenParam = params.get('token') || '';
              }

              let configConfigured = false;

              if (tokenParam) {
                 try {
                    const base64 = decodeURIComponent(tokenParam);
                    const binaryStr = atob(base64);
                    const jsonStr = decodeURIComponent(escape(binaryStr));
                    const config = JSON.parse(jsonStr);
                    
                    if (config.cId && config.cKey) {
                       const finalUrl = config.cId.includes('http') ? config.cId : `https://${config.cId}.supabase.co`;
                       setCloudUrl(finalUrl);
                       setCloudKey(config.cKey);
                       setCloudPass(config.cPass || '');
                       CloudService.configure(finalUrl, config.cKey, config.cPass || ''); 
                       configConfigured = true;
                       
                       await preLoadEventData(eventId);
                    }
                 } catch (e) {
                    console.error("Error parsing token from URL", e);
                 }
              }

              if (!configConfigured) {
                 const savedConfig = CloudService.getConfig();
                 if (savedConfig) {
                    setCloudUrl(savedConfig.url);
                    setCloudKey(savedConfig.key);
                    setCloudPass(savedConfig.encryptionPass || '');
                    CloudService.init();
                    await preLoadEventData(eventId);
                 }
              }

              window.history.replaceState({}, '', '/');
            }
        } catch (error) {
            console.error("Redirect error", error);
        } finally {
            setIsInitializing(false);
        }
      }
    };
    
    handleRedirect();
  }, []);

  const handleLogout = () => {
    setAuthSession(null);
    setOrgData(INITIAL_STRUCTURE);
    setProgram(PROGRAM_BETHEL);
    setNotes({});
    setAttendance({});
    setLoginPin(''); 
    setLoginError(''); 
    setShowTypeSelection(false); 
    setSelectedEventType(null);
    setShowAdminModal(false); 
    setAcceptedTerms(false); 
    setConfirmedVolunteer(null); 
    setIsDisambiguationRequired(false);
    setSelectedUserCongId('');
    setView('dashboard');
    
    SecureStorage.setItem('active_session', null); 
    SecureStorage.setItem('user_congregation_id', '');
    
    const params = new URLSearchParams(window.location.search);
    const publicId = params.get('id') || params.get('event');
    if (publicId) { 
      setLoginEventId(publicId); 
      setIsDirectLink(true); 
    } else {
      setLoginEventId('');
      setIsDirectLink(false);
    }
  };

  const fetchProviderEvents = async () => {
    if (!CloudService.getConfig()) return;
    setIsLoadingEvents(true);
    const result = await CloudService.listAllEvents();
    if (result.data) {
      setProviderEventList(result.data);
    } else {
      alert("Erro ao carregar eventos: " + result.error);
    }
    setIsLoadingEvents(false);
  };

  useEffect(() => {
    if (authSession?.isSuperAdmin) {
      fetchProviderEvents();
    }
  }, [authSession?.isSuperAdmin]);


  useEffect(() => {
    let activeSession = SecureStorage.getItem<AuthSession | null>('active_session', null);
    if (activeSession) {
      // AUTO-FIX: Se for MASTER e não tiver isSuperAdmin, adiciona.
      if (activeSession.eventId === 'MASTER' && !activeSession.isSuperAdmin) {
          activeSession.isSuperAdmin = true;
          activeSession.role = 'admin';
          SecureStorage.setItem('active_session', activeSession);
      }

      const isLegacySession = activeSession.role !== 'public' && !activeSession.isSuperAdmin && !activeSession.managementType;
      
      if (isLegacySession) {
        setIsRepairingSession(true);
        setAuthSession(activeSession);
        return; 
      }
      
      const isValid = (Date.now() - activeSession.timestamp) < (7 * 24 * 60 * 60 * 1000);
      if (isValid) {
        setAuthSession(activeSession);
        if (activeSession.role !== 'public' && !activeSession.isTemplate) {
          const lastType = SecureStorage.getItem<EventType | null>(`${activeSession.eventId}_last_event_type`, null);
          if (lastType) {
            setSelectedEventType(lastType);
          } else {
            if (activeSession.managementType === 'CONVENTION') {
              setSelectedEventType('REGIONAL_CONVENTION');
            } else if (activeSession.managementType === 'ASSEMBLY') {
              setShowTypeSelection(true);
            }
          }
        }
      } else {
        handleLogout();
      }
    }

    const savedConfig = CloudService.getConfig();
    if (savedConfig) {
      setCloudUrl(savedConfig.url);
      setCloudKey(savedConfig.key);
      setCloudPass(savedConfig.encryptionPass || '');
      CloudService.init();
    }

    setAvailableEvents(SecureStorage.listLocalEvents());

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const idParam = params.get('id');

    if (idParam) {
        setLoginEventId(idParam);
        setIsDirectLink(true);
    }

    if (token) {
       try {
          let config;
          try {
             const base64 = decodeURIComponent(token);
             const json = decodeURIComponent(escape(atob(base64)));
             config = JSON.parse(json);
          } catch {
             const json = atob(token);
             config = JSON.parse(json);
          }

          if (config.cId && config.cKey) {
             const finalUrl = config.cId.includes('http') ? config.cId : `https://${config.cId}.supabase.co`;
             setCloudUrl(finalUrl);
             setCloudKey(config.cKey);
             setCloudPass(config.cPass || '');
             CloudService.configure(finalUrl, config.cKey, config.cPass || ''); 
             if (config.target) {
                setLoginEventId(config.target);
                setIsDirectLink(true);
             }
             if (config.mType) setInitialManagementType(config.mType); 
             if(!config.target) {
               setShowAdminModal(false);
             }
          }
       } catch (e) { console.error("Invalid token", e); }
    }
  }, []);

  useEffect(() => {
    const loadDataForSession = async () => {
      let eventKey = authSession ? authSession.eventId : loginEventId;
      if (!eventKey) return;
      
      // Determine Event Type
      let eventTypeForLoading = selectedEventType;
      
      // Force read if unknown and public
      if (!eventTypeForLoading && (authSession?.role === 'public' || isDirectLink)) {
         eventTypeForLoading = SecureStorage.getItem<EventType | null>(`${eventKey}_last_event_type`, null);
         if (eventTypeForLoading) {
             setSelectedEventType(eventTypeForLoading);
         } else if (CloudService.getConfig()) {
             const cloudData = await CloudService.loadEvent(eventKey);
             if (cloudData.data?.type) {
                 eventTypeForLoading = cloudData.data.type as EventType;
                 SecureStorage.setItem(`${eventKey}_last_event_type`, eventTypeForLoading);
                 setSelectedEventType(eventTypeForLoading);
             }
         }
      }
      
      if (!authSession && !isDirectLink) return;
      if (showTypeSelection && authSession?.managementType === 'ASSEMBLY') return;
      if (isRepairingSession) return;
      
      const isTemplateEdit = authSession?.isTemplate;
      
      if (!isTemplateEdit && !eventTypeForLoading && authSession?.role !== 'public' && !authSession?.isSuperAdmin && !isDirectLink) return;

      // CRITICAL FIX: If user is public/admin via link, and we already have populated data (from preLoad), do NOT overwrite it with empty local storage
      if (!isOrgEmpty(orgData)) {
          // Double check: if orgData matches the logged in event, keep it!
          // This prevents the "blank screen" after a successful cloud load in Incognito.
          return; 
      }

      let baseProgram = PROGRAM_BETHEL;

      // --- ROBUST DATA LOADING: ATTEMPT 1 (Direct Match) ---
      let isConventionType = eventTypeForLoading === 'REGIONAL_CONVENTION' || authSession?.managementType === 'CONVENTION';
      const correctStructKey = isConventionType ? `${eventKey}_CONVENTION_structure` : `${eventKey}_structure`;
      let loadedOrg = SecureStorage.getItem<OrgStructure | null>(correctStructKey, null);

      // --- ROBUST DATA LOADING: ATTEMPT 2 (Type Mismatch Check) ---
      // If we didn't find data with the expected type, try the OTHER type.
      // This happens if the user created an "Assembly" but the system defaulted to "Convention" check or vice-versa.
      if (isOrgEmpty(loadedOrg)) {
          const altKey = !isConventionType ? `${eventKey}_CONVENTION_structure` : `${eventKey}_structure`;
          const altOrg = SecureStorage.getItem<OrgStructure | null>(altKey, null);
          if (!isOrgEmpty(altOrg)) {
              loadedOrg = altOrg;
              // We found it! Correct the state.
              const realType = !isConventionType ? 'REGIONAL_CONVENTION' : 'BETHEL_REP';
              setSelectedEventType(realType);
              isConventionType = !isConventionType;
              if (authSession?.role === 'public') SecureStorage.setItem(`${eventKey}_last_event_type`, realType);
          }
      }

      // --- ROBUST DATA LOADING: ATTEMPT 3 (ID Variations Check) ---
      // Common issue: User types "GO 003 A" (spaces) but saved as "GO-003-A" (dashes).
      if (isOrgEmpty(loadedOrg) && (authSession?.role === 'public' || isDirectLink)) {
         const variations = [
             eventKey.replace(/ /g, '-'), // Try with dashes
             eventKey.replace(/-/g, ' '), // Try with spaces
             eventKey.trim()
         ];

         for (const variant of variations) {
             if (variant === eventKey) continue;
             
             // Try Assembly for variant
             let attempt = SecureStorage.getItem<OrgStructure | null>(`${variant}_structure`, null);
             if (!isOrgEmpty(attempt)) {
                 loadedOrg = attempt;
                 eventKey = variant; // Found it! Update key
                 if (authSession) { authSession.eventId = variant; SecureStorage.setItem('active_session', authSession); }
                 
                 // If we found an Assembly structure but thought it was Convention, switch back
                 if (isConventionType) {
                    setSelectedEventType('BETHEL_REP');
                    isConventionType = false;
                 }
                 break;
             }

             // Try Convention for variant
             attempt = SecureStorage.getItem<OrgStructure | null>(`${variant}_CONVENTION_structure`, null);
             if (!isOrgEmpty(attempt)) {
                 loadedOrg = attempt;
                 eventKey = variant; // Found it! Update key
                 if (authSession) { authSession.eventId = variant; SecureStorage.setItem('active_session', authSession); }
                 
                 setSelectedEventType('REGIONAL_CONVENTION');
                 isConventionType = true;
                 break;
             }
         }
      }

      let loadedProgram: AssemblyProgram | null = eventTypeForLoading ? SecureStorage.getItem<AssemblyProgram | null>(`${eventKey}_program_${eventTypeForLoading}`, null) : null;

      // --- CLOUD RESCUE: SAFETY NET FOR INCOGNITO/NEW DEVICES ---
      // If local storage returned nothing (common in Private Tabs or new devices accessing via link),
      // we attempt to fetch data again from the Cloud. This handles race conditions where the pre-load
      // might have finished but didn't persist to local storage in time for this effect.
      if (isOrgEmpty(loadedOrg) && CloudService.getConfig()) {
          try {
              const cloudRes = await CloudService.loadEvent(eventKey);
              if (cloudRes.data) {
                  if (cloudRes.data.org) loadedOrg = cloudRes.data.org;
                  if (cloudRes.data.program) loadedProgram = cloudRes.data.program;
                  if (cloudRes.data.type) {
                      setSelectedEventType(cloudRes.data.type as EventType);
                      // Update derived flags based on fetched type
                      isConventionType = cloudRes.data.type === 'REGIONAL_CONVENTION';
                  }
                  
                  // Persist fetched data to avoid re-fetching on reload
                  if(loadedOrg) SecureStorage.setItem(isConventionType ? `${eventKey}_CONVENTION_structure` : `${eventKey}_structure`, loadedOrg);
                  if(loadedProgram && cloudRes.data.type) SecureStorage.setItem(`${eventKey}_program_${cloudRes.data.type}`, loadedProgram);
              }
          } catch (e) {
              console.error("Cloud rescue failed", e);
          }
      }

      // Legacy Rescue (Old keys cleanup)
      if (isOrgEmpty(loadedOrg) && authSession && authSession.managementType) {
        const wrongKey = authSession.managementType === 'ASSEMBLY' 
            ? `${eventKey}_CONVENTION_structure` 
            : `${eventKey}_structure`;
        const rescueData = SecureStorage.getItem<OrgStructure | null>(wrongKey, null);
        if (rescueData && !isOrgEmpty(rescueData)) {
            loadedOrg = rescueData; 
            SecureStorage.setItem(correctStructKey, rescueData); 
            localStorage.removeItem(`congass_enc_${wrongKey}`);
        }
      }
      
      const shouldLoadFromCloud = (isOrgEmpty(loadedOrg) || isDirectLink) && CloudService.getConfig() && eventKey;
      
      if (shouldLoadFromCloud && !loadedOrg) { // Only fetch if we haven't already rescued it above
           const res = await CloudService.loadEvent(eventKey);
           if (res.data) {
               if(res.data.org) { 
                   loadedOrg = res.data.org; 
                   SecureStorage.setItem(correctStructKey, loadedOrg); 
               }
               if(res.data.program) { 
                   loadedProgram = res.data.program; 
                   SecureStorage.setItem(`${eventKey}_program_${res.data.program.type}`, loadedProgram); 
               }
               if(res.data.type && !selectedEventType) {
                   setSelectedEventType(res.data.type as EventType);
               }
           }
      }

      if(eventTypeForLoading) {
        switch (eventTypeForLoading) {
            case 'CIRCUIT_OVERSEER': baseProgram = PROGRAM_CO; break;
            case 'REGIONAL_CONVENTION': baseProgram = PROGRAM_CONVENTION; break;
            default: baseProgram = PROGRAM_BETHEL; break;
        }
      }
      
      const baseStructure = isConventionType ? INITIAL_STRUCTURE_CONVENTION : INITIAL_STRUCTURE;
      let finalOrgData: OrgStructure;
      
      if (loadedOrg) {
        const mergeWithDefaults = (data: any, defaults: any): any => {
          if (typeof defaults !== 'object' || defaults === null) return data;
          let result = { ...data };
          for (const key in defaults) {
            if (!(key in result) || result[key] === undefined) {
              result[key] = defaults[key]; 
            } else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
              result[key] = mergeWithDefaults(result[key], defaults[key]); 
            }
          }
          return result;
        };
        finalOrgData = mergeWithDefaults(loadedOrg, baseStructure);
      } else {
        finalOrgData = JSON.parse(JSON.stringify(baseStructure));
      }
      
      if (finalOrgData) {
        const isConventionData = finalOrgData.coordDepartments !== undefined; 
        if (isConventionData) {
            if (!finalOrgData.coordDepartments || finalOrgData.coordDepartments.length === 0) {
                finalOrgData.coordDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE_CONVENTION.coordDepartments));
            }
            if (!finalOrgData.progDepartments || finalOrgData.progDepartments.length === 0) {
                finalOrgData.progDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE_CONVENTION.progDepartments));
            }
            if (!finalOrgData.roomDepartments || finalOrgData.roomDepartments.length === 0) {
                finalOrgData.roomDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE_CONVENTION.roomDepartments));
            }
        } else {
            if (!finalOrgData.aoDepartments || finalOrgData.aoDepartments.length === 0) {
                finalOrgData.aoDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE.aoDepartments));
            }
            if (!finalOrgData.aaoDepartments || finalOrgData.aaoDepartments.length === 0) {
                finalOrgData.aaoDepartments = JSON.parse(JSON.stringify(INITIAL_STRUCTURE.aaoDepartments));
            }
        }
      }
      
      if (JSON.stringify(finalOrgData) !== JSON.stringify(loadedOrg)) {
        SecureStorage.setItem(correctStructKey, finalOrgData);
      }

      setOrgData(finalOrgData);
      if(loadedProgram || eventTypeForLoading) {
          setProgram((loadedProgram || baseProgram) as AssemblyProgram);
      } else {
          setProgram(baseProgram);
      }
      
      if (authSession && !authSession.isTemplate) {
        const savedNotes = SecureStorage.getItem<Record<string, string>>(`${eventKey}_notes`, {});
        const savedAttendance = SecureStorage.getItem<Record<string, string>>(`${eventKey}_attendance`, {});
        setNotes(savedNotes);
        setAttendance(savedAttendance);
      }
    };

    loadDataForSession();
  }, [authSession, selectedEventType, showTypeSelection, isDirectLink, loginEventId, isRepairingSession]);

  useEffect(() => {
    setConfirmedVolunteer(null);
    setIsDisambiguationRequired(false);
    setPotentialMatches([]);
    
    const userName = authSession?.userName;
    if (!userName || authSession?.role !== 'public' || !selectedUserCongId) {
      return;
    }
    
    const selectedCongName = orgData.generalInfo?.congregations?.find(c => c.id === selectedUserCongId)?.name;
    if (!selectedCongName) return;

    const allVolunteersInCong: VolunteerData[] = [];
    const seenNames = new Set<string>();

    const addVolunteer = (v: VolunteerData | null) => {
      if (v && v.name && v.congregation && normalizeString(v.congregation) === normalizeString(selectedCongName) && !seenNames.has(normalizeString(v.name))) {
        allVolunteersInCong.push(v);
        seenNames.add(normalizeString(v.name));
      }
    };
    
    if (orgData.committee) {
      Object.values(orgData.committee).forEach(v => addVolunteer(v));
    }
    
    const allDepts = [
      ...(orgData.aoDepartments || []), ...(orgData.aaoDepartments || []),
      ...(orgData.coordDepartments || []), ...(orgData.progDepartments || []),
      ...(orgData.roomDepartments || [])
    ];
    allDepts.forEach(dept => {
      addVolunteer(dept.overseer);
      dept.assistants.forEach(v => addVolunteer(v));
    });
    
    if (orgData.parkingData) {
      orgData.parkingData.forEach(sector => {
        addVolunteer(sector.morningVol1);
        addVolunteer(sector.morningVol2);
        addVolunteer(sector.afternoonVol1);
        addVolunteer(sector.afternoonVol2);
      });
    }
    
    if (orgData.generalInfo?.congregations) {
        const cong = orgData.generalInfo.congregations.find(c => c.id === selectedUserCongId);
        if (cong && cong.cleaningResponsable) {
            const volunteer: VolunteerData = {
                name: cong.cleaningResponsable,
                congregation: cong.name,
                phone: cong.cleaningResponsablePhone || '',
                email: '',
                lgpdConsent: true,
            };
            addVolunteer(volunteer);
        }
    }

    if (orgData.attendantsData) {
        orgData.attendantsData.forEach(attendant => {
            const volunteersToAdd = [
                { name: attendant.morning_vol1_name, phone: attendant.morning_vol1_phone, congId: attendant.morning_vol1_congId },
                { name: attendant.morning_vol2_name, phone: attendant.morning_vol2_phone, congId: attendant.morning_vol2_congId },
                { name: attendant.afternoon_vol1_name, phone: attendant.afternoon_vol1_phone, congId: attendant.afternoon_vol1_congId },
                { name: attendant.afternoon_vol2_name, phone: attendant.afternoon_vol2_phone, congId: attendant.afternoon_vol2_congId },
            ];

            volunteersToAdd.forEach(vol => {
                if (vol.name && vol.congId === selectedUserCongId) {
                    const volunteer: VolunteerData = {
                        name: vol.name,
                        congregation: selectedCongName,
                        phone: vol.phone || '',
                        email: '',
                        lgpdConsent: true,
                    };
                    addVolunteer(volunteer);
                }
            });
        });
    }

    const matches = allVolunteersInCong.filter(v => nameMatches(userName, v.name));

    if (matches.length > 0) {
      if (matches.length === 1 && normalizeString(matches[0].name) === normalizeString(userName)) {
        setConfirmedVolunteer(matches[0]);
      } else {
        setPotentialMatches(matches);
        setIsDisambiguationRequired(true);
      }
    }
  }, [authSession, selectedUserCongId, orgData]);

  const handleRepairSession = (type: 'ASSEMBLY' | 'CONVENTION') => {
    if (!authSession) return;
    const repairedSession = { ...authSession, managementType: type };
    setAuthSession(repairedSession);
    SecureStorage.setItem('active_session', repairedSession);
    setIsRepairingSession(false);
    if (type === 'ASSEMBLY') {
      setShowTypeSelection(true);
    } else {
      setSelectedEventType('REGIONAL_CONVENTION');
    }
  };

  const handleCongregationSelect = (congId: string) => { SecureStorage.setItem('user_congregation_id', congId); setSelectedUserCongId(congId); };
  const handleDisambiguationSubmit = () => {
    if (!disambiguationPhoneInput) return;
    const normalizedInputPhone = normalizePhone(disambiguationPhoneInput);
    const match = potentialMatches.find(v => normalizePhone(v.phone) === normalizedInputPhone);
    if (match) { setConfirmedVolunteer(match); setIsDisambiguationRequired(false); setDisambiguationPhoneInput(''); } 
    else { alert("Telefone não encontrado."); }
  };
  const selectedCong = useMemo(() => orgData.generalInfo?.congregations?.find(c => c.id === selectedUserCongId), [orgData, selectedUserCongId]);
  const myAttendantAssignments = useMemo(() => {
    const userName = confirmedVolunteer?.name; const attendantsData = orgData.attendantsData || [];
    if (!userName || !selectedUserCongId) return [];
    const assignments: { sectorId: string, period: string, customName?: string, canReport: boolean, rawPeriod: 'morning' | 'afternoon' }[] = [];
    attendantsData.forEach(a => {
        let isMorning = false; let isAfternoon = false;
        if (a.morning_vol1_congId === selectedUserCongId && normalizeString(userName) === normalizeString(a.morning_vol1_name || '')) isMorning = true;
        if (a.morning_vol2_congId === selectedUserCongId && normalizeString(userName) === normalizeString(a.morning_vol2_name || '')) isMorning = true;
        if (a.afternoon_vol1_congId === selectedUserCongId && normalizeString(userName) === normalizeString(a.afternoon_vol1_name || '')) isAfternoon = true;
        if (a.afternoon_vol2_congId === selectedUserCongId && normalizeString(userName) === normalizeString(a.afternoon_vol2_name || '')) isAfternoon = true;
        if (isMorning) assignments.push({ sectorId: a.sectorId, period: 'Manhã', customName: a.customName, canReport: true, rawPeriod: 'morning' });
        if (isAfternoon) assignments.push({ sectorId: a.sectorId, period: 'Tarde', customName: a.customName, canReport: true, rawPeriod: 'afternoon' });
    }); return assignments;
  }, [confirmedVolunteer, orgData.attendantsData, selectedUserCongId]);
  const myOrganogramAssignments = useMemo(() => {
     const userName = confirmedVolunteer?.name; if (!userName) return [];
     const assignments: { role: string, dept: string }[] = [];
     const checkVolunteer = (v: VolunteerData | null, r: string, d: string) => { if (v && v.name && normalizeString(userName) === normalizeString(v.name)) { assignments.push({ role: r, dept: d }); } };
     if (orgData.committee) { Object.entries(orgData.committee).forEach(([key, value]) => checkVolunteer(value, key, 'Comissão')); }
     const allDepts = [ ...(orgData.aoDepartments || []), ...(orgData.aaoDepartments || []), ...(orgData.coordDepartments || []), ...(orgData.progDepartments || []), ...(orgData.roomDepartments || []) ];
     allDepts.forEach(d => { checkVolunteer(d.overseer, 'Encarregado', d.name); d.assistants.forEach(a => checkVolunteer(a, 'Assistente', d.name)); });
     return assignments;
  }, [confirmedVolunteer, orgData]);
  
  const hasOrganogramRole = myOrganogramAssignments.length > 0;
  const publicAnnouncements = useMemo(() => orgData.generalInfo?.publicAnnouncements, [orgData]);
  const openReportModal = (sId: string, p: 'morning' | 'afternoon') => { setReportSectorId(sId); setReportPeriod(p); setShowReportModal(true); };

  const handleLogin = (e: React.FormEvent, mode: 'public' | 'admin') => {
    e.preventDefault();
    setLoginError('');
    const normalizedId = loginEventId.trim().toUpperCase();

    // PUBLIC LOGIN (With Data Preservation Fix)
    if (mode === 'public') {
        if (!normalizedId) { setLoginError('ID do Evento não encontrado.'); return; }
        
        // Try to recover event type from previous session or preload
        const preloadedType = SecureStorage.getItem<EventType | null>(`${normalizedId}_last_event_type`, null);
        if (preloadedType) {
            setSelectedEventType(preloadedType);
        }

        // AUTO-DETECT MANAGEMENT TYPE
        let mType: 'ASSEMBLY' | 'CONVENTION' = 'ASSEMBLY';
        if (orgData.coordDepartments && orgData.coordDepartments.length > 0) {
            mType = 'CONVENTION';
        } else if (selectedEventType === 'REGIONAL_CONVENTION') {
            mType = 'CONVENTION';
        }

        // CRITICAL FIX FOR INCOGNITO/NEW SESSIONS:
        // If we have data in memory (loaded via link) but local storage is empty,
        // we MUST save the memory data to storage NOW, before the session init logic wipes it.
        if (!isOrgEmpty(orgData) && isDirectLink) {
            const saveKey = mType === 'CONVENTION' ? `${normalizedId}_CONVENTION_structure` : `${normalizedId}_structure`;
            const storageCheck = SecureStorage.getItem(saveKey, null);
            
            // Only save if storage is actually empty to avoid overwriting existing local data
            if (!storageCheck) {
                SecureStorage.setItem(saveKey, orgData);
                // ALSO SAVE PROGRAM TO PREVENT "NO PROGRAM" ERROR
                SecureStorage.setItem(`${normalizedId}_program_${program.type}`, program);
            }
        }

        const session: AuthSession = { 
            eventId: normalizedId, 
            role: 'public', 
            timestamp: Date.now(), 
            userName: loginName.trim() || 'Visitante',
            managementType: mType 
        };
        
        setAuthSession(session);
        SecureStorage.setItem('active_session', session);
        setView('dashboard');
        return;
    }

    const pin = loginPin.trim();
    if (!normalizedId || !pin || !acceptedTerms) {
        setLoginError('Preencha todos os campos e aceite os termos.');
        return;
    }

    if (normalizedId === 'MASTER' && pin === APP_CONFIG.MASTER_PIN) {
        const session: AuthSession = { eventId: 'MASTER', role: 'admin', timestamp: Date.now(), userName: 'Provedor Master', isSuperAdmin: true };
        setAuthSession(session);
        SecureStorage.setItem('active_session', session);
        setShowAdminModal(false);
        setView('dashboard');
        return;
    }

    // Try to load data from storage
    let conventionData = SecureStorage.getItem<OrgStructure | null>(`${normalizedId}_CONVENTION_structure`, null);
    let assemblyData = SecureStorage.getItem<OrgStructure | null>(`${normalizedId}_structure`, null);

    // CRITICAL FIX FOR ADMIN IN INCOGNITO:
    // If storage is empty (new session) BUT we have data in memory (from link),
    // Use the memory data for validation and persistence.
    if (isOrgEmpty(conventionData) && isOrgEmpty(assemblyData) && !isOrgEmpty(orgData) && isDirectLink) {
        if (orgData.coordDepartments && orgData.coordDepartments.length > 0) {
            conventionData = orgData;
            SecureStorage.setItem(`${normalizedId}_CONVENTION_structure`, orgData);
        } else {
            assemblyData = orgData;
            SecureStorage.setItem(`${normalizedId}_structure`, orgData);
        }
    }

    const adminPin = (conventionData?.generalInfo?.teamAccessPin || assemblyData?.generalInfo?.teamAccessPin) || APP_CONFIG.ADMIN_PIN;
    const volunteerPin = (conventionData?.generalInfo?.volunteerAccessPin || assemblyData?.generalInfo?.volunteerAccessPin) || APP_CONFIG.VOLUNTEER_PIN;
    
    let role: UserRole | null = null;
    let session: AuthSession | null = null;

    if (pin === adminPin) role = 'admin';
    else if (pin === volunteerPin) role = 'volunteer';
    else {
        setLoginError('PIN incorreto.');
        return;
    }

    if (!isOrgEmpty(conventionData) && !isOrgEmpty(assemblyData)) {
        session = { eventId: normalizedId, role, timestamp: Date.now(), userName: loginName.trim() || (role === 'admin' ? 'Admin' : 'Voluntário') };
        setAuthSession(session);
        SecureStorage.setItem('active_session', session);
        setIsRepairingSession(true);
        setShowAdminModal(false);
        return;
    }

    // Default detection if not repairing
    let mType = initialManagementType;
    if (!mType) {
        if (selectedEventType === 'REGIONAL_CONVENTION') mType = 'CONVENTION';
        else if (selectedEventType) mType = 'ASSEMBLY';
        else mType = !isOrgEmpty(conventionData) ? 'CONVENTION' : 'ASSEMBLY';
    }
    
    session = { eventId: normalizedId, role, timestamp: Date.now(), userName: loginName.trim() || (role === 'admin' ? 'Admin' : 'Voluntário'), managementType: mType };
    
    if (role === 'volunteer') {
        const org = mType === 'CONVENTION' ? conventionData : assemblyData;
        const userName = session.userName;
        if (org && userName) {
            const indicatorsOverseer = findDepartmentByName(org, 'Indicadores')?.overseer;
            const parkingOverseer = findDepartmentByName(org, 'Estacionamento')?.overseer;

            if (indicatorsOverseer && normalizeString(indicatorsOverseer.name) === normalizeString(userName)) {
                session.departmentAccess = 'attendants';
            } else if (parkingOverseer && normalizeString(parkingOverseer.name) === normalizeString(userName)) {
                session.departmentAccess = 'parking';
            }
        }
    }
    
    setAuthSession(session);
    SecureStorage.setItem('active_session', session);
    setShowAdminModal(false);

    if (mType === 'CONVENTION') {
        handleSelectEventType('REGIONAL_CONVENTION', false);
    } else {
        const lastType = SecureStorage.getItem<EventType>(`${normalizedId}_last_event_type`, 'BETHEL_REP');
        if (lastType && lastType !== 'REGIONAL_CONVENTION') {
            handleSelectEventType(lastType, false);
        } else {
            setShowTypeSelection(true);
        }
    }
  };
  
  const handleOrganogramPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const volunteerPin = orgData.generalInfo?.volunteerAccessPin || APP_CONFIG.VOLUNTEER_PIN;
    if (organogramPinInput === volunteerPin) { setShowOrganogramPinModal(false); setOrganogramPinInput(''); setOrganogramPinError(''); setView('organogram'); } 
    else { setOrganogramPinError('PIN incorreto.'); }
  };

  const handleSelectEventType = (type: EventType, save: boolean = true) => {
     setSelectedEventType(type);
     if (save && authSession) SecureStorage.setItem(`${authSession.eventId}_last_event_type`, type);
     setShowTypeSelection(false);
     setView('dashboard');
  };
  
  const handleEditTemplate = (eventType: EventType) => {
    let templateId: string;
    let managementType: 'ASSEMBLY' | 'CONVENTION';

    switch (eventType) {
      case 'BETHEL_REP':
        templateId = TEMPLATE_EVENT_IDS.ASSEMBLY_BETHEL;
        managementType = 'ASSEMBLY';
        break;
      case 'CIRCUIT_OVERSEER':
        templateId = TEMPLATE_EVENT_IDS.ASSEMBLY_CO;
        managementType = 'ASSEMBLY';
        break;
      case 'REGIONAL_CONVENTION':
        templateId = TEMPLATE_EVENT_IDS.CONVENTION_REGIONAL;
        managementType = 'CONVENTION';
        break;
      default:
        return;
    }

    const templateSession: AuthSession = {
      eventId: templateId,
      role: 'admin',
      timestamp: Date.now(),
      userName: 'Editor de Modelo',
      isTemplate: true,
      managementType,
    };
    setAuthSession(templateSession);
    setSelectedEventType(eventType);
  };
  
  const handleReturnToProviderPanel = () => {
    const masterSession: AuthSession = { eventId: 'MASTER', role: 'admin', timestamp: Date.now(), userName: 'Provedor Master', isSuperAdmin: true };
    setAuthSession(masterSession);
    setSelectedEventType(null);
    setView('dashboard');
  };

  const handleUpdateOrg = (newData: OrgStructure) => {
    if (!newData) return;
    setOrgData(newData);
    if (authSession && selectedEventType) {
       const isConventionType = selectedEventType === 'REGIONAL_CONVENTION';
       const structKey = isConventionType ? `${authSession.eventId}_CONVENTION_structure` : `${authSession.eventId}_structure`;
       SecureStorage.setItem(structKey, newData);
    }
  };

  const handleForceRestoreFromBackup = async (fullBackup: any) => {
    if (!authSession) return;
    
    // Suporte a legado (só structure) e novo (appData completo)
    let structure, eventType, backupNotes, backupAttendance, backupProgram;

    if (fullBackup.appData) {
        // Novo formato
        structure = fullBackup.appData.structure;
        eventType = fullBackup.appData.eventType;
        backupNotes = fullBackup.appData.notes;
        backupAttendance = fullBackup.appData.attendance;
        backupProgram = fullBackup.appData.program;
    } else {
        // Formato antigo (apenas estrutura)
        structure = fullBackup;
        // Tenta inferir tipo
        eventType = structure.coordDepartments ? 'REGIONAL_CONVENTION' : 'BETHEL_REP';
    }

    if (!structure) {
      alert("Backup inválido.");
      return;
    }
    
    const currentIsConvention = authSession.managementType === 'CONVENTION';
    const wrongKey = currentIsConvention ? `${authSession.eventId}_structure` : `${authSession.eventId}_CONVENTION_structure`;
    localStorage.removeItem(`congass_enc_${wrongKey}`);

    handleUpdateOrg(structure);
    
    // Se tivermos o programa no backup, usamos. Se não, usamos o padrão.
    const programToSave = backupProgram || (eventType === 'BETHEL_REP' ? PROGRAM_BETHEL : (eventType === 'CIRCUIT_OVERSEER' ? PROGRAM_CO : PROGRAM_CONVENTION));
    setProgram(programToSave);
    SecureStorage.setItem(`${authSession.eventId}_program_${eventType}`, programToSave);
    
    if (eventType) {
        setSelectedEventType(eventType);
        SecureStorage.setItem(`${authSession.eventId}_last_event_type`, eventType);
    }

    if (backupNotes) {
      setNotes(backupNotes);
      SecureStorage.setItem(`${authSession.eventId}_notes`, backupNotes);
    }
    if (backupAttendance) {
      setAttendance(backupAttendance);
      SecureStorage.setItem(`${authSession.eventId}_attendance`, backupAttendance);
    }

    // AUTOMATIC CLOUD SYNC
    const config = CloudService.getConfig();
    if (config) {
        setSyncStatus('syncing');
        // Construct payload similar to handleSync('up')
        const payload = { 
            org: structure, 
            notes: backupNotes || {}, 
            attendance: backupAttendance || {}, 
            program: programToSave, 
            type: eventType, 
            version: APP_CONFIG.APP_VERSION 
        };
        
        try {
            const res = await CloudService.saveEvent(authSession.eventId, payload);
            if (res.error) {
                alert(`Backup restaurado localmente, mas falha ao sincronizar com nuvem: ${res.error}`);
                setSyncStatus('error');
            } else {
                alert(`Backup restaurado e sincronizado com a nuvem com sucesso!`);
                setSyncStatus('success');
            }
        } catch (e) {
            console.error("Auto sync failed", e);
            setSyncStatus('error');
        }
        setTimeout(() => setSyncStatus('idle'), 3000);
    } else {
        alert("Backup restaurado APENAS NESTE DISPOSITIVO. Para compartilhar, configure a Nuvem no ícone superior direito.");
    }
  };


  const handleUpdateAttendant = (sId: string, f: string, v: any) => {
      const cAtt = orgData.attendantsData || []; const idx = cAtt.findIndex(a => a.sectorId === sId);
      const nData = [...cAtt];
      if (idx !== -1) { nData[idx] = { ...nData[idx], [f]: v }; } else { nData.push({ sectorId: sId, countMorning: 0, countAfternoon: 0, [f]: v } as any); }
      handleUpdateOrg({ ...orgData, attendantsData: nData });
  };
  const handleReportAttendance = () => {
      if (!reportValue) return;
      handleUpdateAttendant(reportSectorId, reportPeriod === 'morning' ? 'countMorning' : 'afternoon', parseInt(reportValue) || 0);
      setReportSent(true); setTimeout(() => { setReportSent(false); setShowReportModal(false); setReportValue(''); }, 1500);
  };
  const handleAddSuggestion = (text: string) => {
     const newS: SuggestionEntry = { id: Date.now().toString(), text, date: new Date().toLocaleString(), isRead: false };
     const nData = { ...orgData }; if (!nData.generalInfo) nData.generalInfo = { reminders: '', congregations: [], suggestions: [] };
     if (!nData.generalInfo.suggestions) nData.generalInfo.suggestions = [];
     nData.generalInfo.suggestions.unshift(newS); handleUpdateOrg(nData);
  };
  const handleUpdateNotes = (id: string, text: string) => { const n = { ...notes, [id]: text }; setNotes(n); if (authSession) SecureStorage.setItem(`${authSession.eventId}_notes`, n); };
  const handleUpdateAttendance = (id: string, val: string) => { const a = { ...attendance, [id]: val }; setAttendance(a); if (authSession) SecureStorage.setItem(`${authSession.eventId}_attendance`, a); };
  const handleUpdateProgram = (nP: AssemblyProgram) => { if(!nP) return; setProgram(nP); if (authSession) SecureStorage.setItem(`${authSession.eventId}_program_${program.type}`, nP); };
  const handleCloudConfigSave = () => { if (CloudService.configure(cloudUrl, cloudKey, cloudPass)) { setShowCloudModal(false); setSyncStatus('idle'); alert("Conexão estabelecida!"); } else alert("Erro."); };
  
  const handleSync = async (direction: 'up' | 'down') => {
    if (!authSession) return; setSyncStatus('syncing'); CloudService.configure(cloudUrl, cloudKey, cloudPass);
    if (direction === 'up') {
       const payload = { org: orgData, notes: authSession.isTemplate ? {} : notes, attendance: authSession.isTemplate ? {} : attendance, program, type: selectedEventType, version: APP_CONFIG.APP_VERSION };
       const res = await CloudService.saveEvent(authSession.eventId, payload);
       if (res.error) { alert(`Erro: ${res.error}`); setSyncStatus('error'); } else setSyncStatus('success');
    } else {
       const res = await CloudService.loadEvent(authSession.eventId);
       if (res.error) { alert(`Erro: ${res.error}`); setSyncStatus('error'); } 
       else if (res.data) {
          if (res.data.type) setSelectedEventType(res.data.type as EventType);
          if (res.data.org) { handleUpdateOrg(res.data.org); }
          if (res.data.program) { handleUpdateProgram(res.data.program); }
          
          if (!authSession.isTemplate) {
            if (res.data.notes) { setNotes(res.data.notes); SecureStorage.setItem(`${authSession.eventId}_notes`, res.data.notes); }
            if (res.data.attendance) { setAttendance(res.data.attendance); SecureStorage.setItem(`${authSession.eventId}_attendance`, res.data.attendance); }
          }
          setSyncStatus('success');
          if(confirm("Sincronização concluída! Recarregar?")) window.location.reload();
       } else { alert("Nenhum dado encontrado na nuvem."); setSyncStatus('idle'); }
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleGenerateInvite = (targetId: string, type: 'provider' | 'admin' | 'public', managementType?: 'ASSEMBLY' | 'CONVENTION') => {
    // === NOVO: VERIFICAÇÃO DE NUVEM ===
    if (!cloudUrl || !cloudKey) {
        alert("⚠️ PARA GERAR LINKS, VOCÊ PRECISA DA NUVEM!\n\nSem a nuvem configurada (ícone no topo direito), o sistema não tem onde guardar os dados para os outros baixarem.\n\nAlternativa: Envie o arquivo de Backup para a pessoa (Menu Geral > Baixar Backup).");
        return;
    }
    // ===================================
    
    const baseUrl = window.location.origin;
    let text = '';
    
    // IMPORTANT: Include cPass for decryption
    const tokenConfig = { 
        cId: cloudUrl.replace('https://', '').replace('.supabase.co', ''), 
        cKey: cloudKey,
        cPass: cloudPass 
    };
    // SAFE ENCODING for URL (JSON -> encodeURIComponent (UTF8 safe) -> unescape (Binary safe) -> btoa (Base64) -> encodeURIComponent)
    const json = JSON.stringify(tokenConfig);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const token = encodeURIComponent(base64);
    
    // Using Hash Fragment (#) to avoid server-side processing/stripping of the token
    const shortUrl = `${baseUrl}/ir/${encodeURIComponent(targetId)}#token=${token}`;

    if (type === 'provider') {
       text = `🔐 *Convite Admin (${managementType})*\nID do Evento: ${targetId}\nLink de Acesso: ${shortUrl}\n\n⚠️ Lembrete: Este link concede acesso administrativo. Compartilhe com responsabilidade.`;
    } else if (type === 'admin') {
       const volunteerPin = orgData.generalInfo?.volunteerAccessPin || APP_CONFIG.VOLUNTEER_PIN;
       text = `🚀 *Convite Equipe*\n1. Acesse: ${shortUrl}\n2. Use o PIN 🔒: ${volunteerPin}\n\nLembrete: Ao compartilhar, você é responsável por ter o consentimento do voluntário para o uso de seus dados neste sistema.`;
    } else { // public
       text = `👋 *Programa Digital*\nPara anotações, horários e suas designações, acesse:\n${shortUrl}`;
    }
    navigator.clipboard.writeText(text); setCopyFeedback('Copiado!'); setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleCreateEventAndGenerateLink = async () => {
    if (!providerNewEventId) { alert("Por favor, insira um ID para o novo evento."); return; }
    setIsCreatingEvent(true); setCopyFeedback('Criando evento na nuvem...');
  
    try {
      const newEventId = providerNewEventId.trim().toUpperCase();
      
      const existingEvent = await CloudService.loadEvent(newEventId);
      if (existingEvent.data) {
        if (!confirm(`O evento "${newEventId}" já existe. Gerar novo link?`)) {
          setIsCreatingEvent(false); setCopyFeedback(''); return;
        }
        handleGenerateInvite(newEventId, 'provider', providerNewEventType); return;
      }
      
      let templateId: string = providerNewEventType === 'CONVENTION' ? TEMPLATE_EVENT_IDS.CONVENTION_REGIONAL : TEMPLATE_EVENT_IDS.ASSEMBLY_BETHEL;
  
      const templateRes = await CloudService.loadEvent(templateId);

      if(!templateRes.data) {
        alert("Modelo base não encontrado. Salve os modelos primeiro.");
        setIsCreatingEvent(false); setCopyFeedback('');
        return;
      }
      
      const saveRes = await CloudService.saveEvent(newEventId, templateRes.data);
      if (saveRes.error) throw new Error(saveRes.error);
      
      handleGenerateInvite(newEventId, 'provider', providerNewEventType);
      
    } catch (error) {
      alert(`Falha: ${error instanceof Error ? error.message : 'Erro'}`);
      setCopyFeedback('Erro ao criar evento.');
    } finally {
      setIsCreatingEvent(false);
      setTimeout(() => setCopyFeedback(''), 4000);
    }
  };

  const handleCopyPix = () => { navigator.clipboard.writeText("apoio@teogestor.app"); setPixFeedback('Chave Copiada!'); setTimeout(() => setPixFeedback(''), 2000); };
  const isAdmin = useMemo(() => authSession?.role === 'admin', [authSession]);
  const isSuperAdmin = useMemo(() => authSession?.isSuperAdmin === true, [authSession]);
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

  if (isInitializing) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-6 shadow-lg shadow-brand-200/50"></div>
            <p className="text-slate-500 font-extrabold text-lg animate-pulse tracking-wide uppercase">Iniciando Sistema...</p>
            <p className="text-xs text-slate-400 mt-2">Sincronizando dados criptografados</p>
        </div>
    );
  }

  if (!authSession) {
    return ( <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden"><div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-100/40 rounded-full blur-[100px] pointer-events-none"></div><div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in border border-white/60 relative z-10"><div className="bg-gradient-to-br from-brand-500 to-brand-600 p-8 text-center text-white relative"><Layout size={42} className="mx-auto mb-3 drop-shadow-md" /><h1 className="text-2xl font-extrabold">TeoGestor</h1><p className="text-brand-50 text-xs mt-1 font-bold">Gestão Teocrática Inteligente</p></div><form onSubmit={(e) => handleLogin(e, 'public')} className="p-8 space-y-6">{isDirectLink ? (<div className="text-center pb-4"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Acessando Evento</p><div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-50 text-brand-700 rounded-full font-bold text-xl border border-brand-100"><LinkIcon size={20}/> {loginEventId}</div></div>) : (<div className="relative group"><User className="absolute left-4 top-4 text-slate-300" size={20} /><input type="text" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 outline-none font-bold text-slate-800 uppercase text-lg" placeholder="EVENTO (Ex: GO-003 A)" value={loginEventId} onChange={e => setLoginEventId(e.target.value)} list="local-events"/><datalist id="local-events">{availableEvents.map(ev => <option key={ev} value={ev} />)}</datalist></div>)}<div className="relative group"><Users className="absolute left-4 top-4 text-slate-300" size={20} /><input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-brand-500 outline-none text-slate-800 font-semibold" placeholder="Seu Nome" value={loginName} onChange={e => setLoginName(e.target.value)}/></div>{loginError && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 border border-red-100"><AlertTriangle size={18}/> {loginError}</div>}
    
    <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
        <ShieldCheck className="text-emerald-600 shrink-0" size={20} />
        <p className="text-xs text-emerald-800 leading-relaxed">
            <strong>Segurança Garantida:</strong> O sistema é criptografado e os dados são salvos apenas localmente no seu dispositivo.
        </p>
    </div>
    
    <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl text-lg flex items-center justify-center gap-3"><BookOpen size={24}/> Entrar no Meu Espaço</button></form><div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-between items-center px-8"><span className="text-[10px] text-slate-300 font-bold tracking-widest">v{APP_CONFIG.APP_VERSION}</span><button onClick={() => setShowAdminModal(true)} className="text-slate-300 hover:text-slate-500 p-2"><Lock size={16}/></button></div>{showAdminModal && (<div className="absolute inset-0 bg-white z-20 flex flex-col animate-slide-up"><div className="bg-brand-900 p-8 text-white flex justify-between items-start"><div className="relative z-10"><h2 className="text-2xl font-bold">Acesso Restrito</h2><p className="text-brand-300 text-xs font-bold mt-1 uppercase">Gestão do Evento</p></div><button onClick={() => setShowAdminModal(false)} className="bg-white/10 p-2 rounded-full text-white"><X size={20}/></button></div><form onSubmit={(e) => handleLogin(e, 'admin')} className="flex-1 p-8 overflow-y-auto space-y-6"><div className="relative group"><User className="absolute left-4 top-4 text-slate-300" size={20} /><input type="text" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-600 outline-none font-bold text-slate-800 uppercase" placeholder="Ex: GO-003 A" value={loginEventId} onChange={e => setLoginEventId(e.target.value)}/></div><div className="relative group"><Users className="absolute left-4 top-4 text-slate-300" size={20} /><input type="text" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-600 outline-none text-slate-800 font-medium" placeholder="Seu Nome" value={loginName} onChange={e => setLoginName(e.target.value)}/></div><div className="relative group"><Key className="absolute left-4 top-4 text-slate-300" size={20} /><input type={showPassword ? "text" : "password"} className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-brand-600 outline-none text-slate-800 font-bold tracking-widest text-lg" placeholder="••••••••" value={loginPin} onChange={e => setLoginPin(e.target.value)}/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div><div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-3 mt-4"><div className="flex items-center gap-2 text-brand-800 font-bold border-b border-slate-200 pb-2 mb-2"><ShieldCheck size={16}/> Política de Uso & Privacidade</div><p className="leading-relaxed text-[10px] text-justify text-slate-500"><strong>Atenção:</strong> Este não é um site oficial das Testemunhas de Jeová. Não possui vínculo com jw.org.</p><p className="leading-relaxed text-[10px] text-justify text-slate-500"><strong>Segurança:</strong> Todos os dados são <strong>Criptografados</strong> e armazenados localmente.</p><label className="flex items-start gap-3 pt-3 border-t border-slate-200 cursor-pointer group"><input type="checkbox" className="peer sr-only" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}/><div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-brand-900 peer-checked:border-brand-900 flex items-center justify-center bg-white"><CheckSquare size={12} className="text-white opacity-0 peer-checked:opacity-100" /></div><span className="text-[11px] font-bold text-slate-600 group-hover:text-brand-900 select-none">Li e concordo com a política de privacidade.</span></label></div><button disabled={!acceptedTerms} type="submit" className="w-full bg-brand-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2"><Lock size={20}/> Entrar no Sistema</button></form></div>)}{showCloudModal && (<div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 p-8 flex flex-col items-center justify-center animate-fade-in"><div className="w-full max-w-xs space-y-6"><div className="text-center"><div className="bg-brand-50 text-brand-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-100 shadow-sm"><Cloud size={40}/></div><h3 className="font-bold text-slate-800 text-2xl">Configurar Nuvem</h3></div><div className="bg-amber-50 p-5 rounded-2xl border border-amber-100"><label className="block text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-1"><Key size={14}/> PIN do Evento</label><input type="password" className="w-full border border-amber-200 bg-white rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100" placeholder="Senha de Criptografia" value={cloudPass} onChange={e => setCloudPass(e.target.value)} /></div><div className="space-y-3"><button onClick={handleCloudConfigSave} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 shadow-lg">Confirmar Conexão</button><button onClick={() => setShowCloudModal(false)} className="w-full py-4 text-slate-400 hover:text-slate-600 text-sm font-bold">Pular</button></div></div></div>)}</div></div>)
  }
  
  if (isRepairingSession) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-4 animate-fade-in">
          <h2 className="text-center text-slate-800 font-extrabold mb-2 text-lg">Reparar Sessão</h2>
          <p className="text-center text-sm text-slate-500 mb-6">Detectamos uma sessão antiga. Confirme o tipo de evento que você gerencia.</p>
          <button onClick={() => handleRepairSession('ASSEMBLY')} className="w-full p-4 bg-white border-2 border-slate-100 hover:border-brand-400 hover:bg-brand-50/50 rounded-2xl flex items-center gap-4 transition-all group shadow-sm"><Layout size={24} className="text-brand-600"/><span className="font-bold text-slate-900 text-sm">Gestão de Assembleia</span></button>
          <button onClick={() => handleRepairSession('CONVENTION')} className="w-full p-4 bg-white border-2 border-slate-100 hover:border-purple-400 hover:bg-purple-50/50 rounded-2xl flex items-center gap-4 transition-all group shadow-sm"><Grid size={24} className="text-purple-600"/><span className="font-bold text-slate-900 text-sm">Gestão de Congresso</span></button>
          <div className="pt-4 border-t border-slate-100"></div>
          <button onClick={handleLogout} className="w-full mt-4 py-3 text-slate-400 text-xs font-bold hover:text-slate-700">Cancelar e Sair</button>
        </div>
      </div>
    );
  }

  if (showTypeSelection) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-4 animate-fade-in">
          <h2 className="text-center text-slate-800 font-extrabold mb-6 text-lg">Qual programa da Assembleia?</h2>
          <button onClick={() => handleSelectEventType('BETHEL_REP')} className="w-full p-4 bg-white border-2 border-slate-100 hover:border-brand-400 hover:bg-brand-50/50 rounded-2xl flex items-center gap-4 transition-all group shadow-sm"><Smartphone size={24} className="text-brand-600"/><span className="font-bold text-slate-900 text-sm">Assembleia com Rep. de Betel</span></button>
          <button onClick={() => handleSelectEventType('CIRCUIT_OVERSEER')} className="w-full p-4 bg-white border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl flex items-center gap-4 transition-all group shadow-sm"><Briefcase size={24} className="text-blue-600"/><span className="font-bold text-slate-900 text-sm">Assembleia com Sup. de Circuito</span></button>
          <div className="pt-4 border-t border-slate-100"></div>
          <button onClick={handleLogout} className="w-full mt-4 py-3 text-slate-400 text-xs font-bold hover:text-slate-700">Cancelar e Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
       <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0"><div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-brand-100/30 rounded-full blur-[120px]"></div><div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-100/30 rounded-full blur-[120px]"></div></div>
       
       <header className="fixed top-4 left-4 right-4 z-40 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl px-4 py-3 flex justify-between items-center shadow-lg">
  <div className="flex items-center gap-3">
    <button onClick={() => setView('dashboard')} className="p-2.5 rounded-xl bg-slate-100/50 hover:bg-white text-slate-600 transition-all">
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
      <button onClick={handleReturnToProviderPanel} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200 font-bold text-xs flex items-center gap-2">
        <ArrowLeft size={16} /> Voltar ao Painel
      </button>
    ) : (
      <>
        {/* BOTÃO DE CONFIGURAÇÃO DA NUVEM - SEMPRE VISÍVEL PARA ADMIN E MASTER */}
        {(isAdmin || isSuperAdmin || authSession.eventId === 'MASTER') && (
          <button 
            onClick={() => setShowCloudModal(true)} 
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 shadow-sm ${
                cloudUrl 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200' 
                : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 animate-pulse'
            }`}
            title={cloudUrl ? "Nuvem Conectada" : "Nuvem Desconectada (Configurar)"}
          >
            <Cloud size={20} />
            {!cloudUrl && <span className="text-[10px] font-bold uppercase hidden sm:inline">Conectar</span>}
          </button>
        )}

        {/* CONTROLES DE SINCRONIZAÇÃO - SÓ SE TIVER URL */}
        {cloudUrl && (isAdmin || isSuperAdmin) && (
           <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 ml-1 hidden md:flex">
              <button onClick={() => handleSync('up')} disabled={syncStatus === 'syncing'} className="p-2 rounded-lg bg-white text-brand-600 shadow-sm hover:bg-brand-50 transition-colors border border-slate-100"><Upload size={16}/></button>
              <button onClick={() => handleSync('down')} disabled={syncStatus === 'syncing'} className="p-2 rounded-lg bg-white text-blue-600 shadow-sm hover:bg-blue-50 transition-colors border border-slate-100"><Download size={16}/></button>
           </div>
        )}
        
        {/* BOTÃO SYNC MOBILE - CONDENSADO */}
        {cloudUrl && (isAdmin || isSuperAdmin) && (
           <button onClick={() => handleSync('up')} className="md:hidden p-2.5 bg-slate-100 text-brand-600 rounded-xl border border-slate-200"><RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''}/></button>
        )}

        <button onClick={handleLogout} className="ml-1 p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100">
          <LogoutIcon size={18} />
        </button>
      </>
    )}
  </div>
</header>
       
       <main className="relative z-10 pt-24 pb-32 md:pb-8 animate-fade-in max-w-7xl mx-auto px-4">
          {view === 'dashboard' && (
             <div className="max-w-3xl mx-auto">
                <div className={`rounded-[2rem] p-6 md:p-8 mb-6 relative overflow-hidden shadow-xl ${selectedEventType === 'REGIONAL_CONVENTION' ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-brand-500 to-blue-700'} text-white`}>
                   <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div>
                          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">Olá, {authSession.userName}</h2>
                          <p className="text-white/90 text-sm font-medium">{showPublicDashboard ? 'Bem-vindo ao seu guia digital.' : (isSuperAdmin ? 'Painel do Provedor Master' : `${authSession.isTemplate ? 'Modo de Edição de Modelo' : (selectedEventType === 'REGIONAL_CONVENTION' ? 'Gestão de Congresso' : 'Gestão de Assembleia')}`)}</p>
                      </div>
                      {showPublicDashboard && ( <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20 w-full md:w-56 shrink-0 mt-2 md:mt-0"><label className="block text-[10px] font-bold text-white/80 mb-1.5 uppercase tracking-wider">Sua Congregação</label><div className="relative group"><select className="w-full p-2 rounded-lg border border-white/30 bg-transparent text-sm font-bold text-white outline-none appearance-none cursor-pointer" value={selectedUserCongId} onChange={(e) => handleCongregationSelect(e.target.value)}><option value="" style={{ color: 'black' }}>-- Ver designações --</option>{(orgData.generalInfo?.congregations || []).map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.name}</option>)}</select><div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/80"><ChevronDown size={18}/></div></div></div> )}
                   </div>
                </div>
                
                {isSuperAdmin ? (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4"><Plus size={18} /> Criar Novo Evento</h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input className="flex-1 px-4 py-3 text-sm border border-slate-200 bg-slate-50 rounded-xl outline-none shadow-sm focus:ring-1 focus:ring-brand-400 font-mono uppercase" placeholder="ID do Evento (ex: SP-123-A)" value={providerNewEventId} onChange={e => setProviderNewEventId(e.target.value)} />
                        <select className="px-4 py-3 text-sm border border-slate-200 bg-slate-50 rounded-xl outline-none shadow-sm focus:ring-1 focus:ring-brand-400 font-bold" value={providerNewEventType} onChange={e => setProviderNewEventType(e.target.value as any)}>
                          <option value="ASSEMBLY">Assembleia</option>
                          <option value="CONVENTION">Congresso</option>
                        </select>
                        <button onClick={handleCreateEventAndGenerateLink} disabled={!providerNewEventId || isCreatingEvent} className="bg-brand-600 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"><LinkIcon size={14}/> Gerar Link Admin</button>
                      </div>
                      <p className="text-xs text-slate-400 mt-3">{copyFeedback || 'Cria um novo evento na nuvem a partir do modelo base e gera o link de convite.'}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4"><PenTool size={18} /> Gerenciar Modelos Base</h3>
                        <p className="text-xs text-slate-500 mb-4">Edite os programas e estruturas padrão que serão usados ao criar novos eventos.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button onClick={() => handleEditTemplate('BETHEL_REP')} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-brand-50 hover:border-brand-200 transition-colors text-left">Assembleia (Rep. Betel)</button>
                            <button onClick={() => handleEditTemplate('CIRCUIT_OVERSEER')} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left">Assembleia (Sup. Circuito)</button>
                            <button onClick={() => handleEditTemplate('REGIONAL_CONVENTION')} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-purple-50 hover:border-purple-200 transition-colors text-left">Congresso</button>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Server size={18} /> Eventos Registrados</h3><button onClick={fetchProviderEvents} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><RefreshCw size={16}/></button></div>
                      {isLoadingEvents ? <p className="text-center text-slate-400 py-8">Carregando...</p> : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">{providerEventList.map(event => (<div key={event.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100"><div className="flex-1 min-w-0"><strong className="font-mono text-slate-700 truncate block">{event.id}</strong><p className="text-xs text-slate-500">Atualizado em: {new Date(event.updated_at).toLocaleString('pt-BR')}</p></div></div>))}</div>
                      )}
                    </div>
                  </div>
                ) : showPublicDashboard ? (
                  <div className="space-y-6">
                    
                    {publicAnnouncements && selectedUserCongId && (
                      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-amber-200/80 animate-fade-in">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-amber-100 text-amber-600 p-2 rounded-full"><Megaphone size={20}/></div>
                          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Quadro de Anúncios</h3>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{publicAnnouncements}</p>
                      </div>
                    )}
                    
                    <button onClick={() => setView('program')} className="w-full bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] shadow-sm border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-row items-center gap-6 group relative overflow-hidden h-[120px]">
                      <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-inner relative z-10"><Grid size={32} /></div>
                      <div className="text-left flex-1 relative z-10">
                        <h3 className="font-bold text-lg text-slate-800 mb-1">Programação / Anotações</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Acesse o cronograma e faça suas anotações.</p>
                      </div>
                    </button>
                    
                    {isDisambiguationRequired && (
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-amber-200 animate-fade-in">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-amber-100 text-amber-600 p-2 rounded-full"><UserCheck size={20}/></div>
                                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Confirme sua Identidade</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Para proteger a privacidade da equipe, digite seu telefone para ver suas designações.</p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                    <input type="tel" inputMode="numeric" className="w-full p-3 pl-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition-all font-mono" placeholder="Seu telefone" value={disambiguationPhoneInput} onChange={(e) => setDisambiguationPhoneInput(e.target.value)} />
                                </div>
                                <button onClick={handleDisambiguationSubmit} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm">Verificar</button>
                            </div>
                        </div>
                    )}

                    {selectedUserCongId && (
                        <div className="space-y-6 animate-fade-in">
                            {( (selectedCong && selectedCong.cleaningAssignment) || confirmedVolunteer ) && (
                                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-blue-100 relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100"><UserCheck size={18} className="text-brand-600"/><h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Suas Designações</h3></div>
                                    <div className="space-y-2">
                                        {selectedCong && selectedCong.cleaningAssignment && (
                                            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg shrink-0"><Sparkles size={16}/></div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Limpeza ({selectedCong.name})</p>
                                                        <p className="text-sm font-bold text-slate-800">{selectedCong.cleaningAssignment}</p>
                                                        <p className="text-[10px] text-slate-500 mt-1">Responsável: <span className="font-bold">{selectedCong.cleaningResponsable || 'Não informado'}</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {confirmedVolunteer && (
                                            <>
                                                {myAttendantAssignments.map((assign, idx) => (<div key={`${assign.sectorId}_${idx}`} className="bg-orange-50/50 p-3 rounded-xl border border-orange-100"><div className="flex items-start gap-3 mb-2"><div className="bg-orange-100 text-orange-600 p-1.5 rounded-lg shrink-0"><Users size={16}/></div><div><p className="text-[9px] font-bold text-orange-600 uppercase tracking-wide mb-0.5">Indicador:</p><p className="text-sm font-bold text-slate-800">{assign.customName || DEFAULT_SECTORS.find(s => s.id === assign.sectorId)?.name || 'Setor'}</p><span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 inline-block ${assign.period === 'Manhã' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{assign.period}</span></div></div>{assign.canReport && (<button onClick={() => openReportModal(assign.sectorId, assign.rawPeriod)} className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"><Send size={12}/> Reportar Assistência</button>)}</div>))}
                                                {myOrganogramAssignments.map((assign, idx) => (<div key={idx} className="bg-blue-50/50 p-3 rounded-xl border border-blue-100"><p className="text-[9px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">{assign.dept}</p><p className="text-sm font-bold text-slate-800">{assign.role}</p></div>))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {hasOrganogramRole && (
                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-3 mb-3"><div className="bg-slate-100 text-slate-600 p-2 rounded-full"><Layout size={20}/></div><h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Organograma da Equipe</h3></div>
                                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">Visualize a estrutura de voluntários do evento. É necessário o PIN de acesso dos voluntários.</p>
                                    <button onClick={() => setShowOrganogramPinModal(true)} className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"><Lock size={12}/> Visualizar Organograma</button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-emerald-100 p-5 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all"><div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div><div className="bg-emerald-50 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><Heart size={24} className="text-emerald-600 fill-emerald-600"/></div><h3 className="font-bold text-slate-800 text-base mb-1">Donativos para a Obra Mundial</h3><p className="text-xs text-slate-500 mb-4 max-w-xs">Apoie os eventos e a obra mundial das Testemunhas de Jeová através do site oficial.</p><a href="https://donate.jw.org/pt/BRA/home" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">Acessar donate.jw.org <span className="text-emerald-200">↗</span></a></div>
                        <div className="text-center px-2 pt-4 border-t border-slate-200/50"><p className="text-[9px] text-slate-400 mb-2 font-medium">Gostou do App? Contribua voluntariamente:</p><button onClick={handleCopyPix} className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-[9px] font-bold hover:bg-white hover:text-slate-700 transition-all shadow-sm w-full justify-center"><Copy size={10}/> {pixFeedback || "Copiar Chave Pix (App)"}</button></div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {isAdmin && isOrgEmpty(orgData) && (
                      <div className="col-span-full bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mb-2 animate-bounce-in">
                        <div className="flex items-center gap-4">
                          <div className="bg-amber-100 p-3 rounded-full text-amber-600"><Upload size={24}/></div>
                          <div>
                            <h3 className="font-bold text-amber-900 text-lg">Restaurar Dados?</h3>
                            <p className="text-sm text-amber-700 leading-tight">O evento parece vazio. Importe o arquivo que você baixou do seu computador.</p>
                          </div>
                        </div>
                        <button onClick={() => setView('general_info')} className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md transition-all whitespace-nowrap flex items-center gap-2">
                          <Upload size={18}/> Ir para Importação
                        </button>
                      </div>
                    )}

                    {isAdmin && <button onClick={() => setView('cover')} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-start gap-3 group"><div className="bg-brand-50 text-brand-600 p-3 rounded-lg group-hover:bg-brand-100 transition-colors"><BookOpen size={24}/></div><div><h3 className="font-bold text-slate-800 text-base">Capa e Programa</h3><p className="text-xs text-slate-500">Definir data, local e imagem de capa.</p></div></button>}
                    <button onClick={() => setView('organogram')} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-start gap-3 group"><div className="bg-blue-50 text-blue-600 p-3 rounded-lg group-hover:bg-blue-100 transition-colors"><Layout size={24}/></div><div><h3 className="font-bold text-slate-800 text-base">Organograma</h3><p className="text-xs text-slate-500">Designar voluntários para os departamentos.</p></div></button>
                    {isAdmin && <button onClick={() => setView('general_info')} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-start gap-3 group"><div className="bg-slate-100 text-slate-600 p-3 rounded-lg group-hover:bg-slate-200 transition-colors"><Settings size={24}/></div><div><h3 className="font-bold text-slate-800 text-base">Geral e Contatos</h3><p className="text-xs text-slate-500">Lembretes, congregações e backup.</p></div></button>}
                    
                    {(isAdmin || isAttendantOverseer) && <button onClick={() => setView('attendants')} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-start gap-3 group"><div className="bg-orange-50 text-orange-600 p-3 rounded-lg group-hover:bg-orange-100 transition-colors"><UserCheck size={24}/></div><div><h3 className="font-bold text-slate-800 text-base">Indicadores</h3><p className="text-xs text-slate-500">Gerenciar turnos e assistência.</p></div></button>}
                    {(isAdmin || isParkingOverseer) && <button onClick={() => setView('parking')} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-start gap-3 group"><div className="bg-gray-100 text-gray-600 p-3 rounded-lg group-hover:bg-gray-200 transition-colors"><Car size={24}/></div><div><h3 className="font-bold text-slate-800 text-base">Estacionamento</h3><p className="text-xs text-slate-500">Gerenciar vagas e voluntários.</p></div></button>}

                    {isAdmin && (
                        <button onClick={() => setView('cleaning')} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-start gap-3 group"><div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg group-hover:bg-emerald-100 transition-colors"><Sparkles size={24}/></div><div><h3 className="font-bold text-slate-800 text-base">Limpeza</h3><p className="text-xs text-slate-500">Designar limpeza por congregação.</p></div></button>
                    )}

                    {isAdmin && <button onClick={() => setView('sharing')} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-start gap-3 group"><div className="bg-purple-50 text-purple-600 p-3 rounded-lg group-hover:bg-purple-100 transition-colors"><Share2 size={24}/></div><div><h3 className="font-bold text-slate-800 text-base">Convidar Equipe</h3><p className="text-xs text-slate-500">{copyFeedback || 'Gerar link e PIN para voluntários.'}</p></div></button>}
                    {isAdmin && <button onClick={() => setView('sharing')} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-start gap-3 group"><div className="bg-cyan-50 text-cyan-600 p-3 rounded-lg group-hover:bg-cyan-100 transition-colors"><LinkIcon size={24}/></div><div><h3 className="font-bold text-slate-800 text-base">Link Público</h3><p className="text-xs text-slate-500">{copyFeedback || 'Link para a assistência em geral.'}</p></div></button>}
                  </div>
                )}
             </div>
          )}
          {view === 'cover' && program && <Cover program={program} onEnter={() => setView('program')} onBack={() => setView('dashboard')} initialCircuitId={authSession.eventId} />}
          {view === 'program' && selectedEventType && program && <Program program={program} notes={notes} onNoteChange={handleUpdateNotes} attendance={attendance} onAttendanceChange={handleUpdateAttendance} onUpdateProgram={isAdmin ? handleUpdateProgram : undefined} isAdmin={isAdmin} onAddSuggestion={handleAddSuggestion} userName={authSession.userName} />}
          {view === 'organogram' && selectedEventType && orgData && <Organogram data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin} eventType={selectedEventType} isAttendantOverseer={isAttendantOverseer} isParkingOverseer={isParkingOverseer} />}
          {view === 'cleaning' && orgData && <CleaningManagement data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin} />}
          {view === 'attendants' && orgData && <AttendantManager data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin || isAttendantOverseer} />}
          {view === 'general_info' && orgData && <GeneralInfo data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} onBack={() => setView('dashboard')} onForceRestore={handleForceRestoreFromBackup} currentProgram={program} currentNotes={notes} currentAttendance={attendance} currentEventType={selectedEventType} />}
          {view === 'parking' && orgData && <ParkingManagement data={orgData} onUpdate={handleUpdateOrg} isAdmin={isAdmin || isParkingOverseer} />}
          {view === 'sharing' && authSession && <SharingCenter eventId={authSession.eventId} onBack={() => setView('dashboard')} cloudUrl={cloudUrl} cloudKey={cloudKey} orgData={orgData} cloudPass={cloudPass} />}
       </main>
       
      {showReportModal && ( <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-in overflow-hidden"><div className={`p-5 flex justify-between items-center ${reportPeriod === 'morning' ? 'bg-amber-400' : 'bg-blue-600'} text-white`}><h3 className="font-bold text-lg flex items-center gap-2">{reportPeriod === 'morning' ? <Sun size={20}/> : <Moon size={20}/>} Reportar Assistência</h3><button onClick={() => setShowReportModal(false)} className="bg-white/20 p-1.5 rounded-full hover:bg-white/30"><X size={18}/></button></div><div className="p-6 space-y-4"><div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center"><p className="text-xs text-orange-700 font-bold leading-tight">Certifique-se com seu companheiro a quantidade.</p></div><p className="text-sm text-slate-600 text-center">Digite a quantidade total de assistência do seu setor ({DEFAULT_SECTORS.find(s => s.id === reportSectorId)?.name || 'Setor'}).</p><div className="flex justify-center"><input autoFocus type="number" className="w-32 text-center text-4xl font-bold border-b-2 border-slate-300 focus:border-slate-800 outline-none py-2 bg-transparent font-mono" placeholder="0" value={reportValue} onChange={(e) => setReportValue(e.target.value)} /></div><button onClick={handleReportAttendance} disabled={!reportValue || reportSent} className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${reportSent ? 'bg-emerald-500' : 'bg-emerald-500'}`}>{reportSent ? <CheckCircle2 size={20}/> : <Send size={20}/>}{reportSent ? 'Enviado!' : 'Enviar'}</button></div></div></div> )}
      {showOrganogramPinModal && ( <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in overflow-hidden border border-slate-200"><div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Lock size={18}/> Acesso ao Organograma</h3><button onClick={() => setShowOrganogramPinModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400 hover:text-slate-600"/></button></div><form onSubmit={handleOrganogramPinSubmit} className="p-6 space-y-4"><p className="text-sm text-slate-600 text-center">Insira o PIN de acesso dos voluntários.</p><div className="relative group"><Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} /><input autoFocus type="password" className="w-full text-center tracking-widest font-mono text-xl border-2 border-slate-200 bg-slate-50 rounded-xl py-3 outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500" value={organogramPinInput} onChange={(e) => { setOrganogramPinInput(e.target.value); setOrganogramPinError(''); }} /></div>{organogramPinError && <p className="text-xs text-red-500 text-center font-bold">{organogramPinError}</p>}<button type="submit" className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all shadow-sm">Verificar</button></form></div></div> )}
      
      <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1 pb-4">
         <Lock size={10} /> Dados criptografados e armazenados localmente.
      </p>
    </div>
  );
};

export default App;