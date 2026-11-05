import type {ExamSet, Question, SetCategory} from '@/lib/mock';
import {getCategoryLabel, getQuestionSkills, getSetCover, initialCategories} from '@/lib/mock';
import {exportStyles} from '@/lib/export-styles';
import {buildExportAppJs} from '@/lib/export-app-js';

export type ExportResult = {
  /** Folder name inside the zip, e.g. aksorn-statistics-v01 */
  folder: string;
  /** Downloaded zip filename */
  filename: string;
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

function coverExtFromMimeOrPath(mime: string, src: string): string {
  const m = mime.toLowerCase();
  if (m.includes('png')) return 'png';
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif')) return 'gif';
  if (m.includes('svg')) return 'svg';
  const fromPath = src.split('?')[0].split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(fromPath)) {
    return fromPath === 'jpeg' ? 'jpg' : fromPath;
  }
  return 'png';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadCoverAsset(
  set: ExamSet,
  categories: SetCategory[] = initialCategories,
): Promise<{path: string; content?: string; encoding?: 'utf8' | 'base64'}> {
  const src = getSetCover(set, categories);
  if (src.startsWith('data:')) {
    const match = src.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const ext = coverExtFromMimeOrPath(match[1], src);
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
      const mime = res.headers.get('content-type') || '';
      const ext = coverExtFromMimeOrPath(mime, src);
      // SVG is text; raster images must be written as base64 — res.text() corrupts PNG/JPEG
      if (ext === 'svg' || mime.includes('svg')) {
        const text = await res.text();
        return {path: 'assets/cover.svg', content: text, encoding: 'utf8'};
      }
      const buffer = await res.arrayBuffer();
      return {
        path: `assets/cover.${ext}`,
        content: arrayBufferToBase64(buffer),
        encoding: 'base64',
      };
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

function nextLocalVersion(base: string): number {
  if (typeof window === 'undefined') return 1;
  const key = `kh-export-ver-${base}`;
  const prev = Number(window.localStorage.getItem(key) || '0');
  const next = Number.isFinite(prev) && prev > 0 ? prev + 1 : 1;
  window.localStorage.setItem(key, String(next));
  return next;
}

function formatVersion(n: number): {folderTag: string; label: string} {
  const pad = String(n).padStart(2, '0');
  return {folderTag: `v${pad}`, label: `v.${pad}`};
}

/** Build learner package and download as ZIP to the user's machine */
export async function exportUserPackage(
  set: ExamSet,
  questions: Question[],
  categories: SetCategory[] = initialCategories,
): Promise<ExportResult> {
  if (!questions.length) {
    throw new Error('ชุดนี้ยังไม่มีคำถาม ไม่สามารถ Export ได้');
  }

  const base = exportBaseSlug(set);
  const version = nextLocalVersion(base);
  const {folderTag, label} = formatVersion(version);
  const folder = `${base}-${folderTag}`;
  const filename = `${folder}.zip`;

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

  // Dynamic import keeps JSZip (and core-js) out of the initial SSR bundle
  const {default: JSZip} = await import('jszip');
  const zip = new JSZip();
  const root = zip.folder(folder);
  if (!root) throw new Error('สร้าง ZIP ไม่สำเร็จ');

  for (const file of files) {
    if (file.encoding === 'base64') {
      root.file(file.path, file.content, {base64: true});
    } else {
      root.file(file.path, file.content);
    }
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {level: 6},
  });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);

  return {
    folder,
    filename,
    version,
    versionLabel: label,
  };
}
