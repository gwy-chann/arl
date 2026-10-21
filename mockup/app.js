/* ARLQ Inventory Monitoring and Sales System: interactive mockup (no backend) */
(function(){
'use strict';

/* ------------------------------------------------------------------ data */
const TODAY = new Date(2026, 9, 14);
const SIZES = [{k:'350',l:'350 ml'},{k:'1L',l:'1 L'},{k:'gal',l:'1 gal'}];
const sizeLabel = k => SIZES.find(s=>s.k===k).l;

const S = {
  cats:[{id:'c1',name:'Soy sauce'},{id:'c2',name:'Vinegar'},{id:'c3',name:'Fish sauce'}],
  products:[
    {id:'toyo',name:'Toyo',cat:'c1',variants:[
      {id:'toyo-350',size:'350',cost:14,price:20,stock:96,min:48},
      {id:'toyo-1L',size:'1L',cost:38,price:50,stock:58,min:30},
      {id:'toyo-gal',size:'gal',cost:125,price:160,stock:17,min:12}]},
    {id:'suka',name:'Suka',cat:'c2',variants:[
      {id:'suka-350',size:'350',cost:11,price:16,stock:72,min:48},
      {id:'suka-1L',size:'1L',cost:30,price:42,stock:34,min:24},
      {id:'suka-gal',size:'gal',cost:100,price:135,stock:6,min:12}]},
    {id:'patis',name:'Patis',cat:'c3',variants:[
      {id:'patis-350',size:'350',cost:18,price:25,stock:21,min:36},
      {id:'patis-1L',size:'1L',cost:48,price:62,stock:40,min:24},
      {id:'patis-gal',size:'gal',cost:160,price:200,stock:14,min:12}]}
  ],
  customers:[
    {id:'k1',name:"Aling Nena's Sari-Sari Store",phone:'0917 301 4488',addr:'Purok 3, Brgy. San Roque'},
    {id:'k2',name:'Mang Tonyo Carinderia',phone:'0928 554 1290',addr:'Public Market Stall 14'},
    {id:'k3',name:'Lola Remedios Eatery',phone:'0935 882 7013',addr:'Rizal St., Brgy. Poblacion'},
    {id:'k4',name:'Kristine Dela Cruz',phone:'0906 447 2251',addr:'Lot 8, Mabini Subdivision'},
    {id:'k5',name:'Bigasan ni Ben',phone:'0919 660 3382',addr:'National Highway, Brgy. Bagong Silang'},
    {id:'k6',name:'Marites Food Stall',phone:'0945 213 9904',addr:'Terminal Road'},
    {id:'k7',name:'Tito Boy Lechon Haus',phone:'0927 774 1156',addr:'Brgy. Santo Niño'},
    {id:'k8',name:"Jun-Jun's Turo-Turo",phone:'0998 120 6677',addr:'Corner Luna and Bonifacio St.'}
  ],
  sales:[],
  moves:[],
  settings:{days:7,mobile:'0917 555 0142',channel:'SMS'}
};

/* seed sales: [daysAgo, customer, [[variant, qty]...], paid ('P' = full), order] */
const seed = [
  [0,'k1',[['toyo-1L',6],['suka-1L',4]],'P','Pending'],
  [0,'k2',[['patis-gal',2],['toyo-gal',1]],240,'Pending'],
  [1,'k6',[['toyo-350',24],['suka-350',12]],'P','Picked Up'],
  [1,'k7',[['toyo-gal',3],['suka-gal',2],['patis-gal',2]],0,'Delivered'],
  [2,'k3',[['patis-1L',6]],'P','Delivered'],
  [3,'k5',[['suka-350',24],['toyo-350',24],['patis-350',12]],'P','Picked Up'],
  [4,'k8',[['toyo-1L',4],['patis-1L',3]],200,'Delivered'],
  [5,'k4',[['toyo-350',6]],'P','Picked Up'],
  [6,'k2',[['toyo-1L',8],['suka-1L',6]],'P','Delivered'],
  [8,'k1',[['patis-350',12],['toyo-350',12]],0,'Delivered'],
  [9,'k7',[['toyo-gal',2],['patis-gal',2]],300,'Delivered'],
  [11,'k3',[['suka-1L',6],['toyo-1L',4]],'P','Delivered'],
  [12,'k6',[['suka-350',24]],0,'Picked Up'],
  [14,'k5',[['toyo-350',48],['suka-350',24]],'P','Picked Up'],
  [17,'k8',[['patis-gal',3]],'P','Delivered'],
  [21,'k2',[['toyo-gal',4],['suka-gal',3]],'P','Delivered'],
  [25,'k1',[['toyo-1L',6],['patis-1L',4]],'P','Delivered'],
  [30,'k7',[['toyo-gal',5],['patis-gal',3],['suka-gal',2]],'P','Delivered'],
  [36,'k3',[['patis-350',18],['toyo-350',18]],'P','Picked Up'],
  [42,'k5',[['suka-1L',10],['toyo-1L',10]],'P','Delivered'],
  [51,'k2',[['toyo-gal',4],['patis-gal',2]],'P','Delivered'],
  [58,'k6',[['toyo-350',24],['suka-350',24]],'P','Picked Up'],
  [66,'k7',[['toyo-gal',4],['suka-gal',4]],'P','Delivered'],
  [72,'k1',[['patis-1L',8]],'P','Delivered']
];
const priceOf = id => { for(const p of S.products) for(const v of p.variants) if(v.id===id) return v; };
seed.slice().reverse().forEach((r,i)=>{
  const items = r[2].map(([vid,q])=>{const v=priceOf(vid);return {vid,qty:q,price:v.price,cost:v.cost};});
  const total = items.reduce((a,b)=>a+b.qty*b.price,0);
  S.sales.push({id:'s'+(i+1),no:'ARLQ-'+String(1040+i+1).padStart(5,'0'),ago:r[0],cust:r[1],items,
    paid:r[3]==='P'?total:r[3],order:r[4]});
});
S.sales.sort((a,b)=>a.ago-b.ago||b.no.localeCompare(a.no));

const mv=(ago,type,vid,qty,note)=>S.moves.push({ago,type,vid,qty,note,id:S.moves.length});
mv(0,'Out','toyo-1L',6,'Sale ARLQ-01064');mv(0,'Out','suka-1L',4,'Sale ARLQ-01064');
mv(2,'In','toyo-350',96,'Restock from warehouse');mv(2,'In','suka-350',72,'Restock from warehouse');
mv(3,'Out','suka-gal',1,'Damaged: cracked cap');
mv(5,'In','patis-1L',48,'Restock from warehouse');
mv(7,'Out','patis-350',2,'Sample for new customer');
mv(9,'In','toyo-gal',24,'Restock from warehouse');
mv(13,'In','suka-1L',36,'Restock from warehouse');
mv(16,'Out','toyo-350',3,'Spilled during repack');
mv(20,'In','patis-gal',18,'Restock from warehouse');
mv(27,'In','patis-350',48,'Restock from warehouse');

/* ---------------------------------------------------------------- helpers */
const $ = s => document.querySelector(s);
const peso = n => '₱' + Number(n).toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:2});
const pesoD = n => '₱' + Number(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const dateOf = ago => { const d=new Date(TODAY); d.setDate(d.getDate()-ago); return d; };
const fmtDate = ago => dateOf(ago).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
const fmtShort = ago => dateOf(ago).toLocaleDateString('en-PH',{month:'short',day:'numeric'});
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cust = id => S.customers.find(c=>c.id===id);
const prod = id => S.products.find(p=>p.id===id);
const allVars = () => S.products.flatMap(p=>p.variants.map(v=>({...v,p,ref:v})));
const V = vid => allVars().find(v=>v.id===vid);
const vlabel = vid => { const v=V(vid); return v ? `${v.p.name} - ${sizeLabel(v.size)}` : vid; };
const total = s => s.items.reduce((a,i)=>a+i.qty*i.price,0);
const profit = s => s.items.reduce((a,i)=>a+i.qty*(i.price-i.cost),0);
const balance = s => Math.max(0,total(s)-s.paid);
const payStatus = s => balance(s)<=0 ? 'Paid' : (s.paid>0 ? 'Partially Paid' : 'Not Yet Paid');
const isOverdue = s => balance(s)>0 && s.ago>=S.settings.days;
const isLow = v => v.stock<=v.min;
const lowVars = () => allVars().filter(isLow);
const catName = id => (S.cats.find(c=>c.id===id)||{name:'Uncategorized'}).name;
const sale = id => S.sales.find(s=>s.id===id);
const unpaid = () => S.sales.filter(s=>balance(s)>0);
const custBal = id => S.sales.filter(s=>s.cust===id).reduce((a,s)=>a+balance(s),0);
const nextNo = () => 'ARLQ-' + String(1040+S.sales.length+1).padStart(5,'0');
const uid = () => Math.random().toString(36).slice(2,8);

const ICONS = {
  home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  cart:'<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.2a1 1 0 001 .8h9.2a1 1 0 001-.8L21 7H6"/>',
  box:'<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  tag:'<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  users:'<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c.5-3.6 3.2-5.6 6.5-5.6s6 2 6.5 5.6"/><path d="M16 4.8a3.2 3.2 0 010 6.4M18 14.6c2 .7 3.2 2.4 3.5 5.4"/>',
  chart:'<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-5M12 16V7M16 16v-8"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5h0a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  out:'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  print:'<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M6 15h12v6H6z"/>',
  back:'<path d="M15 18l-6-6 6-6"/>',
  x:'<path d="M18 6L6 18M6 6l12 12"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert:'<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.1"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon:'<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'
};
const ico = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||''}</svg>`;

/* ---------------------------------------------------------------- storage & theme */
const storage = {
  get(k, fallback=null){ try{ return localStorage.getItem(k) ?? fallback; }catch(e){ return fallback; } },
  set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} },
  sessionGet(k, fallback=null){ try{ return sessionStorage.getItem(k) ?? fallback; }catch(e){ return fallback; } },
  sessionSet(k, v){ try{ sessionStorage.setItem(k, v); }catch(e){} },
  sessionRemove(k){ try{ sessionStorage.removeItem(k); }catch(e){} }
};

let currentTheme = storage.get('arlq-theme', 'auto');
function getEffectiveTheme(){
  if(currentTheme === 'auto'){
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  return currentTheme;
}
function isDark(){ return getEffectiveTheme() === 'dark'; }
function applyTheme(t){
  currentTheme = t;
  storage.set('arlq-theme', t);
  const eff = getEffectiveTheme();
  if(eff === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  rerender();
}
if(window.matchMedia){
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
    if(currentTheme === 'auto'){
      const eff = getEffectiveTheme();
      if(eff === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      rerender();
    }
  });
}

const pill = (txt,k) => `<span class="pill ${k}">${txt}</span>`;
const payPill = st => pill(st, st==='Paid'?'ok':st==='Partially Paid'?'warn':'bad');
const orderPill = st => pill(st, st==='Pending'?'warn':'info');

function toast(msg){
  const t=document.createElement('div');t.className='toast';t.innerHTML=ico('check')+esc(msg);
  $('#toasts').appendChild(t);setTimeout(()=>t.remove(),2800);
}
function modal(html){ $('#modal-root').innerHTML=`<div class="modal-back" onclick="if(event.target===this)A.closeModal()"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const f=$('#modal-root input,#modal-root select'); if(f) f.focus(); }

