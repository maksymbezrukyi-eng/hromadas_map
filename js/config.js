// Where live sync pulls data from.
// 'sheets' — Google Sheets CSV. Kept in the codebase but not used —
//            the team decided the selection workbook is the source of
//            truth (Крок 5 of the project plan).
// 'local'  — data/hromadas_survey.json, a snapshot exported from the
//            selection workbook via scripts/convert_workbook.ps1.
const DATA_SOURCE = 'local';

// Columns/fields each source is expected to provide. Checked on every
// load; a missing one is reported instead of silently producing blanks.
const EXPECTED_COLUMNS = {
  sheets: {
    status: ['hromada_id','UNICEF статус','Short-list',"Статус інтерв'ю",'Фінальний статус'],
    scoring: ['hromada_id','ЗВАЖЕНИЙ БАЛ ОПИТ. (макс 8,0)','Д1 РАЗОМ (макс 10)','Д2 РАЗОМ (макс 10)','Д3 РАЗОМ (макс 10)','Д4 РАЗОМ (макс 10)','Д5 РАЗОМ (макс 10)','Д6 РАЗОМ (макс 10)','Д4А РАЗОМ (макс 10)'],
    ranking: ['hromada_id','final_score (макс 10,0)','rank_auto','final_decision'],
  },
  local: {
    // data/hromadas_survey.json — one object per hromada with a real
    // score, keyed by field name (see scripts/convert_workbook.ps1).
    survey: ['id','us','sl','interview','final','score_survey',
      'd1','d1_1','d1_2','d1_3','d1_4',
      'd2','d2_1','d2_2','d2_3','d2_4',
      'd3','d3_1','d3_2','d3_3',
      'd4','d4_1','d4_2','d4_3',
      'd5','d5_1','d5_2',
      'd6','d6_1','d6_2','d6_3','d6_4','d6_5',
      'd4a','d7_1','d7_2','d7_3',
      'final_score','rank','children_u1','population_survey'],
  },
};

const LOCAL_DATA_URL = 'data/hromadas_survey.json';

// Домен-складові (Д1.1..Д7.3) з data/hromadas_survey.json — сирі значення,
// з яких складаються сім підсумкових доменних балів (h.d1..h.d4a). Окремий
// список, бо його потрібно і sheets.js (щоб знати, що зливати на H), і
// dashboard.js (щоб побудувати підменю показників по доменах).
const SUB_INDICATOR_FIELDS = [
  'd1_1','d1_2','d1_3','d1_4',
  'd2_1','d2_2','d2_3','d2_4',
  'd3_1','d3_2','d3_3',
  'd4_1','d4_2','d4_3',
  'd5_1','d5_2',
  'd6_1','d6_2','d6_3','d6_4','d6_5',
  'd7_1','d7_2','d7_3',
];

