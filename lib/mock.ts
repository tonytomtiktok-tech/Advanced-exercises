export const SUBJECT_OPTIONS = [
  'คณิต',
  'วิทย์',
  'ภาษาไทย',
  'สังคม',
  'การงานอาชีพ',
  'อังกฤษ',
  'สุขศึกษา',
  'ศิลปะ',
] as const;

export const SKILL_OPTIONS = [
  'ความรู้ ความจำ',
  'ความเข้าใจ',
  'การประยุกต์ใช้',
  'การวิเคราะห์',
  'การประเมินค่า',
  'การสร้างสรรค์',
] as const;

export type SkillName = (typeof SKILL_OPTIONS)[number];

export type Question = {
  id: number;
  subject: string;
  level: string;
  /** Sets/lessons this question belongs to — one question can be in many */
  setIds: number[];
  skills: string[];
  /** @deprecated use setIds — kept for old localStorage */
  topic?: string;
  /** @deprecated use skills — kept for old localStorage */
  skill?: string;
  difficulty: 'ง่าย' | 'ปานกลาง' | 'ยาก';
  prompt: string;
  /** Images for the stem — shown one-at-a-time with prev/next */
  promptImages?: string[];
  /** @deprecated use promptImages */
  promptImage?: string;
  /** Optional video for the stem — URL only (YouTube / Vimeo / direct file) */
  promptVideoUrl?: string;
  options: string[];
  /** Optional image per choice — index aligns with options */
  optionImages?: (string | undefined)[];
  correct: number;
  explanation: string;
  /** Images for explanation — stacked vertically */
  explanationImages?: string[];
  /** @deprecated use explanationImages */
  explanationImage?: string;
};

export function getPromptImages(q: Pick<Question, 'promptImages' | 'promptImage'>): string[] {
  if (Array.isArray(q.promptImages) && q.promptImages.length) {
    return q.promptImages.filter(Boolean);
  }
  if (q.promptImage) return [q.promptImage];
  return [];
}

export function getPromptVideoUrl(q: Pick<Question, 'promptVideoUrl'>): string {
  return String(q.promptVideoUrl || '').trim();
}

export type PromptVideoEmbed =
  | {kind: 'youtube'; src: string}
  | {kind: 'vimeo'; src: string}
  | {kind: 'file'; src: string};

