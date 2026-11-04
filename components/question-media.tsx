'use client';
import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, ImagePlus, Link2, X} from 'lucide-react';
import {parsePromptVideoUrl} from '@/lib/mock';

const cls = (...x: (string | boolean | undefined)[]) => x.filter(Boolean).join(' ');

const IMAGE_ACCEPT = 'image/*,.gif,image/gif';

/** Keep GIF as-is so animation is preserved; compress other rasters to JPEG */
export function fileToDataUrl(file: File, maxSide = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.onload = () => {
      const src = String(reader.result || '');
      const type = (file.type || '').toLowerCase();
      const isGif =
        type === 'image/gif' || /\.gif$/i.test(file.name) || src.startsWith('data:image/gif');
      // GIF / SVG: do not rasterize through canvas (would freeze animation / break vectors)
      if (!type.startsWith('image/') || type === 'image/svg+xml' || isGif) {
        resolve(src);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/** Prompt images: one frame + prev/next when multiple */
export function PromptImage({
  src,
  images,
  compact,
}: {
  src?: string;
  images?: string[];
  compact?: boolean;
}) {
  const list = (images && images.length ? images : src ? [src] : []).filter(Boolean);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [list.length, list[0]]);

  if (!list.length) return null;
  const safeIdx = Math.min(idx, list.length - 1);
  const multi = list.length > 1;

  return (
    <figure
      className={cls(
        'relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50',
        compact ? 'max-w-xs' : 'mx-auto w-full max-w-2xl',
      )}
    >
      <img
        src={list[safeIdx]}
        alt={`ภาพประกอบโจทย์ ${safeIdx + 1}`}
        className={cls(
          'mx-auto block w-full object-contain',
          compact ? 'max-h-40' : 'max-h-[320px]',
        )}
      />
      {multi && (
        <>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + list.length) % list.length)}
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-ink shadow-sm hover:bg-white"
            aria-label="รูปก่อนหน้า"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % list.length)}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-ink shadow-sm hover:bg-white"
            aria-label="รูปถัดไป"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white">
            {safeIdx + 1} / {list.length}
          </div>
        </>
      )}
    </figure>
  );
}

export function OptionImage({src, compact}: {src?: string; compact?: boolean}) {
  if (!src) return null;
  return (
    <div
      className={cls(
        'mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white',
        compact ? 'max-w-[140px]' : 'max-w-[220px]',
      )}
    >
      <img
        src={src}
        alt="ภาพตัวเลือก"
        className={cls('block w-full object-contain', compact ? 'max-h-20' : 'max-h-28')}
      />
    </div>
  );
}

/** Stem video from URL (YouTube / Vimeo / direct file) */
export function PromptVideo({url, compact}: {url?: string; compact?: boolean}) {
  const embed = url ? parsePromptVideoUrl(url) : null;
  if (!embed) return null;
  return (
    <div
      className={cls(
        'mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm',
        compact ? 'max-w-xs' : 'mx-auto w-full max-w-2xl',
      )}
    >
      {embed.kind === 'file' ? (
        <video
          src={embed.src}
          controls
          playsInline
          className={cls('block w-full bg-black', compact ? 'max-h-40' : 'max-h-[360px]')}
        />
      ) : (
        <div className="relative aspect-video w-full">
          <iframe
            src={embed.src}
            title="วิดีโอประกอบโจทย์"
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

/** Admin: paste video URL for the question stem */
export function PromptVideoUrlField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const embed = value.trim() ? parsePromptVideoUrl(value) : null;
  const invalid = Boolean(value.trim()) && !embed;
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-3">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
        <Link2 size={14} />
        วิดีโอโจทย์ (URL เท่านั้น)
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=… หรือลิงก์ .mp4"
          className="field min-w-0 flex-1 py-2 text-sm"
          aria-label="URL วิดีโอโจทย์"
        />
        {value.trim() && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50"
          >
            <X size={14} /> ลบ
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-muted">
        รองรับ YouTube, Vimeo หรือลิงก์ไฟล์วิดีโอโดยตรง — ยังไม่อัปโหลดไฟล์จากเครื่อง
      </p>
      {invalid && (
        <p className="mt-1 text-[11px] font-bold text-rose-500">ลิงก์ไม่ถูกต้องหรือยังไม่รองรับ</p>
      )}
      {embed && <PromptVideo url={value} compact />}
    </div>
  );
}

/** Explanation images: stacked vertically */
export function ExplanationImage({
  src,
  images,
  compact,
}: {
  src?: string;
  images?: string[];
  compact?: boolean;
}) {
  const list = (images && images.length ? images : src ? [src] : []).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className={cls('mt-3 space-y-3', compact ? 'max-w-xs' : 'w-full max-w-xl')}>
      {list.map((url, i) => (
        <figure
          key={`${i}-${url.slice(0, 24)}`}
          className="overflow-hidden rounded-2xl border border-indigo-100 bg-white"
        >
          <img
            src={url}
            alt={`ภาพประกอบเฉลย ${i + 1}`}
            className={cls(
              'mx-auto block w-full object-contain',
              compact ? 'max-h-36' : 'max-h-[260px]',
            )}
          />
        </figure>
      ))}
    </div>
  );
}

/** Single image attach (options) */
export function ImageAttachButton({
  label = 'ใส่รูป',
  value,
  onChange,
  maxSide = 1200,
}: {
  label?: string;
  value?: string;
  onChange: (next?: string) => void;
  maxSide?: number;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-start gap-3">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand hover:text-brand">
        <ImagePlus size={14} />
        {value ? 'เปลี่ยนรูป' : label}
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              onChange(await fileToDataUrl(file, maxSide));
            } catch {
              alert('อัปโหลดรูปไม่สำเร็จ');
            }
          }}
        />
      </label>
      {value && (
        <>
          <div className="relative h-16 w-24 overflow-hidden rounded-lg border bg-slate-50">
            <img src={value} alt="" className="h-full w-full object-contain" />
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50"
          >
            <X size={14} /> ลบรูป
          </button>
        </>
      )}
    </div>
  );
}

/** Multi image attach (prompt / explanation) */
export function MultiImageAttach({
  label = 'เพิ่มรูป',
  values,
  onChange,
  maxSide = 1200,
}: {
  label?: string;
  values: string[];
  onChange: (next: string[]) => void;
  maxSide?: number;
}) {
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-start gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-brand hover:text-brand">
          <ImagePlus size={14} />
          {label}
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="sr-only"
            onChange={async (e) => {
              const files = [...(e.target.files || [])];
              e.target.value = '';
              if (!files.length) return;
              try {
                const urls = await Promise.all(files.map((f) => fileToDataUrl(f, maxSide)));
                onChange([...values, ...urls]);
              } catch {
                alert('อัปโหลดรูปไม่สำเร็จ');
              }
            }}
          />
        </label>
        {values.length > 0 && (
          <span className="self-center text-[11px] font-bold text-muted">{values.length} รูป</span>
        )}
        <span className="self-center text-[10px] text-muted">รองรับ JPG, PNG, GIF (ขยับได้)</span>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((url, i) => (
            <div
              key={`${i}-${url.slice(0, 24)}`}
              className="relative h-16 w-24 overflow-hidden rounded-lg border bg-slate-50"
            >
              <img src={url} alt="" className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white hover:bg-rose-600"
                aria-label={`ลบรูปที่ ${i + 1}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
