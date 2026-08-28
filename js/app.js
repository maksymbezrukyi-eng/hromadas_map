let SCORING_DATA = [];
let RANKING_DATA = [];
const LAST_SYNC = {time: null, status: 'idle'};

document.addEventListener('DOMContentLoaded',()=>{
  const tp=H.reduce((s,h)=>s+h.pop,0);
  const tc=H.reduce((s,h)=>s+h.ch,0);
  document.getElementById('h-pop').textContent=Math.round(tp/1000).toLocaleString('uk-UA');
  document.getElementById('h-ch').textContent=tc.toLocaleString('uk-UA');
  document.getElementById('fd').textContent=new Date().toLocaleDateString('uk-UA');
  const obs=[...new Set(H.map(h=>h.o))].sort();
  ['f-obl','t-obl'].forEach(id=>{
    const s=document.getElementById(id);
    obs.forEach(o=>{const op=document.createElement('option');op.value=o;op.textContent=o;s.appendChild(op)});
  });
  initMap(); initDash(); initTbl();
  // Auto-sync from Sheets on load
  setTimeout(()=>syncFromSheets(true), 1000);
  // Auto-refresh every 5 minutes
  setInterval(()=>syncFromSheets(true), 300000);
});

function showTab(id){
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',['map','dash','tbl'][i]===id));
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