let confirmCb=null;
function confirmBox(title,msg,label,cb){
  confirmCb=cb;
  modal(`<h3>${title}</h3><div class="mb"><p class="muted">${msg}</p></div>
  <div class="mf"><button class="btn sec" onclick="A.closeModal()">Cancel</button><button class="btn danger" onclick="A.doConfirm()">${label}</button></div>`);
}

/* ---------------------------------------------------------------- layout */
let authed = storage.sessionGet('arlq')==='1';

const NAV = [
  {k:'dashboard',l:'Dashboard',i:'home',h:'#/dashboard'},
  {k:'sales',l:'Sales',i:'cart',h:'#/sales',sub:[['New sale','#/sales/new','sales/new'],['Sales list','#/sales','sales']]},
  {k:'inventory',l:'Inventory',i:'box',h:'#/inventory',sub:[['Stock overview','#/inventory','inventory'],['Stock in','#/inventory/in','inventory/in'],['Stock out','#/inventory/out','inventory/out'],['Low stock alerts','#/inventory/low','inventory/low'],['Movement history','#/inventory/history','inventory/history']]},
  {k:'products',l:'Products',i:'tag',h:'#/products',sub:[['Product list','#/products','products'],['Categories','#/products/categories','products/categories']]},
  {k:'customers',l:'Customers',i:'users',h:'#/customers',sub:[['Customer list','#/customers','customers'],['Customers with balances','#/customers/balances','customers/balances']]},
  {k:'reports',l:'Reports',i:'chart',h:'#/reports/sales'},
  {k:'settings',l:'Settings',i:'gear',h:'#/settings/reminders'}
];

function shell(section,sub,body){
  const alerts = unpaid().filter(isOverdue).length + lowVars().length;
  const nav = NAV.map(n=>{
    const on = n.k===section;
    let h = `<a href="${n.h}" class="${on?'on':''}">${ico(n.i)}${n.l}${n.k==='dashboard'&&alerts?`<span class="badge-n">${alerts}</span>`:''}</a>`;
    if(on && n.sub) h += `<div class="subnav">${n.sub.map(s=>`<a href="${s[1]}" class="${s[2]===sub?'on':''}">${s[0]}</a>`).join('')}</div>`;
    return h;
  }).join('');
  return `<div class="shell">
  <aside class="sidebar" id="sidebar">
    <div class="side-logo"><div class="logo-mark" role="img" aria-label="ARL Quality logo"></div><span>Food Condiments Trading<br>Inventory and Sales</span></div>
    <nav class="nav" aria-label="Main">${nav}</nav>
    <div class="side-foot">
      <div class="who"><div class="avatar">AD</div><div><b>Administrator</b><span>Owner account</span></div></div>
      <div class="nav" style="padding:0">
        <button onclick="A.logout()">${ico('out')}Log out</button>
      </div>
    </div>
  </aside>
  <div class="scrim" id="scrim" onclick="A.menu(false)"></div>
  <div class="main">
    <header class="topbar">
      <button class="icon-btn menu-btn" onclick="A.menu(true)" aria-label="Open menu">${ico('menu')}</button>
      <div class="topbar-brand logo-mark" role="img" aria-label="ARL Quality logo"></div>
      <div class="topbar-right">
        <button class="theme-toggle-btn" onclick="A.toggleTheme()" aria-label="Toggle theme">
          ${ico(isDark()?'sun':'moon')}
          <span>${isDark()?'Light mode':'Dark mode'}</span>
        </button>
      </div>
    </header>
    <main class="page" id="page">${body}</main>
  </div></div>`;
}

const head = (title,sub,actions,crumbs) => `<div>${crumbs?`<div class="crumb">${crumbs}</div>`:''}</div>
  <div class="page-head"><div><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div><div class="actions">${actions||''}</div></div>`;
const crumb = (...a) => a.map((x,i)=> i<a.length-1?`<a href="${x[1]}">${x[0]}</a><span>/</span>`:`<span>${x[0]}</span>`).join('');
const searchBox = (tid,ph) => `<div class="search">${ico('search')}<input type="search" placeholder="${ph}" aria-label="${ph}" oninput="A.tf(this,'${tid}')"></div>`;
const empty = (t,m) => `<div class="empty"><b>${t}</b>${m}</div>`;

/* ---------------------------------------------------------------- views */
function loginView(){
  return `<div class="login">
    <div class="login-theme-toggle">
      <button class="btn sec sm" onclick="A.toggleTheme()" aria-label="Toggle dark mode">${ico(isDark()?'sun':'moon')}${isDark()?'Light mode':'Dark mode'}</button>
    </div>
    <section class="login-brand"><div class="top">
      <div class="logo-mark" role="img" aria-label="ARL Quality logo"></div>
      <div><h1>Know what’s on the shelf and who still owes you.</h1>
      <p>Stock levels, sales and utang for your toyo, suka and patis business, in one place.</p></div></div>
      <small>ARLQ Food Condiments Trading</small>
    </section>
    <section class="login-form-wrap">
      <div class="login-card">
        <form class="login-form" onsubmit="A.login(event)">
          <h2>Log in</h2><p class="sub">Administrator access only.</p>
          <div class="field"><label for="u">Username</label><input id="u" type="text" value="admin" autocomplete="username" required></div>
          <div class="field"><label for="pw">Password</label><input id="pw" type="password" value="password123" autocomplete="current-password" required></div>
          <button class="btn block" type="submit">Log in</button>
          <p class="hint muted" style="margin-top:20px;font-size:14px;text-align:center">Forgot your password? Contact the system developer to reset it.</p>
        </form>
      </div>
    </section></div>`;
}