const SHEETS = {
  status: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDCuFGnAQaSspoRNdHZ3xXrfmz942eMZzpyHoSs3oilu5yvU0Q7nmwQlqLTiVCd50j7-do-J82ICaD/pub?gid=1397593365&single=true&output=csv',
  scoring: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDCuFGnAQaSspoRNdHZ3xXrfmz942eMZzpyHoSs3oilu5yvU0Q7nmwQlqLTiVCd50j7-do-J82ICaD/pub?gid=672236927&single=true&output=csv',
  ranking: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDCuFGnAQaSspoRNdHZ3xXrfmz942eMZzpyHoSs3oilu5yvU0Q7nmwQlqLTiVCd50j7-do-J82ICaD/pub?gid=2079674827&single=true&output=csv',
};
const INDICATOR_NAMES = {
  'Д1.1':'К-сть дітей до 1 року','Д1.2':'Частка дітей від населення',
  'Д1.3':'Частка вразливих груп','Д1.4':'К-сть дітей до 18 років',
  'Д1 РАЗОМ (макс 10)':'Домен 1: Демографічна потреба',
  'Д2.1':'Діти без декларації ПМД','Д2.2':'Частка домашніх візитів',
  'Д2.3':'Вакансії лікарів ПМД','Д2.4':'Вакансії медсестер ПМД',
  'Д2 РАЗОМ (макс 10)':'Домен 2: Стан системи ПМД',
  'Д3.1':'Бюджетна програма ПМД','Д3.2':'Частка бюджету на ПМД',
  'Д3.3':'Кошти понад капітаційну ставку',
  'Д3 РАЗОМ (макс 10)':'Домен 3: Фінансова спроможність',
  'Д4.1':'К-сть населених пунктів','Д4.2':'Макс. відстань до ПМД',
  'Д4.3':'Сер. відстань до ПМД',
  'Д4 РАЗОМ (макс 10)':'Домен 4: Географічний',
  'Д5.1':'Візити до вразливих сімей','Д5.2':'Частка вразливих серед охоплених',
  'Д5 РАЗОМ (макс 10)':'Домен 5: Соціальний',
  'Д6.1':'Охоплення АКДП-3','Д6.2':'Охоплення КПК-1',
  'Д6.3':'Постнатальні огляди 7 днів','Д6.4':'Грудне вигодовування',
  "Д6 РАЗОМ (макс 10)":"Домен 6 — Громадське здоров-я",
  'Д4А.1':'Досвід програм МТД','Д4А.2':'Структура підрозділу ОЗ',
  'Д4А.3':'Якість мотиваційного листа',
  'Д4А РАЗОМ (макс 10)':'Домен 7: Інституційний профіль',
  'ЗВАЖЕНИЙ БАЛ ОПИТ. (макс 8,0)':'Зважений бал опитування (макс 8.0)',
};

const GC={"KfW 1":"#1a6fc4","KfW 2":"#2ea06b","KfW 2+":"#e08a1e"};
// us/sl/interview/final badge vocabulary. recommended/not_recommended/
// shortlisted/invited/completed/partial/no_response are the values the old
// Google Sheets columns used; ok/exclude/separate/"have programme" and the
// "final" registry-status strings are what the workbook itself actually
// contains (confirmed against data/hromadas_survey.json) — kept side by
// side rather than replacing, since either source can still populate H.
// {uk,en} за той самий принцип, що й INDICATOR_LABELS вище — ключі це сирі
// значення статусів (частина з воркбука напряму, українською), значення —
// те, що показуємо користувачу залежно від активної мови.
const SUA={
  recommended:{uk:"Рекомендовано",en:"Recommended"},
  not_recommended:{uk:"Не рекомендовано",en:"Not recommended"},
  pending:{uk:"Очікує",en:"Pending"},
  shortlisted:{uk:"Short-list",en:"Short-list"},
  reserve:{uk:"Резерв",en:"Reserve"},
  excluded:{uk:"Виключено",en:"Excluded"},
  invited:{uk:"Запрошено",en:"Invited"},
  completed:{uk:"Заповнено",en:"Completed"},
  partial:{uk:"Частково",en:"Partial"},
  no_response:{uk:"Без відповіді",en:"No response"},
  ok:{uk:"Ок",en:"OK"},
  exclude:{uk:"Виключено",en:"Excluded"},
  separate:{uk:"Окремо",en:"Separate"},
  "have programme":{uk:"Має іншу програму",en:"Has another programme"},
  "НЕ ПОДАНО":{uk:"Не подано",en:"Not submitted"},
  "не рекомендовано":{uk:"Не рекомендовано",en:"Not recommended"},
  "потребує рішення UNICEF":{uk:"Потребує рішення UNICEF",en:"Requires UNICEF decision"},
  "потребує даних":{uk:"Потребує даних",en:"Requires data"},
  "ДООПРАЦЮВАННЯ АНКЕТИ":{uk:"Доопрацювання анкети",en:"Survey needs revision"},
};
function statusLabel(s){
  const e = SUA[s];
  if(!e) return s;
  return e[typeof LANG!=='undefined'?LANG:'uk'] || e.uk;
}
const SBC={
  recommended:"b-rec",not_recommended:"b-notrec",pending:"b-pend",shortlisted:"b-short",
  reserve:"b-res",excluded:"b-excl",invited:"b-inv",
  ok:"b-rec",exclude:"b-excl",separate:"b-pend","have programme":"b-pend",
};
const KC={"KfW 1":"kfw1","KfW 2":"kfw2","KfW 2+":"kfw2p"};

