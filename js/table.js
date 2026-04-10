function initTbl(){FR=[...H];renderT()}
function badge(s,cls){return`<span class="badge ${cls||SBC[s]||'b-pend'}">${SUA[s]||s}</span>`}
function renderT(){
  const tb=document.getElementById('tbody');tb.innerHTML='';
  FR.forEach(h=>{
    const sh=(h.ch/h.pop*100).toFixed(1);
    tb.innerHTML+=`<tr><td class="mono">${h.id}</td><td>${h.n}</td><td>${h.o}</td><td><span class="badge ${KC[h.g]}">${h.g}</span></td><td class="num">${h.pop.toLocaleString('uk-UA')}</td><td class="num">${h.ch.toLocaleString('uk-UA')}</td><td class="num">${sh}%</td><td>${badge(h.us)}</td><td>${badge(h.sl)}</td></tr>`;
  });
  document.getElementById('tcnt').textContent=`${FR.length} з ${H.length}`;
}
function ftbl(){
  const q=document.getElementById('t-q').value.toLowerCase();
  const ob=document.getElementById('t-obl').value;
  FR=H.filter(h=>(!q||h.n.toLowerCase().includes(q)||h.o.toLowerCase().includes(q))&&(!ob||h.o===ob));
  renderT();
}
function resetT(){['t-q','t-obl'].forEach(id=>{document.getElementById(id).value=''});FR=[...H];renderT()}
function st(c){
  const ths=document.querySelectorAll('.dt th');
  ths.forEach(t=>t.classList.remove('asc','desc'));
  if(SC===c)SD*=-1;else{SC=c;SD=1};
  ths[c].classList.add(SD===1?'asc':'desc');
  const K=['id','n','o','g','pop','ch',null,'us','sl','interview','final'];
  const k=K[c];if(!k)return;
  FR.sort((a,b)=>{let av=a[k],bv=b[k];if(typeof av==='number')return(av-bv)*SD;return String(av).localeCompare(String(bv),'uk')*SD});
  renderT();
}