/* ---- dashboard */
function dashboard(){
  const todayS = S.sales.filter(s=>s.ago===0);
  const monthS = S.sales.filter(s=>dateOf(s.ago).getMonth()===TODAY.getMonth());
  const out = unpaid().reduce((a,s)=>a+balance(s),0);
  const low = lowVars();
  const overdue = unpaid().filter(isOverdue).sort((a,b)=>b.ago-a.ago);
  const notices = [
    ...overdue.map(s=>`<div class="notice"><span class="dot bad"></span><p><b>${esc(cust(s.cust).name)}</b> owes ${pesoD(balance(s))}<small>Receipt ${s.no} · unpaid for ${s.ago} days · SMS reminder sent</small></p><a class="btn sec sm" href="#/sales/${s.id}">Open sale</a></div>`),
    ...low.map(v=>`<div class="notice"><span class="dot warn"></span><p><b>${v.p.name} - ${sizeLabel(v.size)}</b> is running low<small>${v.stock} left · minimum is ${v.min}</small></p><a class="btn sec sm" href="#/inventory/in">Stock in</a></div>`)
  ];
  const days=[...Array(7)].map((_,i)=>6-i);
  const dayTot=days.map(d=>S.sales.filter(s=>s.ago===d).reduce((a,s)=>a+total(s),0));
  const mx=Math.max(...dayTot,1);
  const bars=days.map((d,i)=>`<div class="bar ${d===0?'cur':''}"><em>${dayTot[i]?peso(dayTot[i]):''}</em><i style="height:${Math.max(dayTot[i]/mx*100,1.5)}%"></i><span>${d===0?'Today':dateOf(d).toLocaleDateString('en-PH',{weekday:'short'})}</span></div>`).join('');
  const stockRows = S.products.map(p=>`<tr><td><b>${p.name}</b></td>${p.variants.map(v=>`<td><div class="level"><b>${v.stock}</b><div class="meter ${isLow(v)?'low':''}"><i style="width:${Math.min(v.stock/(v.min*2.5)*100,100)}%"></i></div></div></td>`).join('')}</tr>`).join('');
  const bal = Object.values(S.sales.reduce((m,s)=>{const b=balance(s);if(b>0){(m[s.cust]=m[s.cust]||{id:s.cust,b:0,oldest:0});m[s.cust].b+=b;m[s.cust].oldest=Math.max(m[s.cust].oldest,s.ago);}return m;},{})).sort((a,b)=>b.b-a.b).slice(0,5);

  return head('Good day, Admin',TODAY.toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'}),
    `<a class="btn" href="#/sales/new">${ico('plus')}New sale</a><a class="btn sec" href="#/inventory/in">${ico('box')}Stock in</a>`) + `
  <div class="stats">
    <div class="stat"><span>Sales today</span><b>${peso(todayS.reduce((a,s)=>a+total(s),0))}</b><small>${todayS.length} transactions</small></div>
    <div class="stat"><span>Sales this month</span><b>${peso(monthS.reduce((a,s)=>a+total(s),0))}</b><small>Profit ${peso(monthS.reduce((a,s)=>a+profit(s),0))}</small></div>
    <div class="stat ${out?'alert':''}"><span>Outstanding balances</span><b>${peso(out)}</b><small>${unpaid().length} unpaid sales</small></div>
    <div class="stat ${low.length?'alert':''}"><span>Low stock items</span><b>${low.length} of 9</b><small>at or below minimum</small></div>
  </div>
  <div class="dash-grid">
    <div class="stack">
      <section class="card"><div class="card-h"><h2>Notifications</h2>${pill(notices.length+' need attention',notices.length?'bad':'ok')}</div>
        ${notices.join('')||empty('All clear','No overdue balances or low stock.')}</section>
      <section class="card"><div class="card-h"><h2>Sales, last 7 days</h2><a class="link" href="#/reports/sales">Full report</a></div><div class="card-b"><div class="bars">${bars}</div></div></section>
    </div>
    <div class="stack">
      <section class="card"><div class="card-h"><h2>Stock on hand</h2><a class="link" href="#/inventory">Details</a></div>
        <div class="tbl-wrap"><table class="stockgrid"><thead><tr><th>Product</th>${SIZES.map(s=>`<th>${s.l}</th>`).join('')}</tr></thead><tbody>${stockRows}</tbody></table></div></section>
      <section class="card"><div class="card-h"><h2>Who owes you</h2><a class="link" href="#/customers/balances">See all</a></div>
        <div class="rowlist">${bal.map(r=>`<a class="r" href="#/customers/${r.id}"><div>${esc(cust(r.id).name)}<small>Oldest unpaid: ${r.oldest} days</small></div><div style="text-align:right"><b>${pesoD(r.b)}</b><br>${r.oldest>=S.settings.days?pill('Overdue','bad'):''}</div></a>`).join('')||empty('No balances','Everyone has paid.')}</div></section>
    </div>
  </div>`;
}

