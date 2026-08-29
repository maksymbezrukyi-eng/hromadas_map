function initTbl(){FR=[...H];renderT()}
function badge(s,cls){return`<span class="badge ${cls||SBC[s]||'b-pend'}">${statusLabel(s)}</span>`}

// Розгорнуті рядки — id громад, для яких зараз показано повні дані
// (домени, бали, населення за анкетою), а не тільки курований набір
// колонок. Скидається при повторному рендері з нуля — це нормально,
// список громад однаково стабільний.
let EXP = new Set();
function toggleRow(id){
  if(EXP.has(id)) EXP.delete(id); else EXP.add(id);
  renderT();
}
function dtlCell(l,v){return`<div><div class="dtl-lbl">${l}</div><div class="dtl-val">${v}</div></div>`}
function detailRow(h){
  const num=(v,d)=>v>0?(d?v.toFixed(d):v.toLocaleString(numLocale())):'—';
  const cells=[
    dtlCell(indicatorLabel('d1'),num(h.d1)),
    dtlCell(indicatorLabel('d2'),num(h.d2)),
    dtlCell(indicatorLabel('d3'),num(h.d3)),
    dtlCell(indicatorLabel('d4'),num(h.d4)),
    dtlCell(indicatorLabel('d5'),num(h.d5)),
    dtlCell(indicatorLabel('d6'),num(h.d6)),
    dtlCell(indicatorLabel('d4a'),num(h.d4a)),
    dtlCell(indicatorLabel('score_survey'),num(h.score_survey,2)),
    dtlCell(indicatorLabel('final_score'),num(h.final_score,2)),
    dtlCell(indicatorLabel('rank'),num(h.rank)),
    dtlCell(indicatorLabel('population_survey'),num(h.population_survey)),
  ].join('');
  return `<tr class="dt-expand"><td colspan="11"><div class="dtl-grid">${cells}</div></td></tr>`;
}

function renderT(){
  const tb=document.getElementById('tbody');tb.innerHTML='';
  FR.forEach(h=>{
    const confirmed = h.children_u1_confirmed>0;
    const chTxt = confirmed ? h.children_u1_confirmed.toLocaleString(numLocale()) : '—';
    const sh = confirmed ? (h.children_u1_confirmed/h.pop*100).toFixed(1)+'%' : '—';
    const arrow = EXP.has(h.id) ? '▾' : '▸';
    tb.innerHTML+=`<tr><td class="mono expand-btn" onclick="toggleRow(${h.id})">${arrow}</td><td class="mono">${h.id}</td><td>${trName(h.n)}</td><td>${trName(h.o)}</td><td class="num">${h.pop.toLocaleString(numLocale())}</td><td class="num">${chTxt}</td><td class="num">${sh}</td><td>${badge(h.us)}</td><td>${badge(h.sl)}</td><td>${h.interview?badge(h.interview):'—'}</td><td>${h.final?badge(h.final):'—'}</td></tr>`;
    if(EXP.has(h.id)) tb.innerHTML+=detailRow(h);
  });
  document.getElementById('tcnt').textContent=t('tcnt',FR.length,H.length);
}
// Пошук матчить і українську назву, і транслітеровану — незалежно від
// поточної мови інтерфейсу, щоб можна було шукати в обох розкладках.
function hMatches(h,q){
  return h.n.toLowerCase().includes(q) || h.o.toLowerCase().includes(q) ||
    trName(h.n).toLowerCase().includes(q) || trName(h.o).toLowerCase().includes(q);
}
function ftbl(){
  const q=document.getElementById('t-q').value.toLowerCase();
  const ob=document.getElementById('t-obl').value;
  FR=H.filter(h=>(!q||hMatches(h,q))&&(!ob||h.o===ob));
  renderT();
}
function resetT(){['t-q','t-obl'].forEach(id=>{document.getElementById(id).value=''});FR=[...H];renderT()}
function st(c){
  const ths=document.querySelectorAll('.dt th');
  ths.forEach(t=>t.classList.remove('asc','desc'));
  if(SC===c)SD*=-1;else{SC=c;SD=1};
  ths[c].classList.add(SD===1?'asc':'desc');
  const K=[null,'id','n','o','pop','children_u1_confirmed',null,'us','sl','interview','final'];
  const k=K[c];if(!k)return;
  const isName = k==='n'||k==='o';
  FR.sort((a,b)=>{
    let av=a[k],bv=b[k];
    if(typeof av==='number')return(av-bv)*SD;
    if(isName && typeof LANG!=='undefined' && LANG==='en'){
      return trName(av).localeCompare(trName(bv),'en')*SD;
    }
    return String(av).localeCompare(String(bv),'uk')*SD;
  });
  renderT();
}
