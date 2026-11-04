/** Shared CSS for exported user packages — mirrors Admin theme */
export const exportStyles = `@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box}html,body{margin:0;padding:0}
:root{color-scheme:light;--ink:#17233c;--muted:#8190ac;--brand:#5554e8;--orange:#ff9626;--soft:0 10px 35px rgba(28,45,91,.07)}
body{font-family:'Prompt',system-ui,sans-serif;color:var(--ink);background-color:#fbfcff;background-image:radial-gradient(#e3e9f3 .65px,transparent .65px);background-size:9px 9px;min-height:100vh}
button{font-family:inherit;cursor:pointer;border:none;background:none}button:disabled{cursor:not-allowed;opacity:.4}
a{color:inherit;text-decoration:none}
.wrap{display:flex;flex-direction:column;min-height:100vh}
.header{position:sticky;top:0;z-index:40;border-bottom:1px solid #f1f5f9;background:rgba(255,255,255,.95);backdrop-filter:blur(8px)}
.header-inner{margin:0 auto;display:flex;height:80px;max-width:80rem;align-items:center;justify-content:space-between;gap:1rem;padding:0 1rem}
@media(min-width:640px){.header-inner{padding:0 1.5rem}}
.brand{display:flex;align-items:center;gap:.75rem;text-align:left;color:inherit}
.brand-logo{display:grid;height:44px;width:44px;place-items:center;overflow:hidden;border-radius:12px;background:#fff}
.brand-logo img{height:44px;width:44px;object-fit:contain}
.brand strong{display:block;font-size:1.125rem;letter-spacing:-.025em;color:var(--ink)}
.brand .sub{display:block;font-size:10px;font-weight:700;letter-spacing:.05em;color:#94a3b8}
.nav{display:none;align-items:center;gap:.25rem}
@media(min-width:1024px){.nav{display:flex}}
.nav a,.nav button{display:flex;align-items:center;gap:.5rem;border-radius:9999px;padding:.625rem 1rem;font-size:.875rem;font-weight:600;color:#475569;transition:background .15s}
.nav a:hover,.nav button:hover{background:#f8fafc}
.nav a.active,.nav button.active{background:#eef2ff;color:var(--brand)}
.pill{display:inline-flex;align-items:center;gap:.25rem;border-radius:9999px;padding:.25rem .75rem;font-size:.75rem;font-weight:700}
.pill-neutral{background:#f1f5f9;color:#475569}
.pill-purple{background:#eef2ff;color:#4f46e5}
.pill-orange{background:#fff7ed;color:#ea580c}
.pill-green{background:#ecfdf5;color:#047857}
.main{margin:0 auto;width:100%;max-width:80rem;flex:1;padding:2rem 1rem 7rem}
@media(min-width:640px){.main{padding:3rem 1.5rem 7rem}}
.main--bleed{max-width:none;padding:0;display:flex;flex-direction:column}
.footer{border-top:1px solid #e2e8f0;background:#fff;padding:1.75rem;text-align:center;font-size:.75rem;color:var(--muted)}
.icon{display:block;width:1.15rem;height:1.15rem;flex-shrink:0}
.icon-sm{width:1rem;height:1rem}
.icon-lg{width:1.5rem;height:1.5rem}
.status-dot{width:6px;height:6px;border-radius:9999px;background:#10b981;display:inline-block}
.btn-icon{display:inline-flex;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;padding:0;border-radius:12px;border:1px solid #e2e8f0;background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(15,23,42,.05);transition:background .15s,border-color .15s,color .15s,box-shadow .15s,transform .15s}
.btn-icon:hover{background:#f8fafc;border-color:#c7d2fe;color:var(--brand);box-shadow:0 6px 16px rgba(85,84,232,.14);transform:translateY(-1px)}
.btn-icon:active{transform:none}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:40;display:flex;justify-content:space-around;gap:.25rem;border-top:1px solid #e2e8f0;background:rgba(255,255,255,.92);padding:.4rem .55rem calc(.4rem + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 28px rgba(15,23,42,.07);backdrop-filter:blur(12px)}
@media(min-width:1024px){.bottom-nav{display:none}}
.bottom-nav a{display:flex;min-width:0;flex:1;flex-direction:column;align-items:center;gap:.3rem;border-radius:14px;padding:.55rem .2rem;font-size:10px;font-weight:700;letter-spacing:.01em;color:#94a3b8;transition:background .15s,color .15s,transform .15s}
.bottom-nav a .nav-ico{display:grid;place-items:center;width:2.05rem;height:2.05rem;border-radius:11px;color:inherit;background:transparent;transition:background .15s,box-shadow .15s,color .15s,transform .15s}
.bottom-nav a:hover{background:#f8fafc}
.bottom-nav a.nav-tone-gold .nav-ico{color:#f59d24;background:rgba(245,157,36,.12)}
.bottom-nav a.nav-tone-orange .nav-ico{color:#ee7326;background:rgba(238,115,38,.12)}
.bottom-nav a.nav-tone-red .nav-ico{color:#e30613;background:rgba(227,6,19,.1)}
.bottom-nav a.nav-tone-gold:hover{color:#d97706}
.bottom-nav a.nav-tone-orange:hover{color:#ea580c}
.bottom-nav a.nav-tone-red:hover{color:#c40510}
.bottom-nav a.active{color:inherit}
.bottom-nav a.nav-tone-gold.active{background:rgba(245,157,36,.14);color:#b45309}
.bottom-nav a.nav-tone-orange.active{background:rgba(238,115,38,.14);color:#c2410c}
.bottom-nav a.nav-tone-red.active{background:rgba(227,6,19,.12);color:#ae0f0a}
.bottom-nav a.active .nav-ico{background:#fff;box-shadow:0 3px 10px rgba(15,23,42,.1);transform:translateY(-1px)}
.bottom-nav a.nav-tone-gold.active .nav-ico{color:#f59d24;box-shadow:0 3px 10px rgba(245,157,36,.28)}
.bottom-nav a.nav-tone-orange.active .nav-ico{color:#ee7326;box-shadow:0 3px 10px rgba(238,115,38,.28)}
.bottom-nav a.nav-tone-red.active .nav-ico{color:#e30613;box-shadow:0 3px 10px rgba(227,6,19,.28)}
.card{border:1px solid #e2e8f0;border-radius:1.5rem;background:#fff;box-shadow:var(--soft)}
.rounded-3xl{border-radius:1.5rem}.rounded-2xl{border-radius:1rem}.rounded-xl{border-radius:12px}.rounded-full{border-radius:9999px}
.text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}
.text-ink{color:var(--ink)}.text-muted{color:var(--muted)}.text-brand{color:var(--brand)}.text-orange{color:#f97316}.text-emerald{color:#059669}.text-rose{color:#e11d48}
.font-black{font-weight:900}.font-bold{font-weight:700}.font-semibold{font-weight:600}
.text-xs{font-size:.75rem}.text-sm{font-size:.875rem}.text-lg{font-size:1.125rem}.text-xl{font-size:1.25rem}.text-2xl{font-size:1.5rem}.text-3xl{font-size:1.875rem}.text-4xl{font-size:2.25rem}.text-6xl{font-size:3.75rem}
.mt-1{margin-top:.25rem}.mt-2{margin-top:.5rem}.mt-3{margin-top:.75rem}.mt-4{margin-top:1rem}.mt-5{margin-top:1.25rem}.mt-6{margin-top:1.5rem}.mt-7{margin-top:1.75rem}.mt-8{margin-top:2rem}.mt-9{margin-top:2.25rem}
.mb-3{margin-top:0;margin-bottom:.75rem}.mb-6{margin-bottom:1.5rem}.mb-7{margin-bottom:1.75rem}.mb-8{margin-bottom:2rem}
.p-4{padding:1rem}.p-5{padding:1.25rem}.p-6{padding:1.5rem}.p-7{padding:1.75rem}.p-9{padding:2.25rem}.p-10{padding:2.5rem}
.px-4{padding-left:1rem;padding-right:1rem}.px-5{padding-left:1.25rem;padding-right:1.25rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.px-7{padding-left:1.75rem;padding-right:1.75rem}
.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-3{padding-top:.75rem;padding-bottom:.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}.py-5{padding-top:1.25rem;padding-bottom:1.25rem}
.flex{display:flex}.grid{display:grid}.hidden{display:none}.inline-flex{display:inline-flex}
.items-center{align-items:center}.items-start{align-items:flex-start}.justify-between{justify-content:space-between}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}
.flex-wrap{flex-wrap:wrap}.gap-1{gap:.25rem}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-5{gap:1.25rem}.gap-6{gap:1.5rem}
.shrink-0{flex-shrink:0}.min-w-0{min-width:0}.w-full{width:100%}.h-fit{height:fit-content}
.border{border:1px solid #e2e8f0}.border-t{border-top:1px solid #e2e8f0}.border-b{border-bottom:1px solid #e2e8f0}
.border-emerald{border-color:#d1fae5}.border-indigo{border-color:#e0e7ff}.border-orange{border-color:#fed7aa}.border-brand{border-color:var(--brand)}.border-rose{border-color:#fda4af}.border-2{border-width:2px}
.bg-white{background:#fff}.bg-slate-50{background:#f8fafc}.bg-emerald-50{background:#ecfdf5}.bg-indigo-50{background:#eef2ff}.bg-orange-50{background:#fff7ed}.bg-rose-50{background:#fff1f2}.bg-ink{background:var(--ink)}.bg-brand{background:var(--brand)}.bg-emerald{background:#10b981}.text-white{color:#fff}
.shadow-soft{box-shadow:var(--soft)}
.mx-auto{margin-left:auto;margin-right:auto}.max-w-2xl{max-width:42rem}.max-w-3xl{max-width:48rem}.max-w-6xl{max-width:72rem}
.leading-6{line-height:1.5}.leading-7{line-height:1.75}.leading-9{line-height:2.25}
.space-y-2>*+*{margin-top:.5rem}.space-y-3>*+*{margin-top:.75rem}.space-y-6>*+*{margin-top:1.5rem}
.overflow-hidden{overflow:hidden}
.place{display:grid;place-items:center}
.icon-box{display:grid;height:56px;width:56px;place-items:center;border-radius:1rem;color:#fff}
.icon-box.sm{height:36px;width:36px;border-radius:9999px;border:1px solid #ffedd5;background:#fff;color:#f97316;font-weight:700}
.icon-emerald{background:#10b981;box-shadow:0 10px 25px rgba(16,185,129,.2)}
.icon-brand{background:linear-gradient(to bottom right,#818cf8,var(--brand));box-shadow:0 10px 25px rgba(85,84,232,.25)}
.mode-card{display:block;width:100%;border:1px solid;border-radius:1.5rem;padding:1.75rem;text-align:left;box-shadow:var(--soft);transition:transform .15s,box-shadow .15s;color:inherit}
.mode-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(28,45,91,.12)}
.mode-practice{border-color:#d1fae5;background:linear-gradient(to bottom right,#ecfdf5,#fff)}
.mode-sim{border-color:#e0e7ff;background:linear-gradient(to bottom right,#eef2ff,#fff)}
.goals{border:1px solid #fed7aa;border-radius:1.5rem;background:linear-gradient(to right,#fffbeb,#fff7ed);padding:1.5rem}
.grid-2{display:grid;gap:1rem}
@media(min-width:640px){.grid-2{grid-template-columns:1fr 1fr}.sm\\:p-7{padding:1.75rem}.sm\\:p-8{padding:2rem}.sm\\:p-9{padding:2.25rem}.sm\\:p-12{padding:3rem}.sm\\:text-xl{font-size:1.25rem}.sm\\:px-8{padding-left:2rem;padding-right:2rem}}
.exam-layout{display:grid;gap:1.5rem}
.report-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}
.report-grid{display:grid;gap:1.25rem}
.exam-map-sticky{align-self:start}
.self-start{align-self:start}
@media(min-width:1024px){
  .exam-layout{display:grid;grid-template-columns:230px 1fr;gap:1.5rem}
  .report-grid{grid-template-columns:1.1fr 1fr}
  .exam-map-sticky{position:sticky;top:6rem;z-index:10;max-height:calc(100vh - 7rem);overflow-y:auto}
}
.text-5xl{font-size:3rem}
.map-btns{display:flex;flex-wrap:wrap;gap:.5rem}
.map-btn{display:grid;height:40px;width:40px;flex-shrink:0;place-items:center;border-radius:12px;font-size:.75rem;font-weight:700;background:#f8fafc;color:#94a3b8}
.map-btn.current{border:2px solid #fb923c;background:#fff7ed;color:#ea580c}
.map-btn.answered{background:#ecfdf5;color:#059669}
.q-video{margin-top:1rem;overflow:hidden;border:1px solid #e2e8f0;border-radius:1rem;background:#0f172a}
.q-video video{display:block;width:100%;max-height:360px;background:#000}
.q-video-embed{position:relative;aspect-ratio:16/9}
.q-video-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.q-media{margin-top:1rem;overflow:hidden;border:1px solid #e2e8f0;border-radius:1rem;background:#f8fafc;position:relative}
.q-media img{display:block;width:100%;object-fit:contain}
.q-media-prompt{margin-left:auto;margin-right:auto;max-width:42rem}
.q-media-prompt img{max-height:320px}
.q-media-option{margin-top:.5rem;max-width:220px;border-radius:.75rem}
.q-media-option img{max-height:7rem}
.q-media-explain{margin-top:.75rem;max-width:36rem;border-color:#e0e7ff}
.q-media-explain img{max-height:260px}
.q-explain-stack{display:flex;flex-direction:column;gap:.75rem;margin-top:.75rem;max-width:36rem}
.q-explain-stack .q-media{margin-top:0}
.q-nav{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:9999px;border:1px solid rgba(255,255,255,.7);background:rgba(255,255,255,.92);font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(15,23,42,.12)}
.q-nav-prev{left:.5rem}.q-nav-next{right:.5rem}
.q-carousel-count{position:absolute;left:50%;bottom:.5rem;transform:translateX(-50%);background:rgba(0,0,0,.55);color:#fff;border-radius:9999px;padding:.2rem .65rem;font-size:11px;font-weight:700}
.pause-overlay{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(15,23,42,.72);backdrop-filter:blur(2px)}
.pause-card{width:100%;max-width:24rem;border-radius:1.5rem;background:#fff;padding:2rem 1.5rem;text-align:center;box-shadow:0 24px 80px rgba(15,23,42,.28)}
.pause-icon{margin:0 auto;display:grid;place-items:center;width:3.5rem;height:3.5rem;border-radius:1rem;background:#fff7ed;color:#ea580c}
.pause-title{margin-top:1.25rem;font-size:1.25rem;font-weight:900;color:var(--ink)}
.pause-desc{margin-top:.75rem;font-size:.875rem;line-height:1.6;color:#64748b}
.pause-used{margin-top:1.25rem;font-size:.875rem;font-weight:700;color:var(--ink)}
.pause-resume{margin-top:1.5rem;width:100%;justify-content:center;background:#10b981;color:#fff;border:0;border-radius:1rem;padding:1rem 1.25rem;font-weight:700}
.pause-resume:hover{background:#059669}
.options-col{display:flex;flex-direction:column;gap:.75rem}
.opt{display:flex;min-height:64px;align-items:flex-start;gap:.75rem;border:1px solid #e2e8f0;border-radius:1rem;padding:1rem;text-align:left;font-size:.875rem;width:100%;background:#fff;transition:border .15s,background .15s}
.opt-body{display:flex;min-width:0;flex:1;flex-direction:column;font-weight:600;line-height:1.5}
.opt:hover{border-color:#c7d2fe;background:#f8fafc}
.opt.selected{border-color:var(--brand);background:#eef2ff;color:var(--brand)}
.opt.right{border-color:#34d399;background:#ecfdf5;color:#047857}
.opt.wrong{border-color:#fb7185;background:#fff1f2;color:#e11d48}
.opt-num{display:grid;height:32px;min-width:32px;padding:0 .5rem;flex-shrink:0;place-items:center;border-radius:9999px;border:1px solid #e2e8f0;font-size:.75rem;font-weight:700;color:var(--muted)}
.opt.selected .opt-num{border-color:var(--brand);background:var(--brand);color:#fff}
.opt.right .opt-num{background:#10b981;border-color:#10b981;color:#fff}
.opt.wrong .opt-num{background:#f43f5e;border-color:#f43f5e;color:#fff}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:9999px;padding:.75rem 1.5rem;font-size:.875rem;font-weight:700;transition:background .15s,transform .15s,box-shadow .15s}
.btn:hover{transform:translateY(-1px)}
.btn-dark{background:var(--ink);color:#fff}.btn-brand{background:var(--brand);color:#fff;box-shadow:0 8px 20px rgba(85,84,232,.25)}.btn-outline{border:1px solid #e2e8f0;background:#fff}.btn-orange{border:1px solid #fed7aa;color:#ea580c;background:#fff}
.toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:1.5rem}
.timer{display:inline-flex;align-items:center;gap:.45rem;border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:.55rem 1rem;font-size:.875rem;font-weight:700;box-shadow:0 1px 2px rgba(15,23,42,.04);font-variant-numeric:tabular-nums}
.back{display:inline-flex;align-items:center;gap:.4rem;font-size:.875rem;font-weight:600;color:var(--muted);transition:color .15s}
.back:hover{color:var(--brand)}
.explain{margin-top:1.75rem;border:1px solid #e0e7ff;border-radius:1rem;background:rgba(238,242,255,.6);padding:1.5rem}
.progress{height:8px;overflow:hidden;border-radius:9999px;background:#f1f5f9}
.progress>div{height:100%;border-radius:9999px}
.bar-green{background:#34d399}.bar-orange{background:#fb923c}.bar-rose{background:#fb7185}
.stat-card{border:1px solid #e2e8f0;border-radius:1rem;background:#fff;padding:1.25rem;box-shadow:var(--soft)}
.report-panel{border:1px solid #e2e8f0;border-radius:1.5rem;background:#fff;box-shadow:var(--soft)}
.report-summary{border:1px solid #e2e8f0;border-radius:32px;background:#fff;box-shadow:var(--soft)}
.report-radar{margin-top:.25rem;height:18rem;width:100%}
.report-radar svg{display:block;width:100%;height:100%;margin:0 auto}
.btn-soft{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:.75rem;padding:.75rem 1.25rem;font-size:.875rem;font-weight:700;transition:background .15s,opacity .15s}
.btn-soft-brand{background:var(--brand);color:#fff;border:0}
.btn-soft-brand:hover{filter:brightness(.95)}
.btn-soft-outline{border:1px solid #e2e8f0;background:#fff;color:var(--ink)}
.btn-soft-aksorn{background:#e30613;color:#fff;border:0;box-shadow:var(--soft)}
.btn-soft-aksorn:hover{background:#c40510}
.pill .icon{width:13px;height:13px}
.text-slate-400{color:#94a3b8}.text-slate-500{color:#64748b}.text-slate-700{color:#334155}.text-orange-500{color:#f97316}
.pt-6{padding-top:1.5rem}.mb-1{margin-bottom:.25rem}.mb-4{margin-bottom:1rem}.mt-8{margin-top:2rem}.mt-10{margin-top:2.5rem}
.text-right{text-align:right}.text-left{text-align:left}
@media(min-width:640px){.sm\\:text-3xl{font-size:1.875rem}.sm\\:p-10{padding:2.5rem}}
.q-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffedd5;background:rgba(255,247,237,.6);padding:1.25rem 1.5rem}
@media(min-width:640px){.q-head{padding:1.25rem 2rem}}
.summary{margin:0 auto;max-width:42rem;border:1px solid #e2e8f0;border-radius:32px;background:#fff;padding:1.75rem;text-align:center;box-shadow:var(--soft)}
@media(min-width:640px){.summary{padding:3rem}}
.summary-icon{margin:0 auto;display:grid;height:80px;width:80px;place-items:center;border-radius:9999px;background:#ecfdf5;color:#10b981;font-size:2.5rem}
.review{text-align:left;margin-top:2rem}.review-item{border-top:1px solid #e2e8f0;padding:1rem 0;font-size:.875rem}
.radar-wrap{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;padding:1rem 0}
.radar-item{flex:1;min-width:120px;max-width:160px;text-align:center}
.radar-ring{margin:0 auto;height:72px;width:72px;border-radius:9999px;border:6px solid #e0e7ff;display:grid;place-items:center;font-weight:900;color:var(--brand)}
@media print{
  .header,.footer,.bottom-nav,#export-pdf-btn,.btn-soft{display:none!important}
  .main{max-width:none;padding:0!important}
  .report-panel,.report-summary,.stat-card{box-shadow:none}
}
.link{font-weight:700;color:var(--brand);text-decoration:underline}
.activity-stage{position:relative;display:flex;width:100%;flex:1;min-height:calc(100dvh - 80px);overflow:hidden;background:#fff}
.activity-stage-cover{position:absolute;inset:0}
.activity-stage-cover img{height:100%;width:100%;object-fit:cover}
.activity-stage-body{position:relative;z-index:10;display:flex;width:100%;flex:1;min-height:calc(100dvh - 80px);flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:clamp(1.25rem,4vh,3rem) clamp(1rem,4vw,3rem) clamp(5.5rem,12vh,6.5rem);gap:clamp(1rem,2.8vh,2.25rem)}
@media(min-width:1024px){.activity-stage-body{padding-bottom:clamp(2rem,6vh,3.5rem)}}
.activity-stage-badge{display:inline-flex;align-items:center;gap:.5rem;border-radius:9999px;background:#fff;border:1px solid #ffedd5;color:#ea580c;font-weight:900;font-size:clamp(.8125rem,calc(1.1vw + .65rem),1.125rem);padding:clamp(.5rem,1.2vh,.75rem) clamp(1rem,2.5vw,1.5rem)}
.activity-stage-title{margin:0;font-weight:900;letter-spacing:-.025em;color:var(--ink);line-height:1.1;font-size:clamp(2.25rem,calc(4.5vw + 1.25rem),4.75rem);max-width:min(92vw,18ch)}
.activity-stage-meter{display:flex;width:100%;max-width:min(92vw,40rem);align-items:stretch;overflow:hidden;border-radius:1.25rem;border:1px solid #e2e8f0;background:rgba(255,255,255,.95);backdrop-filter:blur(8px);box-sizing:border-box}
.activity-stage-meter *,.activity-stage-meter *::before,.activity-stage-meter *::after{box-sizing:border-box}
.activity-stage-meter p{margin:0}
.activity-stage-meter .meter-cell{flex:1;min-width:0;padding:1.15rem 1.35rem;text-align:center}
@media(min-width:640px){.activity-stage-meter .meter-cell{padding:1.25rem 2rem}}
.activity-stage-meter .meter-divider{width:1px;align-self:stretch;background:rgba(226,232,240,.9)}
.activity-stage-meter .meter-label{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;line-height:1.2}
.activity-stage-meter .meter-value{margin-top:.3rem;font-size:2.25rem;font-weight:900;line-height:1;color:var(--ink);font-variant-numeric:tabular-nums}
.activity-stage-meter .meter-red{color:#e30613}
.activity-stage-meter .meter-unit{margin-left:.3rem;font-size:1rem;font-weight:700;color:#94a3b8}
.activity-stage-cta{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:9999px;background:#e30613;color:#fff;font-weight:700;border:0;cursor:pointer;font-size:clamp(1rem,calc(1.2vw + .75rem),1.25rem);padding:clamp(.85rem,1.8vh,1.15rem) clamp(2.25rem,5vw,3.5rem);box-shadow:0 14px 36px rgba(227,6,19,.4);transition:transform .15s,background .15s}
.activity-stage-cta:hover{background:#c40510;transform:translateY(-2px)}
.btn-aksorn{background:#e30613;color:#fff;padding:1rem 3rem;font-size:1rem;border-radius:9999px;box-shadow:0 14px 36px rgba(227,6,19,.4)}
.btn-aksorn:hover{background:#c40510}
.btn-light{background:#fff;color:var(--ink)}
.activity-goals{border:1px solid #ffedd5;border-radius:28px;padding:1.5rem;background:linear-gradient(to bottom right,#fffbeb,#fff,#fff7ed);box-shadow:var(--soft)}
@media(min-width:640px){.activity-goals{padding:2rem}}
.goal-item{display:flex;gap:.75rem;border:1px solid rgba(255,237,213,.8);border-radius:1rem;background:rgba(255,255,255,.9);padding:1rem;transition:border .15s,box-shadow .15s}
.goal-item:hover{border-color:#fed7aa;box-shadow:0 8px 20px rgba(28,45,91,.08)}
.goal-icon{display:grid;height:44px;width:44px;flex-shrink:0;place-items:center;border-radius:12px;background:#fff7ed;font-size:1.25rem}
`;
