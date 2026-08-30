// DASHBOARD — chart instances cache
const _charts = {};
function mkChart(id, cfg) {
  if(_charts[id]) _charts[id].destroy();
  const el = document.getElementById(id);
  if(!el) return;
  _charts[id] = new Chart(el, cfg);
}

// Indicator picker — обраний показник → горизонтальний барчарт усіх обраних
// громад, де він відомий, відсортованих за спаданням. Той самий тип
// графіка, що й раніше був тільки для "Топ-20 за балом", тепер під
// будь-який показник — згрупований по доменах: спершу підсумковий бал
// домену, потім його складові (Д1.1, Д1.2, ...).
// Структура груп/показників — самі назви (uk/en) живуть у config.js
// (DOMAIN_GROUPS, INDICATOR_LABELS), спільно з table.js, щоб та сама назва
// не перекладалась двічі по-різному.
const INDICATOR_GROUPS = [
  {groupKey:'general', items:['score_survey','children_u1_confirmed','population_survey']},
  {groupKey:'d1', items:['d1','d1_1','d1_2','d1_3','d1_4']},
  {groupKey:'d2', items:['d2','d2_1','d2_2','d2_3','d2_4']},
  {groupKey:'d3', items:['d3','d3_1','d3_2','d3_3']},
  {groupKey:'d4', items:['d4','d4_1','d4_2','d4_3']},
  {groupKey:'d5', items:['d5','d5_1','d5_2']},
  {groupKey:'d6', items:['d6','d6_1','d6_2','d6_3','d6_4','d6_5']},
  {groupKey:'d7', items:['d4a','d7_1','d7_2','d7_3']},
];

// Перелік показників — чекбокси (не select), згруповані по доменах
// нередагованими заголовками-роздільниками — той самий принцип, що й
// список громад нижче, щоб можна було порівнювати кілька показників
// одразу, а не тільки один. За замовчуванням позначений лише "Бал
// опитування", щоб при першому відкритті з'являвся один графік, як і
// раніше — порівняння кількох показників це свідомий вибір користувача,
// не 35 графіків одразу. Перебудовується і при старті, і при зміні мови
// (setLang), бо назви груп/показників залежать від LANG; позначені
// показники зберігаються через рестор після перебудови.
function populateIndicatorPickList(){
  const wrap = document.getElementById('ind-picklist');
  if(!wrap) return;
  const prevChecked = wrap.children.length ? selectedIndicatorKeys() : null;
  wrap.innerHTML = '';
  INDICATOR_GROUPS.forEach(g=>{
    const dg = DOMAIN_GROUPS.find(d=>d.key===g.groupKey);
    const hdr = document.createElement('div');
    hdr.className = 'ind-group-hdr';
    hdr.textContent = domainGroupName(dg);
    wrap.appendChild(hdr);
    g.items.forEach(k=>{
      const lbl = document.createElement('label');
      const nm = indicatorLabel(k);
      lbl.dataset.name = nm.toLowerCase();
      const checked = prevChecked ? prevChecked.has(k) : (k==='score_survey');
      lbl.innerHTML = `<input type="checkbox" ${checked?'checked':''} value="${k}">${nm}`;
      wrap.appendChild(lbl);
    });
  });
}
function indPickSetAll(checked){
  document.querySelectorAll('#ind-picklist input[type=checkbox]').forEach(cb=>cb.checked=checked);
}
function filterIndPickList(){
  const q = document.getElementById('ind-pick-q').value.toLowerCase().trim();
  document.querySelectorAll('#ind-picklist label').forEach(lbl=>{
    lbl.style.display = (!q || lbl.dataset.name.includes(q)) ? '' : 'none';
  });
  // Заголовок домену ховаємо, якщо під ним не лишилось жодного видимого показника.
  document.querySelectorAll('#ind-picklist .ind-group-hdr').forEach(hdr=>{
    let sib = hdr.nextElementSibling, anyVisible = false;
    while(sib && !sib.classList.contains('ind-group-hdr')){
      if(sib.style.display !== 'none') anyVisible = true;
      sib = sib.nextElementSibling;
    }
    hdr.style.display = anyVisible ? '' : 'none';
  });
}
function selectedIndicatorKeys(){
  return new Set(Array.from(document.querySelectorAll('#ind-picklist input:checked')).map(cb=>cb.value));
}

