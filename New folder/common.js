const firebaseConfig={
  apiKey:"AIzaSyCdzQP6n7gw8T82h2Qg-cLfnLbEqJ4WONg",
  authDomain:"caps-62ee2.firebaseapp.com",
  databaseURL:"https://caps-62ee2-default-rtdb.firebaseio.com",
  projectId:"caps-62ee2",
  storageBucket:"caps-62ee2.appspot.com",
  messagingSenderId:"407248916382",
  appId:"1:407248916382:web:104a66db2e652789e2d08f",
  measurementId:"G-2Y9GYDHFVM"
};
const $=id=>document.getElementById(id);
const r2=n=>Math.round((n+Number.EPSILON)*100)/100;
const peso=n=>'₱'+n.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const pad=n=>String(n).padStart(2,'0');
const hm=m=>Math.floor(m/60)+'h '+pad(m%60)+'m';
const tm=t=>{const[a,b]=t.split(':').map(Number);return a*60+b};
const pc=x=>Math.round(x*100)+'%';
const dstr=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
let auth=null,db=null,defaults={rate:755,nd:true,ndp:10};
let payout={d1:5,d2:20,lag:0}; // payout days of the month + cutoff days before payday
try{firebase.initializeApp(firebaseConfig);auth=firebase.auth();db=firebase.database();auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{})}catch(e){console.error(e)}

// Redirect to the landing page unless logged in, then call cb(user, userRef)
function guard(cb){
  if(!auth){document.body.innerHTML='<p style="padding:20px">Firebase could not load. Check your connection.</p>';return}
  auth.onAuthStateChanged(u=>{
    if(!u){location.href='index.html';return}
    const lo=$('lo');if(lo)lo.onclick=()=>auth.signOut();
    const ref=db.ref('users/'+u.uid);
    ref.child('profile').update({uid:u.uid,email:u.email||''}).catch(dbErr); // unique per-user record
    const nav=document.querySelector('.nav');
    if(nav)nav.insertAdjacentHTML('afterend','<p class="note">Signed in as '+(u.email||'')+' · User ID: '+u.uid+'</p>');
    // load saved settings first so older entries without a rate still compute
    ref.child('settings').once('value').then(s=>{
      const v=s.val();
      if(v){
        defaults=v;
        if(v.payout&&v.payout.d1&&v.payout.d2)payout={d1:+v.payout.d1,d2:+v.payout.d2,lag:+v.payout.lag||0};
      }
    }).catch(()=>{}).then(()=>cb(u,ref));
  });
}

// ---------- SweetAlert popups (centered); plain alert/confirm if SweetAlert fails to load ----------
const swalTheme={background:'var(--card)',color:'var(--tx)',confirmButtonColor:'var(--pr)'};
function notify(icon,title,text){
  if(window.Swal)return Swal.fire(Object.assign({icon,title,text,confirmButtonText:'OK'},swalTheme,icon==='success'?{timer:2500,timerProgressBar:true}:{}));
  alert(title+(text?'\n'+text:''));return Promise.resolve();
}
function confirmDelete(title,text){
  if(window.Swal)return Swal.fire(Object.assign({icon:'warning',title,text,showCancelButton:true,confirmButtonText:'Yes, delete',cancelButtonText:'Cancel',reverseButtons:true,focusCancel:true,cancelButtonColor:'#6b7280'},swalTheme,{confirmButtonColor:'#d33'})).then(r=>r.isConfirmed);
  return Promise.resolve(confirm(title+(text?'\n'+text:'')));
}

