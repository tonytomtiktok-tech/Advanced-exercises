'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Check, ChevronDown, ChevronUp, Download, FileDown, FileUp, GripVertical, Pencil, Plus, Trash2, Upload, X} from 'lucide-react';
import {
  DEFAULT_CATEGORY_ID,
  ExamSet,
  Question,
  SetCategory,
  SKILL_OPTIONS,
  SUBJECT_OPTIONS,
  buildSetQuestionOrder,
  getCategoryLabel,
  getExplanationImages,
  getOrderedSetQuestions,
  getPromptImages,
  getQuestionSetIds,
  getSetCategory,
  getSetCover,
  getSetMemberIds,
  getQuestionSkills,
  normalizeSkillName,
  parsePromptVideoUrl,
} from '@/lib/mock';
import {exportUserPackage} from '@/lib/export-package';
import {
  downloadQuestionImportJsonTemplate,
  downloadQuestionImportTemplate,
  exportQuestionsExcel,
  exportQuestionsJson,
  parseQuestionsFromExcel,
  parseQuestionsFromJsonText,
  questionContentKey,
  type ImportQuestionDraft,
} from '@/lib/import-questions';
import {
  ExplanationImage,
  ImageAttachButton,
  MultiImageAttach,
  OptionImage,
  PromptImage,
  PromptVideo,
  PromptVideoUrlField,
} from '@/components/question-media';
import MathText from '@/components/math-text';
import MathKeyboardDock, {type MathFieldTarget} from '@/components/math-toolbar';

const cls = (...x: (string | boolean | undefined)[]) => x.filter(Boolean).join(' ');

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'purple' | 'orange' | 'green';
}) {
  return (
    <span
      className={cls(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
        tone === 'neutral' && 'bg-slate-100 text-slate-600',
        tone === 'purple' && 'bg-indigo-50 text-indigo-600',
        tone === 'orange' && 'bg-orange-50 text-orange-600',
        tone === 'green' && 'bg-emerald-50 text-emerald-700',
      )}
    >
      {children}
    </span>
  );
}

const levels = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
const blankQ = {
  prompt: '',
  promptImages: [] as string[],
  promptVideoUrl: '',
  options: ['', '', '', ''],
  optionImages: [undefined, undefined, undefined, undefined] as (string | undefined)[],
  correct: 0,
  explanation: '',
  explanationImages: [] as string[],
  subject: 'คณิต',
  level: 'ม.1',
  skills: ['ความรู้ ความจำ'] as string[],
};

function normalizeSubject(subject: string) {
  if (subject === 'คณิตศาสตร์') return 'คณิต';
  if (subject === 'วิทยาศาสตร์') return 'วิทย์';
  return subject;
}

type DraftMeta = {
  time: number;
  cover?: string;
  categoryId: string;
  coverCustom: boolean;
};

