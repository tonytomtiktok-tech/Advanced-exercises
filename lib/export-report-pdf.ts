import {jsPDF} from 'jspdf';
import html2canvas from 'html2canvas';
import type {Attempt, ExamSet, Question} from '@/lib/mock';
import {getQuestionSkills} from '@/lib/mock';

export type ReportPdfSkill = {
  skill: string;
  percent: number;
  count: number;
  correct: number;
  questionCount: number;
};

export type ReportPdfInput = {
  set: ExamSet;
  totalCount: number;
  totalCorrect: number;
  totals: ReportPdfSkill[];
  latest?: Attempt | null;
  latestPct: number;
  reviewQs: Question[];
};

async function svgUrlToPngDataUrl(url: string, size = 256): Promise<string> {
  const res = await fetch(url);
  const svgText = await res.text();
  const blob = new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'});
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function esc(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function skillColor(t: ReportPdfSkill) {
  if (t.count === 0) return '#94a3b8';
  if (t.percent >= 70) return '#059669';
  if (t.percent >= 50) return '#f97316';
  return '#f43f5e';
}

function buildSkillBars(skills: ReportPdfSkill[]) {
  return skills
    .map((t) => {
      const pctLabel = t.count === 0 ? '–' : t.percent + '%';
      const barW = t.count ? t.percent : 0;
      const color = skillColor(t);
      return `<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700">
          <span>${esc(t.skill)}</span><span style="color:${color}">${pctLabel}</span>
        </div>
        <div style="margin-top:6px;height:8px;background:#f1f5f9;border-radius:999px;overflow:hidden">
          <div style="width:${barW}%;height:100%;background:${color};border-radius:999px"></div>
        </div>
        <div style="margin-top:4px;font-size:10px;color:#64748b">ตอบถูก ${t.correct}/${t.count} ข้อ · ในชุดมี ${t.questionCount} ข้อ</div>
      </div>`;
    })
    .join('');
}

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
}

/** Radar chart matching the web report look */
function buildRadarSvg(skills: ReportPdfSkill[]) {
  const n = Math.max(skills.length, 3);
  const items =
    skills.length >= 3
      ? skills
      : [
          ...skills,
          ...Array.from({length: 3 - skills.length}, (_, i) => ({
            skill: `–${i}`,
            percent: 0,
            count: 0,
            correct: 0,
            questionCount: 0,
          })),
        ];
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 105;
  const levels = 5;
  const step = 360 / items.length;

  const grids: string[] = [];
  for (let lv = 1; lv <= levels; lv++) {
    const r = (maxR * lv) / levels;
    const pts = items
      .map((_, i) => {
        const p = polarPoint(cx, cy, r, i * step);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(' ');
    grids.push(
      `<polygon points="${pts}" fill="none" stroke="#e4e8f4" stroke-width="1"/>`,
    );
  }

  const axes = items
    .map((_, i) => {
      const p = polarPoint(cx, cy, maxR, i * step);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#e4e8f4" stroke-width="1"/>`;
    })
    .join('');

  const dataPts = items
    .map((t, i) => {
      const r = (maxR * Math.max(0, Math.min(100, t.percent))) / 100;
      return polarPoint(cx, cy, r, i * step);
    })
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const labels = items
    .map((t, i) => {
      const p = polarPoint(cx, cy, maxR + 28, i * step);
      const name =
        t.skill.startsWith('–')
          ? ''
          : t.skill.length > 10
            ? esc(t.skill.slice(0, 10)) + '…'
            : esc(t.skill);
      return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#64748b" font-family="Sarabun,Tahoma,sans-serif">${name}</text>`;
    })
    .join('');

  void n;
  return `<svg width="100%" height="260" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto">
    ${grids.join('')}
    ${axes}
    <polygon points="${dataPts}" fill="#7776f5" fill-opacity="0.25" stroke="#6665f0" stroke-width="2"/>
    ${items
      .map((t, i) => {
        const r = (maxR * Math.max(0, Math.min(100, t.percent))) / 100;
        const p = polarPoint(cx, cy, r, i * step);
        return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#6665f0"/>`;
      })
      .join('')}
    ${labels}
  </svg>`;
}

function buildStrengthPanel(skills: ReportPdfSkill[]) {
  return `<div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;box-sizing:border-box">
    <div style="font-size:14px;font-weight:900;margin-bottom:4px">📊 จุดแข็ง–จุดอ่อนรายสาระ</div>
    <div style="font-size:10px;color:#64748b;margin-bottom:8px">ยิ่งพื้นที่กว้าง ยิ่งแม่นยำขึ้น · คะแนนจากโจทย์ที่ทำแล้ว</div>
    ${
      skills.length
        ? buildRadarSvg(skills)
        : '<div style="height:220px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px">ยังไม่มีข้อมูลทักษะ</div>'
    }
    <div style="margin-top:4px;text-align:center;font-size:10px;color:#f97316">💡 ควรฝึกทักษะที่มีความแม่นยำต่ำก่อน</div>
  </div>`;
}

function buildTitleHeader(logoSrc: string, title: string, subtitle: string) {
  return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e2e8f0">
    <img src="${logoSrc}" alt="A+" width="48" height="48" style="display:block;flex-shrink:0"/>
    <div>
      <div style="font-size:20px;font-weight:900;line-height:1.2">รายงานผล · ${esc(title)}</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px">${esc(subtitle)}</div>
    </div>
  </div>`;
}

