// Тристанова модель, яку показує карта: не подали опитувальник / подали /
// пройшли інтерв'ю. Замінює стару логіку за short-list/фінальним статусом
// і фолбеком на колір KfW-групи (Крок 5) — KfW ніде більше не впливає на
// те, що бачить користувач.
function submissionState(h){
  if(h.interview && h.interview!=='pending') return 'interviewed';
  if(h.score_survey>0) return 'submitted';
  return 'not_submitted';
}
const SUBMISSION_COLOR = {not_submitted:'#AEACA4', submitted:'#006EB6', interviewed:'#1A6B3C'};
const SUBMISSION_LABEL_KEY = {not_submitted:'status_not_submitted', submitted:'status_submitted', interviewed:'status_interviewed'};
function statusMarkerColor(h) { return SUBMISSION_COLOR[submissionState(h)]; }
function submissionLabel(state) { return t(SUBMISSION_LABEL_KEY[state]); }

// Refresh marker/boundary colors based on updated statuses
function refreshMarkers() {
  MKS.forEach(m=>{
    m.setStyle({fillColor:statusMarkerColor(m.h)});
  });
  if(boundaryLayer) {
    boundaryLayer.eachLayer(layer=>{
      const p = layer.feature.properties;
      const h = H.find(x=>x.id===p.id);
      if(h) { const col=statusMarkerColor(h); layer.setStyle({fillColor:col,color:col}); }
    });
  }
}

function initMap(){
  map=L.map('map',{center:[49.2,31.5],zoom:6});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(map);
  // Markers removed — boundaries only
  upMS(H);
  loadBoundaries();
}

function loadBoundaries(){
  fetch('data/hromadas_68.geojson')
    .then(r=>{
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data=>{
      console.log('GeoJSON loaded:', data.features.length, 'features');
      boundaryLayer = L.geoJSON(data, {
        style: feat => {
          try {
            const id = feat.properties.id;
            const h = H.find(x=>x.id===id) || H.find(x=>x.id===Number(id));
            const col = h ? statusMarkerColor(h) : '#6B6961';
            return {fillColor:col, fillOpacity:0.25, color:col, weight:1.5, opacity:0.8};
          } catch(e) {
            return {fillColor:'#6B6961', fillOpacity:0.2, color:'#444', weight:1};
          }
        },
        onEachFeature: (feat, layer) => {
          const p = feat.properties;
          layer.on('mouseover', e => {
            const h = H.find(x=>x.id===p.id)||H.find(x=>x.id===Number(p.id));
            const col = h ? statusMarkerColor(h) : '#6B6961';
            e.target.setStyle({fillOpacity:0.5, weight:2.5});
            showHCard(p);
          });
          layer.on('mouseout', e => {
            boundaryLayer.resetStyle(e.target);
          });
          layer.on('click', e => {
            L.DomEvent.stopPropagation(e);
            showHCard(p);
            const pop = Number(p.pop)||0;
            const h = H.find(x=>x.id===p.id)||H.find(x=>x.id===Number(p.id));
            const confirmed = h && h.children_u1_confirmed>0;
            const childrenTxt = confirmed ? h.children_u1_confirmed.toLocaleString(numLocale()) : '—';
            const share = confirmed && pop ? (h.children_u1_confirmed/pop*100).toFixed(1)+'%' : '—';
            const status = h ? submissionLabel(submissionState(h)) : '—';
            layer.bindPopup(
              '<div class="pp-name">'+(p.name||p.n||'')+'</div>'+
              '<div class="pp-obl">'+(p.oblast||p.o||'')+'</div>'+
              '<div class="pp-grid">'+
              '<div><div class="pp-lbl">'+t('population')+'</div><div class="pp-val">'+pop.toLocaleString(numLocale())+'</div></div>'+
              '<div><div class="pp-lbl">'+t('children_u1')+'</div><div class="pp-val">'+childrenTxt+'</div></div>'+
              '<div><div class="pp-lbl">'+t('share')+'</div><div class="pp-val">'+share+'</div></div>'+
              '<div><div class="pp-lbl">'+t('status_lbl')+'</div><div class="pp-val">'+status+'</div></div>'+
              '</div>'
            ).openPopup();
          });
        }
      }).addTo(map);
      console.log('BoundaryLayer added to map');
      upMS(H);
    })
    .catch(e=>{
      console.error('GeoJSON load failed:', e);
    });
}

function grantFill(g){
  return g==='KfW 1'?'#1a6fc4':g==='KfW 2'?'#2ea06b':'#e08a1e';
}

function showHCard(p){
  const h = H.find(x=>x.id===p.id) || H.find(x=>x.id===Number(p.id));
  const confirmed = h && h.children_u1_confirmed>0;
  document.getElementById('hc-n').textContent = p.name || p.n;
  document.getElementById('hc-o').textContent = p.oblast || p.o;
  document.getElementById('hc-p').textContent = (p.pop||0).toLocaleString(numLocale());
  document.getElementById('hc-c').textContent = confirmed ? h.children_u1_confirmed.toLocaleString(numLocale()) : '—';
  const pop = p.pop||1;
  document.getElementById('hc-s').textContent = confirmed ? (h.children_u1_confirmed/pop*100).toFixed(1)+'%' : '—';
  document.getElementById('hcard').classList.add('on');
}

function applyF(){
  const ob=document.getElementById('f-obl').value;
  const q=document.getElementById('f-q').value.toLowerCase().trim();
  const vis=[];
  if(boundaryLayer){
    boundaryLayer.eachLayer(layer=>{
      const p=layer.feature.properties;
      const h=H.find(x=>x.id===p.id);
      if(!h) return;
      const ok=(!ob||h.o===ob)&&(!q||h.n.toLowerCase().includes(q)||h.o.toLowerCase().includes(q));
      layer.setStyle({fillOpacity: ok?0.25:0, opacity: ok?0.8:0});
      if(ok) vis.push(h);
    });
  } else {
    H.forEach(h=>{
      const ok=(!ob||h.o===ob)&&(!q||h.n.toLowerCase().includes(q)||h.o.toLowerCase().includes(q));
      if(ok) vis.push(h);
    });
  }
  upMS(vis);
}
function toggleBounds(show){
  if(!boundaryLayer) return;
  if(show) boundaryLayer.addTo(map);
  else map.removeLayer(boundaryLayer);
}
function resetF(){['f-obl','f-kfw','f-q'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});document.getElementById('hcard').classList.remove('on');applyF()}
function upMS(v){
  document.getElementById('ms-n').textContent=v.length;
  document.getElementById('ms-p').textContent=Math.round(v.reduce((s,h)=>s+h.pop,0)/1000).toLocaleString(numLocale());
  const confirmed = v.filter(h=>h.children_u1_confirmed>0);
  document.getElementById('ms-c').textContent = confirmed.length
    ? confirmed.reduce((s,h)=>s+h.children_u1_confirmed,0).toLocaleString(numLocale())
    : '—';
  document.getElementById('ms-o').textContent=new Set(v.map(h=>h.o)).size;
}