// ---------- Payout schedule ----------
const ord=n=>{const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])};
const payLabels=()=>{const d=[payout.d1,payout.d2].sort((a,b)=>a-b);return[ord(d[0]),ord(d[1])]};
const clampDay=(y,m,d)=>Math.min(d,new Date(y,m+1,0).getDate()); // day 31 becomes the last day of short months
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
// Paydays around month m (0-based): previous, current and next month
function payoutList(y,m){
  const days=[payout.d1,payout.d2].sort((a,b)=>a-b),list=[];
  for(let k=-1;k<=1;k++)days.forEach((pd,slot)=>list.push({date:new Date(y,m+k,clampDay(y,m+k,pd)),slot}));
  return list.sort((a,b)=>a.date-b.date);
}
// Which payday does a work date belong to? Returns the payday, which slot it is (0 = earlier day of the month,
// 1 = later day), the work period it covers, and the month the payday falls in.
function getPeriod(ds){
  const[y,m,d]=ds.split('-').map(Number),D=new Date(y,m-1,d);
  const l=payoutList(y,m-1);
  let i=l.findIndex(p=>addDays(p.date,-payout.lag)>=D);
  if(i<1)i=1;
  const pd=l[i],prev=l[i-1];
  return{payday:pd.date,slot:pd.slot,start:addDays(prev.date,1-payout.lag),end:addDays(pd.date,-payout.lag),key:dstr(pd.date),month:dstr(pd.date).slice(0,7)};
}
// Wire up the payout-day inputs (#payd1, #payd2, #paylag, #paysave, #paymsg). Saves to users/<uid>/settings/payout.
function initPayoutUI(ref,onChange){
  const a=$('payd1'),b=$('payd2'),c=$('paylag');
  if(!a||!b||!c)return;
  a.value=payout.d1;b.value=payout.d2;c.value=payout.lag;
  $('paysave').onclick=()=>{
    const d1=parseInt(a.value,10),d2=parseInt(b.value,10),lag=parseInt(c.value,10)||0;
    if(!(d1>=1&&d1<=31&&d2>=1&&d2<=31)){notify('warning','Check the payout days','Payout days must be between 1 and 31.');return}
    if(d1===d2){notify('warning','Check the payout days','Choose two different payout days.');return}
    if(lag<0||lag>15){notify('warning','Check the cutoff days','Cutoff days must be between 0 and 15.');return}
    payout={d1,d2,lag};
    ref.child('settings/payout').set(payout).then(()=>{
      notify('success','Payout days saved','Your records are now grouped by the '+payLabels().join(' and ')+' payday.');
      if(onChange)onChange();
    }).catch(dbErr);
  };
}

// Pay for one saved entry. Uses the rate and night-diff settings stored on the entry itself.
function calc(e){
  const daily=+(e.rate!=null?e.rate:defaults.rate)||0,rest=e.day==='rest';
  const base=e.hol==='reg'?(rest?2.6:2):e.hol==='spe'?(rest?1.5:1.3):(rest?1.3:1);
  const om=(e.hol==='none'&&!rest)?1.25:base*1.3;
  if(e.absent){const p=e.hol==='reg'?daily:0;return{w:0,reg:0,ot:0,nm:0,base:e.hol==='reg'?1:0,om:0,rp:p,op:0,np:0,pay:p}}
  let span=tm(e.out)-tm(e.in);if(span<=0)span+=1440;
  const useNd=e.nd!=null?e.nd:defaults.nd,ndp=+(e.ndp!=null?e.ndp:defaults.ndp)||0,s0=tm(e.in),fl=[];
  for(let i=0;i<span;i++){const m=(s0+i)%1440;fl.push(!!useNd&&(m>=1320||m<360))} // 10PM-6AM
  const b=Math.min(Math.max(0,Math.round(e.brk)),span);
  fl.splice(Math.floor((span-b)/2),b); // break assumed mid-shift
  const w=fl.length,reg=Math.min(w,480),ot=w-reg;
  const nR=fl.slice(0,480).filter(Boolean).length,nO=fl.slice(480).filter(Boolean).length;
  const pm=daily/8/60;
  const rp=r2(pm*reg*base),op=r2(pm*ot*om),np=r2(pm*(nR*base+nO*om)*ndp/100);
  return{w,reg,ot,nm:nR+nO,base,om,rp,op,np,pay:r2(rp+op+np)};
}