/** Resolve a pasted video URL into an embeddable source */
export function parsePromptVideoUrl(raw: string): PromptVideoEmbed | null {
  const url = raw.trim();
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    if (id) return {kind: 'youtube', src: `https://www.youtube.com/embed/${id}`};
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const embed = parsed.pathname.match(/^\/embed\/([^/?#]+)/);
    if (embed?.[1]) return {kind: 'youtube', src: `https://www.youtube.com/embed/${embed[1]}`};
    const shorts = parsed.pathname.match(/^\/shorts\/([^/?#]+)/);
    if (shorts?.[1]) return {kind: 'youtube', src: `https://www.youtube.com/embed/${shorts[1]}`};
    const id = parsed.searchParams.get('v');
    if (id) return {kind: 'youtube', src: `https://www.youtube.com/embed/${id}`};
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parsed.pathname.split('/').filter(Boolean).pop();
    if (id && /^\d+$/.test(id)) return {kind: 'vimeo', src: `https://player.vimeo.com/video/${id}`};
  }
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(parsed.pathname + parsed.search)) {
    return {kind: 'file', src: url};
  }
  // Allow other https media URLs as HTML5 video attempt
  if (parsed.protocol === 'https:') return {kind: 'file', src: url};
  return null;
}

export function getExplanationImages(
  q: Pick<Question, 'explanationImages' | 'explanationImage'>,
): string[] {
  if (Array.isArray(q.explanationImages) && q.explanationImages.length) {
    return q.explanationImages.filter(Boolean);
  }
  if (q.explanationImage) return [q.explanationImage];
  return [];
}

/** Activity category shown on the hero badge (e.g. ข้อสอบ O-net · ม.6) */
export type SetCategory = {
  id: string;
  name: string;
  /** Shared default cover for every set in this category (all subjects/levels) */
  defaultCover: string;
};

export const DEFAULT_CATEGORY_ID = 'onet';

/** Default category covers live in public/covers/categories/ */
export const initialCategories: SetCategory[] = [
  {
    id: 'onet',
    name: 'ข้อสอบ O-net',
    defaultCover: '/covers/categories/onet.png',
  },
  {
    id: 'advanced',
    name: 'แบบฝึก advanced',
    defaultCover: '/covers/categories/advanced.png',
  },
];

export type ExamSet = {
  id: number;
  title: string;
  subject: string;
  level: string;
  topic: string;
  count: number;
  time: number;
  popular: number;
  icon: string;
  tint: string;
  description: string;
  cover?: string;
  /** Category id from SetCategory catalog */
  categoryId?: string;
  /** true when the user uploaded a custom cover (don't overwrite on category change) */
  coverCustom?: boolean;
  /** Ordered question ids in this set — drives practice / export order */
  questionIds?: number[];
};

export function getSetCategory(
  set: Pick<ExamSet, 'categoryId'> | undefined,
  categories: SetCategory[] = initialCategories,
): SetCategory {
  const fallback =
    categories.find((c) => c.id === DEFAULT_CATEGORY_ID) ||
    categories[0] ||
    initialCategories[0];
  if (!set?.categoryId) return fallback;
  return categories.find((c) => c.id === set.categoryId) || fallback;
}

export function getSetCover(
  set: Pick<ExamSet, 'cover' | 'categoryId' | 'id'> | undefined,
  categories: SetCategory[] = initialCategories,
): string {
  if (!set) return initialCategories[0].defaultCover;
  if (set.cover) return set.cover;
  return getSetCategory(set, categories).defaultCover;
}

export function getCategoryLabel(
  set: Pick<ExamSet, 'categoryId'> | undefined,
  categories: SetCategory[] = initialCategories,
): string {
  return getSetCategory(set, categories).name;
}

export type Attempt = {
  id: string;
  setId: number;
  mode: 'practice' | 'simulation';
  date: string;
  answers: Record<number, number>;
  correct: number;
  total: number;
  duration: number;
};

/** Map free-text / legacy labels onto the 6 Bloom skills used in the platform */
export function normalizeSkillName(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, ' ');
  if (!s) return null;
  if ((SKILL_OPTIONS as readonly string[]).includes(s)) return s;
  const compact = s.replace(/\s+/g, '').toLowerCase();
  const aliases: Record<string, (typeof SKILL_OPTIONS)[number]> = {
    ความรู้ความจำ: 'ความรู้ ความจำ',
    ความจำ: 'ความรู้ ความจำ',
    knowledge: 'ความรู้ ความจำ',
    remember: 'ความรู้ ความจำ',
    remembering: 'ความรู้ ความจำ',
    ความเข้าใจ: 'ความเข้าใจ',
    understand: 'ความเข้าใจ',
    understanding: 'ความเข้าใจ',
    การประยุกต์ใช้: 'การประยุกต์ใช้',
    ประยุกต์ใช้: 'การประยุกต์ใช้',
    ประยุกต์: 'การประยุกต์ใช้',
    apply: 'การประยุกต์ใช้',
    applying: 'การประยุกต์ใช้',
    การวิเคราะห์: 'การวิเคราะห์',
    วิเคราะห์: 'การวิเคราะห์',
    analyze: 'การวิเคราะห์',
    analysing: 'การวิเคราะห์',
    analyzing: 'การวิเคราะห์',
    การประเมินค่า: 'การประเมินค่า',
    ประเมินค่า: 'การประเมินค่า',
    ประเมิน: 'การประเมินค่า',
    evaluate: 'การประเมินค่า',
    evaluating: 'การประเมินค่า',
    การสร้างสรรค์: 'การสร้างสรรค์',
    สร้างสรรค์: 'การสร้างสรรค์',
    create: 'การสร้างสรรค์',
    creating: 'การสร้างสรรค์',
  };
  return aliases[compact] ?? null;
}

/** Only the 6 platform skills — unknown import labels are dropped */
export function getQuestionSkills(q: Pick<Question, 'skills' | 'skill'>): string[] {
  const raw =
    Array.isArray(q.skills) && q.skills.length
      ? q.skills
      : typeof q.skill === 'string' && q.skill
        ? [q.skill]
        : [];
  const mapped = [
    ...new Set(raw.map((s) => normalizeSkillName(s)).filter((s): s is string => !!s)),
  ];
  return mapped;
}

export function getQuestionSetIds(
  q: Pick<Question, 'setIds' | 'topic' | 'level'>,
  sets: ExamSet[] = initialSets,
): number[] {
  // Explicit setIds (including []) wins — empty means "in no set", do not fall back to topic
  if (Array.isArray(q.setIds)) return q.setIds;
  if (q.topic) {
    return sets.filter((s) => s.topic === q.topic && s.level === q.level).map((s) => s.id);
  }
  return [];
}

/** Build ordered id list for a set from saved questionIds + current members */
export function buildSetQuestionOrder(set: Pick<ExamSet, 'questionIds'> | undefined, memberIds: number[]): number[] {
  const members = [...new Set(memberIds)];
  const memberSet = new Set(members);
  const ordered = (set?.questionIds || []).filter((id) => memberSet.has(id));
  const rest = members.filter((id) => !ordered.includes(id));
  return [...ordered, ...rest];
}

/** Member question ids for a set: union of question.setIds and set.questionIds */
export function getSetMemberIds(
  set: ExamSet | undefined,
  questions: Question[],
  sets: ExamSet[] = initialSets,
): number[] {
  if (!set) return [];
  const valid = new Set(questions.map((q) => q.id));
  const fromFlags = questions
    .filter((q) => getQuestionSetIds(q, sets).includes(set.id))
    .map((q) => q.id);
  const fromOrder = (set.questionIds || []).filter((id) => valid.has(id));
  return buildSetQuestionOrder(set, [...fromFlags, ...fromOrder]);
}

/** Questions belonging to a set, in admin-defined order */
export function getOrderedSetQuestions(
  set: ExamSet | undefined,
  questions: Question[],
  sets: ExamSet[] = initialSets,
): Question[] {
  if (!set) return [];
  const byId = new Map(questions.map((q) => [q.id, q]));
  return getSetMemberIds(set, questions, sets)
    .map((id) => byId.get(id))
    .filter((q): q is Question => !!q);
}

export const initialQuestions: Question[] = [
  {id:1,subject:'คณิต',level:'ม.1',setIds:[1],skills:['ความรู้ ความจำ'],difficulty:'ง่าย',prompt:'กำหนดให้ A = {1, 3, 5, 7, 9} ข้อความในข้อใดต่อไปนี้ถูกต้อง',options:['4 ∈ A','7 ∉ A','5 ∈ A','9 ∉ A'],correct:2,explanation:'เครื่องหมาย ∈ หมายถึง “เป็นสมาชิกของ” และ 5 อยู่ในเซต A ดังนั้น 5 ∈ A ถูกต้อง ส่วน 4 ไม่อยู่ในเซต และ 7, 9 เป็นสมาชิกของ A'},
  {id:2,subject:'คณิต',level:'ม.1',setIds:[1],skills:['ความรู้ ความจำ'],difficulty:'ง่าย',prompt:'กำหนดให้ B = {a, e, i, o, u} ข้อใดถูกต้อง',options:['b ∈ B','a ∈ B','e ∉ B','u ∉ B'],correct:1,explanation:'a เป็นสมาชิกของเซต B ดังนั้น a ∈ B เป็นข้อความที่ถูกต้อง'},
  {id:3,subject:'คณิต',level:'ม.1',setIds:[1],skills:['ความเข้าใจ','การประยุกต์ใช้'],difficulty:'ปานกลาง',prompt:'ให้ A = {1, 2, 3} และ B = {3, 4, 5} แล้ว A ∩ B เท่ากับข้อใด',options:['{1, 2, 3, 4, 5}','{1, 2}','{3}','{4, 5}'],correct:2,explanation:'อินเตอร์เซกชัน คือสมาชิกที่อยู่ร่วมกันทั้งสองเซต ซึ่งมีเพียง 3'},
  {id:4,subject:'คณิต',level:'ม.1',setIds:[1],skills:['ความเข้าใจ','การประยุกต์ใช้'],difficulty:'ปานกลาง',prompt:'ให้ A = {1, 2} และ B = {2, 3} แล้ว A ∪ B เท่ากับข้อใด',options:['{2}','{1, 2, 3}','{1, 3}','{}'],correct:1,explanation:'ยูเนียน คือสมาชิกทั้งหมดของทั้งสองเซตโดยไม่ซ้ำกัน จึงได้ {1, 2, 3}'},
  {id:5,subject:'คณิต',level:'ม.1',setIds:[1],skills:['ความรู้ ความจำ'],difficulty:'ง่าย',prompt:'เซต C = {2, 4, 6, 8} มีจำนวนสมาชิกกี่ตัว',options:['2','3','4','8'],correct:2,explanation:'เซต C มีสมาชิกที่แตกต่างกัน 4 ตัว คือ 2, 4, 6 และ 8'},
  {id:6,subject:'คณิต',level:'ม.2',setIds:[2],skills:['ความเข้าใจ','การประยุกต์ใช้'],difficulty:'ง่าย',prompt:'2³ × 2² มีค่าเท่ากับข้อใด',options:['16','32','64','8'],correct:1,explanation:'เลขยกกำลังฐานเดียวกันนำมาคูณกันให้บวกเลขชี้กำลัง 2³ × 2² = 2⁵ = 32'},
  {id:7,subject:'คณิต',level:'ม.2',setIds:[2],skills:['การประยุกต์ใช้'],difficulty:'ปานกลาง',prompt:'(3²)³ มีค่าเท่ากับข้อใด',options:['81','243','729','18'],correct:2,explanation:'ยกกำลังซ้อนให้นำเลขชี้กำลังคูณกัน (3²)³ = 3⁶ = 729'},
  {id:8,subject:'คณิต',level:'ม.3',setIds:[3],skills:['การประยุกต์ใช้','การวิเคราะห์'],difficulty:'ปานกลาง',prompt:'คำตอบของสมการ x² − 5x + 6 = 0 คือข้อใด',options:['x = 1, 6','x = −2, −3','x = 2, 3','x = −1, 6'],correct:2,explanation:'แยกตัวประกอบ (x − 2)(x − 3) = 0 จึงได้ x = 2 หรือ x = 3'},
  {id:9,subject:'คณิต',level:'ม.4',setIds:[4],skills:['ความเข้าใจ'],difficulty:'ปานกลาง',prompt:'โยนเหรียญยุติธรรม 1 ครั้ง ความน่าจะเป็นที่จะออกหัวเป็นเท่าใด',options:['0','1/4','1/2','1'],correct:2,explanation:'ผลลัพธ์ที่เป็นไปได้มีหัวและก้อยอย่างละ 1 แบบ ดังนั้นความน่าจะเป็นออกหัวคือ 1/2'},
  {id:10,subject:'คณิต',level:'ม.5',setIds:[5],skills:['ความเข้าใจ'],difficulty:'ปานกลาง',prompt:'ลำดับเลขคณิต 2, 5, 8, 11, ... มีผลต่างร่วมเท่าใด',options:['2','3','5','8'],correct:1,explanation:'ผลต่างระหว่างพจน์ติดกันเท่ากับ 5 − 2 = 3'},
  {id:11,subject:'คณิต',level:'ม.6',setIds:[6],skills:['การประยุกต์ใช้'],difficulty:'ง่าย',prompt:'ค่าเฉลี่ยของข้อมูล 2, 4, 6, 8 เป็นเท่าใด',options:['4','5','6','8'],correct:1,explanation:'ผลรวมเท่ากับ 20 และมีข้อมูล 4 ค่า ค่าเฉลี่ยจึงเท่ากับ 20 ÷ 4 = 5'},
  {id:12,subject:'คณิต',level:'ม.1',setIds:[1],skills:['การวิเคราะห์','การประยุกต์ใช้'],difficulty:'ยาก',prompt:'ถ้า A = {1, 2, 3, 4} และ B = {2, 4, 6} แล้ว A − B คือข้อใด',options:['{1, 3}','{2, 4}','{1, 3, 6}','{6}'],correct:0,explanation:'A − B คือสมาชิกที่อยู่ใน A แต่ไม่อยู่ใน B จึงเหลือ {1, 3}'},
];

export const initialSets: ExamSet[] = [
  {id:1,title:'เซต',subject:'คณิต',level:'ม.1',topic:'เซต',count:250,time:15,popular:240,icon:'∈',tint:'violet',description:'สมาชิกของเซต ยูเนียน อินเตอร์เซกชัน และการแก้โจทย์ปัญหา',cover:'/covers/categories/onet.png',categoryId:'onet',coverCustom:false},
  {id:2,title:'เลขยกกำลัง',subject:'คณิต',level:'ม.2',topic:'เลขยกกำลัง',count:120,time:20,popular:186,icon:'x²',tint:'orange',description:'กฎเลขยกกำลังและการประยุกต์แก้ปัญหา',cover:'/covers/categories/onet.png',categoryId:'onet',coverCustom:false},
  {id:3,title:'สมการกำลังสอง',subject:'คณิต',level:'ม.3',topic:'สมการกำลังสอง',count:90,time:20,popular:154,icon:'√',tint:'green',description:'แยกตัวประกอบและหาคำตอบของสมการ',cover:'/covers/categories/onet.png',categoryId:'onet',coverCustom:false},
  {id:4,title:'ความน่าจะเป็น',subject:'คณิต',level:'ม.4',topic:'ความน่าจะเป็น',count:85,time:15,popular:132,icon:'%',tint:'pink',description:'เหตุการณ์และการคำนวณความน่าจะเป็น',cover:'/covers/categories/onet.png',categoryId:'onet',coverCustom:false},
  {id:5,title:'ลำดับและอนุกรม',subject:'คณิต',level:'ม.5',topic:'ลำดับและอนุกรม',count:110,time:20,popular:118,icon:'∑',tint:'blue',description:'ลำดับเลขคณิตและเรขาคณิต',cover:'/covers/categories/onet.png',categoryId:'onet',coverCustom:false},
  {id:6,title:'สถิติ',subject:'คณิต',level:'ม.6',topic:'สถิติ',count:75,time:20,popular:103,icon:'▥',tint:'purple',description:'ค่าเฉลี่ย มัธยฐาน ฐานนิยม และการนำเสนอข้อมูล',cover:'/covers/categories/onet.png',categoryId:'onet',coverCustom:false},
];

/** Attempts are stored per activity set — no cross-set demo seed */
export const seedAttempts: Attempt[] = [];
