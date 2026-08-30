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
            const security = h ? securityBadgeText(h) : '—';
            layer.bindPopup(
              '<div class="pp-name">'+trName(p.name||p.n||'')+'</div>'+
              '<div class="pp-obl">'+trName(p.oblast||p.o||'')+'</div>'+
              '<div class="pp-grid">'+
              '<div><div class="pp-lbl">'+t('population')+'</div><div class="pp-val">'+pop.toLocaleString(numLocale())+'</div></div>'+
              '<div><div class="pp-lbl">'+t('children_u1')+'</div><div class="pp-val">'+childrenTxt+'</div></div>'+
              '<div><div class="pp-lbl">'+t('share')+'</div><div class="pp-val">'+share+'</div></div>'+
              '<div><div class="pp-lbl">'+t('status_lbl')+'</div><div class="pp-val">'+status+'</div></div>'+
              '<div><div class="pp-lbl">'+t('col_security')+'</div><div class="pp-val">'+security+'</div></div>'+
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

// Останні показані властивості — щоб перемалювати картку тими самими
// даними, якщо мову перемкнули, поки вона відкрита (інакше назва/число
// лишаться в старій мові до наступного ховера).
let lastHCardProps = null;
function showHCard(p){
  lastHCardProps = p;
  const h = H.find(x=>x.id===p.id) || H.find(x=>x.id===Number(p.id));
  const confirmed = h && h.children_u1_confirmed>0;
  document.getElementById('hc-n').textContent = trName(p.name || p.n);
  document.getElementById('hc-o').textContent = trName(p.oblast || p.o);
  document.getElementById('hc-p').textContent = (p.pop||0).toLocaleString(numLocale());
  document.getElementById('hc-c').textContent = confirmed ? h.children_u1_confirmed.toLocaleString(numLocale()) : '—';
  const pop = p.pop||1;
  document.getElementById('hc-s').textContent = confirmed ? (h.children_u1_confirmed/pop*100).toFixed(1)+'%' : '—';
  document.getElementById('hc-sec').textContent = h ? securityBadgeText(h) : '—';
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
      const ok=(!ob||h.o===ob)&&(!q||hMatches(h,q));
      layer.setStyle({fillOpacity: ok?0.25:0, opacity: ok?0.8:0});
      if(ok) vis.push(h);
    });
  } else {
    H.forEach(h=>{
      const ok=(!ob||h.o===ob)&&(!q||hMatches(h,q));
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

// Окупована територія (Крок 11.2) — окремий Leaflet GeoJSON-шар поверх меж
// громад, той самий патерн, що й boundaryLayer у loadBoundaries(), але без
// interaction-обробників (лише візуальний контекст). Вимкнено за
// замовчуванням — це довідковий шар, не основний вигляд карти.
let occupiedLayer = null;
function buildOccupiedLayer(){
  occupiedLayer = L.geoJSON(OCCUPIED_TERRITORY.feature, {
    style: {fillColor:SECURITY_ZONE_COLORS.red, fillOpacity:0.22, color:SECURITY_ZONE_COLORS.red, weight:1, opacity:0.5},
    interactive: false,
  });
}
function toggleOccupiedLayer(show){
  if(!OCCUPIED_TERRITORY) return; // джерело недоступне — чекбокс задизейблений (onSecurityLoaded)
  if(show){
    if(!occupiedLayer) buildOccupiedLayer();
    occupiedLayer.addTo(map);
  } else if(occupiedLayer){
    map.removeLayer(occupiedLayer);
  }
}
// Підпис дати DeepState + вмикання/вимикання чекбокса залежно від того, чи
// вдалось завантажити джерело. Викликається і після initSecurity() (перший
// раз), і з setLang() (переклад підпису під нову мову).
function updateOccupiedNote(){
  const note = document.getElementById('occupied-date-note');
  const cb = document.getElementById('toggle-occupied');
  if(!note || !cb) return;
  // Пояснювальна підказка — щоб не сплутати цей автоматичний індикатор з
  // офіційною оцінкою за Додатком C (яка теж є, у вкладці Паспорт, Крок 11.3).
  const proxyNote = t('security_auto_proxy_note');
  const thSecurity = document.getElementById('th-security');
  const toggleLbl = document.getElementById('toggle-occupied-lbl');
  if(thSecurity) thSecurity.title = proxyNote;
  if(toggleLbl) toggleLbl.title = proxyNote;
  if(OCCUPIED_TERRITORY){
    const ymd = OCCUPIED_TERRITORY.dateUsed; // "20260830"
    const d = new Date(Date.UTC(+ymd.slice(0,4), +ymd.slice(4,6)-1, +ymd.slice(6,8)));
    note.textContent = t('occupied_date_note', d.toLocaleDateString(numLocale(), {timeZone:'UTC'}));
    cb.disabled = false;
  } else {
    note.textContent = t('occupied_unavailable');
    cb.disabled = true;
  }
}
// Викликається один раз після initSecurity() (app.js) — таблиця й hcard уже
// могли відрендеритись до того, як h.security з'явився, тож перемальовуємо
// їх, якщо зараз видимі (той самий принцип, що й lastHCardProps у setLang()).
function onSecurityLoaded(){
  updateOccupiedNote();
  if(document.getElementById('pane-tbl').classList.contains('active')) renderT();
  if(lastHCardProps) showHCard(lastHCardProps);
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
