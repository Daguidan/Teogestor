import { DepartmentConfig, AssemblyProgram, OrgStructure, SectorEntry, ParkingSector } from './types';

export const APP_CONFIG = {
  MASTER_PIN: 'apoc3:7',
  ADMIN_PIN: '1cor14:33',
  VOLUNTEER_PIN: 'sal110:3',
  APP_VERSION: '6.0 Final'
};

export const LICENSE_SALT = "TEOGESTOR_SECURE_KEY_2025_V1";
export const MASTER_LICENSE_KEY = "TEOG-2025";

export const LEGAL_DISCLAIMER = `
Atenção: O TeoGestor não é um aplicativo oficial das Testemunhas de Jeová e não tem vínculo com o site jw.org.
Este software funciona offline e armazena dados EXCLUSIVAMENTE na memória local do seu dispositivo.
Nenhum dado é enviado para servidores externos ou nuvem sem sua configuração expressa.
`;

// IDs para os modelos de eventos base
export const TEMPLATE_EVENT_IDS = {
  ASSEMBLY_BETHEL: 'TEMPLATE_ASSEMBLY_BETHEL_V1',
  ASSEMBLY_CO: 'TEMPLATE_ASSEMBLY_CO_V1',
  CONVENTION_REGIONAL: 'TEMPLATE_CONVENTION_REGIONAL_V1'
};

// NOVA LISTA: Locais de limpeza padrão com base na imagem
export const DEFAULT_CLEANING_LOCATIONS: string[] = [
  'Auditório',
  'Sanitários pequenos / vestiários',
  'Refeitório',
  'Sanitário Masculino',
  'Sanitário Feminino',
  'Palco e Salas / Vidros e Janelas',
  'Guarita / Ruas e Calçadas',
  'Lixeiras e Remoção / Bebedouros',
  'Estoque de Limpeza do auditório',
  'Inspeção final / de todos os Setores',
  'Plantonista',
];

