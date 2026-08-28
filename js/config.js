// Where live sync pulls data from.
// 'sheets' — Google Sheets CSV (current, live behaviour).
// 'local'  — data/hromadas_survey.json, a snapshot exported from the
//            selection workbook. Not switched on yet — see README.
const DATA_SOURCE = 'sheets';

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
    survey: ['id','us','sl','interview','final','score_survey','d1','d2','d3','d4','d5','d6','d4a','final_score','rank'],
  },
};

const LOCAL_DATA_URL = 'data/hromadas_survey.json';

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
  'Д4А РАЗОМ (макс 10)':'Домен 4А: Інституційний профіль',
  'ЗВАЖЕНИЙ БАЛ ОПИТ. (макс 8,0)':'Зважений бал опитування (макс 8.0)',
};

const GC={"KfW 1":"#1a6fc4","KfW 2":"#2ea06b","KfW 2+":"#e08a1e"};
const SUA={recommended:"Рекомендовано",not_recommended:"Не рекомендовано",pending:"Очікує",shortlisted:"Short-list",reserve:"Резерв",excluded:"Виключено",invited:"Запрошено",completed:"Заповнено",partial:"Частково",no_response:"Без відповіді"};
const SBC={recommended:"b-rec",not_recommended:"b-notrec",pending:"b-pend",shortlisted:"b-short",reserve:"b-res",excluded:"b-excl",invited:"b-inv"};
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
window.SHEETS = SHEETS;
window.INDICATOR_NAMES = INDICATOR_NAMES;
window.GC = GC;
window.SUA = SUA;
window.SBC = SBC;
window.KC = KC;
window.CHART_FONT = CHART_FONT;
window.CHART_OPTS = CHART_OPTS;
