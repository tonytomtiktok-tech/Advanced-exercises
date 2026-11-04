import * as XLSX from 'xlsx';
import {
  Question,
  SUBJECT_OPTIONS,
  getExplanationImages,
  getPromptImages,
  getQuestionSkills,
  normalizeSkillName,
} from '@/lib/mock';

const LEVELS = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
const DIFFICULTIES = ['ง่าย', 'ปานกลาง', 'ยาก'] as const;

export type ImportQuestionDraft = Omit<Question, 'id'>;

export type ImportResult = {
  questions: ImportQuestionDraft[];
  skipped: number;
  errors: string[];
};

function normalizeContentText(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Fingerprint for duplicate check: prompt + options + explanation (+ media shape) */
export function questionContentKey(
  q:
    | Pick<
        Question,
        | 'prompt'
        | 'options'
        | 'explanation'
        | 'promptImages'
        | 'promptImage'
        | 'promptVideoUrl'
        | 'explanationImages'
        | 'explanationImage'
        | 'optionImages'
      >
    | ImportQuestionDraft,
): string {
  const options = Array.isArray(q.options) ? q.options.map(normalizeContentText) : [];
  const optionImages = Array.isArray(q.optionImages)
    ? q.optionImages.map((x) => (x ? String(x).slice(0, 64) : ''))
    : [];
  return JSON.stringify({
    prompt: normalizeContentText(q.prompt),
    options,
    explanation: normalizeContentText(q.explanation),
    promptVideoUrl: normalizeContentText(q.promptVideoUrl),
    promptImages: getPromptImages(q).map((x) => x.slice(0, 64)),
    explanationImages: getExplanationImages(q).map((x) => x.slice(0, 64)),
    optionImages,
  });
}

/** Accept array of URLs / data-URLs, or a single string */
function parseMediaList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x ?? '').trim()).filter(Boolean);
  }
  const s = String(raw ?? '').trim();
  if (!s) return [];
  // data:/http(s) may contain commas — treat as one value
  if (/^(data:|https?:\/\/|\/)/i.test(s)) return [s];
  return s
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseOptionImages(
  row: Record<string, unknown>,
  optionCount: number,
): (string | undefined)[] | undefined {
  const out: (string | undefined)[] = Array.from({length: optionCount}, () => undefined);
  let any = false;
  if (Array.isArray(row.optionImages)) {
    for (let i = 0; i < optionCount; i++) {
      const s = String(row.optionImages[i] ?? '').trim();
      if (s) {
        out[i] = s;
        any = true;
      }
    }
  }
  for (let i = 1; i <= optionCount; i++) {
    const v =
      row[`optionImage${i}`] ??
      row[`รูปตัวเลือก${i}`] ??
      row[`choiceImage${i}`];
    if (v == null || String(v).trim() === '') continue;
    out[i - 1] = String(v).trim();
    any = true;
  }
  return any ? out : undefined;
}

function normalizeSubject(subject: string) {
  const s = subject.trim();
  if (s === 'คณิตศาสตร์') return 'คณิต';
  if (s === 'วิทยาศาสตร์') return 'วิทย์';
  if ((SUBJECT_OPTIONS as readonly string[]).includes(s)) return s;
  return s || 'คณิต';
}

function normalizeLevel(level: string) {
  const s = level.trim();
  return LEVELS.includes(s) ? s : s || 'ม.1';
}

function normalizeDifficulty(raw: unknown): Question['difficulty'] {
  const s = String(raw ?? '').trim();
  if ((DIFFICULTIES as readonly string[]).includes(s)) return s as Question['difficulty'];
  const lower = s.toLowerCase();
  if (lower === 'easy' || lower === '1') return 'ง่าย';
  if (lower === 'hard' || lower === '3') return 'ยาก';
  return 'ปานกลาง';
}

function parseSkills(raw: unknown): string[] {
  let parts: string[] = [];
  if (Array.isArray(raw)) {
    parts = raw.map((x) => String(x).trim()).filter(Boolean);
  } else {
    const s = String(raw ?? '').trim();
    if (s) {
      parts = s
        .split(/[,|/;]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }
  const known = [
    ...new Set(parts.map((p) => normalizeSkillName(p)).filter((p): p is string => !!p)),
  ];
  // Only the 6 Bloom skills — never keep free-text topic labels from import files
  return known.length ? known : ['ความรู้ ความจำ'];
}

function parseOptions(row: Record<string, unknown>): string[] {
  if (Array.isArray(row.options)) {
    return row.options.map((o) => String(o ?? '').trim()).filter(Boolean);
  }
  const opts: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const v =
      row[`option${i}`] ??
      row[`ตัวเลือก${i}`] ??
      row[`choice${i}`] ??
      row[`Option${i}`];
    if (v == null || String(v).trim() === '') continue;
    opts.push(String(v).trim());
  }
  return opts;
}

function parseCorrect(raw: unknown, optionCount: number): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // support 0-based or 1-based
    if (raw >= 0 && raw < optionCount) return Math.floor(raw);
    if (raw >= 1 && raw <= optionCount) return Math.floor(raw) - 1;
  }
  const s = String(raw ?? '').trim();
  if (!s) return 0;
  const asNum = Number(s);
  if (Number.isFinite(asNum)) {
    if (asNum >= 0 && asNum < optionCount) return Math.floor(asNum);
    if (asNum >= 1 && asNum <= optionCount) return Math.floor(asNum) - 1;
  }
  const letter = s.toUpperCase().charCodeAt(0) - 65; // A=0
  if (letter >= 0 && letter < optionCount) return letter;
  return 0;
}

