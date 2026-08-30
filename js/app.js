let SCORING_DATA = [];
let RANKING_DATA = [];
const LAST_SYNC = {time: null, status: 'idle'};

// "Подали"/"пройшли інтерв'ю" — рахуються від реальних синхронізованих полів,
// не від застарілої KfW-оцінки. Викликається один раз при завантаженні і
// повторно після кожної синхронізації (sheets.js), бо ці числа міняються
// лише коли приходять нові дані.
function updateHeaderStats(){
  const submitted = H.filter(h=>h.score_survey>0).length;
  const interviewed = H.filter(h=>h.interview && h.interview!=='pending').length;
  const confirmed = H.filter(h=>h.children_u1_confirmed>0);
  const childrenSum = confirmed.reduce((s,h)=>s+h.children_u1_confirmed,0);
  document.getElementById('h-submitted').textContent = submitted;
  document.getElementById('h-interviewed').textContent = interviewed;
  document.getElementById('h-submitted-lbl').textContent = t('hstat_submitted_lbl', H.length);
  document.getElementById('h-interviewed-lbl').textContent = t('hstat_interviewed_lbl', H.length);
  document.getElementById('h-ch').textContent = confirmed.length ? childrenSum.toLocaleString(numLocale()) : '—';
  document.getElementById('h-ch-lbl').textContent = confirmed.length
    ? t('children_u1_confirmed_lbl', confirmed.length, H.length)
    : t('children_u1_none_lbl');
}

function updateFooterDate(){
  document.getElementById('fd').textContent=new Date().toLocaleDateString(numLocale());
}

// Список областей у фільтрах — значення option лишається українською (щоб
// h.o===ob порівняння в applyF/ftbl не залежали від мови), текст
// перекладається/транслітерується. Перебудовується заново при зміні мови
// (setLang), з відновленням поточного вибору.
function populateOblastFilters(){
  const obs=[...new Set(H.map(h=>h.o))].sort();
  ['f-obl','t-obl'].forEach(id=>{
    const s=document.getElementById(id);
    if(!s) return;
    const prev = s.value;
    s.innerHTML = s.options[0] && !s.options[0].value ? s.options[0].outerHTML : '';
    obs.forEach(o=>{const op=document.createElement('option');op.value=o;op.textContent=trName(o);s.appendChild(op)});
    if(prev && [...s.options].some(o=>o.value===prev)) s.value = prev;
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  applyI18n();
  updateHeaderStats();
  updateFooterDate();
  populateOblastFilters();
  initMap(); initDash(); initTbl(); renderPassport();
  // Auto-sync on load
  setTimeout(()=>syncFromSheets(true), 1000);
  // Auto-refresh every 5 minutes
  setInterval(()=>syncFromSheets(true), 300000);
  // Безпековий шар (Крок 11) — окремий асинхронний фетч, не блокує решту
  // ініціалізації; джерело оновлюється раз на добу, тож без інтервалу.
  initSecurity().then(onSecurityLoaded);
});

function showTab(id){
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',['map','dash','tbl','passport'][i]===id));
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.id==='pane-'+id));
  if(id==='map')setTimeout(()=>map.invalidateSize(),50);
  // FR holds the same hromada objects as H, but the HTML was last built
  // whenever renderT() last ran — re-render on every switch to the tab so
  // a sync that completed while this pane was hidden isn't shown stale.
  if(id==='tbl')renderT();
}

// MAP
let map,MKS=[];

// BOUNDARIES
let boundaryLayer = null;
let boundaryVisible = true;
function grantStroke(g){
  return g==='KfW 1'?'#0d4a8a':g==='KfW 2'?'#145230':'#7D4E00';
}

// TABLE
let FR=[...H],SC=-1,SD=1;
