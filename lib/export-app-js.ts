/** Vanilla JS runtime for exported user packages */
export function buildExportAppJs(): string {
  return `(function(){
'use strict';
var DATA = window.AKSORN_DATA;
if(!DATA){document.body.innerHTML='<p style="padding:2rem">ไม่พบข้อมูลข้อสอบ</p>';return;}
var SET = DATA.set;
var QUESTIONS = DATA.questions || [];
var STORAGE_KEY = 'aksorn-attempts-set-' + SET.id;
var page = document.body.getAttribute('data-page') || 'activity';

function $(sel,root){return (root||document).querySelector(sel);}
function $all(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtTime(sec){var m=Math.floor(sec/60),s=sec%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function loadAttempts(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}catch(e){return [];}}
function saveAttempts(list){localStorage.setItem(STORAGE_KEY,JSON.stringify(list));}
function qs(name){return new URLSearchParams(location.search).get(name);}
function go(href){location.href=href;}

function icon(name,cls){
  var c=cls||'icon';
  var paths={
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    file:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/><path d="M10 13h4"/><path d="M10 17h4"/><path d="M10 9h1"/>',
    chart:'<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    play:'<polygon points="6 3 20 12 6 21 6 3"/>',
    clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    back:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    coffee:'<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>'
  };
  return '<svg class="'+c+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||'')+'</svg>';
}

function headerHtml(active){
  return '<header class="header"><div class="header-inner">'
    +'<a class="brand" href="index.html"><span class="brand-logo"><img src="assets/Aksorn_Logo.svg" alt="Aksorn"/></span><span><strong>AKSORN</strong><span class="sub">ข้อสอบ O-net</span></span></a>'
    +'<nav class="nav">'
    +'<a href="index.html" class="'+(active==='activity'?'active':'')+'">'+icon('book','icon icon-sm')+'<span>เลือกกิจกรรม</span></a>'
    +'<a href="exam.html?mode=practice" class="'+(active==='exam'?'active':'')+'">'+icon('file','icon icon-sm')+'<span>ทำแบบฝึก</span></a>'
    +'<a href="report.html" class="'+(active==='report'?'active':'')+'">'+icon('chart','icon icon-sm')+'<span>รายงานผล</span></a>'
    +'</nav>'
    +'<span class="pill pill-green"><span class="status-dot"></span> User</span>'
    +'</div></header>';
}
function footerHtml(){
  return '<footer class="footer">© 2026 Aksorn Education All Rights Reserved</footer>'
    +'<nav class="bottom-nav">'
    +'<a href="index.html" class="nav-tone-gold'+(page==='activity'?' active':'')+'"><span class="nav-ico">'+icon('book','icon')+'</span><span>กิจกรรม</span></a>'
    +'<a href="exam.html?mode=practice" class="nav-tone-orange'+(page==='exam'?' active':'')+'"><span class="nav-ico">'+icon('file','icon')+'</span><span>ทำแบบฝึก</span></a>'
    +'<a href="report.html" class="nav-tone-red'+(page==='report'?' active':'')+'"><span class="nav-ico">'+icon('chart','icon')+'</span><span>รายงานผล</span></a>'
    +'</nav>';
}
function shell(active,inner,opts){
  opts=opts||{};
  var mainClass=opts.fullBleed?'main main--bleed':'main';
  var foot=opts.hideFooter?'':footerHtml();
  if(opts.hideFooter){
    foot='<nav class="bottom-nav">'
      +'<a href="index.html" class="nav-tone-gold'+(page==='activity'?' active':'')+'"><span class="nav-ico">'+icon('book','icon')+'</span><span>กิจกรรม</span></a>'
      +'<a href="exam.html?mode=practice" class="nav-tone-orange'+(page==='exam'?' active':'')+'"><span class="nav-ico">'+icon('file','icon')+'</span><span>ทำแบบฝึก</span></a>'
      +'<a href="report.html" class="nav-tone-red'+(page==='report'?' active':'')+'"><span class="nav-ico">'+icon('chart','icon')+'</span><span>รายงานผล</span></a>'
      +'</nav>';
  }
  document.getElementById('app').innerHTML='<div class="wrap">'+headerHtml(active)+'<main class="'+mainClass+'">'+inner+'</main>'+foot+'</div>';
}

/* ---------- Activity ---------- */
function renderActivity(){
  var cover=SET.cover||'';
  var html='<div class="activity-stage">'
    +(cover?'<div class="activity-stage-cover"><img src="'+esc(cover)+'" alt=""/></div>':'')
    +'<div class="activity-stage-body">'
    +'<span class="activity-stage-badge">✨ '+esc(SET.categoryLabel||'ข้อสอบ O-net')+' · '+esc(SET.level)+'</span>'
    +'<h1 class="activity-stage-title">'+esc(SET.title)+'</h1>'
    +'<div class="activity-stage-meter">'
    +'<div class="meter-cell"><p class="meter-label">ข้อสอบ</p><p class="meter-value meter-red">'+QUESTIONS.length+'<span class="meter-unit">ข้อ</span></p></div>'
    +'<div class="meter-divider"></div>'
    +'<div class="meter-cell"><p class="meter-label">เวลา</p><p class="meter-value">'+SET.time+'<span class="meter-unit">นาที</span></p></div>'
    +'<div class="meter-divider"></div>'
    +'<div class="meter-cell"><p class="meter-label">ระดับ</p><p class="meter-value">'+esc(SET.level)+'</p></div>'
    +'</div>'
    +'<button type="button" class="activity-stage-cta" id="start-exam">เริ่ม →</button>'
    +'</div></div>';
  shell('activity',html,{fullBleed:true,hideFooter:true});
  $('#start-exam').addEventListener('click',function(){saveAttempts([]);go('exam.html?mode=practice');});
}

/* ---------- Exam ---------- */
var state={mode:'practice',index:0,answers:{},revealed:[],finished:false,seconds:0,paused:false,timer:null};

function finishExam(){
  if(state.finished)return;
  clearInterval(state.timer);
  var correct=QUESTIONS.filter(function(q){return state.answers[q.id]===q.correct;}).length;
  saveAttempts([{id:String(Date.now()),setId:SET.id,mode:state.mode,date:new Date().toISOString(),answers:Object.assign({},state.answers),correct:correct,total:QUESTIONS.length,duration:state.seconds}]);
  state.finished=true;
  go('report.html');
}

function startTimer(){
  clearInterval(state.timer);
  state.timer=setInterval(function(){
    if(state.paused||state.finished)return;
    state.seconds++;
    var limit=Math.max(1,SET.time||15)*60;
    if(limit>0&&state.seconds>=limit){finishExam();return;}
    var el=$('#timer-display');
    if(el){
      el.textContent=fmtTime(Math.max(0,limit-state.seconds));
    }
  },1000);
}

function renderExam(){
  if(!QUESTIONS.length){
    shell('exam','<div class="card p-10 text-center">ยังไม่มีโจทย์ในชุดนี้ <a class="link" href="index.html">กลับหน้ากิจกรรม</a></div>');
    return;
  }
  var mode=qs('mode')==='simulation'?'simulation':'practice';
  if(state.mode!==mode&&!state.finished&&Object.keys(state.answers).length===0&&state.seconds===0){state.mode=mode;}
  if(!state._booted){state._booted=true;state.mode=mode;startTimer();}

  if(state.finished){go('report.html');return;}

  var q=QUESTIONS[state.index];
  var revealedNow=state.mode==='practice'&&state.revealed.indexOf(q.id)>=0;
  var clock=fmtTime(Math.max(0,Math.max(1,SET.time||15)*60-state.seconds));

  var map=QUESTIONS.map(function(item,i){
    var cls='map-btn';
    if(i===state.index)cls+=' current';
    else if(state.answers[item.id]!==undefined)cls+=' answered';
    return '<button type="button" class="'+cls+'" data-goto="'+i+'">'+(i+1)+'</button>';
  }).join('');

  function mediaImg(src,kind){
    if(!src)return '';
    return '<figure class="q-media q-media-'+kind+'"><img src="'+src+'" alt=""/></figure>';
  }
  function parseVideoUrl(raw){
    var url=String(raw||'').trim();
    if(!url)return null;
    var a=document.createElement('a');
    a.href=url;
    if(a.protocol!=='http:'&&a.protocol!=='https:')return null;
    var host=(a.hostname||'').replace(/^www\\./,'').toLowerCase();
    var path=a.pathname||'';
    if(host==='youtu.be'){
      var id=path.split('/').filter(Boolean)[0];
      if(id)return {kind:'youtube',src:'https://www.youtube.com/embed/'+id};
    }
    if(host==='youtube.com'||host==='m.youtube.com'||host==='youtube-nocookie.com'){
      var em=path.match(/^\\/embed\\/([^/?#]+)/);
      if(em&&em[1])return {kind:'youtube',src:'https://www.youtube.com/embed/'+em[1]};
      var sh=path.match(/^\\/shorts\\/([^/?#]+)/);
      if(sh&&sh[1])return {kind:'youtube',src:'https://www.youtube.com/embed/'+sh[1]};
      var qv=(a.search||'').match(/[?&]v=([^&]+)/);
      if(qv&&qv[1])return {kind:'youtube',src:'https://www.youtube.com/embed/'+decodeURIComponent(qv[1])};
    }
    if(host==='vimeo.com'||host==='player.vimeo.com'){
      var parts=path.split('/').filter(Boolean);
      var vid=parts[parts.length-1];
      if(vid&&/^\\d+$/.test(vid))return {kind:'vimeo',src:'https://player.vimeo.com/video/'+vid};
    }
    if(/\\.(mp4|webm|ogg)([?#]|$)/i.test(path+a.search))return {kind:'file',src:url};
    if(a.protocol==='https:')return {kind:'file',src:url};
    return null;
  }
  function promptVideo(url){
    var emb=parseVideoUrl(url);
    if(!emb)return '';
    if(emb.kind==='file'){
      return '<div class="q-video"><video src="'+esc(emb.src)+'" controls playsinline></video></div>';
    }
    return '<div class="q-video q-video-embed"><iframe src="'+esc(emb.src)+'" title="video" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>';
  }
  function promptGallery(imgs){
    if(!imgs||!imgs.length)return '';
    if(!state.promptImgIdx)state.promptImgIdx={};
    var idx=state.promptImgIdx[q.id]||0;
    if(idx>=imgs.length)idx=0;
    var html='<figure class="q-media q-media-prompt q-carousel"><img src="'+imgs[idx]+'" alt=""/>';
    if(imgs.length>1){
      html+='<button type="button" class="q-nav q-nav-prev" id="prompt-prev" aria-label="prev">&lt;</button>'
        +'<button type="button" class="q-nav q-nav-next" id="prompt-next" aria-label="next">&gt;</button>'
        +'<div class="q-carousel-count">'+(idx+1)+' / '+imgs.length+'</div>';
    }
    return html+'</figure>';
  }
  function explainGallery(imgs){
    if(!imgs||!imgs.length)return '';
    return '<div class="q-explain-stack">'+imgs.map(function(src){return mediaImg(src,'explain');}).join('')+'</div>';
  }
  var promptImgs=(q.promptImages&&q.promptImages.length)?q.promptImages:(q.promptImage?[q.promptImage]:[]);
  var explainImgs=(q.explanationImages&&q.explanationImages.length)?q.explanationImages:(q.explanationImage?[q.explanationImage]:[]);
  var opts=q.options.map(function(option,i){
    var answered=state.answers[q.id]===i;
    var right=revealedNow&&i===q.correct;
    var wrong=revealedNow&&answered&&i!==q.correct;
    var cls='opt';
    if(right)cls+=' right';else if(wrong)cls+=' wrong';else if(answered)cls+=' selected';
    var letter=String.fromCharCode(65+i);
    var mark=right?'✓':(wrong?'✗':letter+'.');
    var optImg=(q.optionImages&&q.optionImages[i])||'';
    var label=option||(optImg?'ดูภาพประกอบ':'ตัวเลือก '+letter);
    return '<button type="button" class="'+cls+'" data-opt="'+i+'"><span class="opt-num">'+mark+'</span><span class="opt-body"><span>'+esc(label)+'</span>'+mediaImg(optImg,'option')+'</span></button>';
  }).join('');

  var explain='';
  if(revealedNow){
    explain='<div class="explain"><div class="flex items-center gap-2 font-bold text-brand">✓ '+(state.answers[q.id]===q.correct?'ตอบถูกต้อง!':'เฉลยและแนวคิด')+'</div>'
      +'<p class="mt-3 text-sm font-bold">คำตอบที่ถูกต้อง: '+String.fromCharCode(65+q.correct)+(q.options[q.correct]?' — '+esc(q.options[q.correct]):'')+'</p>'
      +mediaImg((q.optionImages&&q.optionImages[q.correct])||'','option')
      +(q.explanation?'<p class="mt-3 text-sm leading-7" style="color:#475569">'+esc(q.explanation)+'</p>':'')
      +explainGallery(explainImgs)
      +'</div>';
  }

  var actions='';
  var allAnswered=QUESTIONS.length>0&&QUESTIONS.every(function(item){return state.answers[item.id]!==undefined;});
  if(state.index>0)actions+='<button type="button" class="btn btn-outline" id="prev-btn">ข้อก่อนหน้า</button>';
  if(state.index<QUESTIONS.length-1)actions+='<button type="button" class="btn btn-dark" id="next-btn">ข้อถัดไป →</button>';
  if(allAnswered)actions+='<button type="button" class="btn btn-brand" id="submit-btn">ส่งข้อสอบ ✓</button>';

  var usedM=Math.floor(state.seconds/60), usedS=state.seconds%60;
  var pauseModal=state.paused
    ? '<div class="pause-overlay" id="pause-overlay"><div class="pause-card">'
      +'<div class="pause-icon">'+icon('coffee','icon icon-lg')+'</div>'
      +'<h2 class="pause-title">พักสักครู่ก่อนนะ</h2>'
      +'<p class="pause-desc">เวลาหยุดแล้วนะ ไปห้องน้ำ ดื่มน้ำ<br/>หรือหาอะไรทานเล่นได้ตามสบาย</p>'
      +'<p class="pause-used">เวลาที่ใช้ไป '+usedM+':'+String(usedS).padStart(2,'0')+'</p>'
      +'<button type="button" class="btn pause-resume" id="resume-btn">'+icon('play','icon icon-sm')+' พร้อมแล้ว เล่นต่อ</button>'
      +'</div></div>'
    : '';

  var html='<div class="mx-auto max-w-6xl">'
    +'<div class="toolbar"><a class="back" href="index.html">'+icon('back','icon icon-sm')+' กลับหน้ากิจกรรม</a><div class="flex items-center gap-2">'
    +'<span class="pill '+(state.mode==='practice'?'pill-green':'pill-purple')+'">'+(state.mode==='practice'?'โหมดฝึก':'โหมดจำลองสอบ')+'</span>'
    +'<span class="timer">'+icon('clock','icon icon-sm text-brand')+'<span id="timer-display">'+clock+'</span></span>'
    +'<button type="button" class="btn-icon" id="pause-btn" aria-label="พักเวลา" title="พักเวลา">'+icon('pause','icon')+'</button>'
    +'</div></div>'
    +'<div class="exam-layout">'
    +'<aside class="card p-5 h-fit exam-map-sticky self-start"><div class="flex justify-between text-sm font-black"><span>แผนที่ข้อสอบ</span><span class="text-muted">'+(state.index+1)+'/'+QUESTIONS.length+'</span></div>'
    +'<p class="mt-1 text-xs text-muted">เลือกหมายเลขเพื่อข้ามไปยังข้อนั้น</p>'
    +'<div class="mt-5 map-btns">'+map+'</div>'
    +'<div class="mt-5 space-y-2 border-t" style="padding-top:1rem"><p class="text-xs text-muted">ตอบแล้ว '+Object.keys(state.answers).length+' ข้อ</p>'
    +'<p class="text-xs text-muted">ยังไม่ตอบ '+(QUESTIONS.length-Object.keys(state.answers).length)+' ข้อ</p></div></aside>'
    +'<div><div class="card overflow-hidden"><div class="q-head"><div class="flex items-center gap-3"><span class="icon-box sm">'+(state.index+1)+'</span>'
    +'<span class="text-xs font-semibold" style="color:#64748b">คำถามที่ '+(state.index+1)+' จาก '+QUESTIONS.length+'</span></div></div>'
    +'<div class="p-6 sm:p-9"><h2 class="text-lg font-bold leading-9 text-ink sm:text-xl">'+esc(q.prompt||(promptImgs.length||q.promptVideoUrl?'พิจารณาสื่อต่อไปนี้แล้วตอบคำถาม':''))+'</h2>'
    +promptGallery(promptImgs)
    +promptVideo(q.promptVideoUrl)
    +'<div class="mt-7 options-col">'+opts+'</div>'+explain+'</div></div>'
    +'<div class="mt-5 flex flex-wrap justify-end gap-3">'+actions+'</div>'
    +'</div></div></div>'+pauseModal;

  shell('exam',html);

  $all('[data-goto]').forEach(function(b){b.addEventListener('click',function(){state.index=Number(b.getAttribute('data-goto'));renderExam();});});
  $all('[data-opt]').forEach(function(b){b.addEventListener('click',function(){
    if(state.finished||state.paused)return;
    state.answers[q.id]=Number(b.getAttribute('data-opt'));
    renderExam();
  });});
  var pause=$('#pause-btn');if(pause)pause.addEventListener('click',function(){state.paused=true;renderExam();});
  var resume=$('#resume-btn');if(resume)resume.addEventListener('click',function(){state.paused=false;renderExam();});
  var pPrev=$('#prompt-prev');var pNext=$('#prompt-next');
  if(pPrev||pNext){
    if(!state.promptImgIdx)state.promptImgIdx={};
    var len=promptImgs.length||1;
    if(pPrev)pPrev.addEventListener('click',function(){state.promptImgIdx[q.id]=((state.promptImgIdx[q.id]||0)-1+len)%len;renderExam();});
    if(pNext)pNext.addEventListener('click',function(){state.promptImgIdx[q.id]=((state.promptImgIdx[q.id]||0)+1)%len;renderExam();});
  }
  var prev=$('#prev-btn');if(prev)prev.addEventListener('click',function(){state.index--;renderExam();});
  var next=$('#next-btn');if(next)next.addEventListener('click',function(){state.index++;renderExam();});
  var submit=$('#submit-btn');if(submit)submit.addEventListener('click',finishExam);
}

/* ---------- Report (match Demo platform) ---------- */
function polarPoint(cx,cy,r,angleDeg){
  var rad=((angleDeg-90)*Math.PI)/180;
  return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};
}
function buildRadarSvg(totals){
  var items=totals.slice();
  while(items.length<3)items.push({skill:'–',percent:0,count:0});
  var size=320,cx=size/2,cy=size/2,maxR=105,levels=5,step=360/items.length;
  var grids='',i,lv,r,pts,p;
  for(lv=1;lv<=levels;lv++){
    r=(maxR*lv)/levels;pts=[];
    for(i=0;i<items.length;i++){p=polarPoint(cx,cy,r,i*step);pts.push(p.x.toFixed(1)+','+p.y.toFixed(1));}
    grids+='<polygon points="'+pts.join(' ')+'" fill="none" stroke="#e4e8f4" stroke-width="1"/>';
  }
  var axes='';
  for(i=0;i<items.length;i++){p=polarPoint(cx,cy,maxR,i*step);axes+='<line x1="'+cx+'" y1="'+cy+'" x2="'+p.x.toFixed(1)+'" y2="'+p.y.toFixed(1)+'" stroke="#e4e8f4" stroke-width="1"/>';}
  var dataPts=[];
  for(i=0;i<items.length;i++){
    r=(maxR*Math.max(0,Math.min(100,items[i].percent||0)))/100;
    p=polarPoint(cx,cy,r,i*step);dataPts.push(p.x.toFixed(1)+','+p.y.toFixed(1));
  }
  var dots='';
  for(i=0;i<items.length;i++){
    r=(maxR*Math.max(0,Math.min(100,items[i].percent||0)))/100;
    p=polarPoint(cx,cy,r,i*step);
    dots+='<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="3.5" fill="#6665f0"/>';
  }
  var labels='';
  for(i=0;i<items.length;i++){
    p=polarPoint(cx,cy,maxR+28,i*step);
    var name=items[i].skill&&items[i].skill.charAt(0)!=='–'?(items[i].skill.length>10?esc(items[i].skill.slice(0,10))+'…':esc(items[i].skill)):'';
    labels+='<text x="'+p.x.toFixed(1)+'" y="'+p.y.toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#64748b">'+name+'</text>';
  }
  return '<div class="report-radar">'
    +'<svg width="100%" height="100%" viewBox="0 0 '+size+' '+size+'" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">'
    +grids+axes
    +'<polygon points="'+dataPts.join(' ')+'" fill="#7776f5" fill-opacity="0.25" stroke="#6665f0" stroke-width="2"/>'
    +dots+labels+'</svg></div>';
}
function getQSkills(q){
  var raw=Array.isArray(q.skills)&&q.skills.length?q.skills:(q.skill?[q.skill]:[]);
  var out=[];
  raw.forEach(function(s){
    var t=String(s||'').trim().replace(/\\s+/g,' ');
    if(t&&out.indexOf(t)<0)out.push(t);
  });
  return out.length?out:['ความรู้ ความจำ'];
}
function renderReport(){
  var attempts=loadAttempts();
  var skillOrder=['ความรู้ ความจำ','ความเข้าใจ','การประยุกต์ใช้','การวิเคราะห์','การประเมินค่า','การสร้างสรรค์'];
  var skillsInSet={};
  QUESTIONS.forEach(function(q){getQSkills(q).forEach(function(s){skillsInSet[s]=true;});});
  var axisSkills=skillOrder.filter(function(s){return skillsInSet[s];});
  Object.keys(skillsInSet).forEach(function(s){
    if(axisSkills.indexOf(s)<0)axisSkills.push(s);
  });
  if(!axisSkills.length)axisSkills=skillOrder.slice();
  var latest=attempts[0];
  var totals=axisSkills.map(function(skill){
    var qs=QUESTIONS.filter(function(q){return getQSkills(q).indexOf(skill)>=0;});
    var correct=0,count=0;
    var pool=latest?[latest]:attempts;
    pool.forEach(function(a){
      qs.forEach(function(q){
        if(a.answers[q.id]===undefined)return;
        count++;
        if(a.answers[q.id]===q.correct)correct++;
      });
    });
    return {skill:skill,percent:count?Math.round(correct/count*100):0,count:count,correct:correct,questionCount:qs.length};
  });
  var totalCount=latest?latest.total:0;
  var totalCorrect=latest?latest.correct:0;
  var latestPct=latest&&latest.total?Math.round(latest.correct/latest.total*100):0;
  var statCount=(latest?totalCount:QUESTIONS.length)+' ข้อ';
  var statCorrect=latest?totalCorrect+' ข้อ':'–';
  var statAcc=totalCount?Math.round(totalCorrect/totalCount*100)+'%':'–';

  var skillBars=[].concat(totals).sort(function(a,b){
    return a.percent-b.percent||String(a.skill).localeCompare(String(b.skill),'th');
  }).map(function(t){
    var tone=!t.count?'text-slate-400':(t.percent>=70?'text-emerald':(t.percent>=50?'text-orange':'text-rose'));
    var bar=t.percent>=70?'bar-green':(t.percent>=50?'bar-orange':'bar-rose');
    return '<div><div class="flex justify-between gap-2 text-sm font-bold"><span>'+esc(t.skill)+'</span><span class="'+tone+'">'+(t.count?t.percent+'%':'–')+'</span></div>'
      +'<div class="mt-2 progress"><div class="'+bar+'" style="width:'+(t.count?t.percent:0)+'%"></div></div>'
      +'<p class="mt-1 text-xs text-muted">ตอบถูก '+t.correct+'/'+t.count+' ข้อ · ในชุดมี '+t.questionCount+' ข้อ</p></div>';
  }).join('');

  var review='';
  if(latest){
    review=QUESTIONS.filter(function(q){return latest.answers[q.id]!==undefined;}).map(function(item,i){
      var choice=latest.answers[item.id];
      var ok=choice===item.correct;
      return '<div class="review-item"><div class="flex gap-2"><span class="shrink-0 '+(ok?'text-emerald':'text-rose')+'" style="font-weight:700">'+(ok?'✓':'✗')+'</span><div class="min-w-0 flex-1">'
        +'<p class="font-semibold text-ink">ข้อ '+(i+1)+'</p>'
        +'<p class="mt-1 text-sm text-slate-700">'+esc(item.prompt)+'</p>'
        +'<p class="mt-2 text-xs text-slate-500">คำตอบของคุณ: '+esc(item.options[choice]!=null?item.options[choice]:'–')+'</p>'
        +'<p class="mt-1 text-xs text-slate-500">เฉลย: '+esc(item.options[item.correct])+' — '+esc(item.explanation)+'</p>'
        +'</div></div></div>';
    }).join('');
  }

  var latestBlock=latest
    ? '<div class="flex flex-wrap items-start justify-between gap-4">'
      +'<div><span class="pill pill-green">'+icon('chart','icon icon-sm')+' สรุปผลการทำข้อสอบ</span>'
      +'<h2 class="mt-3 text-2xl font-black text-ink">รายละเอียดรอบล่าสุด</h2>'
      +'<p class="mt-1 text-sm text-muted">'+esc(SET.title)+' · '+(latest.mode==='practice'?'โหมดฝึก':'โหมดจำลองสอบ')+'</p></div>'
      +'<div class="text-right"><p class="text-5xl font-black text-brand">'+latestPct+'%</p>'
      +'<p class="mt-1 text-sm text-slate-500">ตอบถูก '+latest.correct+' จาก '+latest.total+' ข้อ</p></div></div>'
      +'<div class="mt-6 flex flex-wrap gap-3">'
      +'<a class="btn-soft btn-soft-brand" href="exam.html?mode='+(latest.mode||'practice')+'" id="retry-link">ทำอีกครั้ง</a>'
      +'<a class="btn-soft btn-soft-outline" href="index.html">กลับหน้ากิจกรรม</a></div>'
      +'<div class="mt-10 border-t pt-6 text-left"><h3 class="mb-1 text-lg font-black">ทบทวนคำตอบ</h3>'
      +'<p class="mb-4 text-xs text-muted">ดูดีเทลทีละข้อจากรอบล่าสุด</p>'+review+'</div>'
    : '<p class="mt-8 text-sm text-muted">ยังไม่มีผลการทำข้อสอบของชุดนี้ — ไปทำแบบฝึกแล้วกลับมาดูรายละเอียดที่นี่</p>';

  var html='<div class="mx-auto max-w-6xl report-page">'
    +'<div class="mb-8 flex flex-wrap items-start justify-between gap-4">'
    +'<div><span class="pill pill-purple">'+icon('chart','icon icon-sm')+' Learning analytics</span>'
    +'<h1 class="mt-3 text-3xl font-black text-ink">รายงานผล · '+esc(SET.title)+'</h1>'
    +'<p class="mt-2 text-sm text-muted">อ้างอิงรอบล่าสุดของชุดนี้เท่านั้น · เริ่มทำใหม่แล้วค่าจะเคลียร์</p></div>'
    +'<button type="button" class="btn-soft btn-soft-aksorn" id="export-pdf-btn">'+icon('file','icon icon-sm')+' ส่งออก PDF</button>'
    +'</div>'
    +'<div class="report-stats">'
    +[['จำนวนข้อ',statCount],['ตอบถูก',statCorrect],['ความแม่นยำ',statAcc]].map(function(pair){
      return '<div class="stat-card"><p class="text-xs text-muted">'+pair[0]+'</p><p class="mt-3 text-2xl font-black text-ink sm:text-3xl">'+pair[1]+'</p></div>';
    }).join('')
    +'</div>'
    +'<div class="mt-5 report-grid">'
    +'<section class="report-panel p-5 sm:p-7"><h2 class="text-lg font-black">📊 จุดแข็ง–จุดอ่อนรายสาระ</h2>'
    +'<p class="mt-1 text-xs text-muted">ยิ่งพื้นที่กว้าง ยิ่งแม่นยำขึ้น · คะแนนจากโจทย์ที่ทำแล้ว</p>'
    +'<div class="mt-3">'+buildRadarSvg(totals)+'</div>'
    +'<p class="text-center text-xs text-orange-500">💡 ควรฝึกทักษะที่มีความแม่นยำต่ำก่อน</p></section>'
    +'<section class="report-panel p-5 sm:p-7"><h2 class="text-lg font-black">🧠 ทักษะที่ควรพัฒนา</h2>'
    +'<p class="mt-1 text-xs text-muted">เปอร์เซ็นต์ถูกต้องแยกตามทักษะ</p>'
    +'<div class="mt-6 space-y-6">'+skillBars+'</div></section>'
    +'</div>'
    +'<section class="report-summary mt-8 p-6 sm:p-10">'+latestBlock+'</section>'
    +'</div>';
  shell('report',html);
  var retry=$('#retry-link');
  if(retry)retry.addEventListener('click',function(){saveAttempts([]);});
  var pdfBtn=$('#export-pdf-btn');
  if(pdfBtn)pdfBtn.addEventListener('click',function(){window.print();});
}

if(page==='activity')renderActivity();
else if(page==='exam')renderExam();
else if(page==='report')renderReport();
})();`;
}
