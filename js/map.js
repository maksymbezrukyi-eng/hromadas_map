// Refresh marker colors based on updated statuses
function refreshMarkers() {
  MKS.forEach(m=>{
    const h=m.h;
    const color = statusMarkerColor(h);
    m.setStyle({fillColor:color});
  });
  if(boundaryLayer) {
    boundaryLayer.eachLayer(layer=>{
      const p = layer.feature.properties;
      const h = H.find(x=>x.id===p.id) || H.find(x=>x.id===Number(p.id));
      if(h) {
        const color = statusMarkerColor(h);
        layer.setStyle({fillColor:color,color:color,fillOpacity:0.15});
      }
    });
  }
}

function statusMarkerColor(h) {
  // If has final status — color by it
  if(h.final && h.final!=='pending' && h.final!=='') {
    if(h.final==='selected') return '#1A6B3C';
    if(h.final==='reserve') return '#7D4E00';
    if(h.final==='excluded') return '#B71C1C';
  }
  // Otherwise by shortlist
  if(h.sl==='shortlisted') return '#1A6B3C';
  if(h.sl==='reserve') return '#E08A1E';
  if(h.sl==='excluded') return '#B71C1C';
  // Default — pending / missing status
  return '#6B6961';
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
            const ch = Number(p.children||p.ch)||0;
            const share = pop ? (ch/pop*100).toFixed(1) : '—';
            const h = H.find(x=>x.id===p.id)||H.find(x=>x.id===Number(p.id));
            const status = h ? (SUA[h.final]||SUA[h.sl]||SUA[h.us]||'Очікує') : '—';
            layer.bindPopup(
              '<div class="pp-name">'+(p.name||p.n||'')+'</div>'+
              '<div class="pp-obl">'+(p.oblast||p.o||'')+'</div>'+
              '<div class="pp-grid">'+
              '<div><div class="pp-lbl">Населення</div><div class="pp-val">'+pop.toLocaleString('uk-UA')+'</div></div>'+
              '<div><div class="pp-lbl">Дітей до 1р.</div><div class="pp-val">'+ch.toLocaleString('uk-UA')+'</div></div>'+
              '<div><div class="pp-lbl">Частка</div><div class="pp-val">'+share+'%</div></div>'+
              '<div><div class="pp-lbl">Статус</div><div class="pp-val">'+status+'</div></div>'+
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
  document.getElementById('hc-n').textContent = p.name || p.n;
  document.getElementById('hc-o').textContent = p.oblast || p.o;
  document.getElementById('hc-p').textContent = (p.pop||0).toLocaleString('uk-UA');
  document.getElementById('hc-c').textContent = (p.children||p.ch||0).toLocaleString('uk-UA');
  const pop = p.pop||1; const ch = p.children||p.ch||0;
  document.getElementById('hc-s').textContent = (ch/pop*100).toFixed(1)+'%';
  document.getElementById('hc-k').textContent = p.grant||p.g;
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
  document.getElementById('ms-p').textContent=Math.round(v.reduce((s,h)=>s+h.pop,0)/1000).toLocaleString('uk-UA');
  document.getElementById('ms-c').textContent=v.reduce((s,h)=>s+h.ch,0).toLocaleString('uk-UA');
  document.getElementById('ms-o').textContent=new Set(v.map(h=>h.o)).size;
}
