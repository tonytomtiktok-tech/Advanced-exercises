import type {ExamSet, Question, SetCategory} from '@/lib/mock';
import {getCategoryLabel, getQuestionSkills, getSetCover, initialCategories} from '@/lib/mock';
import {exportStyles} from '@/lib/export-styles';
import {buildExportAppJs} from '@/lib/export-app-js';

export type ExportResult = {
  folder: string;
  path: string;
  url: string;
  version: number;
  versionLabel: string;
};

type ExportFile = {
  path: string;
  content: string;
  encoding?: 'utf8' | 'base64';
};

const TITLE_EXPORT_SLUGS: Record<string, string> = {
  เซต: 'sets',
  เลขยกกำลัง: 'exponents',
  สมการกำลังสอง: 'quadratic',
  ความน่าจะเป็น: 'probability',
  ลำดับและอนุกรม: 'sequences',
  สถิติ: 'statistics',
};

function asciiSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Base folder name without version, e.g. aksorn-statistics */
export function exportBaseSlug(set: ExamSet): string {
  const fromMap = TITLE_EXPORT_SLUGS[set.title] || TITLE_EXPORT_SLUGS[set.topic];
  const fromAscii = asciiSlug(set.title) || asciiSlug(set.topic);
  const key = fromMap || fromAscii || `set-${set.id}`;
  return `aksorn-${key}`;
}

function pageHtml(title: string, page: 'activity' | 'exam' | 'report'): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)} | AKSORN ข้อสอบ O-net</title>
<link rel="stylesheet" href="assets/styles.css"/>
</head>
<body data-page="${page}">
<div id="app"><p style="padding:2rem;font-family:system-ui">กำลังโหลด...</p></div>
<script src="assets/data.js"></script>
<script src="assets/app.js"></script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildDataJs(
  set: ExamSet,
  questions: Question[],
  coverPath: string,
  title: string,
  categoryLabel: string,
): string {
  const payload = {
    set: {
      id: set.id,
      title,
      subject: set.subject,
      level: set.level,
      topic: set.topic,
      count: questions.length,
      time: set.time,
      description: set.description,
      icon: set.icon,
      tint: set.tint,
      cover: coverPath,
      categoryLabel,
    },
    questions: questions.map((q) => ({
      id: q.id,
      subject: q.subject,
      level: q.level,
      topic: q.topic,
      skills: (() => {
        const s = getQuestionSkills(q);
        return s.length ? s : ['ความรู้ ความจำ'];
      })(),
      difficulty: q.difficulty,
      prompt: q.prompt,
      promptImages:
        Array.isArray(q.promptImages) && q.promptImages.length
          ? q.promptImages.filter(Boolean)
          : q.promptImage
            ? [q.promptImage]
            : [],
      promptVideoUrl: q.promptVideoUrl || '',
      options: q.options,
      optionImages: (q.optionImages || []).map((x) => x || ''),
      correct: q.correct,
      explanation: q.explanation,
      explanationImages:
        Array.isArray(q.explanationImages) && q.explanationImages.length
          ? q.explanationImages.filter(Boolean)
          : q.explanationImage
            ? [q.explanationImage]
            : [],
    })),
  };
  return `window.AKSORN_DATA = ${JSON.stringify(payload, null, 2)};\n`;
}

async function loadCoverAsset(
  set: ExamSet,
  categories: SetCategory[] = initialCategories,
): Promise<{path: string; content?: string; encoding?: 'utf8' | 'base64'}> {
  const src = getSetCover(set, categories);
  if (src.startsWith('data:')) {
    const match = src.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mime = match[1];
      const ext =
        mime.includes('png')
          ? 'png'
          : mime.includes('jpeg') || mime.includes('jpg')
            ? 'jpg'
            : mime.includes('webp')
              ? 'webp'
              : 'img';
      return {path: `assets/cover.${ext}`, content: match[2], encoding: 'base64'};
    }
    return {path: src};
  }
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return {path: src};
  }
  try {
    const res = await fetch(src);
    if (res.ok) {
      const text = await res.text();
      const name = src.split('/').pop() || 'cover.svg';
      return {path: `assets/${name}`, content: text, encoding: 'utf8'};
    }
  } catch {
    /* fall through */
  }
  return {path: src};
}

async function loadLogoSvg(): Promise<string> {
  try {
    const res = await fetch('/Aksorn_Logo.svg');
    if (res.ok) return await res.text();
  } catch {
    /* fall through */
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 86.73 86.74"><circle cx="43" cy="43" r="40" fill="#e30613"/></svg>`;
}

export async function exportUserPackage(
  set: ExamSet,
  questions: Question[],
  categories: SetCategory[] = initialCategories,
): Promise<ExportResult> {
  if (!questions.length) {
    throw new Error('ชุดนี้ยังไม่มีคำถาม ไม่สามารถ Export ได้');
  }

  const base = exportBaseSlug(set);
  const logo = await loadLogoSvg();
  const cover = await loadCoverAsset(set, categories);
  const coverPathForData = cover.path;
  const pageTitle = set.title;
  const categoryLabel = getCategoryLabel(set, categories);

  const files: ExportFile[] = [
    {path: 'index.html', content: pageHtml(pageTitle, 'activity')},
    {path: 'exam.html', content: pageHtml(`${pageTitle} · ทำแบบฝึก`, 'exam')},
    {path: 'report.html', content: pageHtml(`รายงานผล · ${pageTitle}`, 'report')},
    {path: 'assets/styles.css', content: exportStyles},
    {path: 'assets/app.js', content: buildExportAppJs()},
    {
      path: 'assets/data.js',
      content: buildDataJs(set, questions, coverPathForData, pageTitle, categoryLabel),
    },
    {path: 'assets/Aksorn_Logo.svg', content: logo},
  ];

  if (cover.content) {
    files.push({
      path: cover.path,
      content: cover.content,
      encoding: cover.encoding || 'utf8',
    });
  }

  const res = await fetch('/api/export-package', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({base, files}),
  });
  const data = (await res.json().catch(() => null)) as
    | {
        ok?: boolean;
        folder?: string;
        path?: string;
        url?: string;
        version?: number;
        versionLabel?: string;
        error?: string;
      }
    | null;
  if (
    !res.ok ||
    !data?.ok ||
    !data.folder ||
    !data.path ||
    !data.url ||
    typeof data.version !== 'number' ||
    !data.versionLabel
  ) {
    throw new Error(data?.error || 'Export ไม่สำเร็จ');
  }

  return {
    folder: data.folder,
    path: data.path,
    url: data.url,
    version: data.version,
    versionLabel: data.versionLabel,
  };
}