// Перелік громад — чекбокси (не <select multiple>): звичайний клік
// вмикає/вимикає одну громаду, без Ctrl/Shift, зрозуміліше для порівняння
// кількох конкретних громад. Висота списку фіксована в CSS (.ind-list),
// тож він не впливає на "розповзання" картки.
// Перебудовується і при старті, і при зміні мови (setLang) — назви
// транслітеруються, тож текст лейблів залежить від LANG; список
// відмічених id зберігається через рестор після перебудови.
function populateHromadaList(){
  const wrap = document.getElementById('ind-hromadas');
  if(!wrap) return;
  const prevChecked = wrap.children.length
    ? new Set(selectedHromadaIds())
    : null; // null = перший запуск, усе позначено за замовчуванням
  wrap.innerHTML = '';
  const collLang = (typeof LANG!=='undefined' && LANG==='en') ? 'en' : 'uk';
  const sortName = h => trName(h.n);
  [...H].sort((a,b)=>sortName(a).localeCompare(sortName(b),collLang)).forEach(h=>{
    const lbl = document.createElement('label');
    const nm = trName(h.n), ob = trName(h.o);
    lbl.dataset.name = (h.n+' '+h.o+' '+nm+' '+ob).toLowerCase();
    const checked = prevChecked ? prevChecked.has(h.id) : true;
    lbl.innerHTML = `<input type="checkbox" ${checked?'checked':''} value="${h.id}">${nm} (${ob})`;
    wrap.appendChild(lbl);
  });
}
function indListSetAll(checked){
  document.querySelectorAll('#ind-hromadas input[type=checkbox]').forEach(cb=>cb.checked=checked);
}
function filterIndList(){
  const q = document.getElementById('ind-list-q').value.toLowerCase().trim();
  document.querySelectorAll('#ind-hromadas label').forEach(lbl=>{
    lbl.style.display = (!q || lbl.dataset.name.includes(q)) ? '' : 'none';
  });
}
function selectedHromadaIds(){
  return new Set(Array.from(document.querySelectorAll('#ind-hromadas input:checked')).map(cb=>Number(cb.value)));
}

// Порівняння кількох громад за кількома показниками одразу — три подання
// одночасно, бо показники бувають на геть різних шкалах (населення —
// сотні тисяч, бали доменів — 0-10) і "один графік на все" або оманливий,
// або взагалі не намалюється:
//   1. Таблиця — завжди коректна, будь-яка комбінація шкал.
//   2. Згрупований барчарт — тільки якщо всі обрані показники сумірні
//      (COMPARABLE_SCALE_FIELDS у config.js), інакше показуємо пояснення.
//   3. Міні-графіки — по одному на показник, кожен у своєму масштабі.
const GROUPED_CHART_COLORS = ['#1A6B3C','#0D5E5E','#7D4E00','#5C3A7A','#2E7D32','#00695C','#1A237E','#B23B3B'];
let _indicatorChartIds = [];

function fmtIndVal(v){
  if(!(v>0)) return '—';
  return Number.isInteger(v) ? v.toLocaleString(numLocale()) : v.toFixed(2);
}

function renderCompareTable(hromadas, keys, wrap){
  const table = document.getElementById('ind-compare-table');
  const thead = '<thead><tr><th>'+t('col_hromada')+'</th>'+keys.map(k=>`<th>${indicatorLabel(k)}</th>`).join('')+'</tr></thead>';
  const tbody = '<tbody>'+hromadas.map(h=>
    '<tr><td>'+trName(h.n)+'</td>'+keys.map(k=>`<td>${fmtIndVal(h[k])}</td>`).join('')+'</tr>'
  ).join('')+'</tbody>';
  table.innerHTML = thead+tbody;
  wrap.style.display = '';
}

