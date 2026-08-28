// DASHBOARD — chart instances cache
const _charts = {};
function mkChart(id, cfg) {
  if(_charts[id]) _charts[id].destroy();
  const el = document.getElementById(id);
  if(!el) return;
  _charts[id] = new Chart(el, cfg);
}

// Indicator picker — обраний показник → горизонтальний барчарт усіх громад,
// де він відомий, відсортованих за спаданням. Той самий тип графіка, що й
// раніше був тільки для "Топ-20 за балом", тепер під будь-який показник.
const INDICATOR_PICKS = [
  {k:'score_survey', l:'Бал опитування (макс 8)'},
  {k:'d1', l:'Домен 1: Демографічна потреба'},
  {k:'d2', l:'Домен 2: Стан ПМД'},
  {k:'d3', l:'Домен 3: Фінансова спроможність'},
  {k:'d4', l:'Домен 4: Географічний'},
  {k:'d5', l:'Домен 5: Соціальний'},
  {k:'d6', l:'Домен 6: Громадське здоров-я'},
  {k:'d4a', l:'Домен 7: Інституційний профіль'},
  {k:'children_u1_confirmed', l:'Дітей до 1 року (за анкетою)'},
  {k:'population_survey', l:'Населення (за анкетою)'},
];

function populateIndicatorPicker(){
  const sel = document.getElementById('ind-picker');
  if(!sel || sel.options.length) return; // once — не скидати вибір користувача
  INDICATOR_PICKS.forEach(d=>{
    const op = document.createElement('option');
    op.value = d.k; op.textContent = d.l;
    sel.appendChild(op);
  });
}

// Список громад (мультивибір) — за замовчуванням усі обрані. Натуральний
// <select multiple> замість власного переліку з чекбоксами: компактніший,
// має вбудований скрол, ctrl/shift-клік і пошук літерами з коробки.
function populateHromadaSelect(){
  const sel = document.getElementById('ind-hromadas');
  if(!sel || sel.options.length) return; // once — не скидати вибір користувача
  [...H].sort((a,b)=>a.n.localeCompare(b.n,'uk')).forEach(h=>{
    const op = document.createElement('option');
    op.value = h.id; op.textContent = `${h.n} (${h.o})`; op.selected = true;
    sel.appendChild(op);
  });
}

function renderIndicatorChart(){
  const field = document.getElementById('ind-picker').value;
  const selectedIds = new Set(Array.from(document.getElementById('ind-hromadas').selectedOptions).map(o=>Number(o.value)));
  const pick = INDICATOR_PICKS.find(d=>d.k===field) || INDICATOR_PICKS[0];
  const ranked = H.filter(h=>selectedIds.has(h.id) && h[pick.k]>0).sort((a,b)=>b[pick.k]-a[pick.k]);
  document.getElementById('ind-empty').style.display = ranked.length ? 'none' : '';
  if(!ranked.length){ if(_charts['ch-indicator']){_charts['ch-indicator'].destroy(); delete _charts['ch-indicator'];} return; }
  // Висоту задаємо контейнеру, не самому canvas — інакше Chart.js
  // (responsive:true) підганяє контейнер під canvas, а canvas під
  // контейнер по колу, і за кілька перерендерів висота "втікає" в нескінченність.
  document.getElementById('ind-chart-wrap').style.height = Math.max(180, ranked.length*18) + 'px';
  mkChart('ch-indicator',{
    type:'bar',
    data:{
      labels: ranked.map(h=>h.n.slice(0,18)),
      datasets:[{ data: ranked.map(h=>h[pick.k]), backgroundColor:'#006EB6', borderRadius:2 }]
    },
    options:{...CHART_OPTS, indexAxis:'y',
      scales:{
        y:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#6B6961'},grid:{display:false}},
        x:{ticks:{font:CHART_FONT,color:'#6B6961'},grid:{color:'#F2F1EE'}}
      }
    }
  });
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
  document.getElementById('donut-submit-title').textContent = `Подали опитувальник — ${submitted} з 68`;
  document.getElementById('donut-interview-title').textContent = `Пройшли інтерв'ю — ${interviewed} з 68`;
  mkChart('ch-submit-donut',{
    type:'doughnut',
    data:{labels:['Подали','Не подали'],datasets:[{data:[submitted,68-submitted],backgroundColor:['#006EB6','#E0DED8'],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:donutLegend()}}
  });
  mkChart('ch-interview-donut',{
    type:'doughnut',
    data:{labels:["Пройшли",'Ще ні'],datasets:[{data:[interviewed,68-interviewed],backgroundColor:['#1A6B3C','#E0DED8'],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:donutLegend()}}
  });
}

function initDash(){ populateIndicatorPicker(); populateHromadaSelect(); rebuildDashboard(); }

function rebuildDashboard(){
  // KPIs
  const shortlisted = H.filter(h=>h.sl==='shortlisted'||h.sl==='invited'||h.sl==='completed').length;
  const selected = H.filter(h=>h.final==='selected').length;
  document.getElementById('kpi-short').textContent = shortlisted||'—';
  document.getElementById('kpi-selected').textContent = selected||'—';
  renderSubmissionDonuts();
  renderIndicatorChart();

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
        labels:ranked.map(h=>h.n.slice(0,14)),
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
      {k:'d1',dl:'D1',l:'Демографічна потреба',w:'20%'},
      {k:'d2',dl:'D2',l:'Стан ПМД',w:'10%'},
      {k:'d3',dl:'D3',l:'Фінансова спроможність',w:'15%'},
      {k:'d4',dl:'D4',l:'Географічний',w:'10%'},
      {k:'d5',dl:'D5',l:'Соціальний',w:'5%'},
      {k:'d6',dl:'D6',l:'Громадське здоров-я',w:'10%'},
      {k:'d4a',dl:'D7',l:'Інституційний профіль',w:'10%'},
    ];
    const scored = H.filter(h=>h.score_survey>0);
    const domAvg = doms.map(d=>scored.length ? (scored.reduce((s,h)=>s+(h[d.k]||0),0)/scored.length).toFixed(1) : 0);
    mkChart('ch-domains',{
      type:'bar',
      data:{
        labels:doms.map(d=>d.l+' ('+d.w+')'),
        datasets:[{
          data:domAvg,
          backgroundColor:['#1A6B3C','#0D5E5E','#7D4E00','#5C3A7A','#2E7D32','#00695C','#1A237E'],
          borderRadius:2
        }]
      },
      options:{...CHART_OPTS,scales:{
        x:{ticks:{font:{family:'IBM Plex Mono',size:8},color:'#6B6961'},grid:{display:false}},
        y:{ticks:{font:CHART_FONT,color:'#6B6961'},grid:{color:'#F2F1EE'},max:10,
          title:{display:true,text:'Середній бал (макс 10)',font:CHART_FONT,color:'#6B6961'}}
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
          label:'Середнє',
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
    const chTxt = d.chConfirmed ? d.ch.toLocaleString('uk-UA') : '—';
    tb.innerHTML+=`<tr>
      <td>${o}</td>
      <td style="text-align:right;font-family:var(--mono)">${d.cnt}</td>
      <td style="text-align:right;font-family:var(--mono)">${chTxt}</td>
      <td style="text-align:right;font-family:var(--mono)">${d.short||'—'}</td>
      <td style="text-align:right;font-family:var(--mono)">${d.sel||'—'}</td>
      <td style="text-align:right;font-family:var(--mono)">${avg}</td>
    </tr>`;
  });
}
