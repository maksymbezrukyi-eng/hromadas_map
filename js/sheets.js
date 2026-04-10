// Parse CSV row handling quoted fields
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
  return lines.slice(1).map(line => {
    const vals = []; let cur = ''; let inQ = false;
    for(let i=0;i<line.length;i++) {
      if(line[i]==='"') inQ=!inQ;
      else if(line[i]===',' && !inQ) { vals.push(cur.trim()); cur=''; }
      else cur+=line[i];
    }
    vals.push(cur.trim());
    const obj={};
    headers.forEach((h,i)=>obj[h]=vals[i]||'');
    return obj;
  });
}

function showSyncStatus(state, count) {
  const el = document.getElementById('sync-status');
  if(!el) return;
  if(state==='loading') { el.textContent='⟳ Синхронізація...'; el.style.color='#6B6961'; }
  else if(state==='ok') { el.textContent='✓ Дані оновлено'; el.style.color='#1A6B3C'; setTimeout(()=>updateSyncLabel(),3000); }
  else { el.textContent='✗ Помилка з\'єднання'; el.style.color='#B71C1C'; }
}

function updateSyncLabel() {
  const el = document.getElementById('sync-status');
  if(!el) return;
  if(LAST_SYNC.time) {
    const mins = Math.round((new Date()-LAST_SYNC.time)/60000);
    el.textContent = mins < 1 ? 'Щойно оновлено' : `Оновлено ${mins} хв тому`;
    el.style.color='#6B6961';
  } else {
    el.textContent='Не синхронізовано';
    el.style.color='#AEACA4';
  }
}

// Sync all sheets
function syncFromSheets(silent=false) {
  if(!silent) showSyncStatus('loading');
  const t = '&t=' + Date.now();
  // Fetch each sheet independently — one failure won't block others
  const safe = url => fetch(url + t).then(r=>r.text()).catch(()=>'');
  Promise.all([
    safe(SHEETS.status),
    safe(SHEETS.scoring),
    safe(SHEETS.ranking),
  ]).then(([csv1, csv2, csv3]) => {
    // Status sheet
    const statusRows = csv1 ? parseCSV(csv1) : [];
    statusRows.forEach(row=>{
      const id = parseInt(row['hromada_id']);
      if(!id) return;
      const h = H.find(x=>x.id===id);
      if(!h) return;
      if(row['UNICEF статус']) h.us = row['UNICEF статус'];
      if(row['Short-list']) h.sl = row['Short-list'];
      if(row["Статус інтерв'ю"]) h.interview = row["Статус інтерв'ю"];
      if(row['Фінальний статус']) h.final = row['Фінальний статус'];
    });
    // Scoring sheet — store globally
    SCORING_DATA = csv2 ? parseCSV(csv2).filter(r=>parseInt(r['hromada_id'])>0) : [];
    // Ranking sheet — store globally
    RANKING_DATA = csv3 ? parseCSV(csv3).filter(r=>parseInt(r['hromada_id'])>0) : [];
    // Attach scores to H
    SCORING_DATA.forEach(row=>{
      const h = H.find(x=>x.id===parseInt(row['hromada_id']));
      if(!h) return;
      h.score_survey = parseFloat(row['ЗВАЖЕНИЙ БАЛ ОПИТ. (макс 8,0)'])||0;
      h.d1 = parseFloat(row['Д1 РАЗОМ (макс 10)'])||0;
      h.d2 = parseFloat(row['Д2 РАЗОМ (макс 10)'])||0;
      h.d3 = parseFloat(row['Д3 РАЗОМ (макс 10)'])||0;
      h.d4 = parseFloat(row['Д4 РАЗОМ (макс 10)'])||0;
      h.d5 = parseFloat(row['Д5 РАЗОМ (макс 10)'])||0;
      h.d6 = parseFloat(row['Д6 РАЗОМ (макс 10)'])||0;
      h.d4a = parseFloat(row['Д4А РАЗОМ (макс 10)'])||0;
    });
    RANKING_DATA.forEach(row=>{
      const h = H.find(x=>x.id===parseInt(row['hromada_id']));
      if(!h) return;
      h.final_score = parseFloat(row['final_score (макс 10,0)'])||0;
      h.rank = parseInt(row['rank_auto'])||0;
      h.final = row['final_decision']||h.final||'pending';
    });
    LAST_SYNC.time = new Date();
    LAST_SYNC.status = 'ok';
    refreshMarkers();
    rebuildDashboard();
    if(document.getElementById('pane-tbl').classList.contains('active')) renderT();
    if(!silent) showSyncStatus('ok');
    updateSyncLabel();
  }).catch(e=>{
    LAST_SYNC.status = 'error';
    if(!silent) showSyncStatus('error');
    console.warn('Sheets sync failed:', e);
  });

}
