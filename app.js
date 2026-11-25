/* ISF CRM — universal CRM on Supabase (auth, realtime, Instagram + phone integrations) */
'use strict';

/* ============ helpers ============ */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&3|8)).toString(16); }));
const sid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();
const clone = o => JSON.parse(JSON.stringify(o || {}));
const num = v => { const n = parseFloat(String(v ?? '').replace(/\s/g,'').replace(',', '.')); return isFinite(n) ? n : 0; };
const fmtNum = n => Math.round(n).toLocaleString('ru-RU');
const CUR = {UZS:"so'm", USD:'$', EUR:'€', RUB:'₽'};
const money = (n, cur='UZS') => cur === 'USD' ? '$' + fmtNum(n) : fmtNum(n) + ' ' + (CUR[cur] || cur);
const MONTHS = ['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
function fmtDate(iso, withTime){ if(!iso) return ''; const d = new Date(iso); if(isNaN(d)) return ''; let s = d.getDate()+' '+MONTHS[d.getMonth()]; if(d.getFullYear()!==new Date().getFullYear()) s+=' '+d.getFullYear(); if(withTime) s += ', '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); return s; }
function daysSince(iso){ if(!iso) return 0; return Math.floor((Date.now()-new Date(iso))/864e5); }
function toLocalInput(iso){ if(!iso) return ''; const d=new Date(iso); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes()); }
function startOfDay(d=new Date()){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function toast(msg, ms=3000){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'), ms); }
const COLORS = ['#5b8def','#22b5c4','#8b5cf6','#f59e0b','#ec4899','#14b8a6','#6366f1','#f97316'];
const WON_C = '#1f9d5b', LOST_C = '#9aa4b2';
const toCamel = k => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toSnake = k => k.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
const fromRow = r => { const o = {}; for (const k in r) o[toCamel(k)] = r[k]; return o; };

/* ============ templates ============ */
const TEMPLATES = {
  savdo: {emoji:'🛒', name:'Umumiy savdo', desc:"Har qanday biznes uchun: lid → aloqa → taklif → muzokara → sotuv.",
    stages:[['Yangi lid'],["Bog'lanildi"],['Taklif yuborildi'],['Muzokara'],['Sotildi','won'],["Yo'qotildi",'lost']],
    fields:[{label:'Manba',type:'select',options:['Instagram','Telegram','Telefon','Tavsiya','Sayt','Boshqa']},{label:'Mahsulot / xizmat',type:'text'}]},
  turagent: {emoji:'✈️', name:'Turagentlik', desc:"So'rov → tur tanlash → bron → oldindan to'lov → to'liq to'lov. Brutto/netto bilan.",
    stages:[["Yangi so'rov"],['Tur tanlanmoqda'],['Bron qilindi'],["Oldindan to'lov"],["To'liq to'landi",'won'],['Rad etdi','lost']],
    fields:[{label:'Manba',type:'select',options:['Instagram','Telegram','Telefon','Tavsiya','Ofis']},{label:"Yo'nalish",type:'text'},{label:'Uchish sanasi',type:'date'},{label:'Kishilar soni',type:'number'},{label:'Brutto',type:'number'},{label:'Netto',type:'number'},{label:"Oldindan to'lov",type:'number'}]},
  bogcha: {emoji:'🧸', name:"Bog'cha qabul", desc:"Ota-ona so'rovi → ekskursiya → shartnoma → qabul.",
    stages:[["Yangi so'rov"],['Ekskursiya belgilandi'],["Ekskursiya bo'ldi"],['Shartnoma'],['Qabul qilindi','won'],['Rad etdi','lost']],
    fields:[{label:'Manba',type:'select',options:['Instagram','Telegram','Telefon','Tavsiya','Banner']},{label:'Bola ismi',type:'text'},{label:'Bola yoshi',type:'number'},{label:'Filial',type:'select',options:['Glinka','Sergeli']},{label:'Boshlash sanasi',type:'date'}]},
  stomatologiya: {emoji:'🦷', name:'Stomatologiya', desc:"Murojaat → konsultatsiya → davolash rejasi → davolash → yakun.",
    stages:[['Yangi murojaat'],['Konsultatsiyaga yozildi'],['Davolash rejasi'],['Davolanmoqda'],['Yakunlandi','won'],['Rad etdi','lost']],
    fields:[{label:'Manba',type:'select',options:['Instagram','Telegram','Telefon','Tavsiya','Google/Yandex']},{label:'Xizmat',type:'select',options:['Davolash','Implant','Protez','Ortodontiya','Gigiyena','Oqartirish']},{label:'Shifokor',type:'text'},{label:'Qabul sanasi',type:'date'}]},
  ijara: {emoji:'🏠', name:"Ko'chmas mulk / ijara", desc:"So'rov → ko'rsatish → muzokara → shartnoma.",
    stages:[["Yangi so'rov"],["Ko'rsatildi"],['Muzokara'],['Shartnoma tayyorlanmoqda'],['Ijaraga berildi','won'],['Rad etdi','lost']],
    fields:[{label:'Manba',type:'select',options:['Instagram','Telegram','Telefon','Tavsiya','OLX']},{label:'Obyekt',type:'text'},{label:'Muddat (oy)',type:'number'},{label:"Oylik to'lov",type:'number'},{label:'Kirish sanasi',type:'date'}]},
  b2b: {emoji:'🏨', name:'B2B / korporativ', desc:"Kompaniyalar bilan: aloqa → uchrashuv → taklif → shartnoma.",
    stages:[['Yangi kompaniya'],['Uchrashuv belgilandi'],['Taklif yuborildi'],['Shartnoma kelishilmoqda'],['Shartnoma imzolandi','won'],["Yo'qotildi",'lost']],
    fields:[{label:'Manba',type:'select',options:['Telefon',"Sovuq qo'ng'iroq",'Tavsiya',"Ko'rgazma",'Sayt','Instagram']},{label:'Kompaniya',type:'text'},{label:"Mas'ul shaxs lavozimi",type:'text'},{label:'Hajm',type:'text'}]}
};
function pipelineFromTemplate(key, sort){
  const t = TEMPLATES[key]; let ci = 0;
  return { name:t.name, currency:'UZS', sort, template:key,
    stages: t.stages.map(([name,type]) => ({id:sid(), name, type:type||'open', color: type==='won'?WON_C : type==='lost'?LOST_C : COLORS[(ci++)%COLORS.length]})),
    fields: t.fields.map(f => ({id:sid(), label:f.label, type:f.type, options:f.options||[]})) };
}

/* ============ supabase & state ============ */
const CFG = window.CRM_CONFIG || {};
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
const TABLES = {
  pipelines:['id','name','currency','sort','template','stages','fields'],
  contacts:['id','name','phone','phone2','email','company','source','comment','ig_user_id','ig_username','created_at','updated_at'],
  deals:['id','pipeline_id','stage_id','title','amount','contact_id','responsible','fields','stage_changed_at','closed_at','last_message_at','unread','created_at','updated_at'],
  notes:['id','deal_id','contact_id','kind','text','author','created_at'],
  tasks:['id','title','due','done','done_at','deal_id','contact_id','responsible','created_at'],
  messages:['id','channel','direction','contact_id','deal_id','text','attachments','external_id','sent_by','status','error','created_at'],
  calls:['id','direction','phone','status','duration','recording_url','external_id','contact_id','deal_id','created_at'],
  members:['user_id','email','name','role','created_at']
};
const S = {pipelines:{}, contacts:{}, deals:{}, notes:{}, tasks:{}, messages:{}, calls:{}, members:{}};
let session = null, meId = null, me = null, booted = false, channel = null;
const ui = { view:'voronka', pipelineId:null, q:'', mine:false, repPipe:null, repPeriod:'30', taskFilter:'all', setPipe:null, ctQ:'', authMode:'login' };
const keyOf = t => t==='members' ? 'user_id' : 'id';
const isAdmin = () => me && (me.role==='owner' || me.role==='admin');

function toRow(table, obj){
  const cols = TABLES[table]; const r = {};
  for (const k in obj){ const sk = toSnake(k); if (cols.includes(sk) && obj[k] !== undefined) r[sk] = obj[k]; }
  return r;
}
async function loadAll(){
  const res = await Promise.all(Object.keys(S).map(t => sb.from(t).select('*').limit(5000)));
  Object.keys(S).forEach((t, i) => {
    const { data, error } = res[i];
    if (error){ console.warn(t, error); return; }
    const o = {}; (data||[]).forEach(r => { o[r[keyOf(t)]] = fromRow(r); });
    S[t] = o;
  });
  me = S.members[meId] || null;
}
function subscribe(){
  if (channel) sb.removeChannel(channel);
  channel = sb.channel('crm-all').on('postgres_changes', { event:'*', schema:'public' }, p => {
    const t = p.table; if (!S[t]) return;
    const k = keyOf(t);
    if (p.eventType === 'DELETE'){ const id = p.old && p.old[k]; if (id){ const n = {...S[t]}; delete n[id]; S[t] = n; } }
    else { const r = p.new; S[t] = {...S[t], [r[k]]: fromRow(r)}; if (t==='messages' && r.direction==='in' && Date.now()-new Date(r.created_at) < 60000) toast('💬 Yangi Instagram xabar'); }
    if (t==='members') me = S.members[meId] || null;
    scheduleRender(); refreshModal();
  }).subscribe();
}
async function write(table, id, obj){
  const k = keyOf(table);
  const existed = !!S[table][id];
  S[table] = {...S[table], [id]: {...(S[table][id]||{}), ...obj, [toCamel(k)]: id}};
  scheduleRender();
  const row = toRow(table, obj);
  // partial changes to an existing row must be UPDATEs: an upsert would fail NOT NULL checks on omitted columns
  const { error } = existed ? await sb.from(table).update(row).eq(k, id) : await sb.from(table).insert({...row, [k]: id});
  if (error){ toast('Saqlanmadi: ' + error.message); console.warn(error); await reloadOne(table, id); return false; }
  return true;
}
async function remove(table, id){
  const n = {...S[table]}; delete n[id]; S[table] = n; scheduleRender();
  const { error } = await sb.from(table).delete().eq(keyOf(table), id);
  if (error){ toast("O'chirilmadi: " + error.message); await reloadOne(table, id); return false; }
  return true;
}
async function reloadOne(table, id){
  const { data } = await sb.from(table).select('*').eq(keyOf(table), id).maybeSingle();
  const n = {...S[table]}; if (data) n[id] = fromRow(data); else delete n[id]; S[table] = n; scheduleRender();
}
function addNote(dealId, kind, text){ return write('notes', uid(), {dealId, kind, text, author: meId, createdAt: nowISO()}); }

/* ============ derived ============ */
const pipelines = () => Object.values(S.pipelines).sort((a,b)=>(a.sort||0)-(b.sort||0) || String(a.name).localeCompare(String(b.name)));
const curPipe = () => { const ps = pipelines(); return ps.find(p=>p.id===ui.pipelineId) || ps[0] || null; };
const contactName = id => (S.contacts[id] && S.contacts[id].name) || '';
const dealsOf = pid => Object.values(S.deals).filter(d=>d.pipelineId===pid);
const tasksAll = () => Object.values(S.tasks);
const stageOf = (p, sid) => p && (p.stages||[]).find(s=>s.id===sid);
const nameOf = id => !id ? '—' : (S.members[id] && (S.members[id].name || S.members[id].email)) || 'Xodim';
const initials = n => (n||'?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('') || '?';
const teamList = () => Object.values(S.members).map(m => [m.userId, m.name || m.email]);
function overdueCount(){ const n = Date.now(); return tasksAll().filter(t=>!t.done && t.due && new Date(t.due) < n).length; }
function nextTask(dealId){ return tasksAll().filter(t=>t.dealId===dealId && !t.done).sort((a,b)=>String(a.due||'9').localeCompare(String(b.due||'9')))[0]; }

/* ============ shell ============ */
let rq = false;
function scheduleRender(){ if(rq) return; rq = true; requestAnimationFrame(()=>{ rq = false; render(); }); }
let mrq = false;
function refreshModal(){ if (mrq) return; mrq = true; setTimeout(()=>{ mrq = false; const r = $('#modal')._refresh; if ($('#ov').classList.contains('show') && r) r(); }, 120); }
const VIEWS = [
  ['voronka','Voronka','<path d="M3 4h18l-7 9v6l-4 2v-8L3 4z"/>'],
  ['mijozlar','Mijozlar','<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M16 4a4 4 0 010 8M22 21c0-3-2-6-5-6.5"/>'],
  ['vazifalar','Vazifalar','<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 15l2 2 4-4"/>'],
  ['hisobot','Hisobot','<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],
  ['sozlamalar','Sozlamalar','<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>']
];
function shell(){
  if ($('#nav')) return;
  $('#root').innerHTML = `<div class="app"><aside class="side"><div class="brand"><div class="logo">✦</div>ISF CRM</div><nav class="nav" id="nav"></nav><div class="foot" id="foot"></div><div class="userbox" id="userbox"></div></aside>
    <main class="main"><div class="top" id="top"></div><div class="content" id="content"></div></main></div>`;
}
function render(){
  if (!session){ renderAuth(); return; }
  if (!booted){ $('#root').innerHTML = '<div class="loading">Yuklanmoqda…</div>'; return; }
  if (!me){ renderNotMember(); return; }
  shell();
  const od = overdueCount();
  $('#nav').innerHTML = VIEWS.map(([k,l,ic]) => `<a href="#${k}" class="${ui.view===k?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic}</svg>${l}${k==='vazifalar'&&od?`<span class="cnt">${od}</span>`:''}</a>`).join('');
  $('#foot').textContent = '';
  $('#userbox').innerHTML = `<span class="av">${esc(initials(me.name||me.email))}</span><span>${esc(me.name||me.email)}</span><button id="logout">Chiqish</button>`;
  $('#logout').onclick = async () => { await sb.auth.signOut(); };
  if (!pipelines().length && ui.view!=='sozlamalar'){ renderOnboarding(); return; }
  ({voronka:renderBoard, mijozlar:renderContacts, vazifalar:renderTasks, hisobot:renderReports, sozlamalar:renderSettings}[ui.view] || renderBoard)();
}

/* ---------- auth ---------- */
function renderAuth(){
  const reg = ui.authMode === 'signup';
  $('#root').innerHTML = `<div class="auth"><form class="box" id="af">
    <div class="brand" style="color:var(--ink);padding:0 0 14px"><div class="logo" style="color:#fff">✦</div>ISF CRM</div>
    <h2>${reg ? "Ro'yxatdan o'tish" : 'Kirish'}</h2>
    <p class="muted" style="margin:0 0 14px;font-size:13px">${reg ? "Birinchi ro'yxatdan o'tgan odam CRM egasi bo'ladi. Xodimlar faqat taklif qilingan email bilan kira oladi." : 'Email va parolingizni kiriting.'}</p>
    ${reg ? `<div class="fg"><label>Ismingiz</label><input class="inp" id="a-name" required></div>` : ''}
    <div class="fg"><label>Email</label><input class="inp" id="a-email" type="email" autocomplete="email" required></div>
    <div class="fg"><label>Parol</label><input class="inp" id="a-pass" type="password" minlength="6" autocomplete="${reg?'new-password':'current-password'}" required></div>
    <div class="err" id="a-err"></div>
    <button class="btn primary" style="width:100%;justify-content:center" id="a-go">${reg ? "Ro'yxatdan o'tish" : 'Kirish'}</button>
    <div class="sw">${reg ? 'Akkauntingiz bormi? <a class="link" id="a-sw">Kirish</a>' : 'Akkaunt yo\'qmi? <a class="link" id="a-sw">Ro\'yxatdan o\'tish</a>'}</div>
  </form></div>`;
  $('#a-sw').onclick = () => { ui.authMode = reg ? 'login' : 'signup'; renderAuth(); };
  $('#af').onsubmit = async e => {
    e.preventDefault();
    const email = $('#a-email').value.trim(), password = $('#a-pass').value;
    $('#a-go').disabled = true; $('#a-err').textContent = '';
    let r;
    if (reg) r = await sb.auth.signUp({ email, password, options: { data: { name: $('#a-name').value.trim() }, emailRedirectTo: location.origin + location.pathname } });
    else r = await sb.auth.signInWithPassword({ email, password });
    $('#a-go').disabled = false;
    if (r.error){ $('#a-err').textContent = authErr(r.error.message); return; }
    if (reg && !r.data.session){ $('#a-err').style.color = 'var(--green)'; $('#a-err').textContent = "Emailingizga tasdiqlash xati yuborildi. Xatdagi havolani bosing, keyin shu yerda kiring."; ui.authMode = 'login'; }
  };
}
function authErr(m){
  if (/Invalid login/i.test(m)) return "Email yoki parol noto'g'ri.";
  if (/Email not confirmed/i.test(m)) return 'Email hali tasdiqlanmagan. Pochtangizdagi xatni oching.';
  if (/already registered/i.test(m)) return "Bu email bilan akkaunt bor. Kirish bo'limidan foydalaning.";
  if (/rate limit/i.test(m)) return "Juda ko'p urinish. Bir necha daqiqadan keyin qayta urining.";
  return m;
}
function renderNotMember(){
  $('#root').innerHTML = `<div class="auth"><div class="box"><h2>Kirish ruxsati yo'q</h2>
    <p class="muted" style="font-size:14px;line-height:1.5">${esc(session.user.email)} akkaunti bu CRM'ga taklif qilinmagan. CRM egasidan sizni Sozlamalar → Jamoa bo'limida shu email bilan taklif qilishini so'rang, keyin qaytadan ro'yxatdan o'ting.</p>
    <button class="btn" id="lo">Chiqish</button></div></div>`;
  $('#lo').onclick = () => sb.auth.signOut();
}

/* ---------- onboarding ---------- */
const obSel = new Set();
function renderOnboarding(){
  $('#top').innerHTML = '<h1>Xush kelibsiz!</h1>';
  if (!isAdmin()){ $('#content').innerHTML = `<div class="empty">Hali voronka yaratilmagan. CRM egasi Sozlamalarda voronka qo'shishi kerak.</div>`; return; }
  $('#content').innerHTML = `<div class="panel" style="max-width:900px">
    <h3>Qaysi biznes(lar) uchun CRM kerak?</h3>
    <p class="muted" style="margin-top:-4px">Bir nechtasini tanlang — har biri alohida voronka bo'ladi.</p>
    <div class="tpl-grid">${Object.entries(TEMPLATES).map(([k,t])=>`<div class="tpl ${obSel.has(k)?'on':''}" data-tpl="${k}"><div class="e">${t.emoji}</div><div class="n">${esc(t.name)}</div><div class="d">${esc(t.desc)}</div></div>`).join('')}</div>
    <div style="margin-top:16px"><button class="btn primary" id="ob-go">Boshlash (${obSel.size})</button></div></div>`;
  document.querySelectorAll('.tpl').forEach(el=>el.onclick=()=>{ const k=el.dataset.tpl; obSel.has(k)?obSel.delete(k):obSel.add(k); renderOnboarding(); });
  $('#ob-go').onclick = async () => { if(!obSel.size) return toast('Kamida bittasini tanlang'); let i=0; for(const k of obSel){ const id=uid(); await write('pipelines', id, pipelineFromTemplate(k, i++)); if(i===1) ui.pipelineId=id; } location.hash='voronka'; render(); };
}

/* ---------- board ---------- */
function topBar(title, extra=''){ $('#top').innerHTML = `<h1>${esc(title)}</h1>${extra}`; }
function renderBoard(){
  const p = curPipe(); if(!p) return renderOnboarding(); ui.pipelineId = p.id;
  const ps = pipelines();
  const active = document.activeElement && document.activeElement.id === 'q';
  topBar('Voronka', `<select class="inp" id="pp" style="width:auto;min-width:170px">${ps.map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select>
    <input class="inp search" id="q" placeholder="Qidirish: nom, telefon, @instagram…" value="${esc(ui.q)}">
    <label class="muted" style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" id="mine" ${ui.mine?'checked':''}> Faqat meniki</label>
    <span class="grow"></span><button class="btn primary" id="newdeal">+ Bitim</button>`);
  $('#pp').onchange = e => { ui.pipelineId = e.target.value; render(); };
  const qi = $('#q'); qi.oninput = e => { ui.q = e.target.value; renderBoardBody(p); };
  if (active){ qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); }
  $('#mine').onchange = e => { ui.mine = e.target.checked; renderBoardBody(p); };
  $('#newdeal').onclick = () => openDeal(null, {pipelineId:p.id, stageId:(p.stages.find(s=>s.type==='open')||p.stages[0]||{}).id});
  renderBoardBody(p);
}
function dealMatches(d){
  if(ui.mine && d.responsible!==meId) return false;
  const q = ui.q.trim().toLowerCase(); if(!q) return true;
  const c = S.contacts[d.contactId] || {};
  return [d.title, c.name, c.phone, c.company, c.igUsername, ...Object.values(d.fields||{})].some(v=>String(v??'').toLowerCase().includes(q.replace(/^@/,'')));
}
function renderBoardBody(p){
  if (document.querySelector('.qa-box')) return; // don't wipe a quick-add form mid-typing
  const all = dealsOf(p.id).filter(dealMatches);
  const cutoff = Date.now() - 30*864e5;
  const cols = (p.stages||[]).map(s => {
    let ds = all.filter(d=>d.stageId===s.id);
    let hidden = 0;
    if(s.type!=='open'){ const keep = ds.filter(d=>!d.closedAt || new Date(d.closedAt) >= cutoff); hidden = ds.length-keep.length; ds = keep; }
    ds.sort((a,b)=>String(b.lastMessageAt||b.updatedAt||'').localeCompare(String(a.lastMessageAt||a.updatedAt||'')));
    const sum = ds.reduce((a,d)=>a+num(d.amount),0);
    return `<div class="col" data-stage="${esc(s.id)}" style="--c:${esc(s.color)}">
      <div class="col-h"><div class="t"><span>${esc(s.name)}</span><span class="muted">${ds.length}</span></div><div class="s">${money(sum,p.currency)}${hidden?` · +${hidden} eski`:''}</div></div>
      <div class="col-b">${ds.map(d=>cardHTML(d,p)).join('')}${s.type==='open'?`<button class="add-in-col" data-add="${esc(s.id)}">+ Tez qo'shish</button>`:''}</div></div>`;
  }).join('');
  $('#content').innerHTML = `<div class="board">${cols}</div>`;
  bindBoard(p);
}
function cardHTML(d,p){
  const c = S.contacts[d.contactId]; const t = nextTask(d.id);
  let tag = '';
  if(t){ const due = t.due ? new Date(t.due) : null; const od = due && due < new Date(); const today = due && due >= startOfDay() && due < new Date(startOfDay().getTime()+864e5);
    tag = `<span class="tag ${od?'red':today?'amber':''}">⏰ ${due?fmtDate(t.due):'vazifa'}</span>`; }
  else if(stageOf(p,d.stageId)?.type==='open') tag = `<span class="tag red">vazifa yo'q</span>`;
  const rn = nameOf(d.responsible);
  const sub = c ? `${c.igUserId?'<span class="ig">IG</span> ':''}${esc(c.igUsername?'@'+c.igUsername:c.name)}${c.phone?' · '+esc(c.phone):''}` : '';
  return `<div class="card" draggable="true" data-deal="${d.id}">
    <div class="ti" style="display:flex;justify-content:space-between;gap:6px"><span>${esc(d.title||'Nomsiz bitim')}</span>${d.unread?`<span class="unread">${d.unread}</span>`:''}</div>
    ${sub?`<div class="sub">${sub}</div>`:''}
    <div class="row"><span class="amt">${num(d.amount)?money(num(d.amount),p.currency):'<span class="muted" style="font-weight:400">—</span>'}</span>
    <span style="display:flex;gap:6px;align-items:center">${tag}<span class="av" title="${esc(rn)}">${esc(initials(d.responsible?rn:'?'))}</span></span></div>
    <div class="sub" style="margin-top:6px;font-size:11.5px">bosqichda ${daysSince(d.stageChangedAt||d.createdAt)} kun</div></div>`;
}
let dragId = null;
function bindBoard(p){
  document.querySelectorAll('.card').forEach(el => {
    el.onclick = () => openDeal(el.dataset.deal);
    el.ondragstart = e => { dragId = el.dataset.deal; el.classList.add('drag'); try{ e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed='move'; }catch(_){} };
    el.ondragend = () => { el.classList.remove('drag'); document.querySelectorAll('.col.over').forEach(c=>c.classList.remove('over')); };
  });
  document.querySelectorAll('.col').forEach(col => {
    col.ondragover = e => { if(!dragId) return; e.preventDefault(); col.classList.add('over'); };
    col.ondragleave = e => { if(!col.contains(e.relatedTarget)) col.classList.remove('over'); };
    col.ondrop = e => { e.preventDefault(); col.classList.remove('over'); if(dragId){ moveDeal(dragId, col.dataset.stage); dragId=null; } };
  });
  document.querySelectorAll('[data-add]').forEach(b => b.onclick = e => { e.stopPropagation(); quickAdd(b, p, b.dataset.add); });
}
function quickAdd(btn, p, stageId){
  const box = document.createElement('div'); box.className='card qa-box'; box.style.cursor='default';
  box.innerHTML = `<input class="inp" placeholder="Bitim nomi" id="qa-t" style="margin-bottom:6px"><input class="inp" placeholder="Mijoz ismi" id="qa-c" style="margin-bottom:6px"><input class="inp" placeholder="Telefon" id="qa-p" style="margin-bottom:6px"><input class="inp" placeholder="Summa" id="qa-a" inputmode="decimal" style="margin-bottom:8px"><div style="display:flex;gap:6px"><button class="btn primary sm" id="qa-s">Qo'shish</button><button class="btn sm" id="qa-x">Bekor</button></div>`;
  btn.replaceWith(box); $('#qa-t').focus();
  const close = () => { box.remove(); renderBoardBody(p); };
  $('#qa-x').onclick = close;
  const save = async () => {
    const title = $('#qa-t').value.trim(), cn = $('#qa-c').value.trim(), ph = $('#qa-p').value.trim(), amt = num($('#qa-a').value);
    if(!title && !cn) return toast('Nom yoki mijoz ismini kiriting');
    box.remove();
    let contactId = null;
    if(cn || ph){ contactId = findContact(ph); if(!contactId){ contactId = uid(); await write('contacts', contactId, {name:cn||ph, phone:ph||null, createdAt:nowISO(), updatedAt:nowISO()}); } }
    const id = uid(), t = nowISO();
    if (await write('deals', id, {pipelineId:p.id, stageId, title:title||cn, amount:amt, contactId, responsible:meId, fields:{}, createdAt:t, updatedAt:t, stageChangedAt:t, closedAt:null})){
      addNote(id, 'stage', 'Bitim yaratildi'); toast("Bitim qo'shildi");
    }
    renderBoardBody(p);
  };
  $('#qa-s').onclick = save;
  box.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{ if(e.key==='Enter') save(); if(e.key==='Escape') close(); });
}
function findContact(phone){
  const pn = String(phone||'').replace(/\D/g,'');
  if (pn.length < 7) return null;
  const hit = Object.values(S.contacts).find(c => String(c.phone||'').replace(/\D/g,'').endsWith(pn.slice(-9)));
  return hit ? hit.id : null;
}
async function moveDeal(id, stageId){
  const d = S.deals[id]; if(!d || d.stageId===stageId) return;
  const p = S.pipelines[d.pipelineId]; const from = stageOf(p, d.stageId), to = stageOf(p, stageId); if(!to) return;
  const t = nowISO();
  if (await write('deals', id, {stageId, stageChangedAt:t, updatedAt:t, closedAt: to.type==='open' ? null : t})){
    addNote(id, 'stage', `${from?from.name:'?'} → ${to.name}`);
    if(to.type==='won') toast('🎉 Bitim yutildi!');
  }
}

/* ---------- modal infra ---------- */
function openModal(html, narrow){ const m=$('#modal'); m._refresh=null; m.className='modal'+(narrow?' narrow':''); m.innerHTML=html; $('#ov').classList.add('show'); m.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal); }
function closeModal(){ $('#ov').classList.remove('show'); $('#modal').innerHTML=''; $('#modal')._refresh=null; }
$('#ov').addEventListener('mousedown', e => { if(e.target.id==='ov') closeModal(); });
document.addEventListener('keydown', e => { if(e.key==='Escape' && $('#ov').classList.contains('show')) closeModal(); });
function confirmBox(msg, onYes){
  const wrap = document.createElement('div'); wrap.className='ov show'; wrap.style.zIndex=30;
  wrap.innerHTML = `<div class="modal narrow"><div class="m-b" style="font-size:15px">${esc(msg)}</div><div class="m-f"><button class="btn" id="cf-n">Yo'q</button><button class="btn primary" style="background:var(--red);border-color:var(--red)" id="cf-y">Ha</button></div></div>`;
  document.body.appendChild(wrap);
  wrap.querySelector('#cf-n').onclick = () => wrap.remove();
  wrap.querySelector('#cf-y').onclick = () => { wrap.remove(); onYes(); };
}
function fieldInput(f, val){
  const id = 'cf-'+f.id, v = val ?? '';
  if(f.type==='select') return `<select class="inp" id="${esc(id)}"><option value=""></option>${(f.options||[]).map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  if(f.type==='number') return `<input class="inp" id="${esc(id)}" inputmode="decimal" value="${esc(v)}">`;
  if(f.type==='date') return `<input class="inp" id="${esc(id)}" type="date" value="${esc(v)}">`;
  if(f.type==='phone') return `<input class="inp" id="${esc(id)}" type="tel" value="${esc(v)}">`;
  return `<input class="inp" id="${esc(id)}" value="${esc(v)}">`;
}
const byId = id => document.getElementById(id);

/* ---------- deal modal ---------- */
function openDeal(id, preset){
  const isNew = !id; id = id || uid();
  const d = isNew ? {pipelineId:preset.pipelineId, stageId:preset.stageId, title:'', amount:'', responsible:meId, fields:{}} : clone(S.deals[id]);
  if(!d || !d.pipelineId) return;
  let p = S.pipelines[d.pipelineId]; if(!p) return toast('Voronka topilmadi');
  let stageId = d.stageId;
  const c = S.contacts[d.contactId] || {};
  const contactOpts = Object.values(S.contacts).map(x=>`<option value="${esc(x.name)}${x.phone?' · '+esc(x.phone):''}"></option>`).join('');
  const fieldsHTML = pp => (pp.fields||[]).map(f=>`<div class="fg"><label>${esc(f.label)}</label>${fieldInput(f, d.fields?.[f.id])}</div>`).join('');
  const stagePick = pp => `<div class="stagepick">${(pp.stages||[]).map(s=>`<button type="button" data-st="${esc(s.id)}" class="${s.id===stageId?'on':''}" style="--c:${esc(s.color)}">${esc(s.name)}</button>`).join('')}</div>`;
  openModal(`<div class="m-h"><h2>${isNew?'Yangi bitim':esc(d.title||'Bitim')}</h2><button class="x" data-close>×</button></div>
    <div class="m-b split">
      <div>
        <div class="sec-t">Asosiy</div>
        <div class="fg"><label>Bitim nomi</label><input class="inp" id="d-title" value="${esc(d.title)}" placeholder="Masalan: Antalya tur, 2 kishi"></div>
        <div class="two"><div class="fg"><label>Summa (${esc(p.currency||'UZS')})</label><input class="inp" id="d-amount" inputmode="decimal" value="${esc(d.amount||'')}"></div>
        <div class="fg"><label>Mas'ul</label><select class="inp" id="d-resp"><option value="">—</option>${teamList().map(([u,n])=>`<option value="${esc(u)}" ${u===d.responsible?'selected':''}>${esc(n)}</option>`).join('')}</select></div></div>
        <div class="fg"><label>Voronka</label><select class="inp" id="d-pipe">${pipelines().map(x=>`<option value="${x.id}" ${x.id===d.pipelineId?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
        <div class="fg"><label>Bosqich</label><div id="d-stages">${stagePick(p)}</div></div>
        <div class="sec-t">Mijoz ${c.igUsername?`<span class="ig" style="text-transform:none">· @${esc(c.igUsername)}</span>`:c.igUserId?'<span class="ig">· Instagram</span>':''}</div>
        <div class="two"><div class="fg"><label>Ism</label><input class="inp" id="d-cname" list="cl" value="${esc(c.name||'')}" autocomplete="off"><datalist id="cl">${contactOpts}</datalist></div>
        <div class="fg"><label>Telefon</label><input class="inp" id="d-cphone" type="tel" value="${esc(c.phone||'')}"></div></div>
        <div class="sec-t">Qo'shimcha maydonlar</div>
        <div id="d-fields">${fieldsHTML(p) || '<div class="muted" style="font-size:13px">Maydon yo\'q</div>'}</div>
      </div>
      <div>
        ${isNew ? `<div class="muted" style="font-size:13px;padding-top:28px">Saqlangandan so'ng chat, izoh, vazifa va tarix shu yerda ko'rinadi.</div>` : `
        <div id="d-chatwrap"></div>
        <div id="d-calls"></div>
        <div class="sec-t">Vazifalar</div>
        <div id="d-tasks"></div>
        <div class="two" style="grid-template-columns:1fr 170px auto;margin-top:6px"><input class="inp" id="nt-title" placeholder="Qo'ng'iroq qilish, uchrashuv…"><input class="inp" id="nt-due" type="datetime-local" value="${toLocalInput(new Date(Date.now()+864e5).toISOString())}"><button class="btn sm" id="nt-add">+</button></div>
        <div class="sec-t">Izohlar va tarix</div>
        <textarea class="inp" id="note" rows="2" placeholder="Izoh yozing…"></textarea>
        <div style="margin-top:6px"><button class="btn sm" id="note-add">Izoh qo'shish</button></div>
        <div class="tl" id="d-tl"></div>`}
      </div>
    </div>
    <div class="m-f">${!isNew?`<button class="btn danger" id="d-del">O'chirish</button><span class="grow"></span>`:''}<button class="btn" data-close>Bekor</button><button class="btn primary" id="d-save">Saqlash</button></div>`);

  const bindStages = () => document.querySelectorAll('#d-stages [data-st]').forEach(b=>b.onclick=()=>{ stageId=b.dataset.st; document.querySelectorAll('#d-stages [data-st]').forEach(x=>x.classList.toggle('on', x.dataset.st===stageId)); });
  bindStages();
  $('#d-pipe').onchange = e => { const np = S.pipelines[e.target.value]; if(!np) return; d.pipelineId = e.target.value; p = np; stageId = (np.stages.find(s=>s.type==='open')||np.stages[0]||{}).id; $('#d-stages').innerHTML = stagePick(np); bindStages(); $('#d-fields').innerHTML = fieldsHTML(np) || '<div class="muted" style="font-size:13px">Maydon yo\'q</div>'; };
  $('#d-cname').oninput = e => { const v = e.target.value; const hit = Object.values(S.contacts).find(x => (x.name+(x.phone?' · '+x.phone:''))===v); if(hit){ e.target.value = hit.name; $('#d-cphone').value = hit.phone||''; e.target.dataset.cid = hit.id; } };
  if(d.contactId) $('#d-cname').dataset.cid = d.contactId;

  if(!isNew){
    if (S.deals[id] && S.deals[id].unread) write('deals', id, {unread:0});
    const renderSide = () => {
      if (!byId('d-tl')) return;
      const cur = S.deals[id] || d; const ct = S.contacts[cur.contactId] || {};
      // Instagram chat
      const msgs = Object.values(S.messages).filter(m => (ct.id && m.contactId===ct.id) || m.dealId===id).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
      const wrap = byId('d-chatwrap');
      if (ct.igUserId || msgs.length){
        if (!byId('chat')){
          wrap.innerHTML = `<div class="sec-t"><span class="ig">Instagram</span> yozishma</div><div class="chat" id="chat"></div>
            <div class="composer"><input class="inp" id="ig-text" placeholder="Javob yozing…"><button class="btn primary sm" id="ig-send">Yuborish</button></div>
            <div class="muted" style="font-size:11.5px;margin-top:4px">Instagram qoidasi: mijozning oxirgi xabaridan keyin 24 soat ichida javob berish mumkin.</div>`;
          const send = async () => {
            const text = byId('ig-text').value.trim(); if (!text) return;
            byId('ig-send').disabled = true;
            const { data, error } = await sb.functions.invoke('instagram-send', { body: { contact_id: ct.id, text } });
            byId('ig-send') && (byId('ig-send').disabled = false);
            if (error){ let msg = error.message; try{ const j = await error.context.json(); msg = j.error || msg; }catch(_){} toast('Yuborilmadi: ' + msg, 5000); }
            else { byId('ig-text') && (byId('ig-text').value = ''); }
            // don't rely on realtime alone: pull this contact's messages now
            const { data: fresh } = await sb.from('messages').select('*').eq('contact_id', ct.id);
            if (fresh){ const n = {...S.messages}; fresh.forEach(r => n[r.id] = fromRow(r)); S.messages = n; }
            refreshModal();
          };
          byId('ig-send').onclick = send; byId('ig-text').onkeydown = e => { if (e.key==='Enter') send(); };
        }
        const chat = byId('chat'); const atBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 40;
        chat.innerHTML = msgs.map(m => `<div class="bub ${m.status==='error'?'err':m.direction}">${esc(m.text||'')}${(m.attachments||[]).map(a=>a.url?` <a class="link" href="${esc(a.url)}" target="_blank" rel="noopener">[${esc(a.type||'fayl')}]</a>`:'').join('')}<div class="m">${fmtDate(m.createdAt,true)}${m.sentBy?' · '+esc(nameOf(m.sentBy)):''}${m.status==='error'?' · xato: '+esc(m.error||''):''}</div></div>`).join('') || '<div class="muted" style="font-size:13px">Xabar yo\'q</div>';
        if (atBottom || !chat._init){ chat.scrollTop = chat.scrollHeight; chat._init = true; }
      }
      // Calls
      const calls = Object.values(S.calls).filter(x => (ct.id && x.contactId===ct.id) || x.dealId===id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
      byId('d-calls').innerHTML = calls.length ? `<div class="sec-t">Qo'ng'iroqlar</div>${calls.map(x=>`<div class="task"><div style="flex:1"><div class="tt">${x.direction==='out'?'📤 Chiquvchi':'📥 Kiruvchi'} · ${esc(x.phone||'')}</div><div class="tm">${fmtDate(x.createdAt,true)}${x.duration?` · ${Math.floor(x.duration/60)}:${String(x.duration%60).padStart(2,'0')}`:''}${x.status?' · '+esc(x.status):''}${x.recordingUrl?` · <a class="link" href="${esc(x.recordingUrl)}" target="_blank" rel="noopener">yozuv</a>`:''}</div></div></div>`).join('')}` : '';
      // Tasks
      const ts = tasksAll().filter(t=>t.dealId===id).sort((a,b)=>Number(a.done)-Number(b.done) || String(a.due||'').localeCompare(String(b.due||'')));
      byId('d-tasks').innerHTML = ts.length ? ts.map(taskHTML).join('') : '<div class="muted" style="font-size:13px">Vazifa yo\'q</div>';
      bindTaskChecks(byId('d-tasks'));
      const notes = Object.values(S.notes).filter(n=>n.dealId===id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
      byId('d-tl').innerHTML = notes.map(n=>`<div class="tl-i ${esc(n.kind||'note')}"><div class="m">${fmtDate(n.createdAt,true)}${n.author?' · '+esc(nameOf(n.author)):''}</div><div class="txt">${esc(n.text)}</div></div>`).join('') || '<div class="muted" style="font-size:13px">Hali hech narsa yo\'q</div>';
    };
    renderSide();
    $('#modal')._refresh = renderSide;
    $('#note-add').onclick = async () => { const v = $('#note').value.trim(); if(!v) return; $('#note').value=''; await addNote(id, 'note', v); renderSide(); };
    $('#nt-add').onclick = async () => { const title = $('#nt-title').value.trim(); if(!title) return toast('Vazifa matnini yozing'); const due = $('#nt-due').value ? new Date($('#nt-due').value).toISOString() : null; $('#nt-title').value=''; await write('tasks', uid(), {title, due, done:false, dealId:id, contactId:S.deals[id]?.contactId||null, responsible:meId, createdAt:nowISO()}); renderSide(); };
    $('#d-del').onclick = () => confirmBox("Bitimni o'chirasizmi? Vazifa va izohlari ham o'chadi.", async () => { await remove('deals', id); closeModal(); toast("O'chirildi"); });
  } else $('#d-title').focus();

  $('#d-save').onclick = async () => {
    const title = $('#d-title').value.trim(); const cname = $('#d-cname').value.trim(); const cphone = $('#d-cphone').value.trim();
    if(!title && !cname) return toast('Bitim nomi yoki mijoz ismini kiriting');
    $('#d-save').disabled = true;
    let contactId = $('#d-cname').dataset.cid || null;
    if(contactId && S.contacts[contactId]){ const ct = S.contacts[contactId]; if(!cname) contactId = null; else if(ct.name!==cname || (ct.phone||'')!==cphone) await write('contacts', contactId, {name:cname, phone:cphone||null, updatedAt:nowISO()}); }
    else if(cname || cphone){ contactId = findContact(cphone); if(!contactId){ contactId = uid(); await write('contacts', contactId, {name:cname||cphone, phone:cphone||null, createdAt:nowISO(), updatedAt:nowISO()}); } }
    const fields = {}; (p.fields||[]).forEach(f => { const el = byId('cf-'+f.id); if(el && el.value!=='') fields[f.id] = f.type==='number' ? num(el.value) : el.value; });
    const base = isNew ? {} : (S.deals[id] || {}); const t = nowISO();
    const n = {pipelineId:d.pipelineId, title:title||cname, amount:num($('#d-amount').value), responsible:$('#d-resp').value||null, contactId, fields, updatedAt:t};
    let stageNote = null;
    if(isNew || base.stageId !== stageId || base.pipelineId !== d.pipelineId){
      const to = stageOf(p, stageId); const from = isNew ? null : stageOf(S.pipelines[base.pipelineId], base.stageId);
      n.stageId = stageId; n.stageChangedAt = t; n.closedAt = to && to.type!=='open' ? t : null;
      stageNote = isNew ? 'Bitim yaratildi' : `${from?from.name:'?'} → ${to?to.name:'?'}`;
    }
    if(isNew) n.createdAt = t;
    const ok = await write('deals', id, n);
    $('#d-save') && ($('#d-save').disabled = false);
    if(ok){ if(stageNote) addNote(id, 'stage', stageNote); closeModal(); toast(isNew?'Bitim yaratildi':'Saqlandi'); }
  };
}

/* ---------- tasks ---------- */
function taskHTML(t){
  const due = t.due ? new Date(t.due) : null; const od = !t.done && due && due < new Date();
  const d = t.dealId && S.deals[t.dealId]; const c = t.contactId && S.contacts[t.contactId];
  return `<div class="task ${t.done?'done':''}"><input type="checkbox" data-tk="${t.id}" ${t.done?'checked':''}>
    <div style="flex:1;min-width:0"><div class="tt">${esc(t.title)}</div>
    <div class="tm">${due?`<span style="${od?'color:var(--red);font-weight:600':''}">${fmtDate(t.due,true)}</span>`:'muddatsiz'}${d?` · <a class="link" data-od="${t.dealId}">${esc(d.title)}</a>`:''}${c&&!d?` · ${esc(c.name)}`:''} · ${esc(nameOf(t.responsible))}</div></div>
    <button class="x" style="font-size:16px" data-tdel="${t.id}" title="O'chirish">×</button></div>`;
}
function bindTaskChecks(root){
  root.querySelectorAll('[data-tk]').forEach(cb => cb.onchange = async () => {
    const t = S.tasks[cb.dataset.tk]; if(!t) return;
    await write('tasks', t.id, {done:cb.checked, doneAt:cb.checked?nowISO():null});
    if(cb.checked && t.dealId && S.deals[t.dealId]) addNote(t.dealId, 'task', '✓ Bajarildi: '+t.title);
    refreshModal();
  });
  root.querySelectorAll('[data-tdel]').forEach(b => b.onclick = async () => { await remove('tasks', b.dataset.tdel); refreshModal(); });
  root.querySelectorAll('[data-od]').forEach(a => a.onclick = () => openDeal(a.dataset.od));
}
function renderTasks(){
  topBar('Vazifalar', `<select class="inp" id="tf" style="width:auto"><option value="all" ${ui.taskFilter==='all'?'selected':''}>Hammaniki</option><option value="mine" ${ui.taskFilter==='mine'?'selected':''}>Faqat meniki</option></select><span class="grow"></span><button class="btn primary" id="nt">+ Vazifa</button>`);
  $('#tf').onchange = e => { ui.taskFilter = e.target.value; renderTasks(); };
  $('#nt').onclick = openNewTask;
  let ts = tasksAll(); if(ui.taskFilter==='mine') ts = ts.filter(t=>t.responsible===meId);
  const eod = startOfDay().getTime() + 864e5, now = Date.now();
  const open = ts.filter(t=>!t.done).sort((a,b)=>String(a.due||'9').localeCompare(String(b.due||'9')));
  const groups = [
    ["Muddati o'tgan", open.filter(t=>t.due && new Date(t.due).getTime() < now)],
    ['Bugun', open.filter(t=>t.due && new Date(t.due).getTime() >= now && new Date(t.due).getTime() < eod)],
    ['Ertaga va keyin', open.filter(t=>t.due && new Date(t.due).getTime() >= eod)],
    ['Muddatsiz', open.filter(t=>!t.due)],
    ['Bajarilgan (oxirgi 20)', ts.filter(t=>t.done).sort((a,b)=>String(b.doneAt||'').localeCompare(String(a.doneAt||''))).slice(0,20)]
  ];
  $('#content').innerHTML = `<div style="max-width:820px">${groups.filter(g=>g[1].length).map(([l,arr])=>`<div class="tgroup"><h4>${l} · ${arr.length}</h4>${arr.map(taskHTML).join('')}</div>`).join('') || '<div class="empty">Vazifalar yo\'q.</div>'}</div>`;
  bindTaskChecks($('#content'));
}
function openNewTask(){
  const ds = Object.values(S.deals).filter(d=>{ const s = stageOf(S.pipelines[d.pipelineId], d.stageId); return s && s.type==='open'; });
  openModal(`<div class="m-h"><h2>Yangi vazifa</h2><button class="x" data-close>×</button></div><div class="m-b">
    <div class="fg"><label>Nima qilish kerak</label><input class="inp" id="t-title" placeholder="Qo'ng'iroq qilish"></div>
    <div class="two"><div class="fg"><label>Muddat</label><input class="inp" id="t-due" type="datetime-local" value="${toLocalInput(new Date(Date.now()+3600e3).toISOString())}"></div>
    <div class="fg"><label>Mas'ul</label><select class="inp" id="t-resp">${teamList().map(([i,n])=>`<option value="${esc(i)}" ${i===meId?'selected':''}>${esc(n)}</option>`).join('')}</select></div></div>
    <div class="fg"><label>Bitim (ixtiyoriy)</label><select class="inp" id="t-deal"><option value=""></option>${ds.map(d=>`<option value="${d.id}">${esc(d.title)}${contactName(d.contactId)?' — '+esc(contactName(d.contactId)):''}</option>`).join('')}</select></div>
    </div><div class="m-f"><button class="btn" data-close>Bekor</button><button class="btn primary" id="t-save">Saqlash</button></div>`, true);
  $('#t-title').focus();
  $('#t-save').onclick = async () => { const title=$('#t-title').value.trim(); if(!title) return toast('Matn kiriting'); const dealId=$('#t-deal').value||null; if (await write('tasks', uid(), {title, due:$('#t-due').value?new Date($('#t-due').value).toISOString():null, done:false, dealId, contactId:dealId?S.deals[dealId]?.contactId||null:null, responsible:$('#t-resp').value, createdAt:nowISO()})){ closeModal(); toast("Vazifa qo'shildi"); } };
}

/* ---------- contacts ---------- */
function renderContacts(){
  const active = document.activeElement && document.activeElement.id === 'cq';
  topBar('Mijozlar', `<input class="inp search" id="cq" placeholder="Ism, telefon, @instagram…" value="${esc(ui.ctQ)}"><span class="grow"></span><button class="btn" id="csv">CSV nusxalash</button><button class="btn primary" id="nc">+ Mijoz</button>`);
  $('#cq').oninput = e => { ui.ctQ = e.target.value; renderContactsBody(); };
  if (active){ const q=$('#cq'); q.focus(); q.setSelectionRange(q.value.length,q.value.length); }
  $('#nc').onclick = () => openContact(null);
  $('#csv').onclick = () => { const rows=[['Ism','Telefon','Instagram','Email','Kompaniya','Manba','Izoh','Bitimlar']]; Object.values(S.contacts).forEach(c=>rows.push([c.name,c.phone,c.igUsername?'@'+c.igUsername:'',c.email,c.company,c.source,c.comment,Object.values(S.deals).filter(d=>d.contactId===c.id).length])); const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n'); navigator.clipboard.writeText(csv).then(()=>toast('CSV nusxalandi — Excelga joylashtiring')).catch(()=>toast("Nusxalab bo'lmadi")); };
  renderContactsBody();
}
function renderContactsBody(){
  const q = ui.ctQ.trim().toLowerCase().replace(/^@/,'');
  const list = Object.values(S.contacts).filter(c=>!q || [c.name,c.phone,c.email,c.company,c.igUsername].some(v=>String(v||'').toLowerCase().includes(q))).sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')));
  const deals = Object.values(S.deals);
  $('#content').innerHTML = list.length ? `<table class="tbl"><thead><tr><th>Ism</th><th>Telefon</th><th>Instagram</th><th>Bitimlar</th><th>Manba</th><th>Qo'shilgan</th></tr></thead><tbody>${list.map(c=>{ const cd = deals.filter(d=>d.contactId===c.id); return `<tr class="click" data-c="${c.id}"><td><b>${esc(c.name)}</b></td><td>${esc(c.phone||'')}</td><td>${c.igUsername?`<span class="ig">@${esc(c.igUsername)}</span>`:c.igUserId?'<span class="ig">IG</span>':''}</td><td>${cd.length}${cd.length?` · ${money(cd.reduce((a,d)=>a+num(d.amount),0))}`:''}</td><td class="muted">${esc(c.source||'')}</td><td class="muted">${fmtDate(c.createdAt)}</td></tr>`; }).join('')}</tbody></table>` : `<div class="empty">${q?'Hech narsa topilmadi':"Mijozlar hali yo'q."}</div>`;
  document.querySelectorAll('[data-c]').forEach(r=>r.onclick=()=>openContact(r.dataset.c));
}
function openContact(id){
  const isNew = !id; id = id || uid(); const c = isNew ? {} : clone(S.contacts[id]);
  const cd = Object.values(S.deals).filter(d=>d.contactId===id);
  openModal(`<div class="m-h"><h2>${isNew?'Yangi mijoz':esc(c.name)}</h2><button class="x" data-close>×</button></div><div class="m-b">
    ${c.igUserId?`<div class="fg"><span class="ig">Instagram:</span> ${c.igUsername?'@'+esc(c.igUsername):'ID '+esc(c.igUserId)}</div>`:''}
    <div class="two"><div class="fg"><label>Ism</label><input class="inp" id="c-name" value="${esc(c.name)}"></div><div class="fg"><label>Telefon</label><input class="inp" id="c-phone" type="tel" value="${esc(c.phone)}"></div></div>
    <div class="two"><div class="fg"><label>Qo'shimcha telefon</label><input class="inp" id="c-phone2" type="tel" value="${esc(c.phone2)}"></div><div class="fg"><label>Email</label><input class="inp" id="c-email" value="${esc(c.email)}"></div></div>
    <div class="two"><div class="fg"><label>Kompaniya</label><input class="inp" id="c-company" value="${esc(c.company)}"></div><div class="fg"><label>Manba</label><input class="inp" id="c-source" value="${esc(c.source)}" placeholder="Instagram, tavsiya…"></div></div>
    <div class="fg"><label>Izoh</label><textarea class="inp" id="c-comment" rows="2">${esc(c.comment)}</textarea></div>
    ${!isNew?`<div class="sec-t">Bitimlar (${cd.length})</div>${cd.map(d=>{ const p=S.pipelines[d.pipelineId]; const s=stageOf(p,d.stageId); return `<div class="task"><div style="flex:1"><a class="link" data-od="${d.id}">${esc(d.title)}</a><div class="tm">${esc(p?p.name:'')} · ${esc(s?s.name:'')} · ${money(num(d.amount),p?.currency)}</div></div></div>`; }).join('') || '<div class="muted">Yo\'q</div>'}`:''}
    </div><div class="m-f">${!isNew?`<button class="btn danger" id="c-del">O'chirish</button><span class="grow"></span><button class="btn" id="c-deal">+ Bitim</button>`:''}<button class="btn" data-close>Bekor</button><button class="btn primary" id="c-save">Saqlash</button></div>`, true);
  document.querySelectorAll('#modal [data-od]').forEach(a=>a.onclick=()=>openDeal(a.dataset.od));
  const v = i => $(i).value.trim() || null;
  $('#c-save').onclick = async () => { const n = {name:v('#c-name')||v('#c-phone')||'', phone:v('#c-phone'), phone2:v('#c-phone2'), email:v('#c-email'), company:v('#c-company'), source:v('#c-source'), comment:v('#c-comment'), updatedAt:nowISO()}; if(isNew) n.createdAt = nowISO(); if(!n.name) return toast('Ism yoki telefon kiriting'); if (await write('contacts', id, n)){ closeModal(); toast('Saqlandi'); } };
  if(!isNew){
    $('#c-del').onclick = () => confirmBox(cd.length ? `Mijozni o'chirasizmi? Uning ${cd.length} ta bitimi mijozsiz qoladi, Instagram yozishmalari o'chadi.` : "Mijozni o'chirasizmi?", async () => { await remove('contacts', id); closeModal(); toast("O'chirildi"); });
    $('#c-deal').onclick = async () => { const p = curPipe(); if(!p) return; const did = uid(), t = nowISO(); const st = (p.stages.find(s=>s.type==='open')||p.stages[0]).id;
      if (await write('deals', did, {pipelineId:p.id, stageId:st, title:c.name, amount:0, contactId:id, responsible:meId, fields:{}, createdAt:t, updatedAt:t, stageChangedAt:t, closedAt:null})){ addNote(did,'stage','Bitim yaratildi'); openDeal(did); } };
  }
}

/* ---------- reports ---------- */
function renderReports(){
  const ps = pipelines(); const p = ps.find(x=>x.id===ui.repPipe) || curPipe(); ui.repPipe = p.id;
  topBar('Hisobot', `<select class="inp" id="rp" style="width:auto">${ps.map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select>
    <select class="inp" id="rper" style="width:auto">${[['7','7 kun'],['30','30 kun'],['90','90 kun'],['365','1 yil'],['all','Hammasi']].map(([v,l])=>`<option value="${v}" ${ui.repPeriod===v?'selected':''}>${l}</option>`).join('')}</select>`);
  $('#rp').onchange = e => { ui.repPipe = e.target.value; renderReports(); };
  $('#rper').onchange = e => { ui.repPeriod = e.target.value; renderReports(); };
  const cur = p.currency;
  const since = ui.repPeriod==='all' ? 0 : Date.now() - (+ui.repPeriod)*864e5;
  const ds = dealsOf(p.id);
  const typeOf = d => (stageOf(p,d.stageId)||{}).type || 'open';
  const open = ds.filter(d=>typeOf(d)==='open');
  const won = ds.filter(d=>typeOf(d)==='won' && d.closedAt && new Date(d.closedAt).getTime()>=since);
  const lost = ds.filter(d=>typeOf(d)==='lost' && d.closedAt && new Date(d.closedAt).getTime()>=since);
  const created = ds.filter(d=>d.createdAt && new Date(d.createdAt).getTime()>=since);
  const sum = a => a.reduce((s,d)=>s+num(d.amount),0);
  const conv = (won.length+lost.length) ? Math.round(won.length*100/(won.length+lost.length)) : 0;
  const avg = won.length ? sum(won)/won.length : 0;
  const cycle = won.length ? Math.round(won.reduce((s,d)=>s+Math.max(0,(new Date(d.closedAt)-new Date(d.createdAt))/864e5),0)/won.length) : 0;
  const maxStage = Math.max(1, ...p.stages.map(s=>ds.filter(d=>d.stageId===s.id).length));
  const stageBars = p.stages.filter(s=>s.type==='open').map(s=>{ const a = ds.filter(d=>d.stageId===s.id); return `<div class="bar"><span>${esc(s.name)}</span><div class="track"><div class="fill" style="width:${a.length*100/maxStage}%;background:${esc(s.color)}"></div></div><span class="n">${a.length} · ${money(sum(a),cur)}</span></div>`; }).join('');
  const sf = (p.fields||[]).find(f=>/manba/i.test(f.label)) || (p.fields||[]).find(f=>f.type==='select');
  let srcHTML = '';
  if(sf){ const m = {}; created.forEach(d=>{ const k = (d.fields||{})[sf.id] || "Ko'rsatilmagan"; m[k] = m[k] || {n:0, w:0}; m[k].n++; if(typeOf(d)==='won') m[k].w++; });
    const rows = Object.entries(m).sort((a,b)=>b[1].n-a[1].n); const mx = Math.max(1,...rows.map(r=>r[1].n));
    srcHTML = `<div class="panel"><h3>${esc(sf.label)} bo'yicha yangi bitimlar</h3>${rows.map(([k,v])=>`<div class="bar"><span>${esc(k)}</span><div class="track"><div class="fill" style="width:${v.n*100/mx}%;background:#22b5c4"></div></div><span class="n">${v.n} · ${v.w} yutildi</span></div>`).join('') || '<div class="muted">Ma\'lumot yo\'q</div>'}</div>`; }
  const byResp = {}; won.forEach(d=>{ const k=d.responsible||'-'; byResp[k]=byResp[k]||{n:0,s:0}; byResp[k].n++; byResp[k].s+=num(d.amount); });
  open.forEach(d=>{ const k=d.responsible||'-'; byResp[k]=byResp[k]||{n:0,s:0}; byResp[k].o=(byResp[k].o||0)+1; });
  const respRows = Object.entries(byResp).sort((a,b)=>b[1].s-a[1].s);
  const br = (p.fields||[]).find(f=>/brutto/i.test(f.label)), nt = (p.fields||[]).find(f=>/netto/i.test(f.label));
  const profit = br && nt ? won.reduce((s,d)=>s+num((d.fields||{})[br.id])-num((d.fields||{})[nt.id]),0) : null;
  const igIn = Object.values(S.messages).filter(m=>m.direction==='in' && new Date(m.createdAt).getTime()>=since).length;
  const callsN = Object.values(S.calls).filter(c=>new Date(c.createdAt).getTime()>=since).length;
  $('#content').innerHTML = `<div class="grid">
    <div class="grid kpis">
      <div class="panel kpi"><div class="l">Ochiq bitimlar</div><div class="v">${open.length}</div><div class="d">${money(sum(open),cur)}</div></div>
      <div class="panel kpi"><div class="l">Yangi bitimlar</div><div class="v">${created.length}</div><div class="d">tanlangan davrda</div></div>
      <div class="panel kpi"><div class="l">Yutilgan</div><div class="v" style="color:var(--green)">${won.length}</div><div class="d">${money(sum(won),cur)}</div></div>
      <div class="panel kpi"><div class="l">Yo'qotilgan</div><div class="v" style="color:var(--red)">${lost.length}</div><div class="d">${money(sum(lost),cur)}</div></div>
      <div class="panel kpi"><div class="l">Konversiya</div><div class="v">${conv}%</div><div class="d">yutilgan / yopilgan</div></div>
      <div class="panel kpi"><div class="l">O'rtacha chek</div><div class="v" style="font-size:18px">${money(avg,cur)}</div><div class="d">sotuv sikli ~${cycle} kun</div></div>
      <div class="panel kpi"><div class="l">Kanallar (barcha voronkalar)</div><div class="v" style="font-size:18px">${igIn} <span class="ig" style="font-size:13px">IG</span> · ${callsN} 📞</div><div class="d">kiruvchi xabar · qo'ng'iroq</div></div>
      ${profit!==null?`<div class="panel kpi"><div class="l">Foyda (brutto − netto)</div><div class="v" style="font-size:18px;color:var(--green)">${money(profit,cur)}</div><div class="d">yutilgan bitimlar</div></div>`:''}
    </div>
    <div class="panel"><h3>Voronka bosqichlari (hozir)</h3>${stageBars||'<div class="muted">Bosqich yo\'q</div>'}</div>
    ${srcHTML}
    <div class="panel"><h3>Xodimlar</h3>${respRows.length?`<table class="tbl" style="box-shadow:none"><thead><tr><th>Xodim</th><th>Ochiq</th><th>Yutilgan</th><th>Summa</th></tr></thead><tbody>${respRows.map(([k,v])=>`<tr><td>${k==='-'?'Biriktirilmagan':esc(nameOf(k))}</td><td>${v.o||0}</td><td>${v.n}</td><td>${money(v.s,cur)}</td></tr>`).join('')}</tbody></table>`:'<div class="muted">Ma\'lumot yo\'q</div>'}</div>
  </div>`;
}

/* ---------- settings ---------- */
let draft = null, integ = null, setTab = 'voronka';
async function loadIntegrations(){
  const { data } = await sb.from('integrations').select('*');
  integ = {}; (data||[]).forEach(r => integ[r.key] = r.config || {});
  if (ui.view === 'sozlamalar') renderSettings();
}
async function saveIntegration(key, patch){
  const config = {...(integ[key]||{}), ...patch};
  const { error } = await sb.from('integrations').upsert({key, config, updated_at: nowISO()});
  if (error) return toast('Saqlanmadi: ' + error.message);
  integ[key] = config; toast('Saqlandi');
}
function renderSettings(){
  const tabs = [['voronka','Voronkalar'],['jamoa','Jamoa'],['integratsiya','Integratsiyalar']];
  topBar('Sozlamalar', tabs.map(([k,l])=>`<button class="btn ${setTab===k?'primary':''}" data-tab="${k}">${l}</button>`).join(''));
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ setTab=b.dataset.tab; draft=null; renderSettings(); });
  if (!isAdmin()){ $('#content').innerHTML = `<div class="empty">Sozlamalarni faqat CRM egasi yoki administrator o'zgartira oladi.</div>`; return; }
  if (setTab==='jamoa') return renderTeam();
  if (setTab==='integratsiya') return renderIntegrations();
  renderPipelineSettings();
}
function renderTeam(){
  sb.from('invites').select('*').then(({data}) => {
    if (setTab!=='jamoa' || ui.view!=='sozlamalar') return;
    const ms = Object.values(S.members).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
    const roleName = {owner:'Egasi', admin:'Administrator', agent:'Xodim'};
    $('#content').innerHTML = `<div class="grid" style="max-width:820px">
      <div class="panel"><h3>Jamoa a'zolari</h3><table class="tbl" style="box-shadow:none"><thead><tr><th>Ism</th><th>Email</th><th>Rol</th><th></th></tr></thead><tbody>
      ${ms.map(m=>`<tr><td>${esc(m.name||'')}</td><td>${esc(m.email||'')}</td><td>${m.role==='owner'?'Egasi':`<select class="inp" data-role="${m.userId}" style="width:auto">${['admin','agent'].map(r=>`<option value="${r}" ${m.role===r?'selected':''}>${roleName[r]}</option>`).join('')}</select>`}</td><td>${m.role!=='owner'&&m.userId!==meId?`<button class="btn sm danger" data-mdel="${m.userId}">Chiqarish</button>`:''}</td></tr>`).join('')}</tbody></table></div>
      <div class="panel"><h3>Xodim taklif qilish</h3>
        <p class="muted" style="font-size:13px;margin-top:-4px">Emailni shu yerga qo'shing. Xodim CRM sahifasida shu email bilan ro'yxatdan o'tsa, avtomatik jamoaga qo'shiladi.</p>
        <div class="two" style="grid-template-columns:1fr 150px auto"><input class="inp" id="inv-email" type="email" placeholder="xodim@gmail.com"><select class="inp" id="inv-role"><option value="agent">Xodim</option><option value="admin">Administrator</option></select><button class="btn primary" id="inv-add">Taklif qilish</button></div>
        ${(data||[]).length?`<div class="sec-t">Kutilayotgan takliflar</div>${data.map(i=>`<div class="task"><div style="flex:1">${esc(i.email)} <span class="muted">· ${roleName[i.role]}</span></div><button class="x" style="font-size:16px" data-idel="${esc(i.email)}">×</button></div>`).join('')}`:''}
        <p class="muted" style="font-size:12.5px">CRM manzili: <span class="code" style="display:inline">${esc(location.origin+location.pathname)}</span></p>
      </div></div>`;
    document.querySelectorAll('[data-role]').forEach(s=>s.onchange=async()=>{ const {error}=await sb.from('members').update({role:s.value}).eq('user_id', s.dataset.role); toast(error?'Xato: '+error.message:'Saqlandi'); });
    document.querySelectorAll('[data-mdel]').forEach(b=>b.onclick=()=>confirmBox("Xodimni jamoadan chiqarasizmi?", async()=>{ const {error}=await sb.from('members').delete().eq('user_id', b.dataset.mdel); toast(error?'Xato: '+error.message:'Chiqarildi'); }));
    document.querySelectorAll('[data-idel]').forEach(b=>b.onclick=async()=>{ await sb.from('invites').delete().eq('email', b.dataset.idel); renderTeam(); });
    $('#inv-add').onclick = async () => { const email = $('#inv-email').value.trim().toLowerCase(); if(!/^\S+@\S+\.\S+$/.test(email)) return toast("Email noto'g'ri"); const {error} = await sb.from('invites').upsert({email, role:$('#inv-role').value}); if(error) return toast('Xato: '+error.message); toast('Taklif qo\'shildi'); renderTeam(); };
  });
}
function renderIntegrations(){
  if (!integ){ $('#content').innerHTML = '<div class="loading">Yuklanmoqda…</div>'; loadIntegrations(); return; }
  const base = CFG.supabaseUrl + '/functions/v1/';
  const ps = pipelines();
  const pipeSel = (key) => `<select class="inp" id="pipe-${key}" style="width:auto"><option value="">Birinchi voronka</option>${ps.map(p=>`<option value="${p.id}" ${integ[key]?.pipeline_id===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`;
  const respSel = (key) => `<select class="inp" id="resp-${key}" style="width:auto"><option value="">Biriktirilmagan</option>${teamList().map(([u,n])=>`<option value="${esc(u)}" ${integ[key]?.responsible===u?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
  const phoneUrl = integ.telefon?.webhook_key ? base + 'phone-webhook?key=' + integ.telefon.webhook_key : '';
  $('#content').innerHTML = `<div class="grid" style="max-width:900px">
    <div class="panel"><h3><span class="ig">Instagram</span> Direct</h3>
      <div class="fg"><label>Webhook manzili (Meta Developers → Instagram → Webhooks → Callback URL)</label><span class="code">${esc(base+'instagram-webhook')}</span></div>
      <div class="two"><div class="fg"><label>Yangi lidlar qaysi voronkaga tushsin</label>${pipeSel('instagram')}</div><div class="fg"><label>Mas'ul xodim</label>${respSel('instagram')}</div></div>
      <button class="btn sm" id="ig-save">Saqlash</button>
      <div class="sec-t">Test: soxta Instagram xabar yuborish</div>
      <p class="muted" style="font-size:13px;margin-top:-4px">Meta ulanmasdan turib CRM qanday ishlashini sinab ko'rish uchun. Xabar haqiqiy Instagram'dan kelgandek qayta ishlanadi.</p>
      <div class="two" style="grid-template-columns:160px 1fr auto"><input class="inp" id="sim-ig-user" placeholder="username" value="test_mijoz"><input class="inp" id="sim-ig-text" value="Assalomu alaykum, narxi qancha?"><button class="btn primary" id="sim-ig">Yuborish</button></div>
    </div>
    <div class="panel"><h3>📞 Telefon (virtual ATS)</h3>
      <p class="muted" style="font-size:13px;margin-top:-4px">Oddiy SIM-karta ulanmaydi. OnlinePBX, Zadarma va shunga o'xshash virtual ATS'ning "Webhook / API" bo'limiga quyidagi manzilni kiriting.</p>
      <div class="fg"><label>Webhook manzili (maxfiy — tarqatmang)</label><span class="code">${esc(phoneUrl||'—')}</span></div>
      <div class="two"><div class="fg"><label>Yangi lidlar qaysi voronkaga tushsin</label>${pipeSel('telefon')}</div><div class="fg"><label>Mas'ul xodim</label>${respSel('telefon')}</div></div>
      <button class="btn sm" id="ph-save">Saqlash</button>
      <div class="sec-t">Test: soxta qo'ng'iroq</div>
      <div class="two" style="grid-template-columns:1fr 120px auto"><input class="inp" id="sim-ph" value="+998 90 111 22 33"><input class="inp" id="sim-dur" value="65" placeholder="soniya"><button class="btn primary" id="sim-call">Qo'ng'iroq</button></div>
    </div></div>`;
  $('#ig-save').onclick = () => saveIntegration('instagram', {pipeline_id: $('#pipe-instagram').value||null, responsible: $('#resp-instagram').value||null});
  $('#ph-save').onclick = () => saveIntegration('telefon', {pipeline_id: $('#pipe-telefon').value||null, responsible: $('#resp-telefon').value||null});
  $('#sim-ig').onclick = async () => {
    const key = integ.test?.key; if (!key) return toast('Test kaliti topilmadi');
    const uname = $('#sim-ig-user').value.trim().replace(/^@/,'') || 'test_mijoz';
    const body = {object:'instagram', entry:[{id:'TEST_PAGE', time:Date.now(), messaging:[{sender:{id:'TEST_'+uname}, recipient:{id:'TEST_PAGE'}, timestamp:Date.now(), _test_username: uname, message:{mid:'test_'+uid(), text:$('#sim-ig-text').value}}]}]};
    $('#sim-ig').disabled = true;
    try{ const r = await fetch(base+'instagram-webhook', {method:'POST', headers:{'Content-Type':'application/json','x-crm-test-key':key}, body:JSON.stringify(body)}); toast(r.ok ? '✓ Xabar yuborildi — Voronkani oching' : 'Xato: '+await r.text(), 5000); }
    catch(e){ toast('Xato: '+e.message); }
    $('#sim-ig').disabled = false;
  };
  $('#sim-call').onclick = async () => {
    if (!phoneUrl) return toast('Telefon kaliti topilmadi');
    $('#sim-call').disabled = true;
    try{ const r = await fetch(phoneUrl, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({direction:'inbound', caller:$('#sim-ph').value, duration:$('#sim-dur').value, status:'answered', call_id:'test-'+uid()})}); toast(r.ok ? "✓ Qo'ng'iroq yozildi — Voronkani oching" : 'Xato: '+await r.text(), 5000); }
    catch(e){ toast('Xato: '+e.message); }
    $('#sim-call').disabled = false;
  };
}
function renderPipelineSettings(){
  const ps = pipelines();
  const bar = `<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"><button class="btn" id="addtpl">+ Shablondan voronka</button><button class="btn" id="addpipe">+ Bo'sh voronka</button></div>`;
  if(!ps.length){ $('#content').innerHTML = bar + `<div class="empty">Voronka yo'q.</div>`; bindPipeAdd(ps); return; }
  const p = ps.find(x=>x.id===ui.setPipe) || ps[0];
  if(!draft || draft.id!==p.id) draft = clone(S.pipelines[p.id]);
  const cnt = sid => Object.values(S.deals).filter(d=>d.pipelineId===p.id && d.stageId===sid).length;
  $('#content').innerHTML = bar + `<div style="display:grid;grid-template-columns:220px 1fr;gap:16px" class="setgrid">
    <div class="panel" style="padding:8px;align-self:start">${ps.map(x=>`<div class="nav"><a style="color:var(--ink);cursor:pointer;${x.id===p.id?'background:var(--accent-soft);color:var(--accent)':''}" data-sp="${x.id}">${esc(x.name)} <span class="muted" style="margin-left:auto;font-size:12px">${dealsOf(x.id).length}</span></a></div>`).join('')}</div>
    <div class="panel">
      <div class="two"><div class="fg"><label>Voronka nomi</label><input class="inp" id="s-name" value="${esc(draft.name)}"></div>
      <div class="fg"><label>Valyuta</label><select class="inp" id="s-cur">${Object.keys(CUR).map(k=>`<option ${k===draft.currency?'selected':''}>${k}</option>`).join('')}</select></div></div>
      <div class="sec-t">Bosqichlar</div>
      <div>${draft.stages.map((s,i)=>`<div class="st-row"><div class="handle"><button data-up="${i}">▲</button><button data-dn="${i}">▼</button></div>
        <input class="inp" data-sn="${i}" value="${esc(s.name)}"><select class="inp" data-stp="${i}"><option value="open" ${s.type==='open'?'selected':''}>Jarayonda</option><option value="won" ${s.type==='won'?'selected':''}>Yutildi</option><option value="lost" ${s.type==='lost'?'selected':''}>Yo'qotildi</option></select>
        <input type="color" data-sc="${i}" value="${esc(s.color)}"><button class="btn sm danger" data-sd="${i}" title="${cnt(s.id)?cnt(s.id)+' ta bitim bor':''}">×</button></div>`).join('')}</div>
      <button class="btn sm" id="s-addst">+ Bosqich</button>
      <div class="sec-t">Bitim maydonlari</div>
      <div>${(draft.fields||[]).map((f,i)=>`<div class="f-row"><input class="inp" data-fl="${i}" value="${esc(f.label)}" placeholder="Nomi">
        <select class="inp" data-ft="${i}">${[['text','Matn'],['number','Raqam'],['date','Sana'],['select',"Ro'yxat"],['phone','Telefon']].map(([v,l])=>`<option value="${v}" ${f.type===v?'selected':''}>${l}</option>`).join('')}</select>
        <input class="inp" data-fo="${i}" value="${esc((f.options||[]).join(', '))}" placeholder="${f.type==='select'?'Variantlar: vergul bilan':'—'}" ${f.type!=='select'?'disabled':''}>
        <button class="btn sm danger" data-fd="${i}">×</button></div>`).join('') || '<div class="muted" style="font-size:13px;margin-bottom:6px">Maydon yo\'q</div>'}</div>
      <button class="btn sm" id="s-addf">+ Maydon</button>
      <p class="muted" style="font-size:12.5px">Maslahat: "Manba" nomli ro'yxat maydonida "Instagram" va "Telefon" variantlari bo'lsa, avtomatik lidlarda manba o'zi belgilanadi.</p>
      <div class="m-f" style="padding:16px 0 0;margin-top:16px"><button class="btn danger" id="s-del">Voronkani o'chirish</button><span class="grow"></span><button class="btn" id="s-reset">Bekor qilish</button><button class="btn primary" id="s-save">Saqlash</button></div>
    </div></div>`;
  if(window.innerWidth<820) document.querySelector('.setgrid').style.gridTemplateColumns='1fr';
  bindPipeAdd(ps);
  document.querySelectorAll('[data-sp]').forEach(a=>a.onclick=()=>{ ui.setPipe=a.dataset.sp; draft=null; renderSettings(); });
  const sync = () => {
    draft.name = $('#s-name').value; draft.currency = $('#s-cur').value;
    document.querySelectorAll('[data-sn]').forEach(el=>draft.stages[+el.dataset.sn].name = el.value);
    document.querySelectorAll('[data-stp]').forEach(el=>draft.stages[+el.dataset.stp].type = el.value);
    document.querySelectorAll('[data-sc]').forEach(el=>draft.stages[+el.dataset.sc].color = el.value);
    document.querySelectorAll('[data-fl]').forEach(el=>draft.fields[+el.dataset.fl].label = el.value);
    document.querySelectorAll('[data-ft]').forEach(el=>draft.fields[+el.dataset.ft].type = el.value);
    document.querySelectorAll('[data-fo]').forEach(el=>draft.fields[+el.dataset.fo].options = el.value.split(',').map(s=>s.trim()).filter(Boolean));
  };
  document.querySelectorAll('[data-ft]').forEach(el=>el.onchange=()=>{ sync(); renderSettings(); });
  document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{ sync(); const i=+b.dataset.up; if(i>0){ [draft.stages[i-1],draft.stages[i]]=[draft.stages[i],draft.stages[i-1]]; } renderSettings(); });
  document.querySelectorAll('[data-dn]').forEach(b=>b.onclick=()=>{ sync(); const i=+b.dataset.dn; if(i<draft.stages.length-1){ [draft.stages[i+1],draft.stages[i]]=[draft.stages[i],draft.stages[i+1]]; } renderSettings(); });
  document.querySelectorAll('[data-sd]').forEach(b=>b.onclick=()=>{ sync(); const i=+b.dataset.sd; const s=draft.stages[i]; if(cnt(s.id)) return toast(`"${s.name}" bosqichida ${cnt(s.id)} ta bitim bor — avval ularni ko'chiring`); if(draft.stages.length<=1) return; draft.stages.splice(i,1); renderSettings(); });
  document.querySelectorAll('[data-fd]').forEach(b=>b.onclick=()=>{ sync(); draft.fields.splice(+b.dataset.fd,1); renderSettings(); });
  $('#s-addst').onclick = () => { sync(); const firstClosed = draft.stages.findIndex(s=>s.type!=='open'); const s = {id:sid(), name:'Yangi bosqich', type:'open', color:COLORS[draft.stages.length%COLORS.length]}; firstClosed<0 ? draft.stages.push(s) : draft.stages.splice(firstClosed,0,s); renderSettings(); };
  $('#s-addf').onclick = () => { sync(); draft.fields = draft.fields||[]; draft.fields.push({id:sid(), label:'', type:'text', options:[]}); renderSettings(); };
  $('#s-reset').onclick = () => { draft = null; renderSettings(); };
  $('#s-save').onclick = async () => { sync(); if(!draft.name.trim()) return toast('Nom kiriting'); const body = {name:draft.name.trim(), currency:draft.currency, stages:draft.stages.filter(s=>s.name.trim()), fields:(draft.fields||[]).filter(f=>f.label.trim())}; if(!body.stages.some(s=>s.type==='open')) return toast("Kamida bitta 'Jarayonda' bosqich kerak"); if (await write('pipelines', p.id, body)){ draft = null; toast('Saqlandi'); renderSettings(); } };
  $('#s-del').onclick = () => { const n = dealsOf(p.id).length; if(n) return toast(`Bu voronkada ${n} ta bitim bor — avval ularni o'chiring yoki ko'chiring`); if(ps.length<=1) return toast("Oxirgi voronkani o'chirib bo'lmaydi"); confirmBox(`"${p.name}" voronkasini o'chirasizmi?`, async ()=>{ await remove('pipelines', p.id); ui.setPipe=null; draft=null; renderSettings(); }); };
}
function bindPipeAdd(ps){
  $('#addpipe').onclick = async () => { const id = uid(); if (await write('pipelines', id, {name:'Yangi voronka', currency:'UZS', sort:ps.length, stages:[{id:sid(),name:'Yangi',type:'open',color:COLORS[0]},{id:sid(),name:'Jarayonda',type:'open',color:COLORS[1]},{id:sid(),name:'Yutildi',type:'won',color:WON_C},{id:sid(),name:"Yo'qotildi",type:'lost',color:LOST_C}], fields:[]})){ ui.setPipe = id; draft = null; renderSettings(); } };
  $('#addtpl').onclick = () => {
    openModal(`<div class="m-h"><h2>Shablon tanlang</h2><button class="x" data-close>×</button></div><div class="m-b"><div class="tpl-grid">${Object.entries(TEMPLATES).map(([k,t])=>`<div class="tpl" data-tpl="${k}"><div class="e">${t.emoji}</div><div class="n">${esc(t.name)}</div><div class="d">${esc(t.desc)}</div></div>`).join('')}</div></div>`);
    document.querySelectorAll('#modal .tpl').forEach(el => el.onclick = async () => { const id = uid(); closeModal(); if (await write('pipelines', id, pipelineFromTemplate(el.dataset.tpl, pipelines().length))){ ui.setPipe = id; draft = null; toast("Voronka qo'shildi"); render(); } });
  };
}

/* ============ boot ============ */
function route(){ const h = location.hash.replace('#',''); ui.view = VIEWS.some(v=>v[0]===h) ? h : 'voronka'; draft = null; if (ui.view==='sozlamalar') integ = null; render(); }
window.addEventListener('hashchange', route);
async function boot(s){
  session = s; meId = s ? s.user.id : null;
  if (!s){ booted = false; if (channel){ sb.removeChannel(channel); channel = null; } Object.keys(S).forEach(k=>S[k]={}); me = null; $('#root').innerHTML=''; render(); return; }
  booted = false; render();
  await loadAll();
  booted = true;
  subscribe();
  route();
}
let lastUser = undefined;
sb.auth.onAuthStateChange((_ev, s) => {
  const u = s ? s.user.id : null;
  session = s;
  if (u === lastUser) return; // token refresh
  lastUser = u;
  setTimeout(() => boot(s), 0);
});