// Домени й показники — {uk, en} для кожного. Спільне джерело для
// dashboard.js (випадаючий список "Показник") і table.js (розгорнутий
// рядок таблиці) — щоб та сама назва не перекладалась двічі по-різному.
const DOMAIN_GROUPS = [
  {key:'general', name:{uk:'Загальне', en:'General'}},
  {key:'d1', name:{uk:'Домен 1: Демографічна потреба', en:'Domain 1: Demographic need'}},
  {key:'d2', name:{uk:'Домен 2: Стан ПМД', en:'Domain 2: PHC system status'}},
  {key:'d3', name:{uk:'Домен 3: Фінансова спроможність', en:'Domain 3: Financial capacity'}},
  {key:'d4', name:{uk:'Домен 4: Географічний', en:'Domain 4: Geographic'}},
  {key:'d5', name:{uk:'Домен 5: Соціальний', en:'Domain 5: Social'}},
  {key:'d6', name:{uk:"Домен 6: Громадське здоров'я", en:'Domain 6: Public health'}},
  {key:'d7', name:{uk:'Домен 7: Інституційний профіль', en:'Domain 7: Institutional profile'}},
];
const INDICATOR_LABELS = {
  score_survey: {uk:'Бал опитування (макс 8)', en:'Survey score (max 8)'},
  children_u1_confirmed: {uk:'Дітей до 1 року (за анкетою)', en:'Children under 1 (from survey)'},
  population_survey: {uk:'Населення (за анкетою)', en:'Population (from survey)'},
  final_score: {uk:'Фінальний бал (макс 10)', en:'Final score (max 10)'},
  rank: {uk:'Позиція в рейтингу', en:'Rank'},

  d1: {uk:'Домен 1 — загальний бал', en:'Domain 1 — total score'},
  d1_1: {uk:'Д1.1 Діти до 1 року', en:'D1.1 Children under 1'},
  d1_2: {uk:'Д1.2 Частка дітей до 1 року', en:'D1.2 Share of children under 1'},
  d1_3: {uk:'Д1.3 Частка вразливих до 1 року', en:'D1.3 Share of vulnerable under 1'},
  d1_4: {uk:'Д1.4 Діти до 18 років', en:'D1.4 Children under 18'},

  d2: {uk:'Домен 2 — загальний бал', en:'Domain 2 — total score'},
  d2_1: {uk:'Д2.1 Діти без декларації', en:'D2.1 Children without a PHC declaration'},
  d2_2: {uk:'Д2.2 Домашні візити', en:'D2.2 Home visits'},
  d2_3: {uk:'Д2.3 Вакансії лікарів', en:'D2.3 Doctor vacancies'},
  d2_4: {uk:'Д2.4 Медсестри / лікарі', en:'D2.4 Nurses / doctors'},

  d3: {uk:'Домен 3 — загальний бал', en:'Domain 3 — total score'},
  d3_1: {uk:'Д3.1 Бюджетна програма ПМД', en:'D3.1 PHC budget programme'},
  d3_2: {uk:'Д3.2 Частка ПМД у видатках ОЗ', en:'D3.2 PHC share of health spending'},
  d3_3: {uk:'Д3.3 Видатки ПМД на 1 мешканця', en:'D3.3 PHC spending per capita'},

  d4: {uk:'Домен 4 — загальний бал', en:'Domain 4 — total score'},
  d4_1: {uk:'Д4.1 Населені пункти', en:'D4.1 Settlements'},
  d4_2: {uk:'Д4.2 Максимальна відстань', en:'D4.2 Maximum distance'},
  d4_3: {uk:'Д4.3 Середня відстань', en:'D4.3 Average distance'},

  d5: {uk:'Домен 5 — загальний бал', en:'Domain 5 — total score'},
  d5_1: {uk:'Д5.1 Домашні візити до вразливих', en:'D5.1 Home visits to vulnerable families'},
  d5_2: {uk:'Д5.2 Частка вразливих у домашніх візитах', en:'D5.2 Share of vulnerable in home visits'},

  d6: {uk:'Домен 6 — загальний бал', en:'Domain 6 — total score'},
  d6_1: {uk:'Д6.1 АКДП-3', en:'D6.1 DTP-3 coverage'},
  d6_2: {uk:'Д6.2 КПК-1', en:'D6.2 MMR-1 coverage'},
  d6_3: {uk:'Д6.3 4+ огляди до 1 року', en:'D6.3 4+ check-ups under 1'},
  d6_4: {uk:'Д6.4 Планові огляди 0–3', en:'D6.4 Scheduled check-ups 0–3'},
  d6_5: {uk:'Д6.5 Грудне вигодовування', en:'D6.5 Breastfeeding'},

  d4a: {uk:'Домен 7 — загальний бал', en:'Domain 7 — total score'},
  d7_1: {uk:'Д7.1 Досвід МТД', en:'D7.1 International TA experience'},
  d7_2: {uk:'Д7.2 Підрозділ ОЗ', en:'D7.2 Health unit structure'},
  d7_3: {uk:'Д7.3 Якість відповідей', en:'D7.3 Response quality'},
};
function indicatorLabel(k){
  const e = INDICATOR_LABELS[k];
  if(!e) return k;
  return e[typeof LANG!=='undefined'?LANG:'uk'] || e.uk;
}
function domainGroupName(g){
  return g.name[typeof LANG!=='undefined'?LANG:'uk'] || g.name.uk;
}

