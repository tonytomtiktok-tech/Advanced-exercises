import {
  ExamSet,
  Question,
  SetCategory,
  DEFAULT_CATEGORY_ID,
  getCategoryLabel,
  getExplanationImages,
  getOrderedSetQuestions,
  getPromptImages,
  getQuestionSkills,
  getSetCategory,
  getSetCover,
} from '@/lib/mock';
import {parseQuestionsFromJsonText, type ImportQuestionDraft} from '@/lib/import-questions';

export const EXAM_SET_PACKAGE_KIND = 'aksorn-exam-set';
export const EXAM_SET_PACKAGE_VERSION = 1;

export type ExamSetPackageSetMeta = {
  title: string;
  subject: string;
  level: string;
  topic: string;
  time: number;
  description: string;
  icon: string;
  tint: string;
  cover?: string;
  coverCustom?: boolean;
  categoryId?: string;
  categoryName?: string;
  categoryDefaultCover?: string;
  popular?: number;
};

export type ExamSetPackage = {
  kind: typeof EXAM_SET_PACKAGE_KIND;
  version: number;
  exportedAt: string;
  set: ExamSetPackageSetMeta;
  questions: Record<string, unknown>[];
};

export type ParsedExamSetPackage = {
  set: ExamSetPackageSetMeta;
  questions: ImportQuestionDraft[];
  skipped: number;
  errors: string[];
};

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function serializeQuestion(q: Question): Record<string, unknown> {
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
  };
}

export function isExamSetPackage(parsed: unknown): parsed is ExamSetPackage {
  if (!parsed || typeof parsed !== 'object') return false;
  const obj = parsed as Record<string, unknown>;
  return (
    obj.kind === EXAM_SET_PACKAGE_KIND &&
    !!obj.set &&
    typeof obj.set === 'object' &&
    Array.isArray(obj.questions)
  );
}

/** Build + download one JSON file for an activity set (meta + ordered questions + media) */
export function exportExamSetPackage(
  set: ExamSet,
  allQuestions: Question[],
  allSets: ExamSet[],
  categories: SetCategory[],
  filename?: string,
) {
  const ordered = getOrderedSetQuestions(set, allQuestions, allSets);
  const category = getSetCategory(set, categories);
  const payload: ExamSetPackage = {
    kind: EXAM_SET_PACKAGE_KIND,
    version: EXAM_SET_PACKAGE_VERSION,
    exportedAt: new Date().toISOString(),
    set: {
      title: set.title,
      subject: set.subject,
      level: set.level,
      topic: set.topic || set.title,
      time: set.time || 15,
      description: set.description || '',
      icon: set.icon || '✦',
      tint: set.tint || 'orange',
      cover: getSetCover(set, categories),
      coverCustom: !!set.coverCustom,
      categoryId: category.id,
      categoryName: getCategoryLabel(set, categories),
      categoryDefaultCover: category.defaultCover,
      popular: set.popular || 0,
    },
    questions: ordered.map(serializeQuestion),
  };
  const safeName = set.title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'set';
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `aksorn-set-${safeName}-${stamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return {count: ordered.length, filename: a.download};
}

export function parseExamSetPackageText(text: string):
  | {ok: true; data: ParsedExamSetPackage}
  | {ok: false; error: string} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {ok: false, error: 'ไฟล์ JSON ไม่ถูกต้อง'};
  }
  if (!isExamSetPackage(parsed)) {
    return {
      ok: false,
      error: 'ไฟล์นี้ไม่ใช่แพ็กเกจชุดกิจกรรม (ต้องมี kind: "aksorn-exam-set")',
    };
  }
  const rawSet = parsed.set as Record<string, unknown>;
  const title = String(rawSet.title ?? '').trim();
  if (!title) return {ok: false, error: 'แพ็กเกจชุดไม่มีชื่อชุด (set.title)'};

  const qResult = parseQuestionsFromJsonText(JSON.stringify({questions: parsed.questions}));
  if (!qResult.questions.length && parsed.questions.length > 0) {
    return {
      ok: false,
      error:
        qResult.errors[0] ||
        'อ่านคำถามในแพ็กเกจไม่สำเร็จ — ตรวจรูปแบบ questions ในไฟล์',
    };
  }

  const setMeta: ExamSetPackageSetMeta = {
    title,
    subject: String(rawSet.subject ?? 'คณิต').trim() || 'คณิต',
    level: String(rawSet.level ?? 'ม.1').trim() || 'ม.1',
    topic: String(rawSet.topic ?? title).trim() || title,
    time: Math.max(1, Math.min(300, Number(rawSet.time) || 15)),
    description: String(rawSet.description ?? '').trim(),
    icon: String(rawSet.icon ?? '✦').trim() || '✦',
    tint: String(rawSet.tint ?? 'orange').trim() || 'orange',
    cover: rawSet.cover != null ? String(rawSet.cover) : undefined,
    coverCustom: !!rawSet.coverCustom,
    categoryId: rawSet.categoryId != null ? String(rawSet.categoryId) : undefined,
    categoryName: rawSet.categoryName != null ? String(rawSet.categoryName) : undefined,
    categoryDefaultCover:
      rawSet.categoryDefaultCover != null ? String(rawSet.categoryDefaultCover) : undefined,
    popular: Number(rawSet.popular) || 0,
  };

  return {
    ok: true,
    data: {
      set: setMeta,
      questions: qResult.questions,
      skipped: qResult.skipped,
      errors: qResult.errors,
    },
  };
}

/** Resolve / create category for an imported set package */
export function resolveCategoryForSetImport(
  meta: ExamSetPackageSetMeta,
  categories: SetCategory[],
): {categories: SetCategory[]; categoryId: string} {
  const byId = meta.categoryId
    ? categories.find((c) => c.id === meta.categoryId)
    : undefined;
  if (byId) return {categories, categoryId: byId.id};

  const byName = meta.categoryName
    ? categories.find((c) => c.name === meta.categoryName)
    : undefined;
  if (byName) return {categories, categoryId: byName.id};

  if (meta.categoryId || meta.categoryName) {
    const id =
      meta.categoryId ||
      `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const created: SetCategory = {
      id,
      name: meta.categoryName || meta.categoryId || 'หมวดนำเข้า',
      defaultCover:
        meta.categoryDefaultCover ||
        meta.cover ||
        categories[0]?.defaultCover ||
        '/covers/categories/onet.png',
    };
    return {categories: [...categories, created], categoryId: created.id};
  }

  const fallback =
    categories.find((c) => c.id === DEFAULT_CATEGORY_ID) || categories[0];
  return {categories, categoryId: fallback?.id || DEFAULT_CATEGORY_ID};
}