function parseSetIds(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  }
  const s = String(raw ?? '').trim();
  if (!s) return [];
  return s
    .split(/[,|/;]+/)
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n));
}

function rowToDraft(row: Record<string, unknown>, index: number): ImportQuestionDraft | {error: string} {
  const prompt = String(row.prompt ?? row.คำถาม ?? row.question ?? row.โจทย์ ?? '').trim();
  const options = parseOptions(row);
  const promptImages = parseMediaList(
    row.promptImages ?? row.promptImage ?? row.รูปโจทย์ ?? row.images,
  );
  const explanationImages = parseMediaList(
    row.explanationImages ?? row.explanationImage ?? row.รูปเฉลย,
  );
  const promptVideoUrl = String(
    row.promptVideoUrl ?? row.videoUrl ?? row.วิดีโอ ?? row.video ?? '',
  ).trim();
  const hasStemMedia = promptImages.length > 0 || !!promptVideoUrl;

  if (!prompt && !hasStemMedia) {
    return {error: `แถว ${index + 1}: ไม่มีคำถาม (ต้องมีข้อความโจทย์ หรือรูป/วิดีโอ)`};
  }
  if (options.length < 2) return {error: `แถว ${index + 1}: ต้องมีตัวเลือกอย่างน้อย 2 ข้อ`};

  const explanation = String(row.explanation ?? row.เฉลย ?? row.คำอธิบาย ?? '').trim();
  const subject = normalizeSubject(String(row.subject ?? row.วิชา ?? 'คณิต'));
  const level = normalizeLevel(String(row.level ?? row.ระดับชั้น ?? row.ระดับ ?? 'ม.1'));
  const skills = parseSkills(row.skills ?? row.skill ?? row.ทักษะ);
  const correct = parseCorrect(row.correct ?? row.คำตอบถูก ?? row.เฉลยข้อ ?? row.answer, options.length);
  const optionImages = parseOptionImages(row, options.length);
  // Ignore setIds from file — imported questions stay in the bank until assigned manually
  void parseSetIds(row.setIds ?? row.setId ?? row.ชุดกิจกรรม);

  return {
    subject,
    level,
    setIds: [],
    skills,
    difficulty: normalizeDifficulty(row.difficulty ?? row.ความยาก),
    prompt,
    promptImages: promptImages.length ? promptImages : undefined,
    promptVideoUrl: promptVideoUrl || undefined,
    options,
    optionImages,
    correct,
    explanation: explanation || (explanationImages.length ? '' : '—'),
    explanationImages: explanationImages.length ? explanationImages : undefined,
  };
}

function normalizeJsonPayload(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.questions)) return obj.questions as Record<string, unknown>[];
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
    // single question object (text and/or media stem)
    if (
      obj.prompt ||
      obj.คำถาม ||
      obj.promptImages ||
      obj.promptImage ||
      obj.promptVideoUrl
    ) {
      return [obj];
    }
  }
  return [];
}

function sheetRowsToObjects(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {defval: ''});
  return rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const k = String(key).trim();
      mapped[k] = value;
      // also map common Thai headers to English keys
      const lower = k.toLowerCase();
      if (k === 'วิชา' || lower === 'subject') mapped.subject = value;
      if (k === 'ระดับชั้น' || k === 'ระดับ' || lower === 'level') mapped.level = value;
      if (k === 'ทักษะ' || lower === 'skills' || lower === 'skill') mapped.skills = value;
      if (k === 'ความยาก' || lower === 'difficulty') mapped.difficulty = value;
      if (k === 'คำถาม' || k === 'โจทย์' || lower === 'prompt' || lower === 'question') mapped.prompt = value;
      if (k === 'เฉลย' || k === 'คำอธิบาย' || lower === 'explanation') mapped.explanation = value;
      if (k === 'คำตอบถูก' || k === 'เฉลยข้อ' || lower === 'correct' || lower === 'answer') mapped.correct = value;
      if (k === 'ชุดกิจกรรม' || lower === 'setids' || lower === 'setid') mapped.setIds = value;
      const optMatch = k.match(/^(?:ตัวเลือก|option|choice)\s*(\d+)$/i);
      if (optMatch) mapped[`option${optMatch[1]}`] = value;
    }
    return mapped;
  });
}

export function parseQuestionsFromJsonText(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {questions: [], skipped: 0, errors: ['ไฟล์ JSON ไม่ถูกต้อง']};
  }
  return parseQuestionRows(normalizeJsonPayload(parsed));
}

export async function parseQuestionsFromExcel(buffer: ArrayBuffer): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, {type: 'array'});
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return {questions: [], skipped: 0, errors: ['ไม่พบชีตในไฟล์ Excel']};
  const rows = sheetRowsToObjects(workbook.Sheets[sheetName]);
  return parseQuestionRows(rows);
}