// Короткі назви доменів (без префікса "Домен N:") — для барчарту/радара
// "Середні бали по доменах", де повна назва + вага і так поруч.
const DOMAIN_SHORT_NAMES = {
  d1: {uk:'Демографічна потреба', en:'Demographic need'},
  d2: {uk:'Стан ПМД', en:'PHC system status'},
  d3: {uk:'Фінансова спроможність', en:'Financial capacity'},
  d4: {uk:'Географічний', en:'Geographic'},
  d5: {uk:'Соціальний', en:'Social'},
  d6: {uk:"Громадське здоров'я", en:'Public health'},
  d4a: {uk:'Інституційний профіль', en:'Institutional profile'},
};
function domainShortName(k){
  const e = DOMAIN_SHORT_NAMES[k];
  if(!e) return k;
  return e[typeof LANG!=='undefined'?LANG:'uk'] || e.uk;
}

const CHART_FONT = {family:'IBM Plex Mono',size:9};
const CHART_OPTS = {
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{display:false}},
  scales:{
    x:{ticks:{font:CHART_FONT,color:'#6B6961'},grid:{display:false}},
    y:{ticks:{font:CHART_FONT,color:'#6B6961'},grid:{color:'#F2F1EE'}}
  }
};

window.DATA_SOURCE = DATA_SOURCE;
window.EXPECTED_COLUMNS = EXPECTED_COLUMNS;
window.LOCAL_DATA_URL = LOCAL_DATA_URL;
window.SUB_INDICATOR_FIELDS = SUB_INDICATOR_FIELDS;
window.SHEETS = SHEETS;
window.INDICATOR_NAMES = INDICATOR_NAMES;
window.GC = GC;
window.SUA = SUA;
window.statusLabel = statusLabel;
window.SBC = SBC;
window.KC = KC;
window.CHART_FONT = CHART_FONT;
window.CHART_OPTS = CHART_OPTS;
