import {NextRequest, NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type ExportFile = {
  path: string;
  content: string;
  encoding?: 'utf8' | 'base64';
};

const VERSION_TOKEN = '{{EXPORT_VERSION}}';

function isSafeBase(base: string): boolean {
  return /^aksorn-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(base) && !base.includes('..');
}

function isSafeRelPath(rel: string): boolean {
  if (!rel || rel.startsWith('/') || rel.includes('\\') || rel.includes('..')) return false;
  return /^[a-zA-Z0-9._\-/]+$/.test(rel);
}

function formatVersion(n: number): {folderTag: string; label: string} {
  const pad = String(n).padStart(2, '0');
  return {folderTag: `v${pad}`, label: `v.${pad}`};
}

async function nextVersion(publicRoot: string, base: string): Promise<number> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(publicRoot);
  } catch {
    entries = [];
  }
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-v(\\d+)$`);
  let max = 0;
  for (const name of entries) {
    const m = name.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {base?: string; files?: ExportFile[]};
    const base = (body.base || '').trim().toLowerCase();
    const files = Array.isArray(body.files) ? body.files : [];

    if (!isSafeBase(base)) {
      return NextResponse.json({ok: false, error: 'ชื่อฐานโฟลเดอร์ไม่ถูกต้อง'}, {status: 400});
    }
    if (!files.length) {
      return NextResponse.json({ok: false, error: 'ไม่มีไฟล์สำหรับ Export'}, {status: 400});
    }

    const publicRoot = path.join(process.cwd(), 'public');
    const publicResolved = path.resolve(publicRoot);

    let version = await nextVersion(publicRoot, base);
    let folder = '';
    let resolved = '';
    let label = '';

    // Allocate a free folder without deleting older versions
    for (let attempt = 0; attempt < 50; attempt++) {
      const formatted = formatVersion(version);
      folder = `${base}-${formatted.folderTag}`;
      label = formatted.label;
      resolved = path.resolve(publicRoot, folder);
      if (!resolved.startsWith(publicResolved + path.sep)) {
        return NextResponse.json({ok: false, error: 'พาธไม่ปลอดภัย'}, {status: 400});
      }
      try {
        await fs.mkdir(resolved, {recursive: false});
        break;
      } catch (e: unknown) {
        const code = e && typeof e === 'object' && 'code' in e ? String((e as {code: string}).code) : '';
        if (code === 'EEXIST') {
          version += 1;
          continue;
        }
        throw e;
      }
    }

    if (!folder || !resolved) {
      return NextResponse.json({ok: false, error: 'สร้างโฟลเดอร์เวอร์ชันไม่สำเร็จ'}, {status: 500});
    }

    await fs.mkdir(path.join(resolved, 'assets'), {recursive: true});

    for (const file of files) {
      if (!isSafeRelPath(file.path)) {
        return NextResponse.json({ok: false, error: `พาธไฟล์ไม่ปลอดภัย: ${file.path}`}, {status: 400});
      }
      const dest = path.resolve(resolved, file.path);
      if (!dest.startsWith(resolved + path.sep)) {
        return NextResponse.json({ok: false, error: 'พาธไฟล์ออกนอกโฟลเดอร์'}, {status: 400});
      }
      await fs.mkdir(path.dirname(dest), {recursive: true});
      if (file.encoding === 'base64') {
        await fs.writeFile(dest, Buffer.from(file.content, 'base64'));
      } else {
        const text = file.content.split(VERSION_TOKEN).join(label);
        await fs.writeFile(dest, text, 'utf8');
      }
    }

    return NextResponse.json({
      ok: true,
      base,
      folder,
      version,
      versionLabel: label,
      path: `public/${folder}`,
      url: `/${folder}/`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ok: false, error: 'เขียนไฟล์ไม่สำเร็จ'}, {status: 500});
  }
}