function renderGroupedChart(hromadas, keys){
  const note = document.getElementById('ind-grouped-note');
  const chartWrap = document.getElementById('ind-grouped-wrap');
  const comparable = keys.every(k=>COMPARABLE_SCALE_FIELDS.has(k));
  if(!comparable){
    note.style.display = '';
    chartWrap.style.display = 'none';
    if(_charts['ch-indicator-grouped']){ _charts['ch-indicator-grouped'].destroy(); delete _charts['ch-indicator-grouped']; }
    return;
  }
  note.style.display = 'none';
  chartWrap.style.display = '';
  // Висота задається обгортці, не canvas — той самий фікс "розповзання",
  // що й у міні-графіках нижче.
  chartWrap.style.height = Math.max(180, hromadas.length*keys.length*10) + 'px';
  mkChart('ch-indicator-grouped',{
    type:'bar',
    data:{
      labels: hromadas.map(h=>trName(h.n).slice(0,18)),
      datasets: keys.map((k,i)=>({
        label: indicatorLabel(k),
        data: hromadas.map(h=>h[k]||0),
        backgroundColor: GROUPED_CHART_COLORS[i % GROUPED_CHART_COLORS.length],
        borderRadius:2
      }))
    },
    options:{...CHART_OPTS, indexAxis:'y',
      plugins:{legend:{display:true,position:'bottom',labels:{font:CHART_FONT,color:'#6B6961',boxWidth:10,padding:10}}},
      scales:{
        y:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#6B6961'},grid:{display:false}},
        x:{ticks:{font:CHART_FONT,color:'#6B6961'},grid:{color:'#F2F1EE'}}
      }
    }
  });
}

function renderMiniCharts(hromadas, keys, container){
  keys.forEach(k=>{
    const rankedForKey = hromadas.filter(h=>h[k]>0).sort((a,b)=>b[k]-a[k]);
    if(!rankedForKey.length) return; // немає даних по цьому показнику — нічого малювати
    const title = document.createElement('div');
    title.className = 'ind-mini-title';
    title.textContent = indicatorLabel(k);
    container.appendChild(title);
    const wrap = document.createElement('div');
    wrap.className = 'ind-chart-wrap';
    wrap.style.height = Math.max(140, rankedForKey.length*18) + 'px';
    const canvasId = 'ind-chart-'+k;
    const canvas = document.createElement('canvas');
    canvas.id = canvasId;
    wrap.appendChild(canvas);
    container.appendChild(wrap);
    _indicatorChartIds.push(canvasId);
    mkChart(canvasId,{
      type:'bar',
      data:{
        labels: rankedForKey.map(h=>trName(h.n).slice(0,18)),
        datasets:[{ data: rankedForKey.map(h=>h[k]), backgroundColor:'#006EB6', borderRadius:2 }]
      },
      options:{...CHART_OPTS, indexAxis:'y',
        scales:{
          y:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#6B6961'},grid:{display:false}},
          x:{ticks:{font:CHART_FONT,color:'#6B6961'},grid:{color:'#F2F1EE'}}
        }
      }
    });
  });
}

function renderIndicatorComparison(){
  const selectedIds = selectedHromadaIds();
  const keys = [...selectedIndicatorKeys()];
  const hromadas = H.filter(h=>selectedIds.has(h.id));
  const emptyMsg = document.getElementById('ind-empty');
  const tableWrap = document.getElementById('ind-compare-table-wrap');
  const groupedSection = document.getElementById('ind-grouped-section');
  const chartsContainer = document.getElementById('ind-charts-container');

  // Завжди чистимо попередні міні-графіки перед перебудовою — інакше
  // Chart.js-інстанси лишаються "висіти" на видалених canvas.
  _indicatorChartIds.forEach(id=>{ if(_charts[id]){ _charts[id].destroy(); delete _charts[id]; } });
  _indicatorChartIds = [];
  chartsContainer.innerHTML = '';

  if(!hromadas.length || !keys.length){
    emptyMsg.style.display = '';
    tableWrap.style.display = 'none';
    groupedSection.style.display = 'none';
    if(_charts['ch-indicator-grouped']){ _charts['ch-indicator-grouped'].destroy(); delete _charts['ch-indicator-grouped']; }
    return;
  }
  emptyMsg.style.display = 'none';
  // Згрупований графік має сенс лише від 2 показників — з одним це те
  // саме, що й перший міні-графік нижче, тож секцію просто ховаємо, а не
  // показуємо примітку "різні шкали" (це була б неправда — показник один).
  groupedSection.style.display = keys.length >= 2 ? '' : 'none';
  if(keys.length < 2 && _charts['ch-indicator-grouped']){
    _charts['ch-indicator-grouped'].destroy(); delete _charts['ch-indicator-grouped'];
  }

  // Сортуємо за першим обраним показником (спаданням) — той самий принцип,
  // що й у старому одиничному графіку: найвищий результат згори.
  const sorted = [...hromadas].sort((a,b)=>(b[keys[0]]||0)-(a[keys[0]]||0));

  renderCompareTable(sorted, keys, tableWrap);
  if(keys.length >= 2) renderGroupedChart(sorted, keys);
  renderMiniCharts(sorted, keys, chartsContainer);
}