function wrapPage(inner: string) {
  return `<div class="pdf-page" style="font-family:'Sarabun','Noto Sans Thai',Tahoma,sans-serif;color:#0f172a;background:#fff;padding:8px 8px 20px;width:720px;box-sizing:border-box">
    ${inner}
  </div>`;
}

function buildPage1Html(data: ReportPdfInput, logoSrc: string) {
  const accuracy = data.totalCount
    ? Math.round((data.totalCorrect / data.totalCount) * 100) + '%'
    : '–';
  const skills = data.totals;
  const skillsSorted = [...skills].sort(
    (a, b) => a.percent - b.percent || a.skill.localeCompare(b.skill, 'th'),
  );

  return wrapPage(`
    ${buildTitleHeader(logoSrc, data.set.title, 'สรุปเฉพาะชุดกิจกรรมนี้ · ขนาด A4')}

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
      ${[
        ['จำนวนข้อ', data.totalCount + ' ข้อ'],
        ['ตอบถูก', data.latest ? data.totalCorrect + ' ข้อ' : '–'],
        ['ความแม่นยำ', data.latest ? accuracy : '–'],
      ]
        .map(
          ([n, v]) =>
            `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px">
              <div style="font-size:10px;color:#64748b">${n}</div>
              <div style="font-size:20px;font-weight:900;margin-top:6px">${v}</div>
            </div>`,
        )
        .join('')}
    </div>

    <div style="display:grid;grid-template-columns:1.05fr 1fr;gap:12px;align-items:start">
      ${buildStrengthPanel(skills)}
      <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;box-sizing:border-box">
        <div style="font-size:14px;font-weight:900;margin-bottom:4px">🧠 ทักษะที่ควรพัฒนา</div>
        <div style="font-size:10px;color:#64748b;margin-bottom:12px">เปอร์เซ็นต์ถูกต้องแยกตามทักษะ</div>
        ${buildSkillBars(skillsSorted) || '<p style="color:#64748b;font-size:12px">ยังไม่มีข้อมูลทักษะ</p>'}
      </div>
    </div>
  `);
}

