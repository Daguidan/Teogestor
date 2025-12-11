

// FIX: Removed self-import of VolunteerData which was causing a conflict.
export type EventType = 'BETHEL_REP' | 'CIRCUIT_OVERSEER' | 'REGIONAL_CONVENTION' | 'CUSTOM' | 'DEPT_INDICADORES' | 'DEPT_ESTACIONAMENTO';

export type UserRole = 'admin' | 'volunteer' | 'public';

// FIX: Moved CloudConfig here to be a shared type across services.
export interface CloudConfig {
  url: string;
  key: string;
  encryptionPass?: string;
}

export interface AuthSession {
  eventId: string;
  role: UserRole;
  timestamp: number;
  userName?: string;
  isSuperAdmin?: boolean;
  managementType?: 'ASSEMBLY' | 'CONVENTION'; 
  isTemplate?: boolean; // Adicionado para modo de edição de modelo
  // FIX: Add missing 'departmentAccess' property to support volunteer overseer roles.
  departmentAccess?: 'attendants' | 'parking';
}

export interface ProviderEventInfo { // NOVA INTERFACE
  id: string;
  updated_at: string;
}

export interface VolunteerData {
  name: string;
  congregation: string;
  phone: string;
  email: string;
  organizationEmail?: string;
  lgpdConsent: boolean;
  role?: string;
}

export interface DepartmentConfig {
  name: string;
  assistantsCount: number;
  isCustom?: boolean;
}

export interface DepartmentAssignment {
  name: string;
  overseer: VolunteerData | null;
  assistants: (VolunteerData | null)[];
  requiredAssistants: number;
  isCustom?: boolean;
}

export interface AssemblyCommittee {
  president: VolunteerData | null;
  assemblyOverseer?: VolunteerData | null;
  assistantAssemblyOverseer?: VolunteerData | null;
  presidentAssistant1?: VolunteerData | null;
  presidentAssistant2?: VolunteerData | null;
  conventionCoordinator?: VolunteerData | null;
  assistantCoordinator?: VolunteerData | null;
  conventionProgramOverseer?: VolunteerData | null;
  assistantProgramOverseer?: VolunteerData | null;
  conventionRoomingOverseer?: VolunteerData | null;
  assistantRoomingOverseer?: VolunteerData | null;
}

export interface CongregationEntry {
  id: string;
  name: string;
  coordinator: string;
  phone: string;
  cleaningAssignment: string;
  accountsAssignment: string;
  cleaningResponsable?: string;
  cleaningResponsablePhone?: string; 
}

export interface SuggestionEntry {
  id: string;
  text: string;
  date: string;
  isRead: boolean;
}

// Interfaces para Indicadores
export interface SectorEntry {
  id: string;
  name: string;
  colorClass: string;
}

export interface AttendantData {
  sectorId: string;
  customName?: string;
  
  // Contagens
  countMorning: number;
  countAfternoon: number;

  // --- MANHÃ (2 Voluntários) ---
  morning_vol1_name?: string;
  morning_vol1_phone?: string;
  morning_vol1_congId?: string; 

  morning_vol2_name?: string;
  morning_vol2_phone?: string;
  morning_vol2_congId?: string;

  // --- TARDE (2 Voluntários) ---
  afternoon_vol1_name?: string;
  afternoon_vol1_phone?: string;
  afternoon_vol1_congId?: string;

  afternoon_vol2_name?: string;
  afternoon_vol2_phone?: string;
  afternoon_vol2_congId?: string;
}

// NOVA INTERFACE PARA ESTACIONAMENTO
export interface ParkingSector {
  id: string;
  name: string;
  passRange: string;
  vehicleCount: number;
  notes: string;
  morningVol1: VolunteerData | null;
  morningVol2: VolunteerData | null;
  afternoonVol1: VolunteerData | null;
  afternoonVol2: VolunteerData | null;
  isCustom?: boolean;
}

export interface OrgStructure {
  committee: AssemblyCommittee;
  aoDepartments: DepartmentAssignment[];
  aaoDepartments: DepartmentAssignment[];
  coordDepartments?: DepartmentAssignment[];
  progDepartments?: DepartmentAssignment[];
  roomDepartments?: DepartmentAssignment[];
  generalInfo?: {
    reminders: string;
    congregations: CongregationEntry[];
    suggestions?: SuggestionEntry[];
    teamAccessPin?: string;
    volunteerAccessPin?: string;
    publicAnnouncements?: string;
    customCleaningLocations?: string[]; // NOVO CAMPO
  };
  attendantsData?: AttendantData[]; // Dados dos Indicadores
  customSectors?: SectorEntry[]; // Setores criados dinamicamente
  parkingData?: ParkingSector[]; // Dados do Estacionamento
}

export interface ProgramPart {
  id: string;
  time: string;
  theme: string;
  speaker?: string;
  note: string;
  subpoints?: string[];
}

export interface Session {
  name: string;
  parts: ProgramPart[];
}

export interface ProgramDay {
  label: string;
  morning: Session;
  afternoon: Session;
}

export interface RecapQuestion {
  question: string;
  reference?: string;
}

export interface AssemblyProgram {
  type: EventType;
  theme: string;
  scriptureReference?: string;
  days: ProgramDay[]; 
  recapQuestions?: RecapQuestion[];
  defaultCoverImage?: string;
}