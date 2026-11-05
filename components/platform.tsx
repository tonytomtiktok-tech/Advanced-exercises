'use client';
import {useEffect,useMemo,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {Activity,ArrowLeft,ArrowRight,BarChart3,BookOpen,Bookmark,Check,CheckCircle2,ChevronRight,Clock,Download,FileDown,FileQuestion,Filter,Home,Menu,Pause,Play,Search,Settings2,ShieldCheck,Sparkles,Target,Timer,Trophy,X} from 'lucide-react';
import {ResponsiveContainer,RadarChart,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Radar,BarChart,Bar,XAxis,Tooltip,CartesianGrid} from 'recharts';
import {Attempt,ExamSet,Question,SetCategory,SKILL_OPTIONS,SUBJECT_OPTIONS,getCategoryLabel,getOrderedSetQuestions,getQuestionSetIds,getQuestionSkills,getSetCover,initialCategories,initialQuestions,initialSets,seedAttempts} from '@/lib/mock';
import AdminWorkspace from '@/components/admin-workspace';
import ExamQuestionBody from '@/components/exam-question-body';
import ExamPauseOverlay from '@/components/exam-pause-overlay';
import MathText from '@/components/math-text';
import {exportReportPdf} from '@/lib/export-report-pdf';
type Mode='practice'|'simulation';
type Route='home'|'activity'|'exam'|'report'|'admin';
const nav=[{id:'home',label:'คลังข้อสอบ',icon:Home},{id:'activity',label:'เลือกกิจกรรม',icon:BookOpen},{id:'exam',label:'ทำแบบฝึก',icon:FileQuestion},{id:'report',label:'รายงานผล',icon:BarChart3},{id:'admin',label:'Backoffice',icon:Settings2}] as const;
const levelGroups=[
  {label:'ประถม',items:['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6']},
  {label:'มัธยม',items:['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6']},
] as const;
const subjectFilters=['ทั้งหมด',...SUBJECT_OPTIONS] as const;
const cls=(...x:(string|boolean|undefined)[])=>x.filter(Boolean).join(' ');
function normalizeHomeSubject(subject:string){
  if(subject==='คณิตศาสตร์')return 'คณิต';
  if(subject==='วิทยาศาสตร์')return 'วิทย์';
  return subject;
}
function filterChip(active:boolean){
  return cls(
    'rounded-full border px-3.5 py-1.5 text-xs font-bold transition',
    active?'border-slate-900 bg-ink text-white':'border-orange-100 bg-orange-50/40 text-orange-700 hover:bg-orange-100',
  );
}
function useStored<T>(key:string,initial:T){
  const [value,setValue]=useState<T>(initial);
  const [activeKey,setActiveKey]=useState(key);
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>{
    setHydrated(false);
    try{
      const raw=localStorage.getItem(key);
      setValue(raw?JSON.parse(raw) as T:initial);
    }catch{
      setValue(initial);
    }
    setActiveKey(key);
    setHydrated(true);
  },[key]);
  useEffect(()=>{
    // Never persist until we've read localStorage — avoids wiping saved sets/questions with seed data
    if(!hydrated||activeKey!==key)return;
    try{localStorage.setItem(key,JSON.stringify(value));}catch{/* quota */}
  },[key,activeKey,value,hydrated]);
  return [value,setValue] as const;
}
function Pill({children,tone='neutral'}:{children:React.ReactNode;tone?:'neutral'|'purple'|'orange'|'green'}){return <span className={cls('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',tone==='neutral'?'bg-slate-100 text-slate-600':tone==='purple'?'bg-indigo-50 text-indigo-600':tone==='orange'?'bg-orange-50 text-orange-600':'bg-emerald-50 text-emerald-700')}>{children}</span>}
function Header({route,go}:{route:Route;go:(to:Route)=>void}){const[menu,setMenu]=useState(false);return <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"><button onClick={()=>go('home')} className="flex items-center gap-3 text-left"><span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white"><img src="/Aksorn_Logo.svg" alt="Aksorn" className="h-11 w-11 object-contain"/></span><span><strong className="block text-lg tracking-tight text-ink">AKSORN</strong><span className="block text-[10px] font-bold tracking-wide text-slate-400">ข้อสอบ O-net</span></span></button><nav className="hidden items-center gap-1 lg:flex">{nav.map(n=><button key={n.id} onClick={()=>go(n.id)} className={cls('flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition',route===n.id?'bg-indigo-50 text-brand':'text-slate-600 hover:bg-slate-50')}><n.icon size={16}/>{n.label}</button>)}</nav><div className="flex items-center gap-2"><Pill tone="green"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Demo</Pill><button onClick={()=>setMenu(!menu)} className="rounded-xl border p-2 lg:hidden" aria-label="เปิดเมนู">{menu?<X size={20}/>:<Menu size={20}/>}</button></div></div>{menu&&<div className="border-t px-4 py-3 lg:hidden"><div className="grid grid-cols-2 gap-2">{nav.map(n=><button key={n.id} onClick={()=>{go(n.id);setMenu(false)}} className={cls('flex items-center gap-2 rounded-xl p-3 text-left text-sm font-semibold',route===n.id?'bg-indigo-50 text-indigo-600':'bg-slate-50')}><n.icon size={16}/>{n.label}</button>)}</div></div>}</header>}
export default function Platform(){const router=useRouter();const path=usePathname();const searchParams=useSearchParams();const slug=(path.split('/')[1]||'home') as Route;const route:Route=(['home','activity','exam','report','admin'] as string[]).includes(slug)?slug:'home';const chosen=Number(searchParams.get('set')||1);const [sets,setSets]=useStored<ExamSet[]>('kh-sets-v4-m6',initialSets);const [categories,setCategories]=useStored<SetCategory[]>('kh-categories',initialCategories);const [questions,setQuestions]=useStored<Question[]>('kh-questions-v4-m6',initialQuestions);const [attempts,setAttempts]=useStored<Attempt[]>('kh-attempts-set-'+chosen,seedAttempts);const [mode,setMode]=useState<Mode>('practice');const [answers,setAnswers]=useState<Record<number,number>>({});const [revealed,setRevealed]=useState<number[]>([]);const [index,setIndex]=useState(0);const [finished,setFinished]=useState(false);const [seconds,setSeconds]=useState(0);const [paused,setPaused]=useState(false);const [saved,setSaved]=useState(false);const [search,setSearch]=useState('');const [level,setLevel]=useState('ทั้งหมด');const [subject,setSubject]=useState('ทั้งหมด');const homeSets=useMemo(()=>{
  const q=search.trim().toLowerCase();
  return sets.filter((s)=>{
    if(subject!=='ทั้งหมด'&&normalizeHomeSubject(s.subject)!==subject)return false;
    if(level!=='ทั้งหมด'&&s.level!==level)return false;
    if(!q)return true;
    return [s.title,s.topic,s.level,s.subject,s.description].join(' ').toLowerCase().includes(q);
  });
},[sets,search,level,subject]);const set=sets.find(s=>s.id===chosen)||sets[0]||{id:0,title:'',subject:'คณิต',level:'ม.1',topic:'',count:0,time:15,popular:0,icon:'',tint:'',description:'',cover:''};const examQuestions=useMemo(()=>getOrderedSetQuestions(set,questions,sets),[questions,set,sets]);const q=examQuestions[index];const go=(to:Route,id?:number)=>router.push('/'+to+(id?'?set='+id:''));const selectSet=(id:number)=>go('activity',id);const begin=(m:Mode)=>{setMode(m);setIndex(0);setAnswers({});setRevealed([]);setFinished(false);setSeconds(0);setPaused(false);setSaved(false);setAttempts([]);go('exam',set.id)};
useEffect(()=>{if(route!=='exam'||finished||paused)return;const timer=window.setInterval(()=>setSeconds(t=>t+1),1000);return()=>window.clearInterval(timer)},[route,finished,paused]);
useEffect(()=>{if(!set||route!=='exam'||finished||!(set.time>0))return;if(seconds>=set.time*60)finishExam()},[seconds,route,set,finished]);
function finishExam(){if(finished)return;const correct=examQuestions.filter(item=>answers[item.id]===item.correct).length;setAttempts([{id:String(Date.now()),setId:set.id,mode,date:new Date().toISOString(),answers:{...answers},correct,total:examQuestions.length,duration:seconds}]);setFinished(true);setSaved(true);go('report',set.id)}
function chooseAnswer(option:number){if(!q||finished||(mode==='practice'&&revealed.includes(q.id)))return;setAnswers(p=>({...p,[q.id]:option}))}
async function handleExport(_setId:number){alert('อยู่ระหว่างดำเนินการ')}
return <div className="flex min-h-screen flex-col"><Header route={route} go={(to)=>go(to,(to==='activity'||to==='exam'||to==='report')&&set.id?set.id:undefined)}/><main className={cls('w-full flex-1',route==='activity'?'flex flex-col p-0':'mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12')}>{route==='home'&&<><section className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#fff3cf_0%,transparent_45%),radial-gradient(ellipse_at_bottom_right,#ffe4e6_0%,transparent_42%),linear-gradient(180deg,#fff_0%,#fbfcff_100%)]"/><div className="absolute -right-8 top-8 h-40 w-40 rounded-full bg-[#e30613]/10 blur-3xl"/><div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-orange-300/20 blur-3xl"/><div className="relative z-10 px-6 py-12 text-center sm:px-12 sm:py-14"><div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/90 px-4 py-1.5 text-xs font-bold text-orange-600 shadow-sm"><ShieldCheck size={13}/> Admin · คลังข้อสอบ O-net</div><h1 className="mt-5 text-4xl font-black tracking-tight text-ink sm:text-5xl">สร้างและจัดการ<br className="sm:hidden"/><span className="text-[#e30613]"> ชุดกิจกรรม</span> สำหรับผู้เรียน</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">เลือกชุดข้อสอบ ตรวจตัวอย่าง แล้ว Export เป็นแพ็กเกจหน้าผู้ใช้ได้ทันที</p><div className="mx-auto mt-8 flex max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_16px_40px_rgba(28,45,91,.08)] sm:flex-row"><div className="flex-1 px-5 py-5 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">ชุดกิจกรรม</p><p className="mt-1 text-3xl font-black tabular-nums text-[#e30613]">{sets.length}</p></div><div className="h-px bg-slate-200 sm:h-auto sm:w-px"/><div className="flex-1 px-5 py-5 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">คำถามทั้งหมด</p><p className="mt-1 text-3xl font-black tabular-nums text-ink">{questions.length.toLocaleString('th-TH')}</p></div><div className="h-px bg-slate-200 sm:h-auto sm:w-px"/><div className="flex-1 px-5 py-5 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">ระดับชั้น</p><p className="mt-1 text-3xl font-black tabular-nums text-ink">{[...new Set(sets.map(s=>s.level))].length}</p></div></div></div></section><div className="mx-auto mt-9 max-w-3xl"><div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-5 py-4 shadow-lg shadow-orange-100/50"><Search className="text-slate-400" size={21}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาหัวข้อ เช่น เซต, เลขยกกำลัง หรือสถิติ..." className="min-w-0 flex-1 bg-transparent text-sm outline-none"/><span className="hidden rounded bg-slate-50 px-2 py-1 text-xs text-slate-400 sm:block">ค้นหา</span></div><div className="mt-4 space-y-4 rounded-2xl border border-orange-100/80 bg-white px-4 py-4 shadow-sm sm:px-5"><div><div className="mb-2 flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">วิชา</p>{subject!=='ทั้งหมด'&&<button type="button" onClick={()=>setSubject('ทั้งหมด')} className="text-[10px] font-bold text-orange-600 hover:underline">ล้างวิชา</button>}</div><div className="flex flex-wrap gap-1.5" role="group" aria-label="กรองตามวิชา">{subjectFilters.map(s=><button type="button" key={s} onClick={()=>setSubject(s)} className={filterChip(subject===s)}>{s}</button>)}</div></div><div className="border-t border-slate-100 pt-4"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">ระดับชั้น</p>{level!=='ทั้งหมด'&&<button type="button" onClick={()=>setLevel('ทั้งหมด')} className="text-[10px] font-bold text-orange-600 hover:underline">ล้างระดับ</button>}</div><div className="flex flex-wrap gap-1.5"><button type="button" onClick={()=>setLevel('ทั้งหมด')} className={filterChip(level==='ทั้งหมด')}>ทั้งหมด</button></div><div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">{levelGroups.map(group=><div key={group.label} className="rounded-xl bg-slate-50/80 px-2.5 py-2"><p className="mb-1.5 text-[10px] font-bold text-slate-400">{group.label}</p><div className="flex flex-wrap gap-1.5" role="group" aria-label={`ระดับชั้น${group.label}`}>{group.items.map(l=><button type="button" key={l} onClick={()=>setLevel(l)} className={filterChip(level===l)}>{l}</button>)}</div></div>)}</div></div></div></div><div className="mt-14 flex flex-wrap items-end justify-between gap-3"><div><Pill tone="orange">แนะนำสำหรับคุณ</Pill><h2 className="mt-2 text-2xl font-black text-ink">เลือกชุดข้อสอบที่สนใจ</h2><p className="mt-1 text-sm text-muted">เลือกบทเรียน แล้วเริ่มฝึกทักษะได้ทันที</p></div><Pill tone="neutral"><Filter size={12}/> {homeSets.length} รายการ</Pill></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{homeSets.map(s=><div key={s.id} role="button" tabIndex={0} onClick={()=>selectSet(s.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectSet(s.id)}}} className="group cursor-pointer overflow-hidden rounded-3xl border bg-white text-left shadow-soft transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"><div className="relative aspect-video overflow-hidden bg-slate-100"><img src={getSetCover(s,categories)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"/><div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><Pill tone="orange">{s.level}</Pill><Pill>{normalizeHomeSubject(s.subject)}</Pill><Pill>{getCategoryLabel(s,categories)}</Pill></div></div><div className="p-5"><h3 className="text-xl font-bold text-ink">{s.title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{s.description}</p><div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted"><span>{s.count} ข้อ · {s.time} นาที</span><div className="flex items-center gap-2"><button type="button" onClick={e=>{e.stopPropagation();handleExport(s.id)}} className="rounded-lg border border-indigo-100 bg-indigo-50 p-1.5 text-brand transition hover:bg-brand hover:text-white disabled:opacity-50" aria-label={`Export ชุด ${s.title}`} title="Export ไปโฟลเดอร์ public"><Download size={14}/></button><span className="flex items-center gap-1 font-bold text-brand">ตัวอย่าง <ArrowRight size={14}/></span></div></div></div></div>)}</div></>}
{route==='activity'&&<div className="activity-stage"><div className="activity-stage-cover"><img src={getSetCover(set,categories)} alt=""/></div><div className="activity-stage-body"><span className="activity-stage-badge"><Sparkles size={15} className="text-orange-500 shrink-0"/> {getCategoryLabel(set,categories)} · {set.level}</span><h1 className="activity-stage-title">{set.title}</h1><div className="activity-stage-meter"><div className="meter-cell"><p className="meter-label">ข้อสอบ</p><p className="meter-value meter-red">{examQuestions.length||set.count}<span className="meter-unit">ข้อ</span></p></div><div className="meter-divider"/><div className="meter-cell"><p className="meter-label">เวลา</p><p className="meter-value">{set.time}<span className="meter-unit">นาที</span></p></div><div className="meter-divider"/><div className="meter-cell"><p className="meter-label">ระดับ</p><p className="meter-value">{set.level}</p></div></div><button type="button" onClick={()=>begin('practice')} className="activity-stage-cta">เริ่ม <ArrowRight size={18}/></button></div></div>}
{route==='exam'&&<div className="mx-auto max-w-6xl">{paused&&!finished&&<ExamPauseOverlay usedSeconds={seconds} onResume={()=>setPaused(false)}/>}<div className="mb-6 flex flex-wrap items-center justify-between gap-3"><button onClick={()=>go('activity',set.id)} className="flex items-center gap-2 text-sm font-semibold text-muted"><ArrowLeft size={16}/> กลับหน้ากิจกรรม</button><div className="flex items-center gap-2"><Pill tone={mode==='practice'?'green':'purple'}>{mode==='practice'?'โหมดฝึก':'โหมดจำลองสอบ'}</Pill><span className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold"><Clock size={16} className="text-brand"/>{`${String(Math.max(0,Math.floor((Math.max(1,set.time||15)*60-seconds)/60))).padStart(2,'0')}:${String(Math.max(0,(Math.max(1,set.time||15)*60-seconds)%60)).padStart(2,'0')}`}</span><button onClick={()=>setPaused(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-slate-50 hover:text-brand hover:shadow-[0_6px_16px_rgba(85,84,232,.14)]" aria-label="พักเวลา" title="พักเวลา"><Pause size={17}/></button></div></div><div className="grid gap-6 lg:grid-cols-[230px_1fr]"><aside className="h-fit self-start rounded-3xl border bg-white p-5 shadow-soft lg:sticky lg:top-24 lg:z-10 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"><div className="flex justify-between text-sm font-black"><span>แผนที่ข้อสอบ</span><span className="text-muted">{index+1}/{examQuestions.length}</span></div><p className="mt-1 text-xs text-muted">เลือกหมายเลขเพื่อข้ามไปยังข้อนั้น</p><div className="mt-5 flex flex-wrap gap-2">{examQuestions.map((item,i)=><button key={item.id} onClick={()=>setIndex(i)} className={cls('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold',index===i?'border-2 border-orange-400 bg-orange-50 text-orange-600':answers[item.id]!==undefined?'bg-emerald-50 text-emerald-600':'bg-slate-50 text-slate-400')}>{i+1}</button>)}</div><div className="mt-5 space-y-2 border-t pt-4 text-xs text-muted"><p>ตอบแล้ว {Object.keys(answers).length} ข้อ</p><p>ยังไม่ตอบ {examQuestions.length-Object.keys(answers).length} ข้อ</p></div></aside><div>{q?<><ExamQuestionBody q={q} index={index} total={examQuestions.length} answer={answers[q.id]} revealed={mode==='practice'&&revealed.includes(q.id)} finished={finished} practice={mode==='practice'} onChoose={chooseAnswer}/><div className="mt-5 flex flex-wrap justify-end gap-3">{index>0&&<button onClick={()=>setIndex(index-1)} className="rounded-full border px-6 py-3 text-sm font-bold">ข้อก่อนหน้า</button>}{index<examQuestions.length-1&&<button onClick={()=>setIndex(index+1)} className="flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-bold text-white">ข้อถัดไป <ChevronRight size={16}/></button>}{examQuestions.length>0&&examQuestions.every(item=>answers[item.id]!==undefined)&&<button onClick={finishExam} className="flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white">ส่งข้อสอบ <Check size={16}/></button>}</div></>:<div className="rounded-2xl border bg-white p-10 text-center">ยังไม่มีโจทย์สำหรับชุดนี้ ลองเพิ่มโจทย์ผ่าน Backoffice <button onClick={()=>go('admin')} className="font-bold text-brand underline">ไปหน้า Admin</button></div>}</div></div></div>}
{route==='report'&&set.id>0&&<Report attempts={attempts.filter(a=>a.setId===set.id)} questions={questions} sets={sets} set={set} onRetry={(m)=>begin(m)} go={go}/>}
{route==='admin'&&<AdminWorkspace sets={sets} setSets={setSets} questions={questions} setQuestions={setQuestions} categories={categories} setCategories={setCategories} onSavedToLibrary={()=>go('home')}/>}</main>{route!=='activity'&&<footer className="border-t bg-white py-7 text-center text-xs text-muted">© 2026 Aksorn Education All Rights Reserved</footer>}<nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around gap-1 border-t border-slate-200 bg-white/92 px-2 py-1.5 shadow-[0_-8px_28px_rgba(15,23,42,.07)] backdrop-blur-md lg:hidden" style={{paddingBottom:'calc(0.4rem + env(safe-area-inset-bottom, 0px))'}}>{nav.map((n,i)=>{const tones=[{ico:'text-[#f59d24] bg-[rgba(245,157,36,.12)]',active:'bg-[rgba(245,157,36,.14)] text-[#b45309]',glow:'shadow-[0_3px_10px_rgba(245,157,36,.28)]'},{ico:'text-[#ee7326] bg-[rgba(238,115,38,.12)]',active:'bg-[rgba(238,115,38,.14)] text-[#c2410c]',glow:'shadow-[0_3px_10px_rgba(238,115,38,.28)]'},{ico:'text-[#e30613] bg-[rgba(227,6,19,.1)]',active:'bg-[rgba(227,6,19,.12)] text-[#ae0f0a]',glow:'shadow-[0_3px_10px_rgba(227,6,19,.28)]'},{ico:'text-[#ee7326] bg-[rgba(238,115,38,.12)]',active:'bg-[rgba(238,115,38,.14)] text-[#c2410c]',glow:'shadow-[0_3px_10px_rgba(238,115,38,.28)]'},{ico:'text-[#ae0f0a] bg-[rgba(174,15,10,.1)]',active:'bg-[rgba(174,15,10,.12)] text-[#ae0f0a]',glow:'shadow-[0_3px_10px_rgba(174,15,10,.28)]'}] as const;const tone=tones[i%tones.length];const on=route===n.id;return <button key={n.id} onClick={()=>go(n.id,(n.id==='activity'||n.id==='exam'||n.id==='report')&&set.id?set.id:undefined)} className={cls('flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[14px] px-1 py-2 text-[10px] font-bold tracking-wide transition',on?tone.active:'text-slate-400 hover:bg-slate-50')}><span className={cls('grid h-8 w-8 place-items-center rounded-[11px] transition',on?cls('bg-white -translate-y-px',tone.glow,tone.ico.split(' ')[0]):tone.ico)}><n.icon size={18}/></span><span>{n.label}</span></button>})}</nav></div>}
function Report({attempts,questions,sets,set,onRetry,go}:{attempts:Attempt[];questions:Question[];sets:ExamSet[];set:ExamSet;onRetry:(m:Mode)=>void;go:(to:Route,id?:number)=>void}){
  const [pdfBusy,setPdfBusy]=useState(false);
  const setQuestions=getOrderedSetQuestions(set,questions,sets);
  const latest=attempts[0];
  const skillsInSet=new Set(setQuestions.flatMap(q=>getQuestionSkills(q)));
  const skillList=[...SKILL_OPTIONS.filter(s=>skillsInSet.has(s)),...[...skillsInSet].filter(s=>!(SKILL_OPTIONS as readonly string[]).includes(s))];
  const axisSkills=skillList.length?skillList:[...SKILL_OPTIONS];
  const answerPool=latest?[latest]:attempts;
  const totals=axisSkills.map(skill=>{
    const qs=setQuestions.filter(q=>getQuestionSkills(q).includes(skill));
    let correct=0,count=0;
    for(const a of answerPool){
      for(const q of qs){
        if(a.answers[q.id]===undefined)continue;
        count++;
        if(a.answers[q.id]===q.correct)correct++;
      }
    }
    return{skill,percent:count?Math.round(correct/count*100):0,count,correct,questionCount:qs.length};
  });
  const radar=totals.map(t=>({name:t.skill.length>10?t.skill.slice(0,10)+'…':t.skill,score:t.percent,fullMark:100}));
  // Always from the current/latest attempt of this set only (cleared on each new begin)
  const totalCount=latest?latest.total:0;
  const totalCorrect=latest?latest.correct:0;
  const latestPct=latest&&latest.total?Math.round(latest.correct/latest.total*100):0;
  const reviewQs=latest?setQuestions.filter(q=>latest.answers[q.id]!==undefined):[];
  async function handleExportPdf(){
    if(pdfBusy)return;
    setPdfBusy(true);
    try{
      await exportReportPdf({set,totalCount,totalCorrect,totals,latest,latestPct,reviewQs});
    }catch(e){
      console.error(e);
      alert('ส่งออก PDF ไม่สำเร็จ กรุณาลองใหม่');
    }finally{
      setPdfBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Pill tone="purple"><Activity size={13}/> Learning analytics</Pill>
          <h1 className="mt-3 text-3xl font-black text-ink">รายงานผล · {set.title}</h1>
          <p className="mt-2 text-sm text-muted">อ้างอิงรอบล่าสุดของชุดนี้เท่านั้น · เริ่มทำใหม่แล้วค่าจะเคลียร์</p>
        </div>
        <button type="button" disabled={pdfBusy} onClick={handleExportPdf} className="inline-flex items-center gap-2 rounded-xl bg-[#e30613] px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-[#c40510] disabled:opacity-60">
          <FileDown size={16}/>{pdfBusy?'กำลังสร้าง PDF…':'ส่งออก PDF'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[['จำนวนข้อ',(latest?totalCount:setQuestions.length)+' ข้อ'],['ตอบถูก',latest?totalCorrect+' ข้อ':'–'],['ความแม่นยำ',totalCount?Math.round(totalCorrect/totalCount*100)+'%':'–']].map(([name,value])=>
          <div key={name} className="rounded-2xl border bg-white p-5 shadow-soft">
            <p className="text-xs text-muted">{name}</p>
            <p className="mt-3 text-2xl font-black text-ink sm:text-3xl">{value}</p>
          </div>
        )}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-3xl border bg-white p-5 shadow-soft sm:p-7">
          <h2 className="text-lg font-black">📊 จุดแข็ง–จุดอ่อนรายสาระ</h2>
          <p className="mt-1 text-xs text-muted">ยิ่งพื้นที่กว้าง ยิ่งแม่นยำขึ้น · คะแนนจากโจทย์ที่ทำแล้ว</p>
          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%"><RadarChart data={radar} outerRadius="65%"><PolarGrid stroke="#e4e8f4"/><PolarAngleAxis dataKey="name" tick={{fontSize:10,fill:'#64748b'}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={false} axisLine={false}/><Radar dataKey="score" stroke="#6665f0" fill="#7776f5" fillOpacity={0.25}/><Tooltip formatter={(v:number)=>[`${v}%`,'ความแม่นยำ']}/></RadarChart></ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-orange-500">💡 ควรฝึกทักษะที่มีความแม่นยำต่ำก่อน</p>
        </section>
        <section className="rounded-3xl border bg-white p-5 shadow-soft sm:p-7">
          <h2 className="text-lg font-black">🧠 ทักษะที่ควรพัฒนา</h2>
          <p className="mt-1 text-xs text-muted">เปอร์เซ็นต์ถูกต้องแยกตามทักษะ</p>
          <div className="mt-6 space-y-6">
            {[...totals].sort((a,b)=>a.percent-b.percent||a.skill.localeCompare(b.skill,'th')).map(t=>
              <div key={t.skill}>
                <div className="flex justify-between gap-2 text-sm font-bold"><span>{t.skill}</span><span className={t.count===0?'text-slate-400':t.percent>=70?'text-emerald-600':t.percent>=50?'text-orange-500':'text-rose-500'}>{t.count===0?'–':t.percent+'%'}</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div style={{width:(t.count?t.percent:0)+'%'}} className={cls('h-full rounded-full',t.percent>=70?'bg-emerald-400':t.percent>=50?'bg-orange-400':'bg-rose-400')}/></div>
                <p className="mt-1 text-xs text-muted">ตอบถูก {t.correct}/{t.count} ข้อ · ในชุดมี {t.questionCount} ข้อ</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-[32px] border bg-white p-6 shadow-soft sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Pill tone="green"><Trophy size={13}/> สรุปผลการทำข้อสอบ</Pill>
            <h2 className="mt-3 text-2xl font-black text-ink">รายละเอียดรอบล่าสุด</h2>
            <p className="mt-1 text-sm text-muted">{set.title}{latest?` · ${latest.mode==='practice'?'โหมดฝึก':'โหมดจำลองสอบ'}`:''}</p>
          </div>
          {latest&&(
            <div className="text-right">
              <p className="text-5xl font-black text-brand">{latestPct}%</p>
              <p className="mt-1 text-sm text-slate-500">ตอบถูก {latest.correct} จาก {latest.total} ข้อ</p>
            </div>
          )}
        </div>
        {!latest?(
          <p className="mt-8 text-sm text-muted">ยังไม่มีผลการทำข้อสอบของชุดนี้ — ไปทำแบบฝึกแล้วกลับมาดูรายละเอียดที่นี่</p>
        ):(
          <>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={()=>onRetry(latest.mode)} className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white">ทำอีกครั้ง</button>
              <button onClick={()=>go('activity',set.id)} className="rounded-xl border px-5 py-3 text-sm font-bold">กลับหน้ากิจกรรม</button>
            </div>
            <div className="mt-10 border-t pt-6 text-left">
              <h3 className="mb-1 text-lg font-black">ทบทวนคำตอบ</h3>
              <p className="mb-4 text-xs text-muted">ดูดีเทลทีละข้อจากรอบล่าสุด</p>
              {reviewQs.map((item,i)=>{
                const choice=latest.answers[item.id];
                const ok=choice===item.correct;
                return (
                  <div key={item.id} className="border-t py-4 text-sm">
                    <div className="flex gap-2">
                      <span className={ok?'shrink-0 font-bold text-emerald-600':'shrink-0 font-bold text-rose-500'}>{ok?'✓':'✗'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">ข้อ {i+1}</p>
                        <MathText text={item.prompt} className="mt-1 text-sm text-slate-700" as="div"/>
                        <p className="mt-2 text-xs text-slate-500">
                          คำตอบของคุณ: <MathText text={item.options[choice]??'–'} className="inline"/>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          เฉลย: <MathText text={item.options[item.correct]} className="inline"/> — <MathText text={item.explanation} className="inline"/>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
