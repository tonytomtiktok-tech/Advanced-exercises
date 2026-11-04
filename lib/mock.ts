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
  {id:1,subject:'คณิต',level:'ม.6',setIds:[1],skills:['การประยุกต์ใช้'],difficulty:'ง่าย',prompt:'ค่าเฉลี่ยของข้อมูล 2, 4, 6, 8 เป็นเท่าใด',options:['4','5','6','8'],correct:1,explanation:'ผลรวมเท่ากับ 20 และมีข้อมูล 4 ค่า ค่าเฉลี่ยจึงเท่ากับ 20 ÷ 4 = 5'},
  {id:2,subject:'คณิต',level:'ม.6',setIds:[1],skills:['ความเข้าใจ'],difficulty:'ง่าย',prompt:'ข้อมูล 3, 5, 5, 7, 9 มีฐานนิยมเท่าใด',options:['3','5','7','9'],correct:1,explanation:'ฐานนิยมคือค่าที่ปรากฏบ่อยที่สุด ในชุดนี้ 5 ปรากฏ 2 ครั้ง จึงเป็นฐานนิยม'},
  {id:3,subject:'คณิต',level:'ม.6',setIds:[1],skills:['ความเข้าใจ','การประยุกต์ใช้'],difficulty:'ปานกลาง',prompt:'ข้อมูล 2, 4, 6, 8, 10 มีมัธยฐานเท่าใด',options:['4','5','6','8'],correct:2,explanation:'เรียงแล้วมี 5 ค่า ค่ากลางคือตัวที่ 3 ซึ่งเท่ากับ 6'},
  {id:4,subject:'คณิต',level:'ม.6',setIds:[1],skills:['การประยุกต์ใช้'],difficulty:'ปานกลาง',prompt:'คะแนนสอบ 5 คน เป็น 10, 12, 14, 16, 18 ค่าเฉลี่ยเลขคณิตเท่าใด',options:['12','14','15','16'],correct:1,explanation:'ผลรวม 70 หารด้วย 5 ได้ค่าเฉลี่ย 14'},
  {id:5,subject:'คณิต',level:'ม.6',setIds:[1],skills:['การวิเคราะห์'],difficulty:'ปานกลาง',prompt:'ถ้าค่าเฉลี่ยของข้อมูล 4 จำนวนเท่ากับ 10 และสามจำนวนแรกเป็น 8, 9, 11 แล้วจำนวนที่สี่เท่าใด',options:['10','11','12','13'],correct:2,explanation:'ผลรวมทั้งสิ้นต้องเป็น 10 × 4 = 40 ดังนั้นจำนวนที่สี่คือ 40 − (8+9+11) = 12'},
  {id:6,subject:'คณิต',level:'ม.6',setIds:[1],skills:['ความรู้ ความจำ'],difficulty:'ง่าย',prompt:'แผนภาพที่นิยมใช้แสดงสัดส่วนของแต่ละส่วนเทียบกับทั้งหมด คือข้อใด',options:['ฮิสโทแกรม','แผนภูมิวงกลม','แผนภูมิแท่ง','แผนภาพต้น-ใบ'],correct:1,explanation:'แผนภูมิวงกลมเหมาะกับการแสดงสัดส่วนหรือร้อยละขององค์ประกอบทั้งหมด'},
];

export const initialSets: ExamSet[] = [
  {id:1,title:'สถิติ',subject:'คณิต',level:'ม.6',topic:'สถิติ',count:6,time:15,popular:103,icon:'▥',tint:'purple',description:'ค่าเฉลี่ย มัธยฐาน ฐานนิยม และการนำเสนอข้อมูล',cover:'/covers/categories/onet.png',categoryId:'onet',coverCustom:false,questionIds:[1,2,3,4,5,6]},
];

/** Attempts are stored per activity set — no cross-set demo seed */
export const seedAttempts: Attempt[] = [];