function buildPage2Html(data: ReportPdfInput, logoSrc: string) {
  const review =
    data.latest && data.reviewQs.length
      ? data.reviewQs
          .map((item, i) => {
            const choice = data.latest!.answers[item.id];
            const ok = choice === item.correct;
            const skills = getQuestionSkills(item).join(', ');
            return `<div style="border-top:1px solid #e2e8f0;padding:12px 0;font-size:12px">
              <div style="font-weight:700;color:${ok ? '#059669' : '#e11d48'}">${ok ? '✓' : '✗'} ข้อ ${i + 1}${skills ? ` · ${esc(skills)}` : ''}</div>
              <div style="margin-top:4px;color:#334155">${esc(item.prompt)}</div>
              <div style="margin-top:6px;font-size:11px;color:#64748b">คำตอบของคุณ: ${esc(item.options[choice] ?? '–')}</div>
              <div style="margin-top:2px;font-size:11px;color:#64748b">เฉลย: ${esc(item.options[item.correct])} — ${esc(item.explanation)}</div>
            </div>`;
          })
          .join('')
      : '<p style="color:#64748b;font-size:12px">ยังไม่มีผลการทำข้อสอบของชุดนี้</p>';

  const latestBlock = data.latest
    ? `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px">
        <div>
          <div style="font-size:11px;font-weight:700;color:#059669">สรุปผลการทำข้อสอบ</div>
          <div style="font-size:18px;font-weight:900;margin-top:4px">รายละเอียดรอบล่าสุด</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px">${esc(data.set.title)} · ${data.latest.mode === 'practice' ? 'โหมดฝึก' : 'โหมดจำลองสอบ'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:36px;font-weight:900;color:#6665f0">${data.latestPct}%</div>
          <div style="font-size:12px;color:#64748b">ตอบถูก ${data.latest.correct} จาก ${data.latest.total} ข้อ</div>
        </div>
      </div>`
    : `<div style="margin-bottom:12px">
        <div style="font-size:18px;font-weight:900">รายละเอียดรอบล่าสุด</div>
        <p style="color:#64748b;font-size:12px;margin-top:8px">ยังไม่มีผลการทำข้อสอบของชุดนี้</p>
      </div>`;

  return wrapPage(`
    ${buildTitleHeader(logoSrc, data.set.title, 'หน้า 2 · รายละเอียดรอบล่าสุด')}
    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px">
      ${latestBlock}
      <div style="font-size:14px;font-weight:900;margin:8px 0 6px">ทบทวนคำตอบ</div>
      ${review}
    </div>
  `);
}

async function renderToCanvas(html: string) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;pointer-events:none;';
  host.innerHTML = html;
  document.body.appendChild(host);
  try {
    const target = host.firstElementChild as HTMLElement;
    return await html2canvas(target, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
  } finally {
    host.remove();
  }
}

function appendCanvasPages(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  opts: {pageOffset: number; totalPages: number},
) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginX = 12;
  const topMargin = 10;
  const bottomMargin = 12;
  const contentW = pageW - marginX * 2;
  const contentH = pageH - topMargin - bottomMargin;
  const imgH = (canvas.height * contentW) / canvas.width;
  const sliceCount = Math.max(1, Math.ceil(imgH / contentH));

  for (let i = 0; i < sliceCount; i++) {
    const isFirstDocPage = opts.pageOffset === 0 && i === 0;
    if (!isFirstDocPage) pdf.addPage();

    const srcY = ((i * contentH) / imgH) * canvas.height;
    const srcH = Math.min(canvas.height - srcY, (contentH / imgH) * canvas.height);
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = Math.max(1, Math.ceil(srcH));
    const ctx = slice.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
    const sliceH = (slice.height * contentW) / slice.width;
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', marginX, topMargin, contentW, sliceH);

    const pageNo = opts.pageOffset + i + 1;
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`${pageNo} / ${opts.totalPages}`, pageW / 2, pageH - 5, {align: 'center'});
  }

  return sliceCount;
}

function countSlices(canvas: HTMLCanvasElement, contentW: number, contentH: number) {
  const imgH = (canvas.height * contentW) / canvas.width;
  return Math.max(1, Math.ceil(imgH / contentH));
}

export async function exportReportPdf(data: ReportPdfInput) {
  const logoPng = await svgUrlToPngDataUrl('/Aksorn_Logo.svg', 256);
  const canvas1 = await renderToCanvas(buildPage1Html(data, logoPng));
  const canvas2 = await renderToCanvas(buildPage2Html(data, logoPng));

  const pdf = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4'});
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - 24;
  const contentH = pageH - 22;
  const slices1 = countSlices(canvas1, contentW, contentH);
  const slices2 = countSlices(canvas2, contentW, contentH);
  const totalPages = slices1 + slices2;

  appendCanvasPages(pdf, canvas1, {pageOffset: 0, totalPages});
  appendCanvasPages(pdf, canvas2, {pageOffset: slices1, totalPages});

  const safeTitle = data.set.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
  pdf.save(`รายงานผล-${safeTitle}.pdf`);
}