type Props = {
  sets: ExamSet[];
  setSets: React.Dispatch<React.SetStateAction<ExamSet[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  categories: SetCategory[];
  setCategories: React.Dispatch<React.SetStateAction<SetCategory[]>>;
  onSavedToLibrary: () => void;
};

function isCategoryDefaultCover(cover: string | undefined, categories: SetCategory[]) {
  if (!cover) return true;
  return categories.some((c) => c.defaultCover === cover);
}

function draftMetaFromSet(s: ExamSet | undefined, categories: SetCategory[]): DraftMeta {
  const category = getSetCategory(s, categories);
  const cover = s?.cover || category.defaultCover;
  const coverCustom =
    s?.coverCustom ?? (s?.cover ? !isCategoryDefaultCover(s.cover, categories) : false);
  return {
    time: s?.time || 15,
    cover,
    categoryId: category.id,
    coverCustom,
  };
}

export default function AdminWorkspace({
  sets,
  setSets,
  questions,
  setQuestions,
  categories,
  setCategories,
  onSavedToLibrary,
}: Props) {
  const [newQ, setNewQ] = useState({...blankQ});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exportSetId, setExportSetId] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overSetId, setOverSetId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [activeSetId, setActiveSetId] = useState<number>(sets[0]?.id ?? 1);
  const [pendingAdd, setPendingAdd] = useState<number[]>([]);
  const [pendingRemove, setPendingRemove] = useState<number[]>([]);
  const [draftOrder, setDraftOrder] = useState<number[]>(() =>
    getSetMemberIds(sets[0], questions, sets),
  );
  const [orderDragId, setOrderDragId] = useState<number | null>(null);
  const [draftMeta, setDraftMeta] = useState<DraftMeta>(() => draftMetaFromSet(sets[0], categories));
  const [assignFlash, setAssignFlash] = useState(false);
  const [formError, setFormError] = useState('');
  const [saveFlash, setSaveFlash] = useState(false);
  const [showNewSet, setShowNewSet] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categoryDraftName, setCategoryDraftName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newSetForm, setNewSetForm] = useState({
    title: '',
    level: 'ม.1',
    description: '',
    time: 15,
    categoryId: DEFAULT_CATEGORY_ID,
  });
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [filterSubject, setFilterSubject] = useState('ทั้งหมด');
  const [filterLevel, setFilterLevel] = useState('ทั้งหมด');
  const [importing, setImporting] = useState(false);
  const [importTrayOpen, setImportTrayOpen] = useState(false);
  const [exportTrayOpen, setExportTrayOpen] = useState(false);
  const [importDragging, setImportDragging] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const metaTouchedRef = useRef(false);
  const [importDupPrompt, setImportDupPrompt] = useState<{
    fresh: ImportQuestionDraft[];
    duplicates: {draft: ImportQuestionDraft; existingId: number; prompt: string}[];
    skippedRows: number;
    parseErrors: string[];
  } | null>(null);
  const [dangerConfirm, setDangerConfirm] = useState<{
    title: string;
    message: React.ReactNode;
    warn?: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const explanationRef = useRef<HTMLTextAreaElement>(null);
  const optionInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [mathOpen, setMathOpen] = useState(false);
  const [mathMinimized, setMathMinimized] = useState(false);
  const [mathTarget, setMathTarget] = useState<MathFieldTarget | null>(null);

  function openMath(target: MathFieldTarget) {
    setMathTarget(target);
    setMathOpen(true);
    setMathMinimized(false);
  }

  function mathValue() {
    if (mathTarget === 'prompt') return newQ.prompt;
    if (mathTarget === 'explanation') return newQ.explanation;
    if (mathTarget?.startsWith('option-')) {
      const i = Number(mathTarget.replace('option-', ''));
      return newQ.options[i] || '';
    }
    return '';
  }

  function setMathValue(next: string) {
    if (mathTarget === 'prompt') {
      setNewQ((p) => ({...p, prompt: next}));
      return;
    }
    if (mathTarget === 'explanation') {
      setNewQ((p) => ({...p, explanation: next}));
      return;
    }
    if (mathTarget?.startsWith('option-')) {
      const i = Number(mathTarget.replace('option-', ''));
      setNewQ((p) => ({
        ...p,
        options: p.options.map((v, j) => (j === i ? next : v)),
      }));
    }
  }

  function getMathTargetEl() {
    if (mathTarget === 'prompt') return promptRef.current;
    if (mathTarget === 'explanation') return explanationRef.current;
    if (mathTarget?.startsWith('option-')) {
      const i = Number(mathTarget.replace('option-', ''));
      return optionInputRefs.current[i] || null;
    }
    return null;
  }

  const bank = useMemo(() => {
    return [...questions]
      .filter((q) => {
        const subject = normalizeSubject(q.subject);
        if (filterSubject !== 'ทั้งหมด' && subject !== filterSubject) return false;
        if (filterLevel !== 'ทั้งหมด' && q.level !== filterLevel) return false;
        return true;
      })
      .sort((a, b) => b.id - a.id);
  }, [questions, filterSubject, filterLevel]);

  const activeSet = sets.find((s) => s.id === activeSetId) || sets[0];

  const committedInActive = useMemo(() => {
    if (!activeSet) return [] as Question[];
    return getOrderedSetQuestions(activeSet, questions, sets);
  }, [questions, sets, activeSet]);

  const committedOrder = useMemo(
    () => getSetMemberIds(activeSet, questions, sets),
    [activeSet, questions, sets],
  );

  // Display order: while staging add/remove, draft is source of truth.
  // Otherwise never show fewer/more members than committed (fixes 7-in-list vs 6-in-panel).
  const effectiveOrder = useMemo(() => {
    if (pendingAdd.length > 0 || pendingRemove.length > 0) return draftOrder;
    const draftSet = new Set(draftOrder);
    const sameMembers =
      draftOrder.length === committedOrder.length &&
      committedOrder.every((id) => draftSet.has(id));
    return sameMembers ? draftOrder : committedOrder;
  }, [draftOrder, committedOrder, pendingAdd.length, pendingRemove.length]);

  const draftInActive = useMemo(() => {
    const byId = new Map(questions.map((q) => [q.id, q]));
    return effectiveOrder.map((id) => byId.get(id)).filter((q): q is Question => !!q);
  }, [effectiveOrder, questions]);

  const safeDraftMeta = draftMeta ?? draftMetaFromSet(activeSet, categories);
  const committedCategory = getSetCategory(activeSet, categories);
  const committedTime = activeSet?.time || 15;
  const committedCover = activeSet?.cover || committedCategory.defaultCover;
  const committedCoverCustom = !!activeSet?.coverCustom;
  const metaDirty =
    !!activeSet &&
    (safeDraftMeta.time !== committedTime ||
      (safeDraftMeta.cover || '') !== (committedCover || '') ||
      safeDraftMeta.categoryId !== committedCategory.id ||
      safeDraftMeta.coverCustom !== committedCoverCustom);
  const orderDirty = effectiveOrder.join(',') !== committedOrder.join(',');
  const setDraftDirty =
    pendingAdd.length > 0 || pendingRemove.length > 0 || metaDirty || orderDirty;
  const draftCategory = getSetCategory({categoryId: safeDraftMeta.categoryId}, categories);

  // Sync draft list with saved membership. Do not gate on metaDirty — cover/time drift
  // after localStorage hydrate must not freeze the question panel at a stale count.
  useEffect(() => {
    if (pendingAdd.length > 0 || pendingRemove.length > 0) return;
    setDraftOrder((prev) => {
      if (prev.join('|') === committedOrder.join('|')) return prev;
      const prevSet = new Set(prev);
      const sameMembers =
        prev.length === committedOrder.length && committedOrder.every((id) => prevSet.has(id));
      return sameMembers ? prev : committedOrder;
    });
  }, [activeSetId, committedOrder.join('|'), pendingAdd.length, pendingRemove.length]);

  // After hydrate, refresh meta from the saved set unless the user edited them.
  useEffect(() => {
    if (!activeSet || metaTouchedRef.current) return;
    setDraftMeta(draftMetaFromSet(activeSet, categories));
  }, [
    activeSetId,
    activeSet?.time,
    activeSet?.cover,
    activeSet?.categoryId,
    activeSet?.coverCustom,
    categories,
  ]);
  function toggleSkill(skill: string) {
    setNewQ((p) => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter((s) => s !== skill) : [...p.skills, skill],
    }));
  }

  function saveQuestion() {
    try {
      setFormError('');
      const promptOk = Boolean(
        newQ.prompt.trim() || newQ.promptImages.length || newQ.promptVideoUrl.trim(),
      );
      if (newQ.promptVideoUrl.trim() && !parsePromptVideoUrl(newQ.promptVideoUrl)) {
        setFormError('ลิงก์วิดีโอโจทย์ไม่ถูกต้อง — ใช้ YouTube, Vimeo หรือ URL ไฟล์วิดีโอ');
        return;
      }
      const optionsOk =
        newQ.options.length >= 2 &&
        newQ.options.every((o, i) => Boolean(o.trim() || newQ.optionImages[i]));
      const explainOk = Boolean(newQ.explanation.trim() || newQ.explanationImages.length);
      if (newQ.options.length < 2) {
        setFormError('ต้องมีตัวเลือกอย่างน้อย 2 ข้อ');
        return;
      }
      if (!promptOk) {
        setFormError('กรุณากรอกโจทย์ (ข้อความหรือรูป)');
        return;
      }
      if (!optionsOk) {
        setFormError('กรุณากรอกตัวเลือกให้ครบทุกข้อ (ข้อความหรือรูป)');
        return;
      }
      if (!explainOk) {
        setFormError('กรุณากรอกเฉลย/คำอธิบาย (ข้อความหรือรูป)');
        return;
      }
      if (newQ.correct < 0 || newQ.correct >= newQ.options.length) {
        setFormError('กรุณาเลือกคำตอบที่ถูกต้อง');
        return;
      }
      let skills = [
        ...new Set(
          (newQ.skills || []).map((s) => normalizeSkillName(s)).filter((s): s is string => !!s),
        ),
      ];
      // Imported items may have lost non-Bloom labels — default so save is not blocked
      if (!skills.length) skills = ['ความรู้ ความจำ'];

      const media = {
        promptImages: [...newQ.promptImages],
        promptImage: undefined,
        promptVideoUrl: newQ.promptVideoUrl.trim() || undefined,
        optionImages: [...newQ.optionImages],
        explanationImages: [...newQ.explanationImages],
        explanationImage: undefined,
      };
      if (editingId !== null) {
        const id = editingId;
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  subject: newQ.subject,
                  level: newQ.level,
                  skills,
                  skill: undefined,
                  topic: undefined,
                  prompt: newQ.prompt,
                  options: [...newQ.options],
                  correct: newQ.correct,
                  explanation: newQ.explanation.trim() || '—',
                  ...media,
                }
              : q,
          ),
        );
        setEditingId(null);
        setNewQ({
          ...blankQ,
          subject: newQ.subject,
          level: newQ.level,
          skills: [...skills],
          optionImages: [undefined, undefined, undefined, undefined],
        });
        setDirty(true);
        setSaveFlash(true);
        window.setTimeout(() => setSaveFlash(false), 2200);
        return;
      }
      setQuestions((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((q) => q.id)) + 1,
          subject: newQ.subject,
          level: newQ.level,
          setIds: [],
          skills,
          difficulty: 'ง่าย',
          prompt: newQ.prompt,
          options: [...newQ.options],
          correct: newQ.correct,
          explanation: newQ.explanation.trim() || '—',
          ...media,
        },
      ]);
      setNewQ({
        ...blankQ,
        subject: newQ.subject,
        level: newQ.level,
        skills: [...skills],
        optionImages: [undefined, undefined, undefined, undefined],
      });
      setDirty(true);
      setSaveFlash(true);
      window.setTimeout(() => setSaveFlash(false), 2200);
    } catch (e) {
      console.error(e);
      setFormError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }
  }

  function startEdit(q: Question) {
    setFormError('');
    setEditingId(q.id);
    const imgs = q.optionImages || [];
    const skills = getQuestionSkills(q);
    setNewQ({
      prompt: q.prompt || '',
      promptImages: getPromptImages(q),
      promptVideoUrl: q.promptVideoUrl || '',
      options: q.options.length >= 2 ? [...q.options] : ['', ''],
      optionImages: (q.options.length >= 2 ? q.options : ['', '']).map((_, i) => imgs[i]),
      correct: Math.min(Math.max(0, q.correct || 0), Math.max(0, (q.options.length || 1) - 1)),
      explanation: q.explanation || '',
      explanationImages: getExplanationImages(q),
      subject: normalizeSubject(q.subject) || 'คณิต',
      level: levels.includes(q.level) ? q.level : 'ม.1',
      // Non-Bloom import labels are dropped — seed a default so save works
      skills: skills.length ? skills : ['ความรู้ ความจำ'],
    });
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  function addOption() {
    if (newQ.options.length >= 10) {
      alert('เพิ่มตัวเลือกได้สูงสุด 10 ข้อ');
      return;
    }
    setNewQ((p) => ({
      ...p,
      options: [...p.options, ''],
      optionImages: [...p.optionImages, undefined],
    }));
  }

  function removeOption(index: number) {
    if (newQ.options.length <= 2) {
      alert('ต้องเหลือตัวเลือกอย่างน้อย 2 ข้อ');
      return;
    }
    setNewQ((p) => {
      const options = p.options.filter((_, i) => i !== index);
      const optionImages = p.optionImages.filter((_, i) => i !== index);
      let correct = p.correct;
      if (index === p.correct) correct = 0;
      else if (index < p.correct) correct = p.correct - 1;
      if (correct >= options.length) correct = options.length - 1;
      return {...p, options, optionImages, correct};
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormError('');
    setNewQ({...blankQ});
  }

  function applySelectSet(id: number) {
    const s = sets.find((x) => x.id === id) || sets[0];
    metaTouchedRef.current = false;
    setActiveSetId(id);
    setPendingAdd([]);
    setPendingRemove([]);
    setExportSetId(id);
    setDraftMeta(draftMetaFromSet(s, categories));
    setDraftOrder(getSetMemberIds(s, questions, sets));
    setOrderDragId(null);
  }

  function applyDraftCategory(categoryId: string) {
    const category = categories.find((c) => c.id === categoryId) || categories[0];
    if (!category) return;
    metaTouchedRef.current = true;
    setDraftMeta((prev) => {
      const base = prev ?? draftMetaFromSet(activeSet, categories);
      const next: DraftMeta = {...base, categoryId: category.id};
      if (!base.coverCustom) next.cover = category.defaultCover;
      return next;
    });
  }

  function resetDraftCoverToCategory() {
    metaTouchedRef.current = true;
    setDraftMeta((prev) => {
      const base = prev ?? draftMetaFromSet(activeSet, categories);
      const category = getSetCategory({categoryId: base.categoryId}, categories);
      return {...base, cover: category.defaultCover, coverCustom: false};
    });
  }

  function selectSet(id: number) {
    if (id === activeSetId) return;
    if (!setDraftDirty) {
      applySelectSet(id);
      return;
    }
    setDangerConfirm({
      title: 'ทิ้งการจัดชุดที่ยังไม่บันทึก?',
      message:
        'มีการเปลี่ยนแปลงค้างอยู่ (คำถาม / ลำดับ / เวลา / ปก) ในชุดที่กำลังจัด หากเปลี่ยนชุด ค่าที่ยังไม่บันทึกจะหายไป',
      warn: 'การกระทำนี้ไม่สามารถย้อนกลับได้',
      confirmLabel: 'ทิ้งแล้วเปลี่ยนชุด',
      onConfirm: () => applySelectSet(id),
    });
  }

  function stageAddToActive(questionId: number) {
    if (!activeSet) return;
    const q = questions.find((item) => item.id === questionId);
    if (!q) return;
    // No level lock — ม.2 can be placed in a ม.6 set (and vice versa)
    const alreadyCommitted =
      getQuestionSetIds(q, sets).includes(activeSet.id) ||
      (activeSet.questionIds || []).includes(questionId);
    if (alreadyCommitted) {
      setPendingRemove((prev) => prev.filter((id) => id !== questionId));
      setDraftOrder((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]));
      return;
    }
    setPendingRemove((prev) => prev.filter((id) => id !== questionId));
    setPendingAdd((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]));
    setDraftOrder((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]));
  }

  function stageRemoveFromActive(questionId: number) {
    setDraftOrder((prev) => prev.filter((id) => id !== questionId));
    if (pendingAdd.includes(questionId)) {
      setPendingAdd((prev) => prev.filter((id) => id !== questionId));
      return;
    }
    setPendingRemove((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]));
  }

  function moveDraftQuestion(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setDraftOrder((prev) => {
      const staging = pendingAdd.length > 0 || pendingRemove.length > 0;
      const prevSet = new Set(prev);
      const sameMembers =
        prev.length === committedOrder.length && committedOrder.every((id) => prevSet.has(id));
      const base = staging || sameMembers ? prev : committedOrder;
      if (fromIndex >= base.length || toIndex >= base.length) return prev;
      const next = [...base];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }

  function saveSetAssignment() {
    if (!activeSet || !setDraftDirty) return false;
    const setId = activeSet.id;
    const finalOrder = effectiveOrder.filter((id) => questions.some((q) => q.id === id));
    const finalSet = new Set(finalOrder);
    setQuestions((prev) =>
      prev.map((q) => {
        const ids = new Set(getQuestionSetIds(q, sets));
        if (finalSet.has(q.id)) ids.add(setId);
        else ids.delete(setId);
        return {...q, setIds: [...ids], topic: undefined};
      }),
    );
    setSets((prev) =>
      prev.map((s) =>
        s.id === setId
          ? {
              ...s,
              time: safeDraftMeta.time,
              cover: safeDraftMeta.cover || draftCategory.defaultCover,
              categoryId: safeDraftMeta.categoryId,
              coverCustom: safeDraftMeta.coverCustom,
              count: finalOrder.length,
              questionIds: finalOrder,
            }
          : s,
      ),
    );
    metaTouchedRef.current = false;
    setPendingAdd([]);
    setPendingRemove([]);
    setDraftOrder(finalOrder);
    setDirty(true);
    setAssignFlash(true);
    window.setTimeout(() => setAssignFlash(false), 2200);
    return true;
  }

  function askDeleteQuestion(q: Question) {
    setDangerConfirm({
      title: 'ยืนยันการลบคำถาม',
      message: (
        <>
          คุณกำลังจะลบคำถาม{' '}
          <span className="font-bold text-ink">
            “{q.prompt.length > 80 ? `${q.prompt.slice(0, 80)}…` : q.prompt}”
          </span>
        </>
      ),
      warn: 'คำถามนี้จะถูกลบออกจากคลังและทุกชุดที่เกี่ยวข้อง — ไม่สามารถย้อนกลับได้',
      confirmLabel: 'ลบคำถามนี้',
      onConfirm: () => {
        if (editingId === q.id) cancelEdit();
        setQuestions((prev) => prev.filter((x) => x.id !== q.id));
        setSets((prev) =>
          prev.map((s) => {
            const wasInSet = getQuestionSetIds(q, prev).includes(s.id);
            return {
              ...s,
              questionIds: s.questionIds?.filter((id) => id !== q.id),
              count: wasInSet ? Math.max(0, (s.count || 0) - 1) : s.count,
            };
          }),
        );
        setDraftOrder((prev) => prev.filter((id) => id !== q.id));
        setExpandedIds((prev) => prev.filter((id) => id !== q.id));
        setPendingAdd((prev) => prev.filter((id) => id !== q.id));
        setPendingRemove((prev) => prev.filter((id) => id !== q.id));
        setDirty(true);
      },
    });
  }

  function finalizeImportedDraft(q: ImportQuestionDraft, id: number): Question {
    const skills = getQuestionSkills(q);
    return {
      ...q,
      id,
      setIds: [],
      topic: undefined,
      skill: undefined,
      skills: skills.length ? skills : ['ความรู้ ความจำ'],
    };
  }

  function finishImportAlert(added: number, overwritten: number, skippedRows: number, parseErrors: string[]) {
    const parts = [
      overwritten ? `ทับของเดิม ${overwritten} ข้อ` : '',
      added ? `เพิ่มใหม่ ${added} ข้อ` : '',
    ].filter(Boolean);
    const skipNote = skippedRows ? `\nข้าม ${skippedRows} แถวจากไฟล์` : '';
    const errNote = parseErrors.length ? `\n\nหมายเหตุ:\n${parseErrors.slice(0, 5).join('\n')}` : '';
    alert(`นำเข้าสำเร็จ${parts.length ? ` — ${parts.join(' · ')}` : ''}${skipNote}${errNote}`);
  }

  async function handleImportFile(file: File) {
    const name = file.name.toLowerCase();
    const isJson = name.endsWith('.json');
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');
    // Future: .docx / .pdf can plug into the same tray
    if (!isJson && !isExcel) {
      alert('ตอนนี้รองรับ JSON และ Excel (.xlsx / .xls / .csv)\nรูปแบบอื่น เช่น Word / PDF จะเพิ่มในภายหลัง');
      return;
    }
    setImporting(true);
    try {
      const result = isJson
        ? parseQuestionsFromJsonText(await file.text())
        : await parseQuestionsFromExcel(await file.arrayBuffer());
      if (!result.questions.length) {
        alert(
          result.errors.length
            ? `นำเข้าไม่สำเร็จ\n${result.errors.slice(0, 5).join('\n')}`
            : 'ไม่พบคำถามในไฟล์',
        );
        return;
      }

      const bankByKey = new Map<string, number>();
      for (const q of questions) {
        const key = questionContentKey(q);
        if (!bankByKey.has(key)) bankByKey.set(key, q.id);
      }

      const fresh: ImportQuestionDraft[] = [];
      const duplicates: {draft: ImportQuestionDraft; existingId: number; prompt: string}[] = [];
      const seenInFile = new Set<string>();

      for (const draft of result.questions) {
        const key = questionContentKey(draft);
        const existingId = bankByKey.get(key);
        if (existingId != null && existingId > 0) {
          duplicates.push({draft, existingId, prompt: draft.prompt});
          continue;
        }
        if (seenInFile.has(key)) {
          // duplicate row inside the same file (not yet in bank)
          duplicates.push({draft, existingId: -1, prompt: draft.prompt});
          continue;
        }
        seenInFile.add(key);
        fresh.push(draft);
      }

      const bankDups = duplicates.filter((d) => d.existingId > 0);

      if (!bankDups.length) {
        setQuestions((prev) => {
          let nextId = prev.reduce((m, q) => Math.max(m, q.id), 0) + 1;
          return [...fresh.map((q) => finalizeImportedDraft(q, nextId++)), ...prev];
        });
        setDirty(true);
        setImportTrayOpen(false);
        finishImportAlert(fresh.length, 0, result.skipped, result.errors);
        return;
      }

      setImportTrayOpen(false);
      setImportDupPrompt({
        fresh,
        duplicates: bankDups,
        skippedRows: result.skipped,
        parseErrors: result.errors,
      });
    } catch (e) {
      console.error(e);
      alert('อ่านไฟล์ไม่สำเร็จ กรุณาตรวจรูปแบบแล้วลองใหม่');
    } finally {
      setImporting(false);
      setImportDragging(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  function resolveImportDuplicates(mode: 'overwrite' | 'add') {
    const pending = importDupPrompt;
    if (!pending) return;
    setImportDupPrompt(null);

    setQuestions((prev) => {
      let nextId = prev.reduce((m, q) => Math.max(m, q.id), 0) + 1;
      let list = prev;

      if (mode === 'overwrite') {
        const byId = new Map(list.map((q) => [q.id, q]));
        for (const {draft, existingId} of pending.duplicates) {
          const old = byId.get(existingId);
          if (!old) continue;
          const skills = getQuestionSkills(draft);
          byId.set(existingId, {
            ...old,
            subject: draft.subject,
            level: draft.level,
            skills: skills.length ? skills : ['ความรู้ ความจำ'],
            skill: undefined,
            topic: undefined,
            difficulty: draft.difficulty,
            prompt: draft.prompt,
            options: draft.options,
            correct: draft.correct,
            explanation: draft.explanation,
          });
        }
        list = list.map((q) => byId.get(q.id) || q);
        const incoming = pending.fresh.map((q) => finalizeImportedDraft(q, nextId++));
        return [...incoming, ...list];
      }

      const allNew = [...pending.fresh, ...pending.duplicates.map((d) => d.draft)];
      return [...allNew.map((q) => finalizeImportedDraft(q, nextId++)), ...list];
    });

    setDirty(true);
    if (mode === 'overwrite') {
      finishImportAlert(
        pending.fresh.length,
        pending.duplicates.length,
        pending.skippedRows,
        pending.parseErrors,
      );
    } else {
      finishImportAlert(
        pending.fresh.length + pending.duplicates.length,
        0,
        pending.skippedRows,
        pending.parseErrors,
      );
    }
  }

  function askDeleteSet(target: ExamSet) {
    const linked = questions.filter((q) => getQuestionSetIds(q, sets).includes(target.id)).length;
    setDangerConfirm({
      title: 'ยืนยันการลบชุดกิจกรรม',
      message: (
        <>
          คุณกำลังจะลบชุด{' '}
          <span className="font-bold text-ink">
            “{target.title}” ({target.level})
          </span>
          <br />
          คำถามที่อยู่ในชุดนี้{' '}
          <span className="font-bold text-orange-600">{linked} ข้อ</span> จะถูกนำออกจากชุดนี้
          แต่ตัวคำถามยังอยู่ในคลัง
        </>
      ),
      warn: 'การลบนี้ไม่สามารถย้อนกลับได้',
      confirmLabel: 'ลบชุดนี้',
      onConfirm: () => {
        const setId = target.id;
        setSets((prev) => prev.filter((s) => s.id !== setId));
        setQuestions((prev) =>
          prev.map((q) => {
            const ids = getQuestionSetIds(q, sets).filter((id) => id !== setId);
            return {...q, setIds: ids, topic: undefined};
          }),
        );
        if (activeSetId === setId) {
          const remaining = sets.filter((s) => s.id !== setId);
          const next = remaining[0];
          const nextId = next?.id ?? 0;
          metaTouchedRef.current = false;
          setActiveSetId(nextId);
          setPendingAdd([]);
          setPendingRemove([]);
          setDraftMeta(draftMetaFromSet(next, categories));
          if (next) {
            setDraftOrder(getSetMemberIds(next, questions, sets));
          } else {
            setDraftOrder([]);
          }
          if (nextId) setExportSetId(nextId);
        } else if (exportSetId === setId) {
          const remaining = sets.filter((s) => s.id !== setId);
          if (remaining[0]) setExportSetId(remaining[0].id);
        }
        setDirty(true);
      },
    });
  }

  function createSet() {
    if (!newSetForm.title.trim()) {
      alert('กรุณาใส่ชื่อชุดกิจกรรม');
      return;
    }
    const id = Math.max(0, ...sets.map((s) => s.id)) + 1;
    const title = newSetForm.title.trim();
    const category = getSetCategory({categoryId: newSetForm.categoryId}, categories);
    const created: ExamSet = {
      id,
      title,
      subject: 'คณิต',
      level: newSetForm.level,
      topic: title,
      count: 0,
      time: Math.max(1, Math.min(300, Number(newSetForm.time) || 15)),
      popular: 0,
      icon: '✦',
      tint: 'orange',
      description: newSetForm.description.trim() || `ชุดกิจกรรม ${title}`,
      cover: category.defaultCover,
      categoryId: category.id,
      coverCustom: false,
      questionIds: [],
    };
    setSets((prev) => [...prev, created]);
    setNewSetForm({
      title: '',
      level: 'ม.1',
      description: '',
      time: 15,
      categoryId: DEFAULT_CATEGORY_ID,
    });
    setShowNewSet(false);
    metaTouchedRef.current = false;
    setActiveSetId(id);
    setPendingAdd([]);
    setPendingRemove([]);
    setDraftOrder([]);
    setExportSetId(id);
    setDraftMeta(draftMetaFromSet(created, categories));
    setDirty(true);
  }

  function addCategory() {
    const name = categoryDraftName.trim();
    if (!name) {
      alert('กรุณาใส่ชื่อหมวด');
      return;
    }
    if (categories.some((c) => c.name === name)) {
      alert('มีชื่อหมวดนี้อยู่แล้ว');
      return;
    }
    const id = `cat-${Date.now()}`;
    setCategories((prev) => [
      ...prev,
      {id, name, defaultCover: '/covers/categories/onet.png'},
    ]);
    setCategoryDraftName('');
    setDirty(true);
  }

  function saveCategoryName(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      alert('ชื่อหมวดห้ามว่าง');
      return;
    }
    if (categories.some((c) => c.id !== id && c.name === trimmed)) {
      alert('มีชื่อหมวดนี้อยู่แล้ว');
      return;
    }
    setCategories((prev) => prev.map((c) => (c.id === id ? {...c, name: trimmed} : c)));
    setEditingCategoryId(null);
    setDirty(true);
  }

  function updateCategoryCover(id: string, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? {...c, defaultCover: dataUrl} : c)),
      );
      // Refresh sets that still use this category's default cover
      setSets((prev) =>
        prev.map((s) => {
          if ((s.categoryId || DEFAULT_CATEGORY_ID) !== id || s.coverCustom) return s;
          return {...s, cover: dataUrl};
        }),
      );
      if (
        safeDraftMeta.categoryId === id &&
        !safeDraftMeta.coverCustom &&
        !metaTouchedRef.current
      ) {
        setDraftMeta((p) => ({...(p ?? draftMetaFromSet(activeSet, categories)), cover: dataUrl}));
      } else if (safeDraftMeta.categoryId === id && !safeDraftMeta.coverCustom) {
        setDraftMeta((p) => ({...(p ?? draftMetaFromSet(activeSet, categories)), cover: dataUrl}));
      }
      setDirty(true);
    };
    reader.readAsDataURL(file);
  }

  function deleteCategory(id: string) {
    if (categories.length <= 1) {
      alert('ต้องเหลือหมวดอย่างน้อย 1 รายการ');
      return;
    }
    const fallback = categories.find((c) => c.id !== id) || categories[0];
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setSets((prev) =>
      prev.map((s) => {
        if ((s.categoryId || DEFAULT_CATEGORY_ID) !== id) return s;
        return {
          ...s,
          categoryId: fallback.id,
          cover: s.coverCustom ? s.cover : fallback.defaultCover,
        };
      }),
    );
    if (safeDraftMeta.categoryId === id) {
      metaTouchedRef.current = true;
      setDraftMeta((p) => ({
        ...(p ?? draftMetaFromSet(activeSet, categories)),
        categoryId: fallback.id,
        cover: (p?.coverCustom ? p.cover : fallback.defaultCover) || fallback.defaultCover,
      }));
    }
    if (newSetForm.categoryId === id) {
      setNewSetForm((p) => ({...p, categoryId: fallback.id}));
    }
    setDirty(true);
  }

  function publishToLibrary() {
    // Flush pending set edits first so membership/count is not lost when leaving Admin
    if (setDraftDirty) saveSetAssignment();
    setDirty(false);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
    onSavedToLibrary();
  }

  async function handleExport() {
    const target = sets.find((s) => s.id === exportSetId);
    if (!target) {
      alert('ไม่พบชุดกิจกรรม');
      return;
    }
    const qs = getOrderedSetQuestions(target, questions, sets);
    setExporting(true);
    try {
      const result = await exportUserPackage(target, qs, categories);
      const open = window.confirm(
        `Export แล้ว ${result.versionLabel}\n${result.path}\n\nเวอร์ชันเก่าจะไม่ถูกลบ\nเปิดพรีวิว ${result.url} เลยไหม?`,
      );
      if (open) window.open(result.url, '_blank');
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Export ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={cls(mathOpen && !mathMinimized && 'pb-56', mathOpen && mathMinimized && 'pb-20')}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Pill tone="purple">Admin workspace · Demo</Pill>
          <h1 className="mt-3 text-3xl font-black text-ink">จัดการคลังข้อสอบ</h1>
          <p className="mt-2 text-sm text-muted">
            สร้างคำถามทางซ้าย แล้วลากไปใส่ชุดกิจกรรมทางขวา — กดบันทึกเพื่ออัปเดตหน้าคลังข้อสอบ
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="orange">
            {questions.length} คำถาม · {sets.length} ชุด
          </Pill>
          <button
            type="button"
            onClick={publishToLibrary}
            className={cls(
              'rounded-xl px-5 py-3 text-sm font-bold text-white shadow-soft transition',
              dirty ? 'bg-[#e30613] hover:bg-[#c40510]' : 'bg-emerald-600 hover:bg-emerald-700',
            )}
          >
            {savedFlash ? 'บันทึกแล้ว ✓' : dirty ? 'บันทึกไปคลังข้อสอบ' : 'บันทึก / ดูคลังข้อสอบ'}
          </button>
        </div>
      </div>

      <section className="mb-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-lg font-black text-ink">
              <Download size={20} className="text-brand" /> Export แพ็กเกจผู้ใช้
            </h2>
            <p className="mt-2 text-sm text-muted">
              เขียนแพ็กเกจลง public เป็นโฟลเดอร์เวอร์ชันใหม่ เช่น aksorn-statistics-v01 — ของเก่าไม่ถูกลบ
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-bold text-muted">
              ชุดกิจกรรม
              <select
                value={exportSetId}
                onChange={(e) => setExportSetId(Number(e.target.value))}
                className="field mt-2 min-w-[180px]"
              >
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.level} · {s.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={exporting}
              onClick={handleExport}
              className="rounded-xl bg-brand px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <Download className="mr-2 inline" size={16} />
              {exporting ? 'กำลัง Export...' : 'Export ไป public'}
            </button>
          </div>
        </div>
      </section>

      {/* Create form — horizontal */}
      <section className="mb-6 rounded-3xl border bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              {editingId !== null ? (
                <>
                  <Pencil size={20} className="text-brand" /> แก้ไขคำถาม
                </>
              ) : (
                <>
                  <Plus size={20} className="text-brand" /> สร้างข้อสอบใหม่
                </>
              )}
            </h2>
            {editingId !== null ? (
              <p className="mt-1 text-xs text-orange-600">
                กำลังแก้ไขข้อ #{editingId} — จัดชุดด้วยการลากไปทางขวา
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted">กรอกโจทย์ด้านซ้าย · ตั้งตัวเลือกด้านขวา</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saveFlash && (
              <span className="text-xs font-bold text-emerald-600">บันทึกสำเร็จ ✓</span>
            )}
            <button
              type="button"
              onClick={saveQuestion}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-indigo-600"
            >
              {editingId !== null ? 'บันทึกการแก้ไข' : 'บันทึกข้อสอบ'}{' '}
              <Check className="ml-1 inline" size={16} />
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border px-5 py-3 text-sm font-bold text-slate-600"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </div>
        {formError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
            {formError}
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.95fr]">
          {/* Left: meta + prompt + explanation */}
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-muted">
                วิชา
                <select
                  value={newQ.subject}
                  onChange={(e) => setNewQ((p) => ({...p, subject: e.target.value}))}
                  className="field mt-2"
                >
                  {SUBJECT_OPTIONS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-muted">
                ระดับชั้น
                <select
                  value={newQ.level}
                  onChange={(e) => setNewQ((p) => ({...p, level: e.target.value}))}
                  className="field mt-2"
                >
                  {levels.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <p className="text-xs font-bold text-muted">
                ทักษะที่วัด{' '}
                <span className="font-medium text-slate-400">(Bloom 6 ระดับ · เลือกได้หลายรายการ)</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <label
                    key={skill}
                    className={cls(
                      'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                      newQ.skills.includes(skill)
                        ? 'border-brand bg-indigo-50 text-brand'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={newQ.skills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="accent-indigo-600"
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted">
                โจทย์
                <textarea
                  ref={promptRef}
                  rows={5}
                  value={newQ.prompt}
                  onFocus={() => openMath('prompt')}
                  onChange={(e) => setNewQ((p) => ({...p, prompt: e.target.value}))}
                  className="field mt-2 min-h-[120px]"
                  placeholder="คลิกเพื่อพิมพ์โจทย์ — แป้นสมการจะลอยขึ้นด้านล่าง"
                />
              </label>
              {newQ.prompt.trim() && (
                <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">พรีวิวโจทย์</p>
                  <MathText text={newQ.prompt} className="mt-1 text-sm font-semibold text-ink" as="div" />
                </div>
              )}
              <MultiImageAttach
                label="เพิ่มรูปโจทย์"
                values={newQ.promptImages}
                maxSide={1400}
                onChange={(next) => setNewQ((p) => ({...p, promptImages: next}))}
              />
              <PromptVideoUrlField
                value={newQ.promptVideoUrl}
                onChange={(next) => setNewQ((p) => ({...p, promptVideoUrl: next}))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted">
                คำอธิบายเฉลย
                <textarea
                  ref={explanationRef}
                  rows={4}
                  className="field mt-2 min-h-[100px]"
                  value={newQ.explanation}
                  onFocus={() => openMath('explanation')}
                  onChange={(e) => setNewQ((p) => ({...p, explanation: e.target.value}))}
                  placeholder="คลิกเพื่อพิมพ์เฉลย — ใช้แป้นสมการคู่กับคีย์บอร์ดได้"
                />
              </label>
              {newQ.explanation.trim() && (
                <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">พรีวิวเฉลย</p>
                  <MathText text={newQ.explanation} className="mt-1 text-xs leading-5 text-slate-600" as="div" />
                </div>
              )}
              <MultiImageAttach
                label="เพิ่มรูปเฉลย"
                values={newQ.explanationImages}
                maxSide={1200}
                onChange={(next) => setNewQ((p) => ({...p, explanationImages: next}))}
              />
            </div>
          </div>

          {/* Right: options */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">ตัวเลือก ({newQ.options.length})</p>
                <p className="mt-1 text-xs text-muted">เลือกวงกลมหน้าข้อที่ถูกต้อง · เพิ่ม/ลดได้อิสระ</p>
              </div>
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white"
              >
                <Plus size={14} /> เพิ่มตัวเลือก
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted">คลิกช่องตัวเลือกแล้วแป้นสมการจะลอยขึ้นด้านล่างจอ</p>
            <div className="mt-4 space-y-3">
              {newQ.options.map((o, i) => (
                <div
                  key={i}
                  className={cls(
                    'rounded-xl border bg-white px-3 py-2.5 transition',
                    newQ.correct === i ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="radio"
                      name="correct"
                      checked={newQ.correct === i}
                      onChange={() => setNewQ((p) => ({...p, correct: i}))}
                      aria-label={`ข้อ ${i + 1} ถูกต้อง`}
                      className="accent-emerald-600"
                    />
                    <input
                      ref={(el) => {
                        optionInputRefs.current[i] = el;
                      }}
                      className="field border-0 bg-transparent px-0 shadow-none focus:ring-0"
                      value={o}
                      onFocus={() => openMath(`option-${i}`)}
                      onChange={(e) =>
                        setNewQ((p) => ({
                          ...p,
                          options: p.options.map((v, j) => (j === i ? e.target.value : v)),
                        }))
                      }
                      placeholder={`ตัวเลือก ${String.fromCharCode(65 + i)}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={newQ.options.length <= 2}
                      className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`ลบตัวเลือก ${String.fromCharCode(65 + i)}`}
                      title="ลบตัวเลือก"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {o.trim() && (
                    <div className="mt-1 px-1 text-xs text-slate-600">
                      <MathText text={o} />
                    </div>
                  )}
                  <ImageAttachButton
                    label="ใส่รูป"
                    value={newQ.optionImages[i]}
                    maxSide={800}
                    onChange={(next) =>
                      setNewQ((p) => ({
                        ...p,
                        optionImages: p.optionImages.map((v, j) => (j === i ? next : v)),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom: bank left / sets right */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border bg-white p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">
                รายการคำถาม{' '}
                <span className="text-muted">
                  ({bank.length}
                  {bank.length !== questions.length ? ` / ${questions.length}` : ''})
                </span>
              </h2>
              <p className="mt-1 text-xs text-muted">ลากการ์ดไปวางที่ชุดกิจกรรมด้านขวา</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setImportTrayOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#e30613] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#c40510]"
              >
                <FileUp size={14} />
                นำเข้า
              </button>
              <button
                type="button"
                onClick={() => setExportTrayOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FileDown size={14} />
                ส่งออก
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-muted">
              วิชา
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="field mt-1.5"
              >
                <option>ทั้งหมด</option>
                {SUBJECT_OPTIONS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-muted">
              ระดับชั้น
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="field mt-1.5"
              >
                <option>ทั้งหมด</option>
                {levels.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 max-h-[720px] space-y-3 overflow-y-auto pr-1">
            {bank.length === 0 && (
              <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-slate-400">
                ไม่พบคำถามตามตัวกรองที่เลือก
              </p>
            )}
            {bank.map((q, i) => {
              const inSets = getQuestionSetIds(q, sets)
                .map((id) => sets.find((s) => s.id === id)?.title)
                .filter(Boolean);
              const expanded = expandedIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(q.id);
                    e.dataTransfer.setData('text/plain', String(q.id));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverSetId(null);
                  }}
                  className={cls(
                    'cursor-grab rounded-2xl border bg-white p-4 active:cursor-grabbing',
                    dragId === q.id && 'border-brand bg-indigo-50/50 opacity-80',
                    editingId === q.id && 'border-brand bg-indigo-50/40',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-1 shrink-0 text-slate-300" size={18} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1">
                        <Pill tone="orange">{normalizeSubject(q.subject)}</Pill>
                        <Pill tone="purple">{q.level}</Pill>
                        {inSets.map((title) => (
                          <Pill key={String(title)}>{title}</Pill>
                        ))}
                        {!inSets.length && <Pill tone="orange">ยังไม่เข้าชุด</Pill>}
                        {getQuestionSkills(q).map((s) => (
                          <Pill key={s} tone="green">
                            {s}
                          </Pill>
                        ))}
                        {!getQuestionSkills(q).length && (
                          <Pill tone="orange">ยังไม่ระบุทักษะ Bloom</Pill>
                        )}
                      </div>
                      <div className="mt-3 text-sm font-semibold leading-6">
                        {i + 1}.{' '}
                        <MathText
                          text={
                            q.prompt ||
                            (getPromptImages(q).length ? '(โจทย์เป็นรูปภาพ)' : '')
                          }
                        />
                      </div>
                      {!expanded && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-emerald-600">
                            ✓ {q.options[q.correct] || (q.optionImages?.[q.correct] ? '(รูป)' : '')}
                          </p>
                          {getPromptImages(q).length > 0 && (
                            <span className="text-[11px] font-bold text-slate-400">
                              · มีรูปโจทย์ {getPromptImages(q).length} ภาพ
                            </span>
                          )}
                        </div>
                      )}
                      {expanded && (
                        <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                            ตัวอย่างข้อคำถาม
                          </p>
                          <PromptImage images={getPromptImages(q)} compact />
                          <PromptVideo url={q.promptVideoUrl} compact />
                          <div className="space-y-2">
                            {q.options.map((opt, oi) => {
                              const isCorrect = oi === q.correct;
                              return (
                                <div
                                  key={oi}
                                  className={cls(
                                    'rounded-lg border px-3 py-2 text-xs font-semibold',
                                    isCorrect
                                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                      : 'border-slate-200 bg-white text-slate-600',
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-500 ring-1 ring-slate-200">
                                      {String.fromCharCode(65 + oi)}
                                    </span>
                                    <span className="min-w-0 flex-1 leading-5">
                                      <MathText
                                        text={opt || (q.optionImages?.[oi] ? '(รูปภาพ)' : '')}
                                      />
                                    </span>
                                    {isCorrect && (
                                      <span className="shrink-0 text-[10px] font-bold text-emerald-700">
                                        ✓ ข้อถูก
                                      </span>
                                    )}
                                  </div>
                                  <OptionImage src={q.optionImages?.[oi]} compact />
                                </div>
                              );
                            })}
                          </div>
                          <div className="rounded-lg border border-indigo-100 bg-white px-3 py-2.5">
                            <p className="text-[11px] font-bold text-brand">คำอธิบายเฉลย</p>
                            <MathText
                              as="div"
                              className="mt-1 text-xs leading-5 text-slate-600"
                              text={
                                q.explanation ||
                                (getExplanationImages(q).length ? '(เฉลยเป็นรูปภาพ)' : '')
                              }
                            />
                            <ExplanationImage images={getExplanationImages(q)} compact />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedIds((prev) =>
                            prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id],
                          );
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-ink"
                        aria-label={expanded ? 'ย่อรายละเอียด' : 'ขยายรายละเอียด'}
                        title={expanded ? 'ย่อ' : 'ขยาย'}
                      >
                        {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(q)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-brand"
                        aria-label="แก้ไขคำถาม"
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          askDeleteQuestion(q);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        aria-label="ลบคำถาม"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">จัดชุดกิจกรรม</h2>
              <p className="mt-1 text-xs text-muted">เลือกชุดจากรายการ → ลากคำถามเข้า → กดบันทึกเพื่อยืนยัน</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewSet((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#e30613] px-3 py-2 text-xs font-bold text-white"
            >
              <Plus size={14} /> เพิ่มชุดใหม่
            </button>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowCategoryManager((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-white"
            >
              {showCategoryManager ? 'ซ่อนจัดการหมวด' : 'จัดการหมวดกิจกรรม'}
            </button>
            {showCategoryManager && (
              <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div>
                  <p className="text-sm font-black text-ink">หมวดบนป้ายกิจกรรม</p>
                  <p className="mt-1 text-xs text-muted">
                    เช่น ข้อสอบ O-net / แบบฝึก advanced — แต่ละหมวดมีปกเริ่มต้นใช้ร่วมกันทุกวิชาและทุกระดับชั้น
                  </p>
                </div>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-2.5"
                    >
                      <label className="relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-slate-200">
                        <img
                          src={cat.defaultCover}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 grid place-items-center bg-black/40 text-[9px] font-bold text-white opacity-0 transition hover:opacity-100">
                          เปลี่ยนปก
                        </span>
                        <input
                          type="file"
                          accept="image/*,.gif"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateCategoryCover(cat.id, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <div className="min-w-0 flex-1">
                        {editingCategoryId === cat.id ? (
                          <input
                            className="field py-2 text-sm"
                            defaultValue={cat.name}
                            autoFocus
                            onBlur={(e) => saveCategoryName(cat.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveCategoryName(cat.id, (e.target as HTMLInputElement).value);
                              }
                              if (e.key === 'Escape') setEditingCategoryId(null);
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingCategoryId(cat.id)}
                            className="text-left text-sm font-bold text-ink hover:text-brand"
                            title="คลิกเพื่อแก้ไขชื่อ"
                          >
                            {cat.name}
                          </button>
                        )}
                        <p className="mt-0.5 text-[10px] text-muted">
                          ใช้ใน {sets.filter((s) => (s.categoryId || DEFAULT_CATEGORY_ID) === cat.id).length}{' '}
                          ชุด
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        aria-label={`ลบหมวด ${cat.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="field min-w-[12rem] flex-1 py-2 text-sm"
                    value={categoryDraftName}
                    onChange={(e) => setCategoryDraftName(e.target.value)}
                    placeholder="ชื่อหมวดใหม่ เช่น แบบทดสอบสั้น"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Plus size={14} /> เพิ่มหมวด
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {showNewSet && (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
              <p className="text-sm font-black text-ink">สร้างชุดกิจกรรมใหม่</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-muted">
                  ชื่อชุด
                  <input
                    className="field mt-1"
                    value={newSetForm.title}
                    onChange={(e) => setNewSetForm((p) => ({...p, title: e.target.value}))}
                    placeholder="เช่น อสมการ"
                  />
                </label>
                <label className="text-xs font-bold text-muted">
                  หมวดกิจกรรม
                  <select
                    className="field mt-1"
                    value={newSetForm.categoryId}
                    onChange={(e) =>
                      setNewSetForm((p) => ({...p, categoryId: e.target.value}))
                    }
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-muted">
                  ระดับชั้น
                  <select
                    className="field mt-1"
                    value={newSetForm.level}
                    onChange={(e) => setNewSetForm((p) => ({...p, level: e.target.value}))}
                  >
                    {levels.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-muted">
                  เวลาถอยหลัง (นาที)
                  <input
                    type="number"
                    min={1}
                    max={300}
                    className="field mt-1"
                    value={newSetForm.time}
                    onChange={(e) =>
                      setNewSetForm((p) => ({
                        ...p,
                        time: Math.max(1, Math.min(300, Number(e.target.value) || 1)),
                      }))
                    }
                    placeholder="เช่น 90"
                  />
                </label>
                <label className="col-span-full text-xs font-bold text-muted">
                  คำอธิบาย
                  <input
                    className="field mt-1"
                    value={newSetForm.description}
                    onChange={(e) => setNewSetForm((p) => ({...p, description: e.target.value}))}
                    placeholder="สั้น ๆ เกี่ยวกับเนื้อหาในชุดนี้"
                  />
                </label>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                ปกเริ่มต้นจะใช้ตามหมวดที่เลือก — เปลี่ยนปกชุดนี้ทีหลังได้
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={createSet}
                  className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white"
                >
                  สร้างชุด
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSet(false)}
                  className="rounded-xl border px-4 py-2.5 text-xs font-bold text-slate-600"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Set picker list */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-muted">รายการชุดทั้งหมด ({sets.length})</p>
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-2xl border bg-slate-50/80 p-2">
              {sets.map((s) => {
                const count = getOrderedSetQuestions(s, questions, sets).length;
                const selected = activeSet?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={cls(
                      'flex w-full items-center gap-2 rounded-xl border px-2 py-2 transition',
                      selected
                        ? 'border-brand bg-white shadow-sm ring-2 ring-indigo-100'
                        : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-white',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => selectSet(s.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-0.5 text-left"
                    >
                      <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                        <img
                          src={getSetCover(s, categories)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-black text-ink">{s.title}</span>
                          <Pill tone="orange">{s.level}</Pill>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {getCategoryLabel(s, categories)} · {count} ข้อ · {s.time || 0} นาที
                        </p>
                      </div>
                      {selected && <Pill tone="purple">กำลังจัด</Pill>}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        askDeleteSet(s);
                      }}
                      className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      aria-label={`ลบชุด ${s.title}`}
                      title="ลบชุด"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active set workspace */}
          {activeSet && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setOverSetId(activeSet.id);
              }}
              onDragLeave={() => setOverSetId((id) => (id === activeSet.id ? null : id))}
              onDrop={(e) => {
                e.preventDefault();
                const raw = e.dataTransfer.getData('text/plain') || '';
                if (raw.startsWith('reorder:')) {
                  setOverSetId(null);
                  setOrderDragId(null);
                  return;
                }
                const id = Number(raw || dragId);
                if (id) stageAddToActive(id);
                setOverSetId(null);
                setDragId(null);
              }}
              className={cls(
                'mt-4 overflow-hidden rounded-2xl border-2 border-dashed transition',
                overSetId === activeSet.id
                  ? 'border-brand bg-indigo-50/70'
                  : 'border-slate-200 bg-white',
              )}
            >
              {/* Header: cover + title */}
              <div className="flex gap-4 border-b border-slate-100 p-4">
                <div className="shrink-0 space-y-2">
                  <label className="group relative block h-24 w-36 cursor-pointer overflow-hidden rounded-xl bg-slate-200 shadow-sm">
                    <img
                      src={
                        safeDraftMeta.cover ||
                        getSetCover(activeSet, categories)
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                      เปลี่ยนปก
                    </span>
                    <input
                      type="file"
                      accept="image/*,.gif"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          metaTouchedRef.current = true;
                          setDraftMeta((p) => ({
                            ...(p ?? draftMetaFromSet(activeSet, categories)),
                            cover: String(reader.result),
                            coverCustom: true,
                          }));
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {safeDraftMeta.coverCustom && (
                    <button
                      type="button"
                      onClick={resetDraftCoverToCategory}
                      className="w-36 rounded-lg border px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      ใช้ปกหมวดเริ่มต้น
                    </button>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-ink">{activeSet.title}</h3>
                    <Pill tone="orange">{activeSet.level}</Pill>
                  </div>
                  <label className="mt-2 block max-w-xs text-xs font-bold text-muted">
                    หมวดบนป้ายกิจกรรม
                    <select
                      className="field mt-1 py-2 text-sm font-bold text-ink"
                      value={safeDraftMeta.categoryId}
                      onChange={(e) => applyDraftCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    แสดงเป็น “{draftCategory.name} · {activeSet.level}” · ปกเริ่มต้นตามหมวด
                    (เปลี่ยนเองได้)
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill>{draftInActive.length} ข้อ</Pill>
                    <Pill tone="green">{safeDraftMeta.time} นาที</Pill>
                    <Pill>{draftCategory.name}</Pill>
                    {safeDraftMeta.coverCustom && <Pill tone="orange">ปกกำหนดเอง</Pill>}
                    {metaDirty && <Pill tone="orange">รอบันทึก</Pill>}
                  </div>
                </div>
              </div>

              {/* Settings row */}
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                <label className="text-xs font-bold text-muted">
                  เวลาถอยหลัง (นาที)
                  <input
                    type="number"
                    min={1}
                    max={300}
                    step={1}
                    value={safeDraftMeta.time}
                    onChange={(e) => {
                      const next = Math.max(1, Math.min(300, Number(e.target.value) || 1));
                      metaTouchedRef.current = true;
                      setDraftMeta((p) => ({
                        ...(p ?? draftMetaFromSet(activeSet, categories)),
                        time: next,
                      }));
                    }}
                    className="field mt-1.5 w-28 py-2 text-sm font-bold text-ink"
                    aria-label="เวลาถอยหลังของชุดกิจกรรม (นาที)"
                  />
                </label>
                <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
                  <button
                    type="button"
                    disabled={!setDraftDirty}
                    onClick={saveSetAssignment}
                    className={cls(
                      'rounded-xl px-5 py-2.5 text-xs font-bold text-white transition',
                      setDraftDirty
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'cursor-not-allowed bg-slate-300',
                    )}
                  >
                    {assignFlash ? 'บันทึกแล้ว ✓' : 'บันทึกการจัดชุด'}
                  </button>
                  {setDraftDirty ? (
                    <p className="text-[11px] font-bold text-orange-600">
                      มีการเปลี่ยนแปลงค้างอยู่
                      {(pendingAdd.length > 0 || pendingRemove.length > 0) &&
                        ` (+${pendingAdd.length} / −${pendingRemove.length})`}
                      {orderDirty && ' · ลำดับข้อ'}
                      {metaDirty && ' · ปก/เวลา'}
                      {' — กดบันทึก'}
                    </p>
                  ) : assignFlash ? (
                    <p className="text-[11px] font-bold text-emerald-600">บันทึกการจัดชุดสำเร็จ ✓</p>
                  ) : (
                    <p className="text-[11px] text-muted">ยังไม่มีการแก้ไข</p>
                  )}
                </div>
              </div>

              {/* Question list — drag to reorder */}
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-muted">คำถามในชุดนี้</p>
                  <p className="text-[11px] text-muted">
                    {draftInActive.length} ข้อ · ลากหรือใช้ลูกศรเรียงลำดับ
                  </p>
                </div>
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {draftInActive.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-xs text-slate-400">
                      ยังไม่มีคำถามในชุดนี้ — ลากมาจากรายการซ้าย
                    </p>
                  )}
                  {draftInActive.map((q, index) => {
                    const isNew = pendingAdd.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', `reorder:${q.id}`);
                          e.dataTransfer.effectAllowed = 'move';
                          setOrderDragId(q.id);
                        }}
                        onDragEnd={() => setOrderDragId(null)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const raw = e.dataTransfer.getData('text/plain') || '';
                          const fromReorder = raw.startsWith('reorder:')
                            ? Number(raw.replace('reorder:', ''))
                            : orderDragId;
                          if (fromReorder) {
                            const fromIndex = draftOrder.indexOf(fromReorder);
                            moveDraftQuestion(fromIndex, index);
                          } else {
                            const bankId = Number(raw || dragId);
                            if (bankId) stageAddToActive(bankId);
                          }
                          setOrderDragId(null);
                          setDragId(null);
                        }}
                        className={cls(
                          'flex items-start gap-2 rounded-xl border px-2 py-2',
                          isNew ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white',
                          orderDragId === q.id && 'opacity-60 ring-2 ring-brand/30',
                        )}
                      >
                        <span
                          className="mt-0.5 cursor-grab touch-none text-slate-300 active:cursor-grabbing"
                          title="ลากเพื่อเรียงลำดับ"
                          aria-hidden
                        >
                          <GripVertical size={16} />
                        </span>
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-black text-slate-500">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          {isNew && (
                            <span className="mb-1 inline-block text-[10px] font-bold text-emerald-700">
                              รอบันทึก
                            </span>
                          )}
                          <p className="text-xs font-semibold leading-5 text-slate-700">{q.prompt}</p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveDraftQuestion(index, index - 1)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-30"
                            aria-label="เลื่อนขึ้น"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={index >= draftInActive.length - 1}
                            onClick={() => moveDraftQuestion(index, index + 1)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-ink disabled:opacity-30"
                            aria-label="เลื่อนลง"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => stageRemoveFromActive(q.id)}
                          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          aria-label="เอาออกจากชุด"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {dangerConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="danger-confirm-title"
          onClick={() => setDangerConfirm(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <Trash2 size={20} />
              </div>
              <div className="min-w-0">
                <h3 id="danger-confirm-title" className="text-lg font-black text-ink">
                  {dangerConfirm.title}
                </h3>
                <div className="mt-2 text-sm leading-6 text-slate-600">{dangerConfirm.message}</div>
                {dangerConfirm.warn && (
                  <p className="mt-2 text-xs font-bold text-red-500">{dangerConfirm.warn}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDangerConfirm(null)}
                className="rounded-xl border px-5 py-3 text-sm font-bold text-slate-600"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = dangerConfirm.onConfirm;
                  setDangerConfirm(null);
                  action();
                }}
                className="rounded-xl bg-[#e30613] px-5 py-3 text-sm font-bold text-white hover:bg-[#c40510]"
              >
                {dangerConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {importDupPrompt && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-dup-title"
        >
          <div className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-soft sm:p-7">
            <h3 id="import-dup-title" className="text-lg font-black text-ink">
              พบข้อสอบซ้ำ
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              มี {importDupPrompt.duplicates.length} ข้อที่โจทย์ ตัวเลือก และคำอธิบายตรงกับของในคลัง
              {importDupPrompt.fresh.length
                ? ` (อีก ${importDupPrompt.fresh.length} ข้อเป็นของใหม่)`
                : ''}
              — ต้องการให้ทับของเดิม หรือเพิ่มเป็นข้อใหม่?
            </p>
            <ul className="mt-4 max-h-40 space-y-2 overflow-y-auto rounded-2xl border bg-slate-50 p-3 text-xs text-slate-600">
              {importDupPrompt.duplicates.slice(0, 8).map((d, i) => (
                <li key={`${d.existingId}-${i}`} className="line-clamp-2">
                  <span className="font-bold text-ink">{i + 1}.</span> {d.prompt}
                  {d.existingId > 0 ? (
                    <span className="ml-1 text-muted">(id {d.existingId})</span>
                  ) : null}
                </li>
              ))}
              {importDupPrompt.duplicates.length > 8 ? (
                <li className="text-muted">…และอีก {importDupPrompt.duplicates.length - 8} ข้อ</li>
              ) : null}
            </ul>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={() => setImportDupPrompt(null)}
                className="rounded-xl border px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => resolveImportDuplicates('add')}
                className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold text-brand hover:bg-indigo-100"
              >
                เพิ่มเป็นข้อใหม่
              </button>
              <button
                type="button"
                onClick={() => resolveImportDuplicates('overwrite')}
                className="rounded-xl bg-[#e30613] px-4 py-3 text-sm font-bold text-white hover:bg-[#c40510]"
              >
                ทับของเดิม
              </button>
            </div>
          </div>
        </div>
      )}

      {importTrayOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-tray-title"
          onClick={() => !importing && setImportTrayOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-soft sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="import-tray-title" className="text-lg font-black text-ink">
                  นำเข้าคำถาม
                </h3>
                <p className="mt-1 text-sm text-muted">
                  ลากไฟล์มาวาง หรือเลือกจากเครื่อง — ถ้าโจทย์/ตัวเลือก/คำอธิบายซ้ำกับคลัง จะถามว่าทับหรือเพิ่มใหม่
                </p>
              </div>
              <button
                type="button"
                disabled={importing}
                onClick={() => setImportTrayOpen(false)}
                className="rounded-xl border p-2 text-slate-500 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <X size={16} />
              </button>
            </div>

            <input
              ref={importInputRef}
              type="file"
              accept=".json,.xlsx,.xls,.csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
              }}
            />

            <button
              type="button"
              disabled={importing}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImportDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImportDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImportDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImportDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void handleImportFile(file);
              }}
              onClick={() => !importing && importInputRef.current?.click()}
              className={cls(
                'mt-5 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition',
                importDragging
                  ? 'border-[#e30613] bg-red-50'
                  : 'border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/40',
                importing && 'pointer-events-none opacity-70',
              )}
            >
              <span
                className={cls(
                  'mb-3 grid h-14 w-14 place-items-center rounded-2xl',
                  importDragging ? 'bg-white text-[#e30613]' : 'bg-white text-slate-500',
                )}
              >
                <Upload size={26} />
              </span>
              <p className="text-sm font-bold text-ink">
                {importing ? 'กำลังนำเข้า…' : importDragging ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวางที่นี่'}
              </p>
              <p className="mt-1 text-xs text-muted">หรือคลิกเพื่อเลือกไฟล์จากเครื่อง</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                  JSON
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                  Excel
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-200">
                  Word · เร็วๆ นี้
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-200">
                  PDF · เร็วๆ นี้
                </span>
              </div>
            </button>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs text-muted">ต้องการแม่แบบ?</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadQuestionImportTemplate()}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <Download size={13} />
                  แม่แบบ Excel
                </button>
                <button
                  type="button"
                  onClick={() => downloadQuestionImportJsonTemplate()}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <Download size={13} />
                  แม่แบบ JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {exportTrayOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-tray-title"
          onClick={() => setExportTrayOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-soft sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="export-tray-title" className="text-lg font-black text-ink">
                  ส่งออกคำถาม
                </h3>
                <p className="mt-1 text-sm text-muted">
                  เลือกรูปแบบไฟล์ — จะส่งออกรายการที่แสดงอยู่ตอนนี้ ({bank.length} ข้อ
                  {bank.length !== questions.length ? ` จากทั้งหมด ${questions.length}` : ''})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportTrayOpen(false)}
                className="rounded-xl border p-2 text-slate-500 hover:bg-slate-50"
                aria-label="ปิด"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={bank.length === 0}
                onClick={() => {
                  exportQuestionsJson(bank);
                  setExportTrayOpen(false);
                }}
                className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                  JSON
                </span>
                <p className="text-sm font-bold text-ink">ส่งออกเป็น JSON</p>
                <p className="text-xs text-muted">เหมาะกับสำรองข้อมูล / นำเข้ากลับ</p>
              </button>
              <button
                type="button"
                disabled={bank.length === 0}
                onClick={() => {
                  exportQuestionsExcel(bank);
                  setExportTrayOpen(false);
                }}
                className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                  Excel
                </span>
                <p className="text-sm font-bold text-ink">ส่งออกเป็น Excel</p>
                <p className="text-xs text-muted">เปิดแก้ในตารางได้ทันที</p>
              </button>
              <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-left opacity-60 sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-200">
                    Word · เร็วๆ นี้
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-400 ring-1 ring-slate-200">
                    PDF · เร็วๆ นี้
                  </span>
                </div>
                <p className="text-xs text-muted">รูปแบบอื่นจะเพิ่มในถาดนี้ภายหลัง</p>
              </div>
            </div>

            {bank.length === 0 && (
              <p className="mt-4 text-center text-xs font-bold text-orange-600">
                ไม่มีคำถามตามตัวกรอง — ปรับตัวกรองก่อนส่งออก
              </p>
            )}
          </div>
        </div>
      )}

      <MathKeyboardDock
        open={mathOpen}
        minimized={mathMinimized}
        target={mathTarget}
        value={mathValue()}
        onChange={setMathValue}
        getTargetEl={getMathTargetEl}
        onClose={() => {
          setMathOpen(false);
          setMathTarget(null);
        }}
        onMinimize={() => setMathMinimized((v) => !v)}
      />
    </div>
  );
}