function dbErr(x){
  const m=$('dbmsg')||$('msg');if(!m)return;
  m.className='msg';
  m.textContent=/permission/i.test(x.message)?'Permission denied. In Firebase Realtime Database > Rules, add the "users" rule so each user can read and write users/$uid.':x.message;
}
// Live-listen to this user's entries. On first load, jump to the latest payout month that has data.
function watch(ref,onData){
  let first=true;
  ref.child('entries').on('value',s=>{
    const v=s.val()||{},list=Object.keys(v).map(k=>Object.assign({},v[k],{id:k})).filter(e=>e&&e.date);
    const mi=$('month');
    if(first&&list.length&&mi&&!list.some(e=>getPeriod(e.date).month===mi.value))mi.value=getPeriod(list.map(e=>e.date).sort().pop()).month;
    first=false;onData(list);
  },dbErr);
}
// Fill the payout tables and totals (#month, #rows, #h1, #h2, #tot, #bymonth, #byperiod)
let lastEntries=[];
// ---------- Pagination (10 rows per page, newest first) ----------
const PAGE=10,pages={};
function slicePage(key,items,el){
  const total=items.length,max=Math.max(1,Math.ceil(total/PAGE));
  const p=Math.min(Math.max(1,pages[key]||1),max);pages[key]=p;
  let box=$('pg-'+key);
  if(!box){box=document.createElement('div');box.id='pg-'+key;box.className='pager';el.closest('.tw').insertAdjacentElement('afterend',box)}
  if(total<=PAGE){box.innerHTML='';box.hidden=true;return items}
  box.hidden=false;
  box.innerHTML=`<button class="sec" type="button" data-pg="${key}" data-to="${p-1}"${p<=1?' disabled':''}>Previous</button><span>Page ${p} of ${max} · ${(p-1)*PAGE+1}–${Math.min(total,p*PAGE)} of ${total}</span><button class="sec" type="button" data-pg="${key}" data-to="${p+1}"${p>=max?' disabled':''}>Next</button>`;
  return items.slice((p-1)*PAGE,p*PAGE);
}
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-pg]');
  if(!b||b.disabled)return;
  pages[b.dataset.pg]=+b.dataset.to;paint(lastEntries);
});
function paint(entries){
  lastEntries=entries;
  const mo=$('month').value,all=$('all')&&$('all').checked;
  const sig=mo+'|'+all;if(paint.sig!==sig){pages.rows=1;paint.sig=sig}
  const cmp=(a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.savedAt||0)-(b.savedAt||0);
  const inMonth=entries.filter(e=>mo&&getPeriod(e.date).month===mo); // entries paid in the selected month
  const shown=(all?entries.slice():inMonth).sort(cmp).reverse();
  const cn=$('count');if(cn)cn.textContent=entries.length+' saved day(s) loaded from your account, '+inMonth.length+' paid in the selected month. '+(all?'The cards show the totals of all entries.':'The cards show the selected month.');
  const get=e=>{try{const r=calc(e);if(!r.pay&&e.pay)r.pay=+e.pay;return r}catch(x){console.error('Bad entry',e,x);return null}};
  let h1=0,h2=0;const html=[];const months={},periods={};
  entries.forEach(e=>{
    const r=get(e);if(!r)return;
    const p=getPeriod(e.date),a=months[p.month]||(months[p.month]={n:0,a:0,b:0});
    a.n++;if(p.slot===0)a.a+=r.pay;else a.b+=r.pay;
    const q=periods[p.key]||(periods[p.key]={p,n:0,min:0,pay:0});q.n++;q.min+=r.w;q.pay+=r.pay;
    if(all||p.month===mo){if(p.slot===0)h1+=r.pay;else h2+=r.pay}
  });
  const dl={rest:'Rest day',reg:'Regular'},hl={none:'',reg:' + Reg. holiday',spe:' + Special day'};
  const fmt=all?{year:'numeric',month:'short',day:'numeric',weekday:'short'}:{month:'short',day:'numeric',weekday:'short'};
  const fd=d=>d.toLocaleDateString('en-PH',{month:'short',day:'numeric'});
  shown.forEach(e=>{
    const r=get(e);if(!r)return;
    const wd=new Date(e.date+'T00:00:00').toLocaleDateString('en-PH',fmt);
    const sv=e.savedAt?new Date(e.savedAt).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'–';
    html.push(`<tr><td>${wd}</td><td>${fd(getPeriod(e.date).payday)}</td><td>${e.absent?'No work':dl[e.day]}${hl[e.hol]||''}</td><td>${e.absent?'–':e.in+'–'+e.out}</td><td>${sv}</td><td class="n">${hm(r.reg)}</td><td class="n">${hm(r.ot)}</td><td class="n">${peso(r.rp)}</td><td class="n">${peso(r.op)}</td><td class="n">${peso(r.np)}</td><td class="n"><b>${peso(r.pay)}</b></td><td><button class="del" data-id="${e.id}" aria-label="Delete entry">✕</button></td></tr>`);
  });
  const rw=$('rows');if(rw)rw.innerHTML=slicePage('rows',html,rw).join('')||'<tr><td colspan="12" style="text-align:center;color:var(--mu)">No entries to show.</td></tr>';
  h1=r2(h1);h2=r2(h2);
  $('h1').textContent=peso(h1);$('h2').textContent=peso(h2);$('tot').textContent=peso(r2(h1+h2));
  const[l1,l2]=payLabels();
  const lb=(id,t)=>{const s=$(id).previousElementSibling;if(s)s.textContent=t};
  lb('h1',all?`1st payout (${l1}) · all months`:`1st payout (${l1})`);
  lb('h2',all?`2nd payout (${l2}) · all months`:`2nd payout (${l2})`);
  lb('tot',all?'Total of all entries (gross)':'Monthly total (gross)');
  const bm=$('bymonth');
  if(bm){
    const ks=Object.keys(months).sort().reverse();let g1=0,g2=0,gn=0;
    const rowsM=slicePage('month',ks.map(k=>{const m=months[k];g1+=m.a;g2+=m.b;gn+=m.n;const nm=new Date(k+'-01T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'long'});return `<tr><td>${nm}</td><td class="n">${m.n}</td><td class="n">${peso(r2(m.a))}</td><td class="n">${peso(r2(m.b))}</td><td class="n"><b>${peso(r2(m.a+m.b))}</b></td></tr>`}),bm).join('');
    bm.innerHTML=`<thead><tr><th>Payout month</th><th class="n">Days logged</th><th class="n">1st payout (${l1})</th><th class="n">2nd payout (${l2})</th><th class="n">Monthly salary</th></tr></thead><tbody>`+(rowsM||'<tr><td colspan="5" style="text-align:center;color:var(--mu)">No entries yet.</td></tr>')+`<tr><td><b>All months</b></td><td class="n">${gn}</td><td class="n"><b>${peso(r2(g1))}</b></td><td class="n"><b>${peso(r2(g2))}</b></td><td class="n"><b>${peso(r2(g1+g2))}</b></td></tr></tbody>`;
  }
  const bp=$('byperiod');
  if(bp){
    const full={year:'numeric',month:'short',day:'numeric'};
    const rowsP=slicePage('period',Object.keys(periods).sort().reverse().map(k=>{const q=periods[k];return `<tr><td><b>${q.p.payday.toLocaleDateString('en-PH',full)}</b></td><td>${fd(q.p.start)} – ${fd(q.p.end)}</td><td class="n">${q.n}</td><td class="n">${hm(q.min)}</td><td class="n"><b>${peso(r2(q.pay))}</b></td></tr>`}),bp).join('');
    bp.innerHTML='<thead><tr><th>Payday</th><th>Work period</th><th class="n">Entries</th><th class="n">Hours</th><th class="n">Gross pay</th></tr></thead><tbody>'+(rowsP||'<tr><td colspan="5" style="text-align:center;color:var(--mu)">No entries yet.</td></tr>')+'</tbody>';
  }
}