function parseQuestionRows(rows: Record<string, unknown>[]): ImportResult {
  const questions: ImportQuestionDraft[] = [];
  const errors: string[] = [];
  let skipped = 0;
  rows.forEach((row, i) => {
    const draft = rowToDraft(row, i);
    if ('error' in draft) {
      skipped++;
      errors.push(draft.error);
      return;
    }
    // ensure skills via helper for legacy shape
    draft.skills = getQuestionSkills(draft);
    questions.push(draft);
  });
  return {questions, skipped, errors};
}

/** Download a starter Excel template */
export function downloadQuestionImportTemplate() {
  const headers = [
    'วิชา',
    'ระดับชั้น',
    'ทักษะ',
    'ความยาก',
    'คำถาม',
    'ตัวเลือก1',
    'ตัวเลือก2',
    'ตัวเลือก3',
    'ตัวเลือก4',
    'คำตอบถูก',
    'เฉลย',
    'ชุดกิจกรรม',
  ];
  const sample = [
    'คณิต',
    'ม.1',
    'ความรู้ ความจำ',
    'ง่าย',
    'กำหนดให้ A = {1, 2, 3} ข้อใดถูกต้อง',
    '1 ∈ A',
    '4 ∈ A',
    '1 ∉ A',
    'A เป็นเซตว่าง',
    '1',
    '1 เป็นสมาชิกของเซต A',
    '',
  ];
  const sheet = XLSX.utils.aoa_to_sheet([headers, sample]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'questions');
  XLSX.writeFile(book, 'aksorn-questions-template.xlsx');
}

export function downloadQuestionImportJsonTemplate() {
  const sample = {
    questions: [
      {
        subject: 'คณิต',
        level: 'ม.1',
        skills: ['ความรู้ ความจำ'],
        difficulty: 'ง่าย',
        prompt: 'กำหนดให้ A = {1, 2, 3} ข้อใดถูกต้อง',
        promptImages: ['https://example.com/prompt.png'],
        promptVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: ['1 ∈ A', '4 ∈ A', '1 ∉ A', 'A เป็นเซตว่าง'],
        optionImages: [null, null, null, null],
        correct: 0,
        explanation: '1 เป็นสมาชิกของเซต A',
        explanationImages: ['https://example.com/explain.png'],
        setIds: [],
      },
    ],
    _note:
      'promptImages / optionImages / explanationImages รองรับ URL หรือ data URL (base64) จากไฟล์ที่ Export จากระบบนี้ — วิดีโอใช้ promptVideoUrl เป็นลิงก์',
  };
  const blob = new Blob([JSON.stringify(sample, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aksorn-questions-template.json';
  a.click();
  URL.revokeObjectURL(url);
}

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/** Export questions as JSON (same shape as import) — includes images + video URL */
export function exportQuestionsJson(questions: Question[], filename?: string) {
  const payload = {
    exportedAt: new Date().toISOString(),
    count: questions.length,
    questions: questions.map((q) => {
      const promptImages = getPromptImages(q);
      const explanationImages = getExplanationImages(q);
      const optionImages = Array.isArray(q.optionImages)
        ? q.options.map((_, i) => q.optionImages?.[i] || null)
        : q.options.map(() => null);
      const hasOptionImages = optionImages.some(Boolean);
      return {
        subject: q.subject,
        level: q.level,
        skills: getQuestionSkills(q),
        difficulty: q.difficulty,
        prompt: q.prompt,
        ...(promptImages.length ? {promptImages} : {}),
        ...(q.promptVideoUrl ? {promptVideoUrl: q.promptVideoUrl} : {}),
        options: [...q.options],
        ...(hasOptionImages ? {optionImages} : {}),
        correct: q.correct,
        explanation: q.explanation,
        ...(explanationImages.length ? {explanationImages} : {}),
        setIds: Array.isArray(q.setIds) ? [...q.setIds] : [],
      };
    }),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `aksorn-questions-${stamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export questions as Excel (.xlsx) */
export function exportQuestionsExcel(questions: Question[], filename?: string) {
  const maxOpts = Math.max(4, ...questions.map((q) => q.options.length), 2);
  const headers = [
    'วิชา',
    'ระดับชั้น',
    'ทักษะ',
    'ความยาก',
    'คำถาม',
    ...Array.from({length: maxOpts}, (_, i) => `ตัวเลือก${i + 1}`),
    'คำตอบถูก',
    'เฉลย',
    'ชุดกิจกรรม',
  ];
  const rows = questions.map((q) => {
    const opts = [...q.options];
    while (opts.length < maxOpts) opts.push('');
    return [
      q.subject,
      q.level,
      getQuestionSkills(q).join(', '),
      q.difficulty,
      q.prompt,
      ...opts,
      q.correct + 1, // 1-based for Excel friendliness
      q.explanation,
      (Array.isArray(q.setIds) ? q.setIds : []).join(','),
    ];
  });
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'questions');
  XLSX.writeFile(book, filename || `aksorn-questions-${stamp()}.xlsx`);
}
