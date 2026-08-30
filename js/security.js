// SECURITY — відстань від маркера кожної громади до найближчого краю
// окупованої території (DeepState, github.com/cyterat/deepstate-map-data).
// Крок 11 (v0.7): лише автоматичний індикатор для довідки, не критерій
// відбору — рішення про участь громади ухвалює людина (CLAUDE.md).
//
// Джерело: data/deepstatemap_data_<YYYYMMDD>.geojson у тому репозиторії,
// окремий файл на кожен день, оновлюється о 03:00 UTC; немає файлу-
// псевдоніма "останній", тож пробуємо сьогодні (UTC) і, якщо 404, до 4
// попередніх днів. Не 19,7 МБ deepstate-map-data.geojson.gz з усією
// історією — той файл для клієнта не підходить.

const DEEPSTATE_BASE_URL = 'https://raw.githubusercontent.com/cyterat/deepstate-map-data/main/data/';
const DEEPSTATE_MAX_LOOKBACK_DAYS = 4;

function deepstateFilename(date){
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth()+1).padStart(2,'0');
  const d = String(date.getUTCDate()).padStart(2,'0');
  return `deepstatemap_data_${y}${m}${d}.geojson`;
}

async function fetchOccupiedTerritory(){
  const today = new Date();
  for(let back=0; back<=DEEPSTATE_MAX_LOOKBACK_DAYS; back++){
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - back);
    const filename = deepstateFilename(d);
    try{
      const r = await fetch(DEEPSTATE_BASE_URL + filename);
      if(!r.ok) continue; // файл ще не з'явився/пропуск дня — пробуємо на день раніше
      const geojson = await r.json();
      const feature = geojson.features && geojson.features[0];
      if(!feature || !feature.geometry) continue;
      return {feature, dateUsed: filename.match(/(\d{8})/)[1]};
    } catch(e){
      continue; // мережева помилка на цьому дні — теж пробуємо раніше, не падаємо одразу
    }
  }
  console.error('fetchOccupiedTerritory: жоден з останніх', DEEPSTATE_MAX_LOOKBACK_DAYS+1, 'днів DeepState не завантажився');
  return null;
}

function haversineKm(lat1, lng1, lat2, lng2){
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Найближча точка на відрізку [lat1,lng1]-[lat2,lng2] до (lat,lng) — через
// локальну рівнокутну проєкцію (довгота масштабується на cos(широти)),
// коректно на масштабі України; відстань до знайденої точки — через
// haversine. Turf.js та подібні бібліотеки навмисно не підключаємо
// (проєктне правило: лише Leaflet і Chart.js з CDN).
function pointToSegmentKm(lat, lng, lat1, lng1, lat2, lng2){
  const cosLat = Math.cos(lat * Math.PI/180);
  const x = lng*cosLat, y = lat;
  const x1 = lng1*cosLat, y1 = lat1;
  const x2 = lng2*cosLat, y2 = lat2;
  const dx = x2-x1, dy = y2-y1;
  let t = dx*dx+dy*dy === 0 ? 0 : ((x-x1)*dx + (y-y1)*dy) / (dx*dx+dy*dy);
  t = Math.max(0, Math.min(1, t));
  const projLat = lat1 + t*(lat2-lat1);
  const projLng = lng1 + t*(lng2-lng1);
  return haversineKm(lat, lng, projLat, projLng);
}

// Ray-casting, одне кільце координат [[lng,lat],...] (GeoJSON — lng першим).
function pointInRing(lat, lng, ring){
  let inside = false;
  for(let i=0, j=ring.length-1; i<ring.length; j=i++){
    const [lngI, latI] = ring[i];
    const [lngJ, latJ] = ring[j];
    const intersects = ((latI>lat) !== (latJ>lat)) &&
      (lng < (lngJ-lngI) * (lat-latI) / (latJ-latI) + lngI);
    if(intersects) inside = !inside;
  }
  return inside;
}

// Один Polygon (перше кільце — зовнішнє, наступні — дірки).
function pointInPolygon(lat, lng, polygonRings){
  if(!pointInRing(lat, lng, polygonRings[0])) return false;
  for(let i=1; i<polygonRings.length; i++){
    if(pointInRing(lat, lng, polygonRings[i])) return false; // у дірці — не всередині
  }
  return true;
}

function distanceToOccupiedKm(lat, lng, multiPolygonFeature){
  const polygons = multiPolygonFeature.geometry.coordinates; // MultiPolygon: [ [ring,...], ... ]
  let inside = false;
  let minKm = Infinity;
  polygons.forEach(polygonRings=>{
    if(!inside && pointInPolygon(lat, lng, polygonRings)) inside = true;
    polygonRings.forEach(ring=>{
      for(let i=0; i<ring.length-1; i++){
        const [lng1, lat1] = ring[i];
        const [lng2, lat2] = ring[i+1];
        const km = pointToSegmentKm(lat, lng, lat1, lng1, lat2, lng2);
        if(km < minKm) minKm = km;
      }
    });
  });
  if(inside) return {km:0, inside:true};
  return {km: minKm, inside:false};
}

function securityZone(km){
  if(km < SECURITY_THRESHOLDS_KM.red) return 'red';
  if(km < SECURITY_THRESHOLDS_KM.yellow) return 'yellow';
  return 'green';
}

let OCCUPIED_TERRITORY = null; // {feature, dateUsed} — зберігаємо для карти (Крок 11.2)

async function initSecurity(){
  const result = await fetchOccupiedTerritory();
  OCCUPIED_TERRITORY = result;
  if(!result){
    H.forEach(h=>{ h.security = null; });
    return;
  }
  H.forEach(h=>{
    const {km, inside} = distanceToOccupiedKm(h.lat, h.lng, result.feature);
    h.security = {km, inside, zone: securityZone(km)};
  });
}

window.fetchOccupiedTerritory = fetchOccupiedTerritory;
window.distanceToOccupiedKm = distanceToOccupiedKm;
window.securityZone = securityZone;
window.initSecurity = initSecurity;