// LISTA DE SETORES PARA INDICADORES (Expandida)
export const DEFAULT_SECTORS: SectorEntry[] = [
  { id: 'refeitorio', name: 'Refeitório', colorClass: 'border-l-4 border-l-stone-400' },
  { id: 'entrada', name: 'Entrada Principal', colorClass: 'border-l-4 border-l-stone-400' },
  { id: 'auditorio', name: 'Auditório Geral', colorClass: 'border-l-4 border-l-stone-400' },
  { id: 'banheiros', name: 'Banheiros', colorClass: 'border-l-4 border-l-cyan-400' },
  { id: 'setor1', name: 'Setor 1', colorClass: 'border-l-4 border-l-cyan-400' },
  { id: 'setor2', name: 'Setor 2', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor3', name: 'Setor 3', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor4', name: 'Setor 4', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor5', name: 'Setor 5', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor6', name: 'Setor 6', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor7', name: 'Setor 7', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor8', name: 'Setor 8', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor9', name: 'Setor 9', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor10', name: 'Setor 10', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor11', name: 'Setor 11', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'setor12', name: 'Setor 12', colorClass: 'border-l-4 border-l-slate-400' },
  { id: 'palco', name: 'Palco', colorClass: 'border-l-4 border-l-indigo-400' },
  { id: 'cpalco', name: 'C. Palco', colorClass: 'border-l-4 border-l-indigo-400' },
  { id: 'extra1', name: 'Setor Extra 1', colorClass: 'border-l-4 border-l-orange-300' },
  { id: 'extra2', name: 'Setor Extra 2', colorClass: 'border-l-4 border-l-orange-300' },
];

// NOVO: SETORES PADRÃO PARA ESTACIONAMENTO
export const DEFAULT_PARKING_SECTORS: { id: string, name: string }[] = [
    { id: 'setor_a', name: 'Setor A - Idosos / Especiais' },
    { id: 'setor_b', name: 'Setor B - Equipe de Trabalho' },
    { id: 'setor_c', name: 'Setor C - Geral' },
    { id: 'setor_d', name: 'Setor D - Geral' },
    { id: 'motos', name: 'Motos' },
];

export const DEPARTMENTS_AO: DepartmentConfig[] = [
  { name: 'Contas', assistantsCount: 3 },
  { name: 'Indicadores', assistantsCount: 3 },
  { name: 'Segurança', assistantsCount: 4 },
  { name: 'Limpeza', assistantsCount: 3 },
  { name: 'Primeiros Socorros', assistantsCount: 1 },
  { name: 'Estacionamento', assistantsCount: 2 },
  { name: 'Prevenção de Acidentes / Incêndio', assistantsCount: 5 },
];

export const DEPARTMENTS_AAO: DepartmentConfig[] = [
  { name: 'Áudio e Vídeo', assistantsCount: 10 },
  { name: 'Palco', assistantsCount: 2 },
  { name: 'Batismo', assistantsCount: 2 },
  { name: 'Perdidos e Achados / Guarda-volumes', assistantsCount: 1 },
  { name: 'Cuidados Infantis / Amamentação', assistantsCount: 1 },
  { name: 'Manutenção', assistantsCount: 2 },
  { name: 'Montagem', assistantsCount: 4 },
];

export const DEPTS_CONV_COORD: DepartmentConfig[] = [
  { name: 'Contas', assistantsCount: 4 },
  { name: 'Indicadores', assistantsCount: 12 },
  { name: 'Primeiros Socorros', assistantsCount: 4 },
  { name: 'Estacionamento', assistantsCount: 8 },
  { name: 'Departamento Extra 1', assistantsCount: 2, isCustom: true },
  { name: 'Departamento Extra 2', assistantsCount: 2, isCustom: true },
];

export const DEPTS_CONV_PROG: DepartmentConfig[] = [
  { name: 'Áudio e Vídeo', assistantsCount: 15 },
  { name: 'Batismo', assistantsCount: 4 },
  { name: 'Interpretação Tátil', assistantsCount: 2 },
  { name: 'Cuidados Infantis / Amamentação', assistantsCount: 2 },
  { name: 'Departamento Extra', assistantsCount: 2, isCustom: true },
];

export const DEPTS_CONV_ROOM: DepartmentConfig[] = [
  { name: 'Limpeza', assistantsCount: 12 },
  { name: 'Informações', assistantsCount: 4 },
  { name: 'Montagem', assistantsCount: 6 },
  { name: 'Achados e Perdidos', assistantsCount: 2 },
  { name: 'Hospedagem', assistantsCount: 3 },
  { name: 'Transporte', assistantsCount: 3 },
  { name: 'Manutenção', assistantsCount: 4 },
  { name: 'Departamento Extra', assistantsCount: 2, isCustom: true },
];

const INITIAL_PARKING_DATA: ParkingSector[] = DEFAULT_PARKING_SECTORS.map(s => ({
    id: s.id,
    name: s.name,
    passRange: '',
    vehicleCount: 0,
    notes: '',
    morningVol1: null,
    morningVol2: null,
    afternoonVol1: null,
    afternoonVol2: null,
}));

export const INITIAL_STRUCTURE: OrgStructure = {
  committee: { president: null, assemblyOverseer: null, assistantAssemblyOverseer: null },
  aoDepartments: DEPARTMENTS_AO.map(d => ({ name: d.name, overseer: null, assistants: Array(d.assistantsCount).fill(null), requiredAssistants: d.assistantsCount, isCustom: false })),
  aaoDepartments: DEPARTMENTS_AAO.map(d => ({ name: d.name, overseer: null, assistants: Array(d.assistantsCount).fill(null), requiredAssistants: d.assistantsCount, isCustom: false })),
  attendantsData: [],
  parkingData: [...INITIAL_PARKING_DATA],
  generalInfo: {
    reminders: '',
    congregations: [],
    suggestions: [],
    customCleaningLocations: []
  }
};

export const INITIAL_STRUCTURE_CONVENTION: OrgStructure = {
  committee: { president: null },
  aoDepartments: [],
  aaoDepartments: [],
  coordDepartments: DEPTS_CONV_COORD.map(d => ({ name: d.name, overseer: null, assistants: Array(d.assistantsCount).fill(null), requiredAssistants: d.assistantsCount, isCustom: d.isCustom })),
  progDepartments: DEPTS_CONV_PROG.map(d => ({ name: d.name, overseer: null, assistants: Array(d.assistantsCount).fill(null), requiredAssistants: d.assistantsCount, isCustom: d.isCustom })),
  roomDepartments: DEPTS_CONV_ROOM.map(d => ({ name: d.name, overseer: null, assistants: Array(d.assistantsCount).fill(null), requiredAssistants: d.assistantsCount, isCustom: d.isCustom })),
  parkingData: [...INITIAL_PARKING_DATA],
  generalInfo: {
    reminders: '',
    congregations: [],
    suggestions: [],
    customCleaningLocations: []
  }
};

// CAMINHOS DE IMAGEM CORRETOS
export const PROGRAM_BETHEL: AssemblyProgram = {
  type: 'BETHEL_REP',
  theme: 'Ouça o Que o Espírito Diz às Congregações',
  scriptureReference: 'APOCALIPSE 3:22',
  defaultCoverImage: '/images/betel.png', 
  days: [
    {
      label: 'Dia da Assembleia',
      morning: {
        name: 'Manhã',
        parts: [
          { id: 'b1', time: '09:40', theme: 'Música', note: '' },
          { id: 'b2', time: '09:50', theme: 'Cântico 1 e oração', note: '' },
          { id: 'b3', time: '10:00', theme: '“Ouça o que o espírito diz” — Como?', note: '' },
          { id: 'b4', time: '10:15', theme: '‘Você está mostrando perseverança sem se cansar’', note: '' },
          { id: 'b5', time: '10:30', theme: '“Não tenha medo”', note: '' },
          { id: 'b6', time: '10:55', theme: 'Cântico 73 e anúncios', note: '' },
          { id: 'b7', time: '11:05', theme: '‘Você não negou sua fé em mim’', note: '' },
          { id: 'b8', time: '11:35', theme: 'Batismo: O significado do seu batismo', note: '' },
          { id: 'b9', time: '12:05', theme: 'Cântico 79', note: '' },
        ]
      },
      afternoon: {
        name: 'Tarde',
        parts: [
          { id: 'b10', time: '13:20', theme: 'Música', note: '' },
          { id: 'b11', time: '13:30', theme: 'Cântico 126', note: '' },
          { id: 'b12', time: '13:35', theme: 'Experiências', note: '' },
          { id: 'b13', time: '13:45', theme: 'Resumo de A Sentinela', note: '' },
          { id: 'b14', time: '14:15', theme: 'Série de discursos: Como aplicar o conselho', note: '', subpoints: ['“Apeguem-se ao que vocês têm”', '“Seja vigilante e fortaleça o que resta”', '“Coloquei diante de você uma porta aberta”'] },
          { id: 'b15', time: '15:00', theme: 'Cântico 76 e anúncios', note: '' },
          { id: 'b16', time: '15:10', theme: '“Seja zeloso”', note: '' },
          { id: 'b17', time: '15:55', theme: 'Cântico 129 e oração', note: '' },
        ]
      }
    }
  ],
  recapQuestions: [
    { question: 'Como podemos ‘ouvir o que o espírito diz’? (Apo. 1:3, 10, 11; 3:19)', reference: '' },
    { question: 'O que vai nos ajudar a continuar trabalhando arduamente e perseverando? (Apo. 2:4)', reference: '' },
    { question: 'Como podemos nos preparar para enfrentar a perseguição com coragem? (Pro. 29:25; Apo. 2:10, 11)', reference: '' },
    { question: 'O que precisamos fazer para não negar nossa fé em Jesus? (Apo. 2:12-16)', reference: '' },
    { question: 'O que podemos nos apegar ao que temos? (Apo. 2:24, 25; 3:1-3, 7, 8, 10, 11)', reference: '' },
    { question: 'O que vai nos ajudar a continuar zelosos? (Apo. 3:14-19; Mat. 6:25-27, 31-33)', reference: '' }
  ]
};

export const PROGRAM_CO: AssemblyProgram = {
  type: 'CIRCUIT_OVERSEER',
  theme: 'Adore com Espírito e Verdade',
  scriptureReference: 'JOÃO 4:24',
  defaultCoverImage: '/images/Circuito.png',
  days: [
    {
      label: 'Dia da Assembleia',
      morning: {
        name: 'Manhã',
        parts: [
          { id: 'c1', time: '09:40', theme: 'Música', note: '' },
          { id: 'c2', time: '09:50', theme: 'Cântico 85 e oração', note: '' },
          { id: 'c3', time: '10:00', theme: '“O Pai está procurando a esses”', note: '' },
          { id: 'c4', time: '10:15', theme: 'Série de discursos: ‘Adore com espírito’', note: '', subpoints: ['Ao tentar entender as orientações de Jeová', 'Ao lidar com o desânimo', 'Ao se esforçar para fazer mais no serviço de Jeová'] },
          { id: 'c5', time: '11:05', theme: 'Cântico 88 e anúncios', note: '' },
          { id: 'c6', time: '11:15', theme: 'Como ‘tornamos conhecida a verdade’?', note: '' },
          { id: 'c7', time: '11:35', theme: 'Batismo: O significado do seu batismo', note: '' },
          { id: 'c8', time: '12:05', theme: 'Cântico 51', note: '' },
        ]
      },
      afternoon: {
        name: 'Tarde',
        parts: [
          { id: 'c9', time: '13:20', theme: 'Música', note: '' },
          { id: 'c10', time: '13:30', theme: 'Cântico 72 e oração', note: '' },
          { id: 'c11', time: '13:35', theme: 'Discurso para o público: Como saber a diferença entre o certo e o errado?', note: '' },
          { id: 'c12', time: '14:05', theme: 'Resumo de A Sentinela', note: '' },
          { id: 'c13', time: '14:35', theme: 'Cântico 56 e anúncios', note: '' },
          { id: 'c14', time: '14:45', theme: 'Série de discursos: ‘Adore com verdade’', note: '', subpoints: ['Na família', 'Em um mundo dividido', 'Em tempos de crise financeira'] },
          { id: 'c15', time: '15:30', theme: '“Compre a verdade e nunca a venda”', note: '' },
          { id: 'c16', time: '16:00', theme: 'Cântico 29 e oração', note: '' },
        ]
      }
    }
  ],
  recapQuestions: [
    { question: 'Que tipo de pessoas Jeová está procurando? (João 4:23, 24)', reference: '' },
    { question: 'Como o espírito santo nos ajuda a dar o nosso melhor a Jeová? (Atos 16:6-10; 1 Cor. 2:10-13; Fil. 4:8, 9)', reference: '' },
    { question: 'Como ‘tornamos conhecida a verdade’? (2 Cor. 4:1, 2)', reference: '' },
    { question: 'O que está envolvido em adorar com verdade? (Pro. 24:3; João 18:36, 37; Efé. 5:33; Heb. 13:5, 6, 18)', reference: '' },
    { question: 'Como podemos ‘comprar a verdade e nunca a vender’? (Pro. 23:23)', reference: '' }
  ]
};

export const PROGRAM_CONVENTION: AssemblyProgram = {
  type: 'REGIONAL_CONVENTION',
  theme: 'Declare as Boas Novas!',
  scriptureReference: '1 CORÍNTIOS 9:16',
  defaultCoverImage: '/images/congresso.png',
  days: [
    {
      label: 'Sexta-feira',
      morning: {
        name: 'Manhã',
        parts: [
          { id: 'cv_fri_m1', time: '09:20', theme: 'Vídeo Musical', note: '' },
          { id: 'cv_fri_m2', time: '09:30', theme: 'Cântico e Oração', note: '' },
          { id: 'cv_fri_m3', time: '09:40', theme: 'Discurso do Presidente: Por que temos de ‘declarar as boas novas’?', note: '' },
          { id: 'cv_fri_m4', time: '10:10', theme: 'Simpósio: Pregue as boas novas...', note: '', subpoints: ['... com coragem', '... com brandura', '... com discernimento'] },
          { id: 'cv_fri_m5', time: '11:05', theme: 'Cântico e Anúncios', note: '' },
          { id: 'cv_fri_m6', time: '11:15', theme: 'Série de Vídeos: A Criação Declara as Boas Novas!', note: '' },
          { id: 'cv_fri_m7', time: '11:45', theme: '“As boas novas do Reino” — o que são?', note: '' },
          { id: 'cv_fri_m8', time: '12:15', theme: 'Cântico', note: '' },
        ]
      },
      afternoon: {
        name: 'Tarde',
        parts: [
          { id: 'cv_fri_a1', time: '13:35', theme: 'Vídeo Musical', note: '' },
          { id: 'cv_fri_a2', time: '13:45', theme: 'Cântico', note: '' },
          { id: 'cv_fri_a3', time: '13:50', theme: 'Simpósio: Imite zelosos declaradores das boas novas', note: '', subpoints: ['Noé', 'Jeremias', 'Jesus Cristo'] },
          { id: 'cv_fri_a4', time: '14:50', theme: '“Não se envergonhe das boas novas”', note: '' },
          { id: 'cv_fri_a5', time: '15:10', theme: 'Cântico e Anúncios', note: '' },
          { id: 'cv_fri_a6', time: '15:20', theme: 'Simpósio: Ferramentas que nos ajudam a declarar as boas novas', note: '', subpoints: ['JW Library', 'jw.org', 'Nossas publicações'] },
          { id: 'cv_fri_a7', time: '16:15', theme: 'Como as “boas novas eternas” nos afetam?', note: '' },
          { id: 'cv_fri_a8', time: '16:50', theme: 'Cântico e Oração', note: '' },
        ]
      }
    },
    {
      label: 'Sábado',
      morning: {
        name: 'Manhã',
        parts: [
          { id: 'cv_sat_m1', time: '09:20', theme: 'Vídeo Musical', note: '' },
          { id: 'cv_sat_m2', time: '09:30', theme: 'Cântico e Oração', note: '' },
          { id: 'cv_sat_m3', time: '09:40', theme: 'Simpósio: Declare as boas novas apesar de...', note: '', subpoints: ['Apatia', 'Oposição', 'Ansiedades'] },
          { id: 'cv_sat_m4', time: '10:30', theme: '“O espírito... dá testemunho” — Como?', note: '' },
          { id: 'cv_sat_m5', time: '10:50', theme: 'Cântico e Anúncios', note: '' },
          { id: 'cv_sat_m6', time: '11:00', theme: 'Simpósio: A alegria de fazer discípulos — Melhore suas habilidades', note: '', subpoints: ['Inicie conversas', 'Use bem as perguntas', 'Ensine com o coração'] },
          { id: 'cv_sat_m7', time: '11:45', theme: 'Discurso de Batismo: Dedique-se a Jeová e declare as boas novas!', note: '' },
          { id: 'cv_sat_m8', time: '12:15', theme: 'Cântico', note: '' },
        ]
      },
      afternoon: {
        name: 'Tarde',
        parts: [
          { id: 'cv_sat_a1', time: '13:35', theme: 'Vídeo Musical', note: '' },
          { id: 'cv_sat_a2', time: '13:45', theme: 'Cântico', note: '' },
          { id: 'cv_sat_a3', time: '13:50', theme: 'Simpósio: Declare as boas novas na sua família', note: '', subpoints: ['Maridos e esposas', 'Pais e filhos', 'Parentes que não são Testemunhas de Jeová'] },
          { id: 'cv_sat_a4', time: '14:50', theme: 'Como os jovens podem declarar as boas novas?', note: '' },
          { id: 'cv_sat_a5', time: '15:10', theme: 'Cântico e Anúncios', note: '' },
          { id: 'cv_sat_a6', time: '15:20', theme: 'Drama em áudio: “Jeová o livrará”', note: '' },
          { id: 'cv_sat_a7', time: '16:00', theme: 'Continue a declarar as boas novas “sem cessar”!', note: '' },
          { id: 'cv_sat_a8', time: '16:50', theme: 'Cântico e Oração', note: '' },
        ]
      }
    },
    {
      label: 'Domingo',
      morning: {
        name: 'Manhã',
        parts: [
          { id: 'cv_sun_m1', time: '09:20', theme: 'Vídeo Musical', note: '' },
          { id: 'cv_sun_m2', time: '09:30', theme: 'Cântico e Oração', note: '' },
          { id: 'cv_sun_m3', time: '09:40', theme: 'Discurso Público: Por que precisamos das boas novas?', note: '' },
          { id: 'cv_sun_m4', time: '10:10', theme: 'Resumo de A Sentinela', note: '' },
          { id: 'cv_sun_m5', time: '10:40', theme: 'Cântico e Anúncios', note: '' },
          { id: 'cv_sun_m6', time: '10:50', theme: 'Simpósio: “Até a parte mais distante da Terra”', note: '', subpoints: ['Usando a tecnologia', 'Em lugares isolados', 'Em outros idiomas'] },
          { id: 'cv_sun_m7', time: '11:45', theme: 'Drama em Vídeo: Neemias — A Alegria de Jeová É a Sua Força (Parte 2)', note: '' },
          { id: 'cv_sun_m8', time: '12:15', theme: 'Cântico', note: '' },
        ]
      },
      afternoon: {
        name: 'Tarde',
        parts: [
          { id: 'cv_sun_a1', time: '13:35', theme: 'Vídeo Musical', note: '' },
          { id: 'cv_sun_a2', time: '13:45', theme: 'Cântico', note: '' },
          // FIX: Changed property 'a' to 'time' to match the ProgramPart type.
          { id: 'cv_sun_a3', time: '13:50', theme: 'Simpósio: Não desista de declarar as boas novas!', note: '', subpoints: ['Quando estiver cansado', 'Quando se sentir desanimado', 'Quando se sentir sozinho'] },
          { id: 'cv_sun_a4', time: '14:50', theme: 'Discurso final: Continue a declarar as boas novas “plenamente”!', note: '' },
          { id: 'cv_sun_a5', time: '15:40', theme: 'Cântico final e Oração', note: '' },
        ]
      }
    }
  ],
  recapQuestions: [
    { question: "O que são as 'boas novas do Reino' e por que é urgente declará-las?" },
    { question: "Como podemos imitar Jesus ao declarar as boas novas com coragem e brandura?" },
    { question: "Que ferramentas nos ajudam a ser mais eficientes na pregação?" },
    { question: "De que maneiras práticas podemos declarar as boas novas na família e aos parentes?" },
    { question: "Como a alegria de Jeová nos fortalece para não desistirmos de declarar as boas novas?" }
  ]
};