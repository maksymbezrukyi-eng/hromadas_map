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
const SUA={
  recommended:"Рекомендовано",not_recommended:"Не рекомендовано",pending:"Очікує",
  shortlisted:"Short-list",reserve:"Резерв",excluded:"Виключено",invited:"Запрошено",
  completed:"Заповнено",partial:"Частково",no_response:"Без відповіді",
  ok:"Ок",exclude:"Виключено",separate:"Окремо","have programme":"Має іншу програму",
  "НЕ ПОДАНО":"Не подано","не рекомендовано":"Не рекомендовано",
  "потребує рішення UNICEF":"Потребує рішення UNICEF","потребує даних":"Потребує даних",
  "ДООПРАЦЮВАННЯ АНКЕТИ":"Доопрацювання анкети",
};
const SBC={
  recommended:"b-rec",not_recommended:"b-notrec",pending:"b-pend",shortlisted:"b-short",
  reserve:"b-res",excluded:"b-excl",invited:"b-inv",
  ok:"b-rec",exclude:"b-excl",separate:"b-pend","have programme":"b-pend",
};
const KC={"KfW 1":"kfw1","KfW 2":"kfw2","KfW 2+":"kfw2p"};

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
window.SBC = SBC;
window.KC = KC;
window.CHART_FONT = CHART_FONT;
window.CHART_OPTS = CHART_OPTS;
