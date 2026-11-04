'use client';
import {Coffee, Play} from 'lucide-react';

function fmtUsed(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ExamPauseOverlay({
  usedSeconds,
  onResume,
}: {
  usedSeconds: number;
  onResume: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-pause-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white px-6 py-8 text-center shadow-[0_24px_80px_rgba(15,23,42,.28)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-500">
          <Coffee size={28} strokeWidth={1.75} />
        </div>
        <h2 id="exam-pause-title" className="mt-5 text-xl font-black text-ink">
          พักสักครู่ก่อนนะ
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          เวลาหยุดแล้วนะ ไปห้องน้ำ ดื่มน้ำ
          <br />
          หรือหาอะไรทานเล่นได้ตามสบาย
        </p>
        <p className="mt-5 text-sm font-bold text-ink">เวลาที่ใช้ไป {fmtUsed(usedSeconds)}</p>
        <button
          type="button"
          onClick={onResume}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-bold text-white hover:bg-emerald-600"
        >
          <Play size={18} fill="currentColor" />
          พร้อมแล้ว เล่นต่อ
        </button>
      </div>
    </div>
  );
}
