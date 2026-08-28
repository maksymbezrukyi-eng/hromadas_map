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
  else if(state==='schema') { el.textContent='⚠ Відсутні очікувані колонки — див. консоль'; el.style.color='#E08A1E'; }
  else { el.textContent='✗ Помилка з\'єднання'; el.style.color='#B71C1C'; }
}

// Returns the subset of `expected` that isn't a key on `row` — an empty
// array means the source has everything the code expects to find.
function missingColumns(row, expected) {
  if(!row) return expected;
  return expected.filter(col => !(col in row));
}

function updateSyncLabel() {
  const el = document.getElementById('sync-status');
  if(!el) return;
  // A schema/connection problem must stay visible even after a silent
  // (auto-refresh) sync, not just get overwritten with "щойно оновлено".
  if(LAST_SYNC.status === 'schema-warning') { showSyncStatus('schema'); return; }
  if(LAST_SYNC.status === 'error') { showSyncStatus('error'); return; }
  if(LAST_SYNC.time) {
    const mins = Math.round((new Date()-LAST_SYNC.time)/60000);
    el.textContent = mins < 1 ? 'Щойно оновлено' : `Оновлено ${mins} хв тому`;
    el.style.color='#6B6961';
  } else {
    el.textContent='Не синхронізовано';
    el.style.color='#AEACA4';
  }
}

// Sync — entry point used by the UI button and auto-refresh. Delegates to
// whichever source DATA_SOURCE (config.js) names; the rest of the app
// doesn't need to know which one ran.
function syncFromSheets(silent=false) {
  if(DATA_SOURCE === 'local') return loadFromLocal(silent);
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
    const scoringRowsRaw = csv2 ? parseCSV(csv2) : [];
    const rankingRowsRaw = csv3 ? parseCSV(csv3) : [];
    const missing = {
      status: missingColumns(statusRows[0], EXPECTED_COLUMNS.sheets.status),
      scoring: missingColumns(scoringRowsRaw[0], EXPECTED_COLUMNS.sheets.scoring),
      ranking: missingColumns(rankingRowsRaw[0], EXPECTED_COLUMNS.sheets.ranking),
    };
    const missingReport = Object.entries(missing).filter(([,cols])=>cols.length);
    if(missingReport.length) {
      console.error('syncFromSheets: відсутні очікувані колонки —',
        missingReport.map(([sheet,cols])=>`${sheet}: ${cols.join(', ')}`).join(' | '));
    }
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
    SCORING_DATA = scoringRowsRaw.filter(r=>parseInt(r['hromada_id'])>0);
    // Ranking sheet — store globally
    RANKING_DATA = rankingRowsRaw.filter(r=>parseInt(r['hromada_id'])>0);
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
    LAST_SYNC.status = missingReport.length ? 'schema-warning' : 'ok';
    updateHeaderStats();
    refreshMarkers();
    rebuildDashboard();
    if(document.getElementById('pane-tbl').classList.contains('active')) renderT();
    if(!silent) showSyncStatus(missingReport.length ? 'schema' : 'ok');
    updateSyncLabel();
  }).catch(e=>{
    LAST_SYNC.status = 'error';
    if(!silent) showSyncStatus('error');
    console.warn('Sheets sync failed:', e);
  });

}

// Local source — data/hromadas_survey.json, a snapshot exported from the
// selection workbook by scripts/convert_workbook.ps1. Same merge targets
// on H as syncFromSheets, so the rest of the app doesn't need to care
// which source ran.
function loadFromLocal(silent=false) {
  if(!silent) showSyncStatus('loading');
  const t = '?t=' + Date.now();
  fetch(LOCAL_DATA_URL + t)
    .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(rows=>{
      const missing = missingColumns(rows[0], EXPECTED_COLUMNS.local.survey);
      if(missing.length) {
        console.error('loadFromLocal: у', LOCAL_DATA_URL, 'відсутні очікувані поля —', missing.join(', '));
      }
      SCORING_DATA = rows.filter(r=>r.score_survey>0);
      RANKING_DATA = rows.filter(r=>r.final_score>0);
      rows.forEach(row=>{
        const h = H.find(x=>x.id===row.id);
        if(!h) return;
        if(row.us) h.us = row.us;
        if(row.sl) h.sl = row.sl;
        if(row.interview) h.interview = row.interview;
        if(row.final) h.final = row.final;
        h.score_survey = row.score_survey||0;
        h.d1 = row.d1||0; h.d2 = row.d2||0; h.d3 = row.d3||0;
        h.d4 = row.d4||0; h.d5 = row.d5||0; h.d6 = row.d6||0;
        h.d4a = row.d4a||0;
        // Домен-складові (Д1.1..Д7.3) — для випадаючого списку показників
        // у дашборді, поза сімома підсумковими балами вище.
        SUB_INDICATOR_FIELDS.forEach(k=>{ h[k] = row[k]||0; });
        h.final_score = row.final_score||0;
        h.rank = row.rank||0;
        // Real, questionnaire-reported figures — only set once a hromada's
        // anketa is accepted. Kept as a separate field from h.ch (the old
        // KfW-file estimate, no longer shown anywhere as of Крок 5).
        if(row.children_u1>0) h.children_u1_confirmed = row.children_u1;
        if(row.population_survey>0) h.population_survey = row.population_survey;
      });
      LAST_SYNC.time = new Date();
      LAST_SYNC.status = missing.length ? 'schema-warning' : 'ok';
      updateHeaderStats();
      refreshMarkers();
      rebuildDashboard();
      if(document.getElementById('pane-tbl').classList.contains('active')) renderT();
      if(!silent) showSyncStatus(missing.length ? 'schema' : 'ok');
      updateSyncLabel();
    })
    .catch(e=>{
      LAST_SYNC.status = 'error';
      if(!silent) showSyncStatus('error');
      console.warn('Local data load failed:', e);
    });
}
