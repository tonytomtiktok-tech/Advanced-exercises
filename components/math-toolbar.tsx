'use client';
import {useEffect, useMemo, useState} from 'react';
import {ChevronDown, Keyboard, Sigma, X} from 'lucide-react';
import MathText from '@/components/math-text';

type Snippet = {label: string; insert: string; title?: string};

const SNIPPETS: Snippet[] = [
  {label: 'x²', insert: '$x^{2}$', title: 'กำลังสอง'},
  {label: 'xⁿ', insert: '$x^{n}$', title: 'กำลัง n'},
  {label: '√', insert: '$\\sqrt{a}$', title: 'รากที่สอง'},
  {label: 'ⁿ√', insert: '$\\sqrt[n]{a}$', title: 'รากที่ n'},
  {label: 'a/b', insert: '$\\dfrac{a}{b}$', title: 'เศษส่วน'},
  {label: '±', insert: '$\\pm$', title: 'บวกลบ'},
  {label: '≠', insert: '$\\neq$', title: 'ไม่เท่ากับ'},
  {label: '≤', insert: '$\\leq$', title: 'น้อยกว่าหรือเท่ากับ'},
  {label: '≥', insert: '$\\geq$', title: 'มากกว่าหรือเท่ากับ'},
  {label: '∈', insert: '$\\in$', title: 'เป็นสมาชิก'},
  {label: '∉', insert: '$\\notin$', title: 'ไม่เป็นสมาชิก'},
  {label: '∪', insert: '$\\cup$', title: 'ยูเนียน'},
  {label: '∩', insert: '$\\cap$', title: 'อินเตอร์เซกชัน'},
  {label: '∑', insert: '$\\sum_{i=1}^{n}$', title: 'ผลรวม'},
  {label: 'π', insert: '$\\pi$', title: 'พาย'},
  {label: 'θ', insert: '$\\theta$', title: 'ธีตา'},
  {label: '∞', insert: '$\\infty$', title: 'อนันต์'},
  {label: 'Δ', insert: '$\\Delta$', title: 'เดลตา'},
  {label: '( )', insert: '$\\left( \\right)$', title: 'วงเล็บใหญ่'},
  {label: 'สมการ', insert: '$$x = \\dfrac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}$$', title: 'สูตรกำลังสอง'},
];

export type MathFieldTarget = 'prompt' | 'explanation' | `option-${number}`;

export function insertAtCursor(
  value: string,
  insert: string,
  start: number,
  end: number,
): {next: string; caret: number} {
  const next = value.slice(0, start) + insert + value.slice(end);
  return {next, caret: start + insert.length};
}

function targetLabel(target: MathFieldTarget | null) {
  if (!target) return '—';
  if (target === 'prompt') return 'โจทย์';
  if (target === 'explanation') return 'คำอธิบายเฉลย';
  const i = Number(target.replace('option-', ''));
  return `ตัวเลือก ${String.fromCharCode(65 + i)}`;
}

/** Floating math keyboard dock — fixed to bottom, works with real keyboard */
export default function MathKeyboardDock({
  open,
  target,
  value,
  onChange,
  getTargetEl,
  onClose,
  onMinimize,
  minimized,
}: {
  open: boolean;
  target: MathFieldTarget | null;
  value: string;
  onChange: (next: string) => void;
  getTargetEl: () => HTMLTextAreaElement | HTMLInputElement | null;
  onClose: () => void;
  onMinimize: () => void;
  minimized: boolean;
}) {
  const [draft, setDraft] = useState('x^{2}+1');
  const preview = useMemo(() => `$${draft}$`, [draft]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = minimized ? '64px' : '220px';
    return () => {
      document.body.style.paddingBottom = prev;
    };
  }, [open, minimized]);

  function applyInsert(snippet: string) {
    const el = getTargetEl();
    if (el && el.selectionStart != null && el.selectionEnd != null) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const {next, caret} = insertAtCursor(value, snippet, start, end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(caret, caret);
      });
      return;
    }
    onChange(value + snippet);
    requestAnimationFrame(() => getTargetEl()?.focus());
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-indigo-100 bg-white/95 shadow-[0_-12px_40px_rgba(15,23,42,.14)] backdrop-blur"
      onMouseDown={(e) => {
        // keep focus in the text field so PC keyboard still works
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
        }
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-brand">
            <Sigma size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-ink">แป้นสมการคณิตศาสตร์</p>
            <p className="truncate text-[11px] text-muted">
              กำลังพิมพ์ที่ <span className="font-bold text-brand">{targetLabel(target)}</span>
              {' · '}ใช้คู่กับคีย์บอร์ดคอมได้
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMinimize}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label={minimized ? 'ขยายแป้นสมการ' : 'ย่อแป้นสมการ'}
            title={minimized ? 'ขยาย' : 'ย่อ'}
          >
            {minimized ? <Keyboard size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="ปิดแป้นสมการ"
            title="ปิด"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="mx-auto max-h-[42vh] max-w-7xl overflow-y-auto px-4 pb-4 pt-1 sm:px-6">
          <div className="flex flex-wrap gap-1.5">
            {SNIPPETS.map((s) => (
              <button
                key={s.label + s.insert}
                type="button"
                title={s.title}
                onClick={() => applyInsert(s.insert)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:border-brand hover:bg-indigo-50 hover:text-brand"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_auto_0.8fr]">
            <label className="text-[11px] font-bold text-muted">
              พิมพ์ LaTeX เอง (ใช้คีย์บอร์ดคอมได้)
              <input
                className="field mt-1 font-mono text-xs"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="เช่น \\frac{a}{b}"
              />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => applyInsert(`$${draft}$`)}
                className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white"
              >
                แทรกบรรทัด
              </button>
              <button
                type="button"
                onClick={() => applyInsert(`$$${draft}$$`)}
                className="rounded-xl border px-4 py-2.5 text-xs font-bold text-slate-700"
              >
                แทรกบล็อก
              </button>
            </div>
            <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">พรีวิว</p>
              <div className="mt-1 min-h-[28px] text-sm text-ink">
                <MathText text={preview} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