/* ---- products */
function productList(){
  const rows = S.products.map(p=>p.variants.map((v,i)=>`<tr data-s="${p.name} ${catName(p.cat)} ${sizeLabel(v.size)}">
    ${i===0?`<td rowspan="3" style="vertical-align:middle;border-right:1px solid var(--line)"><b style="font-size:15.5px">${p.name}</b><br><span class="muted">${catName(p.cat)}</span></td>`:''}
    <td>${sizeLabel(v.size)}</td><td class="num">${peso(v.cost)}</td><td class="num">${peso(v.price)}</td><td class="num">${peso(v.price-v.cost)}</td><td class="num">${v.stock}</td><td class="num">${v.min}</td>
    ${i===0?`<td rowspan="3" style="vertical-align:middle;text-align:right;white-space:nowrap;width:150px"><div style="display:inline-flex;gap:6px"><a class="btn sec sm" href="#/products/${p.id}/edit">${ico('edit')}Edit</a> <button class="btn danger sm" onclick="A.delProduct('${p.id}')">${ico('trash')}Delete</button></div></td>`:''}</tr>`).join('')).join('');
  return head('Products','Three products, three sizes each: nine sellable items.',`<a class="btn" href="#/products/new">${ico('plus')}Add product</a>`)+
  `<div class="card"><div class="toolbar">${searchBox('ptbl','Search products or sizes')}</div>
  <div class="tbl-wrap"><table id="ptbl"><thead><tr><th style="width:24%">Product</th><th style="width:13%">Size</th><th class="num" style="width:11%">Cost</th><th class="num" style="width:13%">Selling price</th><th class="num" style="width:11%">Profit each</th><th class="num" style="width:10%">In stock</th><th class="num" style="width:10%">Minimum</th><th style="width:150px;text-align:right"></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function productForm(id){
  const p = id ? prod(id) : null;
  const vs = SIZES.map(sz=>p?p.variants.find(v=>v.size===sz.k):null);
  return head(p?`Edit ${p.name}`:'Add product',p?'Update prices and minimum stock for each size.':'Set the product and the price of each size.','',crumb(['Products','#/products'],[p?'Edit':'Add'])) + `
  <form class="card form-card" onsubmit="A.saveProduct(event,'${id||''}')">
    <div class="card-b grid2">
      <div class="field"><label for="pn">Product name</label><input id="pn" type="text" value="${p?esc(p.name):''}" required placeholder="e.g. Toyo"></div>
      <div class="field"><label for="pc">Category</label><select id="pc">${S.cats.map(c=>`<option value="${c.id}" ${p&&p.cat===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
    </div>
    <div class="card-b"><h3 style="font-size:15px;margin-bottom:4px">Size variants</h3><p class="muted" style="margin-bottom:12px">Cost and selling price are used to work out profit on every sale.</p>
    <div class="tbl-wrap"><table class="var-table"><thead><tr><th>Size</th><th>Cost price (₱)</th><th>Selling price (₱)</th><th>Minimum stock</th>${p?'':'<th>Opening stock</th>'}</tr></thead><tbody>
    ${SIZES.map((sz,i)=>{const v=vs[i];return `<tr><td><b>${sz.l}</b></td>
      <td><input type="number" min="0" step="0.01" id="cost-${sz.k}" value="${v?v.cost:''}" required aria-label="${sz.l} cost price"></td>
      <td><input type="number" min="0" step="0.01" id="price-${sz.k}" value="${v?v.price:''}" required aria-label="${sz.l} selling price"></td>
      <td><input type="number" min="0" id="min-${sz.k}" value="${v?v.min:''}" required aria-label="${sz.l} minimum stock"></td>
      ${p?'':`<td><input type="number" min="0" id="open-${sz.k}" value="0" aria-label="${sz.l} opening stock"></td>`}</tr>`}).join('')}
    </tbody></table></div></div>
    <div class="form-foot"><a class="btn sec" href="#/products">Cancel</a><button class="btn" type="submit">Save product</button></div>
  </form>`;
}
function categoryList(){
  return head('Categories','Group products so they are easier to find.',`<button class="btn" onclick="A.catModal()">${ico('plus')}Add category</button>`,crumb(['Products','#/products'],['Categories']))+
  `<div class="card" style="max-width:640px"><div class="toolbar">${searchBox('ctbl','Search categories')}</div><div class="tbl-wrap"><table id="ctbl"><thead><tr><th>Category</th><th class="num">Products</th><th></th></tr></thead><tbody>
  ${S.cats.map(c=>`<tr data-s="${esc(c.name)}"><td><b>${esc(c.name)}</b></td><td class="num">${S.products.filter(p=>p.cat===c.id).length}</td><td style="text-align:right;white-space:nowrap"><button class="btn sec sm" onclick="A.catModal('${c.id}')">${ico('edit')}Rename</button> <button class="btn danger sm" onclick="A.delCat('${c.id}')">${ico('trash')}Delete</button></td></tr>`).join('')}
  </tbody></table></div></div>`;
}

/* ---- inventory */
function invTabs(on){
  const t=[['#/inventory','Overview','inventory'],['#/inventory/in','Stock in','in'],['#/inventory/out','Stock out','out'],['#/inventory/low','Low stock alerts','low'],['#/inventory/history','Movement history','history']];
  return `<div class="tabs">${t.map(x=>`<a href="${x[0]}" class="${x[2]===on?'on':''}">${x[1]}</a>`).join('')}</div>`;
}
const stockStatus = v => v.stock===0?pill('Out of stock','bad'):isLow(v)?pill('Low stock','warn'):v.stock<=v.min*1.4?pill('Getting low','warn'):pill('In stock','ok');
function inventory(){
  const rows = allVars().map(v=>`<tr data-s="${v.p.name} ${sizeLabel(v.size)}"><td><b>${v.p.name}</b></td><td>${sizeLabel(v.size)}</td>
   <td class="num"><b>${v.stock}</b></td><td class="num">${v.min}</td>
   <td style="width:20%"><div class="meter ${isLow(v)?'low':''}"><i style="width:${Math.min(v.stock/(v.min*2.5)*100,100)}%"></i></div></td><td>${stockStatus(v)}</td>
   <td style="text-align:right;white-space:nowrap"><a class="btn sec sm" href="#/inventory/in?v=${v.id}">Stock in</a> <a class="btn sec sm" href="#/inventory/out?v=${v.id}">Stock out</a></td></tr>`).join('');
  return head('Inventory','Live stock for all nine variants. Sales deduct stock automatically.')+invTabs('inventory')+
   `<div class="card"><div class="toolbar">${searchBox('itbl','Search product or size')}</div><div class="tbl-wrap"><table id="itbl"><thead><tr><th>Product</th><th>Size</th><th class="num">In stock</th><th class="num">Minimum</th><th>Level</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function stockForm(kind,q){
  const isIn = kind==='in', pre = q.v;
  const opts = allVars().map(v=>`<option value="${v.id}" ${pre===v.id?'selected':''}>${v.p.name} - ${sizeLabel(v.size)} (${v.stock} in stock)</option>`).join('');
  const reasons = isIn?['Restock from warehouse','Return from customer','Correction']:['Damaged or spilled','Sample or giveaway','Used for repacking','Correction'];
  return head(isIn?'Stock in':'Stock out',isIn?'Record stock that arrived.':'Record stock that left without a sale.')+invTabs(kind)+
  `<div class="split"><form class="card" onsubmit="A.saveStock(event,'${kind}')">
    <div class="card-b">
      <div class="field"><label for="sv">Product and size</label><select id="sv">${opts}</select></div>
      <div class="grid2"><div class="field"><label for="sq">Quantity</label><input id="sq" type="number" min="1" value="" required placeholder="0"></div>
      <div class="field"><label for="sd">Date</label><input id="sd" type="text" value="${TODAY.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}" readonly></div></div>
      <div class="field"><label for="sr">${isIn?'Source':'Reason'}</label><select id="sr">${reasons.map(r=>`<option>${r}</option>`).join('')}</select></div>
      <div class="field"><label for="sn">Note <span class="muted" style="font-weight:400">(optional)</span></label><input id="sn" type="text" placeholder="e.g. Delivery receipt no."></div>
    </div><div class="form-foot"><a class="btn sec" href="#/inventory">Cancel</a><button class="btn" type="submit">${isIn?'Save stock in':'Save stock out'}</button></div></form>
    <div class="card"><div class="card-h"><h3>Recent ${isIn?'stock in':'stock out'}</h3></div><div class="rowlist">
     ${S.moves.filter(m=>m.type===(isIn?'In':'Out')&&!m.note.startsWith('Sale')).slice(0,5).map(m=>`<div class="r"><div>${vlabel(m.vid)}<small>${fmtDate(m.ago)} · ${esc(m.note)}</small></div><b>${isIn?'+':'-'}${m.qty}</b></div>`).join('')}
    </div></div></div>`;
}
function lowStock(){
  const l=lowVars();
  return head('Low stock alerts','Variants at or below the minimum level.')+invTabs('low')+
  `<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Product</th><th>Size</th><th class="num">In stock</th><th class="num">Minimum</th><th class="num">Short by</th><th></th></tr></thead><tbody>
  ${l.map(v=>`<tr><td><b>${v.p.name}</b></td><td>${sizeLabel(v.size)}</td><td class="num"><b style="color:var(--bad)">${v.stock}</b></td><td class="num">${v.min}</td><td class="num">${v.min-v.stock}</td><td style="text-align:right"><a class="btn sm" href="#/inventory/in?v=${v.id}">Stock in</a></td></tr>`).join('')}
  </tbody></table>${l.length?'':empty('Nothing is low','Every variant is above its minimum level.')}</div></div>
  <p class="muted" style="margin-top:12px">Change thresholds under <a class="link" href="#/settings/stock">Settings, Minimum stock levels</a>.</p>`;
}
function history(){
  return head('Stock movement history','Every stock in, stock out and sale deduction.')+invTabs('history')+
  `<div class="card"><div class="toolbar">${searchBox('mtbl','Search product or note')}
  <select onchange="A.mf(this.value)" aria-label="Type"><option value="">All movements</option><option>In</option><option>Out</option></select></div>
  <div class="tbl-wrap"><table id="mtbl" class="tbl-cards"><thead><tr><th>Date</th><th>Product</th><th>Type</th><th class="num">Qty</th><th>Note</th></tr></thead><tbody>
  ${S.moves.slice().sort((a,b)=>a.ago-b.ago).map(m=>`<tr data-s="${vlabel(m.vid)} ${esc(m.note)}" data-t="${m.type}"><td data-label="Date">${fmtDate(m.ago)}</td><td data-label="Product"><b>${vlabel(m.vid)}</b></td><td data-label="Type">${pill(m.type==='In'?'Stock in':m.note.startsWith('Sale')?'Sale':'Stock out',m.type==='In'?'ok':m.note.startsWith('Sale')?'info':'warn')}</td><td data-label="Quantity" class="num"><b>${m.type==='In'?'+':'-'}${m.qty}</b></td><td data-label="Note" class="muted">${esc(m.note)}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}

/* ---- sales */
let NS = null;
const newNS = () => ({cust:'',lines:[{p:'toyo',sz:'1L',q:1}],pay:'Paid',paid:0,order:'Pending'});
function lineVar(l){ return prod(l.p).variants.find(v=>v.size===l.sz); }
function newSale(){
  if(!NS) NS=newNS();
  const lines=NS.lines.map(l=>({...l,v:lineVar(l)}));
  const tot=lines.reduce((a,l)=>a+l.q*l.v.price,0), prof=lines.reduce((a,l)=>a+l.q*(l.v.price-l.v.cost),0);
  const paid = NS.pay==='Paid'?tot:NS.pay==='Not Yet Paid'?0:Math.min(NS.paid,tot);
  const bad = lines.some(l=>l.q>l.v.stock) || !NS.cust;
  const seg=(name,vals,cur)=>`<div class="seg">${vals.map(v=>`<label class="${cur===v?'on':''}"><input type="radio" name="${name}" ${cur===v?'checked':''} onchange="A.ns('${name}','${v}')">${v}</label>`).join('')}</div>`;
  return head('New sale','Pick the customer and items. Prices, totals and profit fill in for you.','',crumb(['Sales','#/sales'],['New sale']))+`
  <div class="split"><div class="stack">
    <section class="card"><div class="card-b"><div class="field" style="margin:0"><label for="nc">Customer</label>
      <select id="nc" onchange="A.ns('cust',this.value)"><option value="">Choose a customer</option>${S.customers.map(c=>`<option value="${c.id}" ${NS.cust===c.id?'selected':''}>${esc(c.name)}${custBal(c.id)?` (owes ${peso(custBal(c.id))})`:''}</option>`).join('')}</select>
      <span class="hint">New customer? <a class="link" href="#/customers/new">Add customer</a></span></div></div></section>
    <section class="card"><div class="card-h"><h2>Items</h2><button class="btn sec sm" onclick="A.addLine()">${ico('plus')}Add item</button></div>
    ${lines.map((l,i)=>`<div class="line-item">
      <div class="field"><label>Product</label><select onchange="A.line(${i},'p',this.value)" aria-label="Product">${S.products.map(p=>`<option value="${p.id}" ${l.p===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
      <div class="field"><label>Size</label><select onchange="A.line(${i},'sz',this.value)" aria-label="Size">${SIZES.map(s=>`<option value="${s.k}" ${l.sz===s.k?'selected':''}>${s.l} · ${peso(prod(l.p).variants.find(v=>v.size===s.k).price)}</option>`).join('')}</select></div>
      <div class="field"><label>Quantity</label><div class="stepper"><button type="button" onclick="A.qty(${i},-1)" aria-label="Decrease">−</button><input type="number" min="1" value="${l.q}" onchange="A.line(${i},'q',this.value)" aria-label="Quantity"><button type="button" onclick="A.qty(${i},1)" aria-label="Increase">+</button></div></div>
      <div class="amt">${pesoD(l.q*l.v.price)}</div>
      <button class="icon-btn" ${lines.length<2?'disabled style="opacity:.3"':''} onclick="A.rmLine(${i})" aria-label="Remove item">${ico('x')}</button>
      <div class="stock-note">${l.q>l.v.stock?`<b style="color:var(--bad)">Only ${l.v.stock} in stock.</b> Lower the quantity.`:`Unit price ${pesoD(l.v.price)} · ${l.v.stock-l.q} will remain after this sale`}</div>
    </div>`).join('')}</section>
  </div>
  <aside class="card summary"><div class="card-h"><h2>Summary</h2></div><div class="card-b">
    <div class="sum-line"><span>Items</span><span>${lines.reduce((a,l)=>a+l.q,0)} bottles</span></div>
    <div class="sum-line profit"><span>Profit</span><b>${pesoD(prof)}</b></div>
    <div class="sum-line big"><span>Total</span><span>${pesoD(tot)}</span></div>
    <div class="field" style="margin-top:16px"><label>Payment status</label>${seg('pay',['Paid','Partially Paid','Not Yet Paid'],NS.pay)}</div>
    ${NS.pay==='Partially Paid'?`<div class="field"><label for="ap">Amount paid</label><input id="ap" type="number" min="0" max="${tot}" value="${NS.paid||''}" onchange="A.ns('paid',this.value)" placeholder="0.00"></div>`:''}
    <div class="sum-line"><span>Remaining balance</span><b>${pesoD(tot-paid)}</b></div>
    <div class="field" style="margin-top:12px"><label>Order status</label>${seg('order',['Pending','Delivered','Picked Up'],NS.order)}</div>
    <button class="btn block" ${bad?'disabled':''} onclick="A.saveSale()">Save sale</button>
    <p class="hint muted" style="margin-top:10px;font-size:12.5px">${!NS.cust?'Choose a customer to save.':'You can print the receipt after saving.'}</p>
  </div></aside></div>`;
}
function salesList(){
  const rows=S.sales.map(s=>`<tr class="click" onclick="location.hash='#/sales/${s.id}'" data-s="${s.no} ${esc(cust(s.cust).name)}" data-p="${payStatus(s)}" data-o="${s.order}">
    <td data-label="Receipt"><b>${s.no}</b></td>
    <td data-label="Date">${fmtDate(s.ago)}</td>
    <td data-label="Customer">${esc(cust(s.cust).name)}</td>
    <td data-label="Total" class="num"><b>${pesoD(total(s))}</b></td>
    <td data-label="Balance" class="num">${balance(s)?`<b style="color:var(--bad)">${pesoD(balance(s))}</b>`:'<span class="muted">-</span>'}</td>
    <td data-label="Payment">${payPill(payStatus(s))}${isOverdue(s)?' '+pill('Overdue','bad'):''}</td>
    <td data-label="Order">${orderPill(s.order)}</td></tr>`).join('');
  return head('Sales','All recorded transactions.',`<a class="btn" href="#/sales/new">${ico('plus')}New sale</a>`)+
  `<div class="card"><div class="toolbar">${searchBox('stbl','Search receipt or customer')}
   <select onchange="A.sf()" id="sfp" aria-label="Payment status"><option value="">All payments</option><option>Paid</option><option>Partially Paid</option><option>Not Yet Paid</option></select>
   <select onchange="A.sf()" id="sfo" aria-label="Order status"><option value="">All orders</option><option>Pending</option><option>Delivered</option><option>Picked Up</option></select></div>
  <div class="tbl-wrap"><table id="stbl" class="tbl-cards"><thead><tr><th>Receipt</th><th>Date</th><th>Customer</th><th class="num">Total</th><th class="num">Balance</th><th>Payment</th><th>Order</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function saleDetail(id){
  const s=sale(id); if(!s) return head('Sale not found','','<a class="btn sec" href="#/sales">Back to sales</a>');
  const c=cust(s.cust), t=total(s);
  const seg=(name,vals,cur)=>`<div class="seg">${vals.map(v=>`<label class="${cur===v?'on':''}"><input type="radio" name="${name}" ${cur===v?'checked':''} onchange="A.sd('${name}','${v}')">${v}</label>`).join('')}</div>`;
  SD={pay:payStatus(s),paid:s.paid,order:s.order};
  return head(s.no,`${fmtDate(s.ago)} · ${esc(c.name)}`,`<a class="btn sec" href="#/receipt/${s.id}">${ico('print')}Print receipt</a>`,crumb(['Sales','#/sales'],[s.no]))+`
  <div class="cols"><div class="stack">
    ${isOverdue(s)?`<div class="notice card" style="background:var(--bad-bg);border-color:var(--bad-border)"><span class="dot bad"></span><p><b>Overdue by ${s.ago-S.settings.days+0} day${s.ago-S.settings.days===1?'':'s'} past the reminder limit.</b><small>Unpaid for ${s.ago} days. An SMS reminder was sent to ${S.settings.mobile}. It stops when you mark this sale as Paid.</small></p></div>`:''}
    <section class="card"><div class="card-h"><h2>Items</h2></div><div class="tbl-wrap"><table><thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th><th class="num">Profit</th></tr></thead><tbody>
    ${s.items.map(i=>`<tr><td>${vlabel(i.vid)}</td><td class="num">${i.qty}</td><td class="num">${pesoD(i.price)}</td><td class="num">${pesoD(i.qty*i.price)}</td><td class="num muted">${pesoD(i.qty*(i.price-i.cost))}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="3">Total</td><td class="num">${pesoD(t)}</td><td class="num">${pesoD(profit(s))}</td></tr></tfoot></table></div></section>
    <section class="card"><div class="card-b"><dl class="kv"><dt>Customer</dt><dd><a class="link" href="#/customers/${c.id}">${esc(c.name)}</a></dd><dt>Contact</dt><dd>${c.phone}</dd><dt>Address</dt><dd>${esc(c.addr)}</dd></dl></div></section>
  </div>
  <aside class="stack">
    <section class="card"><div class="card-h"><h2>Payment</h2>${payPill(payStatus(s))}</div><div class="card-b">
      <div class="sum-line"><span>Total</span><b>${pesoD(t)}</b></div><div class="sum-line"><span>Amount paid</span><b>${pesoD(s.paid)}</b></div><div class="sum-line"><span>Remaining balance</span><b ${balance(s)?'style="color:var(--bad)"':''}>${pesoD(balance(s))}</b></div>
      <div class="field" style="margin-top:14px"><label>Update payment status</label>${seg('pay',['Paid','Partially Paid','Not Yet Paid'],SD.pay)}</div>
      <div class="field ${SD.pay==='Partially Paid'?'':'hidden'}" id="sd-paid"><label for="sdp">Amount paid</label><input id="sdp" type="number" min="0" max="${t}" value="${s.paid}"></div>
      <button class="btn block" onclick="A.savePay('${s.id}')">Save payment</button></div></section>
    <section class="card"><div class="card-h"><h2>Order</h2>${orderPill(s.order)}</div><div class="card-b">
      <div class="field"><label>Update order status</label>${seg('order',['Pending','Delivered','Picked Up'],SD.order)}</div>
      <button class="btn block" onclick="A.saveOrder('${s.id}')">Save order status</button></div></section>
  </aside></div>`;
}
let SD={};
function receipt(id){
  const s=sale(id); if(!s) return head('Receipt not found');
  const t=total(s), c=cust(s.cust);
  return head('Receipt preview','Review and print.',`<button class="btn" onclick="window.print()">${ico('print')}Print receipt</button><a class="btn sec" href="#/sales/${s.id}">Back to sale</a>`,crumb(['Sales','#/sales'],[s.no,'#/sales/'+s.id],['Receipt']))+`
  <div class="receipt-wrap"><div class="receipt">
   <div class="rh"><b>ARLQ Food Condiments Trading</b>Official Receipt</div>
   <div class="rr"><span>Receipt no.</span><b>${s.no}</b></div><div class="rr"><span>Date</span><span>${fmtDate(s.ago)}</span></div><div class="rr"><span>Customer</span><span style="text-align:right">${esc(c.name)}</span></div><hr>
   ${s.items.map(i=>`<div class="it"><b>${vlabel(i.vid)}</b><div><span>${i.qty} × ${pesoD(i.price)}</span><span>${pesoD(i.qty*i.price)}</span></div></div>`).join('')}<hr>
   <div class="rr tot"><span>TOTAL</span><span>${pesoD(t)}</span></div>
   <div class="rr"><span>Amount paid</span><span>${pesoD(s.paid)}</span></div>
   ${balance(s)?`<div class="rr"><span>Remaining balance</span><b>${pesoD(balance(s))}</b></div>`:''}
   <div class="stamp">${payStatus(s).toUpperCase()}</div>
   <div class="rf">Thank you for your business!</div></div></div>`;
}

/* ---- customers */
function customerList(){
  return head('Customers','Your regular buyers and what they owe.',`<a class="btn" href="#/customers/new">${ico('plus')}Add customer</a>`)+
  `<div class="card"><div class="toolbar">${searchBox('ktbl','Search name or contact')}</div><div class="tbl-wrap"><table id="ktbl" class="tbl-cards"><thead><tr><th>Customer</th><th>Contact</th><th>Address</th><th class="num">Purchases</th><th class="num">Balance</th></tr></thead><tbody>
  ${S.customers.map(c=>{const b=custBal(c.id);return `<tr class="click" onclick="location.hash='#/customers/${c.id}'" data-s="${esc(c.name)} ${c.phone} ${esc(c.addr)}"><td data-label="Customer"><b>${esc(c.name)}</b></td><td data-label="Contact">${c.phone}</td><td data-label="Address" class="muted">${esc(c.addr)}</td><td data-label="Purchases" class="num">${S.sales.filter(s=>s.cust===c.id).length}</td><td data-label="Balance" class="num">${b?`<b style="color:var(--bad)">${pesoD(b)}</b>`:'<span class="muted">-</span>'}</td></tr>`}).join('')}
  </tbody></table></div></div>`;
}
function customerForm(id){
  const c=id?cust(id):null;
  return head(c?'Edit customer':'Add customer','','',crumb(['Customers','#/customers'],[c?'Edit':'Add']))+`
  <form class="card form-card" onsubmit="A.saveCust(event,'${id||''}')"><div class="card-b">
   <div class="field"><label for="cn">Customer or business name</label><input id="cn" type="text" required value="${c?esc(c.name):''}"></div>
   <div class="grid2"><div class="field"><label for="cp">Mobile number</label><input id="cp" type="tel" required value="${c?c.phone:''}" placeholder="09XX XXX XXXX"></div>
   <div class="field"><label for="ca">Address</label><input id="ca" type="text" value="${c?esc(c.addr):''}"></div></div></div>
   <div class="form-foot"><a class="btn sec" href="#/customers">Cancel</a><button class="btn" type="submit">Save customer</button></div></form>`;
}
function customerProfile(id){
  const c=cust(id); if(!c) return head('Customer not found');
  const ss=S.sales.filter(s=>s.cust===id), b=custBal(id), us=ss.filter(s=>balance(s)>0);
  return head(esc(c.name),`${c.phone} · ${esc(c.addr)}`,`<a class="btn sec" href="#/customers/${id}/edit">${ico('edit')}Edit</a><a class="btn" href="#/sales/new" onclick="NS=null;NSpre('${id}')">${ico('plus')}New sale</a>`,crumb(['Customers','#/customers'],[esc(c.name)]))+`
  <div class="cols"><section class="card"><div class="card-h"><h2>Transaction history</h2><span class="muted">${ss.length} sales</span></div>
  <div class="tbl-wrap"><table class="tbl-cards"><thead><tr><th>Receipt</th><th>Date</th><th class="num">Total</th><th class="num">Balance</th><th>Payment</th><th>Order</th></tr></thead><tbody>
  ${ss.map(s=>`<tr class="click" onclick="location.hash='#/sales/${s.id}'"><td data-label="Receipt"><b>${s.no}</b></td><td data-label="Date">${fmtDate(s.ago)}</td><td data-label="Total" class="num"><b>${pesoD(total(s))}</b></td><td data-label="Balance" class="num">${balance(s)?`<b style="color:var(--bad)">${pesoD(balance(s))}</b>`:'<span class="muted">-</span>'}</td><td data-label="Payment">${payPill(payStatus(s))}</td><td data-label="Order">${orderPill(s.order)}</td></tr>`).join('')}</tbody></table>${ss.length?'':empty('No purchases yet','Record a sale to start the history.')}</div></section>
  <aside class="card"><div class="card-h"><h2>Outstanding balance</h2></div><div class="card-b">
   <div style="font-size:30px;font-weight:650;color:${b?'var(--bad)':'var(--ink)'}">${pesoD(b)}</div>
   ${us.length?`<p class="muted" style="margin:4px 0 14px">Across ${us.length} unpaid sale${us.length>1?'s':''}.</p>${us.map(s=>`<a class="r" style="display:flex;justify-content:space-between;padding:9px 0;border-top:1px solid var(--line)" href="#/sales/${s.id}"><span>${s.no}<br><small class="muted">${s.ago} days outstanding</small></span><span style="text-align:right"><b>${pesoD(balance(s))}</b><br>${isOverdue(s)?pill('Overdue','bad'):''}</span></a>`).join('')}`:'<p class="muted">Fully paid. Nothing is owed.</p>'}
  </div></aside></div>`;
}
function balances(){
  const rows=S.customers.map(c=>{const us=S.sales.filter(s=>s.cust===c.id&&balance(s)>0);return us.length?{c,us,b:us.reduce((a,s)=>a+balance(s),0),old:Math.max(...us.map(s=>s.ago)),oldS:us.reduce((m,s)=>s.ago>m.ago?s:m)}:null}).filter(Boolean).sort((a,b)=>b.old-a.old);
  const od=rows.filter(r=>r.old>=S.settings.days);
  return head('Customers with balances (utang)','Unpaid and partially paid sales.','',crumb(['Customers','#/customers'],['Balances']))+`
  <div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat"><span>Total owed</span><b>${peso(rows.reduce((a,r)=>a+r.b,0))}</b><small>${rows.length} customers</small></div>
  <div class="stat alert"><span>Overdue (${S.settings.days}+ days)</span><b>${peso(od.reduce((a,r)=>a+r.b,0))}</b><small>${od.length} customers</small></div>
  <div class="stat"><span>Reminders</span><b style="font-size:17px;padding-top:6px">SMS to ${S.settings.mobile}</b><small>after ${S.settings.days} days unpaid</small></div></div>
  <div class="card"><div class="tbl-wrap"><table class="tbl-cards"><thead><tr><th>Customer</th><th>Oldest unpaid sale</th><th class="num">Days outstanding</th><th class="num">Balance</th><th>Status</th><th></th></tr></thead><tbody>
  ${rows.map(r=>`<tr><td data-label="Customer"><b>${esc(r.c.name)}</b><br><span class="muted">${r.c.phone}</span></td><td data-label="Oldest Unpaid"><a class="link" href="#/sales/${r.oldS.id}">${r.oldS.no}</a><br><span class="muted">${fmtDate(r.old)}</span></td><td data-label="Days Overdue" class="num">${r.old}</td><td data-label="Balance" class="num"><b>${pesoD(r.b)}</b></td><td data-label="Status">${r.old>=S.settings.days?pill('Overdue','bad'):pill('Not yet due','warn')}</td><td data-label="Action" class="actions-td" style="text-align:right"><a class="btn sec sm" href="#/customers/${r.c.id}">Open profile</a></td></tr>`).join('')}
  </tbody></table>${rows.length?'':empty('No balances','Every customer is fully paid.')}</div></div>`;
}

/* ---- reports */
let R={prod:'all',size:'all',period:'daily',range:'30'};
const RTABS=[['sales','Sales'],['inventory','Inventory'],['movement','Stock movement'],['low','Low stock'],['balances','Customer balances'],['profit','Earnings and profit']];
function rFilter(sel){
  return `<div class="toolbar">
  ${sel.includes('period')?`<select onchange="A.rset('period',this.value)" aria-label="Period"><option value="daily" ${R.period==='daily'?'selected':''}>Daily (last 7 days)</option><option value="weekly" ${R.period==='weekly'?'selected':''}>Weekly (last 4 weeks)</option><option value="monthly" ${R.period==='monthly'?'selected':''}>Monthly (last 3 months)</option></select>`:''}
  ${sel.includes('range')?`<select onchange="A.rset('range',this.value)" aria-label="Range"><option value="7" ${R.range==='7'?'selected':''}>Last 7 days</option><option value="30" ${R.range==='30'?'selected':''}>Last 30 days</option><option value="90" ${R.range==='90'?'selected':''}>Last 90 days</option></select>`:''}
  <select onchange="A.rset('prod',this.value)" aria-label="Product"><option value="all">All products</option>${S.products.map(p=>`<option value="${p.id}" ${R.prod===p.id?'selected':''}>${p.name}</option>`).join('')}</select>
  <select onchange="A.rset('size',this.value)" aria-label="Size"><option value="all">All sizes</option>${SIZES.map(s=>`<option value="${s.k}" ${R.size===s.k?'selected':''}>${s.l}</option>`).join('')}</select>
  <span style="flex:1"></span><button class="btn sec sm no-print" onclick="window.print()">${ico('print')}Print report</button></div>`;
}
const rMatch = vid => { const v=V(vid); return (R.prod==='all'||v.p.id===R.prod)&&(R.size==='all'||v.size===R.size); };
function agg(sales){
  let tx=0,u=0,rev=0,cost=0;
  sales.forEach(s=>{const it=s.items.filter(i=>rMatch(i.vid)); if(!it.length) return; tx++; it.forEach(i=>{u+=i.qty;rev+=i.qty*i.price;cost+=i.qty*i.cost;});});
  return {tx,u,rev,cost,pr:rev-cost};
}
function reports(type){
  const tabs=`<div class="tabs">${RTABS.map(t=>`<a href="#/reports/${t[0]}" class="${t[0]===type?'on':''}">${t[1]}</a>`).join('')}</div>`;
  let body='';
  if(type==='sales'){
    let buckets=[];
    if(R.period==='daily') buckets=[...Array(7)].map((_,i)=>{const d=i;return {l:d===0?'Today':fmtDate(d),f:s=>s.ago===d};});
    else if(R.period==='weekly') buckets=[...Array(4)].map((_,i)=>({l:i===0?'This week':i===1?'Last week':`${i} weeks ago`,f:s=>s.ago>=i*7&&s.ago<i*7+7}));
    else buckets=[0,1,2].map(m=>{const ref=new Date(TODAY.getFullYear(),TODAY.getMonth()-m,1);return {l:ref.toLocaleDateString('en-PH',{month:'long',year:'numeric'}),f:s=>{const d=dateOf(s.ago);return d.getMonth()===ref.getMonth()&&d.getFullYear()===ref.getFullYear();}};});
    const rows=buckets.map(b=>({l:b.l,...agg(S.sales.filter(b.f))}));
    const tt=rows.reduce((a,r)=>({tx:a.tx+r.tx,u:a.u+r.u,rev:a.rev+r.rev,pr:a.pr+r.pr}),{tx:0,u:0,rev:0,pr:0});
    body=rFilter(['period'])+`<div class="tbl-wrap"><table><thead><tr><th>Period</th><th class="num">Transactions</th><th class="num">Bottles sold</th><th class="num">Sales</th><th class="num">Profit</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td>${r.l}</td><td class="num">${r.tx}</td><td class="num">${r.u}</td><td class="num">${pesoD(r.rev)}</td><td class="num">${pesoD(r.pr)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Total</td><td class="num">${tt.tx}</td><td class="num">${tt.u}</td><td class="num">${pesoD(tt.rev)}</td><td class="num">${pesoD(tt.pr)}</td></tr></tfoot></table></div>`;
  }
  if(type==='inventory'){
    const vs=allVars().filter(v=>rMatch(v.id));
    body=rFilter([])+`<div class="tbl-wrap"><table><thead><tr><th>Product</th><th>Size</th><th class="num">In stock</th><th class="num">Minimum</th><th class="num">Value at cost</th><th class="num">Value at selling price</th><th>Status</th></tr></thead><tbody>
    ${vs.map(v=>`<tr><td><b>${v.p.name}</b></td><td>${sizeLabel(v.size)}</td><td class="num">${v.stock}</td><td class="num">${v.min}</td><td class="num">${pesoD(v.stock*v.cost)}</td><td class="num">${pesoD(v.stock*v.price)}</td><td>${stockStatus(v)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="2">Total</td><td class="num">${vs.reduce((a,v)=>a+v.stock,0)}</td><td></td><td class="num">${pesoD(vs.reduce((a,v)=>a+v.stock*v.cost,0))}</td><td class="num">${pesoD(vs.reduce((a,v)=>a+v.stock*v.price,0))}</td><td></td></tr></tfoot></table></div>`;
  }
  if(type==='movement'){
    const rows=allVars().filter(v=>rMatch(v.id)).map(v=>{const m=S.moves.filter(x=>x.vid===v.id&&x.ago<=+R.range);return {v,i:m.filter(x=>x.type==='In').reduce((a,x)=>a+x.qty,0),o:m.filter(x=>x.type==='Out').reduce((a,x)=>a+x.qty,0)};});
    body=rFilter(['range'])+`<div class="tbl-wrap"><table><thead><tr><th>Product</th><th>Size</th><th class="num">Stock in</th><th class="num">Stock out</th><th class="num">Net change</th><th class="num">Now in stock</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td><b>${r.v.p.name}</b></td><td>${sizeLabel(r.v.size)}</td><td class="num">+${r.i}</td><td class="num">-${r.o}</td><td class="num">${r.i-r.o>=0?'+':''}${r.i-r.o}</td><td class="num">${r.v.stock}</td></tr>`).join('')}</tbody></table></div>`;
  }
  if(type==='low'){
    const vs=lowVars().filter(v=>rMatch(v.id));
    body=rFilter([])+`<div class="tbl-wrap"><table><thead><tr><th>Product</th><th>Size</th><th class="num">In stock</th><th class="num">Minimum</th><th class="num">Short by</th></tr></thead><tbody>
    ${vs.map(v=>`<tr><td><b>${v.p.name}</b></td><td>${sizeLabel(v.size)}</td><td class="num"><b style="color:var(--bad)">${v.stock}</b></td><td class="num">${v.min}</td><td class="num">${v.min-v.stock}</td></tr>`).join('')}</tbody></table>${vs.length?'':empty('Nothing to report','No variants are below the minimum for this filter.')}</div>`;
  }
  if(type==='balances'){
    const rows=S.customers.map(c=>({c,b:custBal(c.id),n:S.sales.filter(s=>s.cust===c.id&&balance(s)>0).length})).filter(r=>r.b>0).sort((a,b)=>b.b-a.b);
    body=rFilter([]).replace(/<select[\s\S]*?<\/select>/g,'')+`<div class="tbl-wrap"><table><thead><tr><th>Customer</th><th class="num">Unpaid sales</th><th class="num">Balance</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td><b>${esc(r.c.name)}</b></td><td class="num">${r.n}</td><td class="num">${pesoD(r.b)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="num">${rows.reduce((a,r)=>a+r.n,0)}</td><td class="num">${pesoD(rows.reduce((a,r)=>a+r.b,0))}</td></tr></tfoot></table></div>`;
  }
  if(type==='profit'){
    const ss=S.sales.filter(s=>s.ago<=+R.range);
    const rows=allVars().filter(v=>rMatch(v.id)).map(v=>{let u=0,rev=0,cost=0;ss.forEach(s=>s.items.filter(i=>i.vid===v.id).forEach(i=>{u+=i.qty;rev+=i.qty*i.price;cost+=i.qty*i.cost;}));return {v,u,rev,cost,pr:rev-cost};}).filter(r=>r.u);
    const t=rows.reduce((a,r)=>({u:a.u+r.u,rev:a.rev+r.rev,cost:a.cost+r.cost,pr:a.pr+r.pr}),{u:0,rev:0,cost:0,pr:0});
    body=rFilter(['range'])+`<div class="tbl-wrap"><table><thead><tr><th>Product</th><th>Size</th><th class="num">Sold</th><th class="num">Revenue</th><th class="num">Cost</th><th class="num">Profit</th><th class="num">Margin</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td><b>${r.v.p.name}</b></td><td>${sizeLabel(r.v.size)}</td><td class="num">${r.u}</td><td class="num">${pesoD(r.rev)}</td><td class="num">${pesoD(r.cost)}</td><td class="num"><b>${pesoD(r.pr)}</b></td><td class="num">${Math.round(r.pr/r.rev*100)}%</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="2">Total</td><td class="num">${t.u}</td><td class="num">${pesoD(t.rev)}</td><td class="num">${pesoD(t.cost)}</td><td class="num">${pesoD(t.pr)}</td><td class="num">${t.rev?Math.round(t.pr/t.rev*100):0}%</td></tr></tfoot></table>${rows.length?'':empty('No sales in this range','Try a longer range or another product.')}</div>`;
  }
  return head('Reports','Filter by product and size, then print.')+tabs+`<div class="card">${body}</div>`;
}

/* ---- settings */
function settings(tab){
  const tabs=[['reminders','Reminder settings'],['stock','Minimum stock levels'],['appearance','Appearance'],['password','Change password']];
  const t=`<div class="tabs">${tabs.map(x=>`<a href="#/settings/${x[0]}" class="${x[0]===tab?'on':''}">${x[1]}</a>`).join('')}</div>`;
  let b='';
  if(tab==='reminders') b=`<form class="card form-card" onsubmit="A.saveRem(event)"><div class="card-b">
    <div class="grid2"><div class="field"><label for="rd">Send a reminder after (days unpaid)</label><input id="rd" type="number" min="1" value="${S.settings.days}" required><span class="hint">Default is 7 days.</span></div>
    <div class="field"><label for="rm">Administrator mobile number</label><input id="rm" type="tel" value="${S.settings.mobile}" required><span class="hint">Reminders go to you only, never to customers.</span></div></div>
    <div class="field"><label for="rc">Notification channel</label><select id="rc" disabled><option>SMS</option></select><span class="hint">SMS is the only channel. Alerts also show on the Dashboard.</span></div>
    <div class="reminder-box"><b>Sample message</b><br>ARLQ: Aling Nena’s Sari-Sari Store still owes ₱${'1,340.00'} for receipt ARLQ-01058. Unpaid for ${S.settings.days} days. Reminders stop once the sale is marked Paid.</div></div>
    <div class="form-foot"><button class="btn" type="submit">Save settings</button></div></form>`;
  if(tab==='stock') b=`<form class="card form-card" onsubmit="A.saveMin(event)"><div class="card-b"><p class="muted" style="margin-bottom:14px">A variant is flagged as low when stock reaches this number.</p>
    <div class="tbl-wrap"><table class="var-table"><thead><tr><th>Product</th>${SIZES.map(s=>`<th>${s.l}</th>`).join('')}</tr></thead><tbody>
    ${S.products.map(p=>`<tr><td><b>${p.name}</b></td>${p.variants.map(v=>`<td><input type="number" min="0" data-min="${v.id}" value="${v.min}" aria-label="${p.name} ${sizeLabel(v.size)} minimum"></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
    <div class="form-foot"><button class="btn" type="submit">Save minimum levels</button></div></form>`;
  if(tab==='appearance') b=`<div class="card form-card"><div class="card-b">
    <h3 style="margin-bottom:6px">Theme & Display</h3>
    <p class="muted" style="margin-bottom:18px">Choose how ARLQ looks for your account. You can also quickly toggle between light and dark mode anytime in the sidebar footer.</p>
    <div class="theme-picker">
      <label class="theme-option ${currentTheme==='light'?'on':''}" onclick="A.setTheme('light')">
        <input type="radio" name="th" value="light" ${currentTheme==='light'?'checked':''}>
        <div class="th-preview light"><div class="th-top"></div><div class="th-side"></div><div class="th-content"></div></div>
        <b>${ico('sun')}Light mode</b>
        <small>Clean white and cream surfaces</small>
      </label>
      <label class="theme-option ${currentTheme==='dark'?'on':''}" onclick="A.setTheme('dark')">
        <input type="radio" name="th" value="dark" ${currentTheme==='dark'?'checked':''}>
        <div class="th-preview dark"><div class="th-top"></div><div class="th-side"></div><div class="th-content"></div></div>
        <b>${ico('moon')}Dark mode</b>
        <small>Deep obsidian tones, easy on the eyes</small>
      </label>
      <label class="theme-option ${currentTheme==='auto'?'on':''}" onclick="A.setTheme('auto')">
        <input type="radio" name="th" value="auto" ${currentTheme==='auto'?'checked':''}>
        <div class="th-preview auto"><div class="th-top"></div><div class="th-side"></div><div class="th-content"></div></div>
        <b>${ico('gear')}System default</b>
        <small>Automatically matches your OS preference</small>
      </label>
    </div>
  </div></div>`;
  if(tab==='password') b=`<form class="card form-card" style="max-width:480px" onsubmit="A.savePw(event)"><div class="card-b">
    <div class="field"><label for="p0">Current password</label><input id="p0" type="password" required autocomplete="current-password"></div>
    <div class="field"><label for="p1">New password</label><input id="p1" type="password" minlength="8" required autocomplete="new-password"><span class="hint">At least 8 characters.</span></div>
    <div class="field"><label for="p2">Confirm new password</label><input id="p2" type="password" required autocomplete="new-password"></div></div>
    <div class="form-foot"><button class="btn" type="submit">Update password</button></div></form>`;
  return head('Settings','')+t+b;
}

/* ---------------------------------------------------------------- router */
function route(){
  const app=$('#app');
  if(!authed){ app.innerHTML=loginView(); document.title='Log in · ARLQ'; return; }
  const raw=(location.hash||'#/dashboard').slice(2), [path,qs]=raw.split('?');
  const q=Object.fromEntries(new URLSearchParams(qs||''));
  const p=path.split('/'); let sec=p[0]||'dashboard', sub=sec, html='';
  switch(sec){
    case 'dashboard': html=dashboard(); break;
    case 'products':
      if(p[1]==='new'){html=productForm();sub='products';}
      else if(p[1]==='categories'){html=categoryList();sub='products/categories';}
      else if(p[2]==='edit'){html=productForm(p[1]);}
      else html=productList(); break;
    case 'inventory':
      if(p[1]==='in'||p[1]==='out'){html=stockForm(p[1],q);sub='inventory/'+p[1];}
      else if(p[1]==='low'){html=lowStock();sub='inventory/low';}
      else if(p[1]==='history'){html=history();sub='inventory/history';}
      else html=inventory(); break;
    case 'sales':
      if(p[1]==='new'){ if(!(window._keepNS)) {} html=newSale(); sub='sales/new'; }
      else if(p[1]){html=saleDetail(p[1]);sub='sales';}
      else html=salesList(); break;
    case 'receipt': html=receipt(p[1]); sec='sales'; sub='sales'; break;
    case 'customers':
      if(p[1]==='new'){html=customerForm();}
      else if(p[1]==='balances'){html=balances();sub='customers/balances';}
      else if(p[2]==='edit'){html=customerForm(p[1]);}
      else if(p[1]){html=customerProfile(p[1]);sub='customers';}
      else html=customerList(); break;
    case 'reports': html=reports(p[1]||'sales'); break;
    case 'settings': html=settings(p[1]||'reminders'); break;
    default: html=dashboard(); sec='dashboard';
  }
  if(sec!=='sales'||p[1]!=='new'){ if(sec!=='customers') NS=NS; }
  const open=$('#sidebar')&&$('#sidebar').classList.contains('open');
  app.innerHTML=shell(sec,sub,html);
  document.title=`${sec[0].toUpperCase()+sec.slice(1)} · ARLQ`;
  window.scrollTo(0,0);
}
function NSpre(id){ NS=newNS(); NS.cust=id; }
window.NS=null; window.NSpre=NSpre;
Object.defineProperty(window,'NS',{get:()=>NS,set:v=>{NS=v;}});
window.addEventListener('hashchange',route);

/* --------------------------------------------------------------- actions */
function rerender(){ const y=window.scrollY; route(); window.scrollTo(0,y); }
const A = window.A = {
  login(e){ e.preventDefault(); authed=true; storage.sessionSet('arlq','1'); location.hash='#/dashboard'; route(); },
  logout(){ authed=false; storage.sessionRemove('arlq'); location.hash=''; route(); },
  toggleTheme(){
    const next = isDark() ? 'light' : 'dark';
    applyTheme(next);
    toast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
  },
  setTheme(t){
    applyTheme(t);
    toast(t === 'auto' ? 'Theme set to System default' : (t === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'));
  },
  menu(o){ $('#sidebar').classList.toggle('open',o); $('#scrim').classList.toggle('show',o); },
  closeModal(){ $('#modal-root').innerHTML=''; },
  doConfirm(){ const f=confirmCb; A.closeModal(); if(f) f(); },
  tf(inp,id){ const v=inp.value.toLowerCase(); document.querySelectorAll('#'+id+' tbody tr').forEach(r=>{ r.style.display=(r.dataset.s||r.textContent).toLowerCase().includes(v)?'':'none'; }); },
  mf(t){ document.querySelectorAll('#mtbl tbody tr').forEach(r=>r.style.display=!t||r.dataset.t===t?'':'none'); },
  sf(){ const p=$('#sfp').value,o=$('#sfo').value; document.querySelectorAll('#stbl tbody tr').forEach(r=>r.style.display=(!p||r.dataset.p===p)&&(!o||r.dataset.o===o)?'':'none'); },

  /* products */
  saveProduct(e,id){
    e.preventDefault();
    const name=$('#pn').value.trim(), cat=$('#pc').value;
    const mk=(sz,old)=>({id:(id||name.toLowerCase().replace(/\W+/g,'-'))+'-'+sz.k,size:sz.k,cost:+$('#cost-'+sz.k).value,price:+$('#price-'+sz.k).value,min:+$('#min-'+sz.k).value,stock:old?old.stock:+($('#open-'+sz.k)?.value||0)});
    if(id){ const p=prod(id); p.name=name;p.cat=cat;p.variants=SIZES.map(sz=>mk(sz,p.variants.find(v=>v.size===sz.k))); }
    else S.products.push({id:name.toLowerCase().replace(/\W+/g,'-'),name,cat,variants:SIZES.map(sz=>mk(sz))});
    toast(id?'Product saved':'Product added'); location.hash='#/products';
  },
  delProduct(id){ const p=prod(id); confirmBox(`Delete ${p.name}?`,`This removes ${p.name} and its three sizes from the product list. Past sales stay in the records.`,'Delete product',()=>{ S.products=S.products.filter(x=>x.id!==id); toast('Product deleted'); rerender(); }); },
  catModal(id){ const c=id&&S.cats.find(x=>x.id===id);
    modal(`<h3>${c?'Rename category':'Add category'}</h3><form onsubmit="A.saveCat(event,'${id||''}')"><div class="mb"><div class="field"><label for="cnm">Category name</label><input id="cnm" type="text" value="${c?esc(c.name):''}" required></div></div>
    <div class="mf"><button type="button" class="btn sec" onclick="A.closeModal()">Cancel</button><button class="btn" type="submit">Save category</button></div></form>`); },
  saveCat(e,id){ e.preventDefault(); const n=$('#cnm').value.trim(); if(id) S.cats.find(c=>c.id===id).name=n; else S.cats.push({id:'c'+uid(),name:n}); A.closeModal(); toast('Category saved'); rerender(); },
  delCat(id){ const c=S.cats.find(x=>x.id===id); const used=S.products.filter(p=>p.cat===id).length;
    confirmBox(`Delete ${esc(c.name)}?`,used?`${used} product${used>1?'s are':' is'} in this category. They will become uncategorized.`:'This category is empty.','Delete category',()=>{ S.cats=S.cats.filter(x=>x.id!==id); toast('Category deleted'); rerender(); }); },

  /* stock */
  saveStock(e,kind){ e.preventDefault(); const vid=$('#sv').value, q=+$('#sq').value, v=priceOf(vid);
    if(kind==='out'&&q>v.stock){ toast('Only '+v.stock+' in stock'); return; }
    v.stock+= kind==='in'?q:-q;
    const note=$('#sn').value.trim(); mv(0,kind==='in'?'In':'Out',vid,q,note?$('#sr').value+': '+note:$('#sr').value);
    toast(`${kind==='in'?'Stock in':'Stock out'} saved: ${vlabel(vid)} now ${v.stock}`); location.hash='#/inventory'; },

  /* new sale */
  ns(k,v){ if(!NS) NS=newNS(); NS[k]=k==='paid'?+v:v; if(k==='pay'&&v!=='Partially Paid') NS.paid=0; rerender(); },
  addLine(){ NS.lines.push({p:'toyo',sz:'350',q:1}); rerender(); },
  rmLine(i){ NS.lines.splice(i,1); rerender(); },
  line(i,k,v){ NS.lines[i][k]=k==='q'?Math.max(1,+v||1):v; rerender(); },
  qty(i,d){ NS.lines[i].q=Math.max(1,NS.lines[i].q+d); rerender(); },
  saveSale(){
    const items=NS.lines.map(l=>{const v=lineVar(l);return {vid:v.id,qty:l.q,price:v.price,cost:v.cost};});
    const t=items.reduce((a,i)=>a+i.qty*i.price,0), no=nextNo();
    const paid=NS.pay==='Paid'?t:NS.pay==='Not Yet Paid'?0:Math.min(NS.paid,t);
    const s={id:'s'+uid(),no,ago:0,cust:NS.cust,items,paid,order:NS.order};
    S.sales.unshift(s); items.forEach(i=>{priceOf(i.vid).stock-=i.qty; mv(0,'Out',i.vid,i.qty,'Sale '+no);});
    NS=null; toast('Sale saved: '+no); location.hash='#/sales/'+s.id; },

  /* sale detail */
  sd(k,v){ SD[k]=v; document.querySelectorAll(`input[name=${k}]`).forEach(r=>r.parentElement.classList.toggle('on',r.checked)); if(k==='pay') $('#sd-paid').classList.toggle('hidden',v!=='Partially Paid'); },
  savePay(id){ const s=sale(id), t=total(s);
    if(SD.pay==='Paid') s.paid=t; else if(SD.pay==='Not Yet Paid') s.paid=0; else { const a=+$('#sdp').value; if(!(a>0&&a<t)){ toast('Enter an amount between ₱1 and '+peso(t-1)); return; } s.paid=a; }
    toast('Payment updated: '+payStatus(s)+(SD.pay==='Paid'?'. Reminders stopped.':'')); rerender(); },
  saveOrder(id){ sale(id).order=SD.order; toast('Order marked '+SD.order); rerender(); },

  /* customers */
  saveCust(e,id){ e.preventDefault(); const d={name:$('#cn').value.trim(),phone:$('#cp').value.trim(),addr:$('#ca').value.trim()};
    if(id) Object.assign(cust(id),d); else { const c={id:'k'+uid(),...d}; S.customers.push(c); id=c.id; }
    toast('Customer saved'); location.hash='#/customers/'+id; },

  /* reports & settings */
  rset(k,v){ R[k]=v; rerender(); },
  saveRem(e){ e.preventDefault(); S.settings.days=+$('#rd').value; S.settings.mobile=$('#rm').value; toast('Reminder settings saved'); rerender(); },
  saveMin(e){ e.preventDefault(); document.querySelectorAll('[data-min]').forEach(i=>{priceOf(i.dataset.min).min=+i.value;}); toast('Minimum stock levels saved'); rerender(); },
  savePw(e){ e.preventDefault(); if($('#p1').value!==$('#p2').value){ toast('New passwords do not match'); return; } e.target.reset(); toast('Password updated'); }
};

route();
})();