// Два донати замість старої текстової воронки — скільки подали опитувальник
// і скільки пройшли інтерв'ю, з 68. Легенда показує саме й абсолютне число, і
// відсоток — без плагіна datalabels (його нема серед дозволених залежностей),
// суто через стандартний generateLabels у Chart.js.
function donutLegend(){
  return {
    position:'bottom',
    labels:{
      font:CHART_FONT, color:'#6B6961', boxWidth:10, padding:12,
      generateLabels(chart){
        const d = chart.data;
        const total = d.datasets[0].data.reduce((s,v)=>s+v,0) || 1;
        return d.labels.map((l,i)=>{
          const v = d.datasets[0].data[i];
          const pct = Math.round(v/total*100);
          return {
            text:`${l}: ${v} (${pct}%)`,
            fillStyle:d.datasets[0].backgroundColor[i],
            strokeStyle:d.datasets[0].backgroundColor[i],
            index:i
          };
        });
      }
    }
  };
}
function renderSubmissionDonuts(){
  const submitted = H.filter(h=>h.score_survey>0).length;
  const interviewed = H.filter(h=>h.interview && h.interview!=='pending').length;
  document.getElementById('donut-submit-title').textContent = t('donut_submitted_title', submitted, H.length);
  document.getElementById('donut-interview-title').textContent = t('donut_interviewed_title', interviewed, H.length);
  mkChart('ch-submit-donut',{
    type:'doughnut',
    data:{labels:[t('donut_submitted'),t('donut_not_submitted')],datasets:[{data:[submitted,H.length-submitted],backgroundColor:['#006EB6','#E0DED8'],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:donutLegend()}}
  });
  mkChart('ch-interview-donut',{
    type:'doughnut',
    data:{labels:[t('donut_interviewed_short'),t('donut_not_yet')],datasets:[{data:[interviewed,H.length-interviewed],backgroundColor:['#1A6B3C','#E0DED8'],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:donutLegend()}}
  });
}

function initDash(){ populateIndicatorPickList(); populateHromadaList(); rebuildDashboard(); }

function rebuildDashboard(){
  // KPIs
  const shortlisted = H.filter(h=>h.sl==='shortlisted'||h.sl==='invited'||h.sl==='completed').length;
  const selected = H.filter(h=>h.final==='selected').length;
  document.getElementById('kpi-total').textContent = H.length;
  document.getElementById('kpi-short').textContent = shortlisted||'—';
  document.getElementById('kpi-selected').textContent = selected||'—';
  document.getElementById('kpi-oblasts').textContent = new Set(H.map(h=>h.o)).size;
  renderSubmissionDonuts();
  renderIndicatorComparison();

  // Scores — only if data available
  const hasScores = SCORING_DATA.length > 0 && H.some(h=>h.score_survey>0);
  document.getElementById('scores-row').style.display = hasScores ? '' : 'none';
  document.getElementById('dist-row').style.display = hasScores ? '' : 'none';

  if(hasScores) {
    // Top 20 by survey score
    const ranked = [...H].filter(h=>h.score_survey>0).sort((a,b)=>b.score_survey-a.score_survey).slice(0,20);
    mkChart('ch-top20',{
      type:'bar',
      data:{
        labels:ranked.map(h=>trName(h.n).slice(0,14)),
        datasets:[{
          data:ranked.map(h=>h.score_survey),
          backgroundColor:ranked.map(h=>{
            if(h.final==='selected') return '#1A6B3C';
            if(h.sl==='shortlisted') return '#006EB6';
            if(h.sl==='reserve') return '#E08A1E';
            return '#AEACA4';
          }),
          borderRadius:2
        }]
      },
      options:{...CHART_OPTS,indexAxis:'y',scales:{
        y:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#6B6961'},grid:{display:false}},
        x:{ticks:{font:CHART_FONT,color:'#6B6961'},grid:{color:'#F2F1EE'},max:8}
      }}
    });

    // Domain averages
    const doms = [
      {k:'d1',dl:'D1',w:'20%'},
      {k:'d2',dl:'D2',w:'10%'},
      {k:'d3',dl:'D3',w:'15%'},
      {k:'d4',dl:'D4',w:'10%'},
      {k:'d5',dl:'D5',w:'5%'},
      {k:'d6',dl:'D6',w:'10%'},
      {k:'d4a',dl:'D7',w:'10%'},
    ];
    const scored = H.filter(h=>h.score_survey>0);
    const domAvg = doms.map(d=>scored.length ? (scored.reduce((s,h)=>s+(h[d.k]||0),0)/scored.length).toFixed(1) : 0);
    mkChart('ch-domains',{
      type:'bar',
      data:{
        labels:doms.map(d=>domainShortName(d.k)+' ('+d.w+')'),
        datasets:[{
          data:domAvg,
          backgroundColor:['#1A6B3C','#0D5E5E','#7D4E00','#5C3A7A','#2E7D32','#00695C','#1A237E'],
          borderRadius:2
        }]
      },
      options:{...CHART_OPTS,scales:{
        x:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#6B6961'},grid:{display:false}},
        y:{ticks:{font:CHART_FONT,color:'#6B6961'},grid:{color:'#F2F1EE'},max:10,
          title:{display:true,text:t('avg_score_axis'),font:CHART_FONT,color:'#6B6961'}}
      }}
    });

    // Distribution
    const buckets = [0,1,2,3,4,5,6,7,8].map(i=>({min:i,max:i+1,cnt:0}));
    H.filter(h=>h.score_survey>0).forEach(h=>{
      const b = buckets.find(b=>h.score_survey>=b.min&&h.score_survey<b.max);
      if(b) b.cnt++;
    });
    mkChart('ch-dist',{
      type:'bar',
      data:{
        labels:buckets.map(b=>`${b.min}–${b.max}`),
        datasets:[{data:buckets.map(b=>b.cnt),backgroundColor:'#006EB6',borderRadius:2}]
      },
      options:{...CHART_OPTS}
    });

    // Radar
    mkChart('ch-radar',{
      type:'radar',
      data:{
        labels:doms.map(d=>d.dl),
        datasets:[{
          label:t('avg_dataset_label'),
          data:domAvg,
          borderColor:'#006EB6',backgroundColor:'rgba(0,110,182,0.1)',
          pointBackgroundColor:'#006EB6',borderWidth:2
        }]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        scales:{r:{min:0,max:10,ticks:{font:CHART_FONT,color:'#6B6961',stepSize:2},
          pointLabels:{font:{family:'IBM Plex Mono',size:9}}}},
        plugins:{legend:{display:false}}
      }
    });
  }

  // Oblast summary table
  const tb = document.getElementById('otbl');
  tb.innerHTML='';
  const od={};
  H.forEach(h=>{
    if(!od[h.o])od[h.o]={ch:0,chConfirmed:0,cnt:0,short:0,sel:0,scores:[]};
    if(h.children_u1_confirmed>0){od[h.o].ch+=h.children_u1_confirmed; od[h.o].chConfirmed++;}
    od[h.o].cnt++;
    if(h.sl==='shortlisted'||h.sl==='invited') od[h.o].short++;
    if(h.final==='selected') od[h.o].sel++;
    if(h.score_survey>0) od[h.o].scores.push(h.score_survey);
  });
  Object.entries(od).sort((a,b)=>b[1].cnt-a[1].cnt).forEach(([o,d])=>{
    const avg = d.scores.length ? (d.scores.reduce((s,v)=>s+v,0)/d.scores.length).toFixed(1) : '—';
    const chTxt = d.chConfirmed ? d.ch.toLocaleString(numLocale()) : '—';
    tb.innerHTML+=`<tr>
      <td>${trName(o)}</td>
      <td style="text-align:right;font-family:var(--mono)">${d.cnt}</td>
      <td style="text-align:right;font-family:var(--mono)">${chTxt}</td>
      <td style="text-align:right;font-family:var(--mono)">${d.short||'—'}</td>
      <td style="text-align:right;font-family:var(--mono)">${d.sel||'—'}</td>
      <td style="text-align:right;font-family:var(--mono)">${avg}</td>
    </tr>`;
  });
}
