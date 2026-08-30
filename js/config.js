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

// Вага і макс. зважений бал кожного домену — протокол відбору, Додаток
// A.1 "Домени, ваги та джерела даних". Разом (з доменом 8) — 100% / 10.0.
// Для вкладки "Паспорт показників" (Крок 10).
const DOMAIN_WEIGHTS = {
  d1:{weight:'20%', max:2.0}, d2:{weight:'10%', max:1.0}, d3:{weight:'15%', max:1.5},
  d4:{weight:'10%', max:1.0}, d5:{weight:'5%', max:0.5}, d6:{weight:'10%', max:1.0},
  d7:{weight:'10%', max:1.0},
};
// Домен 8 (оцінювання інтерв'ю, вага 20%, макс 2.0) не має полів у H[] —
// окрема статична структура з протоколу, Додаток A.3 "Домен 8".
const PASSPORT_INTERVIEW_BLOCKS = [
  {name:{uk:'Блок 1. Лідерство', en:'Block 1. Leadership'}, max:4,
    desc:{uk:'Конкретні управлінські рішення; розуміння потреб і особливостей послуг для дітей віком до 1 року та дітей віком 0–3 роки включно; готовність запроваджувати і підтримувати зміни.'}},
  {name:{uk:'Блок 2. Інституційна спроможність', en:'Block 2. Institutional capacity'}, max:3,
    desc:{uk:'Фактичне співфінансування; план фінансової сталості після завершення донорської підтримки; міжсекторальна співпраця.'}},
  {name:{uk:'Блок 3. Безпека та адаптація', en:'Block 3. Safety and adaptation'}, max:null,
    desc:{uk:'Оцінювання адаптації програми до умов воєнного стану — інформаційний блок, не оцінюється балами; результати заносяться до Форми оцінювання для формування загального профілю громади.'}},
  {name:{uk:'Блок 4. Ризики та обмеження', en:'Block 4. Risks and constraints'}, max:3,
    desc:{uk:'Відкритість щодо проблем і впроваджених заходів, визначення чинників, що впливають на реалізацію програми.'}},
];

const INDICATOR_LABELS = {
  score_survey: {uk:'Бал опитування (макс 8)', en:'Survey score (max 8)'},
  children_u1_confirmed: {uk:'Дітей до 1 року (за анкетою)', en:'Children under 1 (from survey)'},
  population_survey: {uk:'Населення (за анкетою)', en:'Population (from survey)'},
  final_score: {uk:'Фінальний бал (макс 10)', en:'Final score (max 10)'},
  rank: {uk:'Позиція в рейтингу', en:'Rank'},

  d1: {uk:'Домен 1 — загальний бал', en:'Domain 1 — total score'},
  d1_1: {uk:'Д1.1 Діти 0–3 років', en:'D1.1 Children 0–3 years'},
  d1_2: {uk:'Д1.2 Частка дітей 0–3 років у населенні', en:'D1.2 Share of children 0–3 in population'},
  d1_3: {uk:'Д1.3 Частка вразливих серед дітей 0–3 років', en:'D1.3 Share of vulnerable among children 0–3'},
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
  d5_1: {uk:'Д5.1 Профілактичні огляди вразливих дітей до 1 року', en:'D5.1 Check-ups of vulnerable children under 1'},
  d5_2: {uk:'Д5.2 Частка вразливих серед охоплених оглядами', en:'D5.2 Share of vulnerable among children covered by check-ups'},

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

// Опис методу оцінювання + макс. бал + тип значення (для типу діаграми,
// Крок 9) — з офіційного протоколу відбору, Додаток A "Матриця оцінювання"
// (Hromada`s\Survey`s protokol (UKR).docx). Лише українською — протокол не
// має англійської версії; в EN-режимі опис показується українською, не
// ховається (короткі назви INDICATOR_LABELS вище лишаються двомовними).
// valueType:'percentage' — рівно ті 12 підпоказників, де протокол прямо
// каже "Частка ... (%)"; решта ('other') — абсолютні кількості, км,
// грн/особу, співвідношення, категоріальні 0-2/0-3/0-4 бали.
const INDICATOR_META = {
  d1_1: {maxPoints:2, valueType:'other',
    desc:{uk:'Абсолютна кількість дітей віком 0–3 роки 11 місяців 29 днів станом на 01.01.2026 (S2_CH04_T). Квартиль у вибірці: Q4=2, Q3=2, Q2=1, Q1=1.'}},
  d1_2: {maxPoints:3, valueType:'percentage',
    desc:{uk:'Частка дітей віком 0–3 роки 11 місяців 29 днів у загальній чисельності населення громади (%). Розрахунок: S2_CH04_T / S2_POP_T × 100. Квартиль у валідній вибірці: Q4=3, Q3=2, Q2=1, Q1=0.'}},
  d1_3: {maxPoints:3, valueType:'percentage',
    desc:{uk:'Частка дітей із вразливих груп серед усіх дітей віком 0–3 роки 11 місяців 29 днів (%). Розрахунок: S2_VUL04_T / S2_CH04_T × 100. Квартиль у валідній вибірці: Q4=3, Q3=2, Q2=1, Q1=0.'}},
  d1_4: {maxPoints:2, valueType:'other',
    desc:{uk:'Загальна кількість дітей віком до 18 років станом на 01.01.2026 (S2_CH18_T). Квартиль у вибірці: Q4=2, Q3=1, Q2=1, Q1=0.'}},

  d2_1: {maxPoints:4, valueType:'percentage',
    desc:{uk:'Частка дітей віком до 1 року без декларації з лікарем ПМД (%). Розрахунок: (S2_CH01_T − S3_07_A) / S2_CH01_T × 100. Зворотний квартиль у валідній вибірці: Q1=4, Q2=3, Q3=2, Q4=1.'}},
  d2_2: {maxPoints:3, valueType:'percentage',
    desc:{uk:"Частка домашніх візитів серед усіх контактів для профілактичних оглядів дітей до 1 року у 2025 році (%) (S3_10 = S3_08_T / S3_09 × 100). Квартиль у валідній вибірці: Q4=3, Q3=2, Q2=1, Q1=0."}},
  d2_3: {maxPoints:2, valueType:'percentage',
    desc:{uk:'Частка вакантних посад лікарів ПМД серед усіх зазначених посад лікарів ПМД (%). Розрахунок: (S3_06_PED + S3_06_GP) / (S3_05_PED_T + S3_05_GP_T + S3_06_PED + S3_06_GP) × 100. Зворотна фіксована шкала: <10%=2, 10–25%=1, >25%=0.'}},
  d2_4: {maxPoints:1, valueType:'other',
    desc:{uk:'Співвідношення медичних працівників ПМД, залучених до профілактичних оглядів, до лікарів ПМД, які надають допомогу дітям до 4 років. Розрахунок: S3_13_T / (S3_05_PED_T + S3_05_GP_T). Фіксована шкала: ≥1.0=1; <1.0=0.'}},

  d3_1: {maxPoints:2, valueType:'other',
    desc:{uk:'Наявність окремої місцевої бюджетної програми підтримки ПМД у 2026 році (S4_01_NAME, S4_01_KPKV). Окрема профінансована програма=2; включено до загальної програми=1; відсутня=0.'}},
  d3_2: {maxPoints:4, valueType:'percentage',
    desc:{uk:"Частка видатків місцевого бюджету на підтримку ПМД у загальних планових видатках місцевого бюджету на охорону здоров'я у 2026 році (%). Розрахунок: S4_03 / S4_02 × 100. Квартиль у валідній вибірці: Q4=4, Q3=3, Q2=2, Q1=1."}},
  d3_3: {maxPoints:4, valueType:'other',
    desc:{uk:'Видатки місцевого бюджету на підтримку ПМД на одного жителя у 2026 році (тис. грн на особу). Розрахунок: S4_03 / S2_POP_T. Квартиль у валідній вибірці: Q4=4, Q3=3, Q2=2, Q1=1.'}},

  d4_1: {maxPoints:2, valueType:'other',
    desc:{uk:'Кількість населених пунктів у громаді (S5_02). Квартиль у вибірці: Q4=2, Q3=2, Q2=1, Q1=0.'}},
  d4_2: {maxPoints:4, valueType:'other',
    desc:{uk:'Відстань від найвіддаленішого населеного пункту до найближчого місця надання ПМД (S5_03_KM, км автошляхами). Квартиль у валідній вибірці: Q4=4, Q3=3, Q2=2, Q1=1.'}},
  d4_3: {maxPoints:4, valueType:'other',
    desc:{uk:'Середня відстань від населених пунктів до найближчого місця надання ПМД (S5_04, км). Квартиль у валідній вибірці: Q4=4, Q3=3, Q2=2, Q1=1.'}},

  d5_1: {maxPoints:5, valueType:'other',
    desc:{uk:'Кількість профілактичних оглядів дітей до 1 року з вразливих сімей у 2025 році (S3_14). Немає обліку = 0; якщо дані наявні — зворотний квартиль: Q1=5, Q2=3, Q3=2, Q4=1.'}},
  d5_2: {maxPoints:5, valueType:'percentage',
    desc:{uk:'Частка дітей із вразливих груп серед усіх дітей, охоплених профілактичними оглядами у 2025 році (%) (S3_15). Немає обліку = 0; якщо дані наявні — зворотний квартиль: Q1=5, Q2=3, Q3=2, Q4=1.'}},

  d6_1: {maxPoints:2, valueType:'percentage',
    desc:{uk:'Охоплення третім щепленням АКДП дітей до 1 року у 2025 році (%) (S6_01). Зворотний квартиль: Q1=2, Q2=1, Q3=1, Q4=0. Джерело: ЕСОЗ, наказ МОЗ №595.'}},
  d6_2: {maxPoints:2, valueType:'percentage',
    desc:{uk:"Охоплення першим щепленням КПК дітей, яким у 2025 році виповнилося 12 місяців (%) (S6_02). Зворотний квартиль: Q1=2, Q2=1, Q3=1, Q4=0. Джерело: ЕСОЗ, наказ МОЗ №595."}},
  d6_3: {maxPoints:2, valueType:'percentage',
    desc:{uk:'Частка дітей до 1 року з 4+ профілактичними оглядами за перший рік життя у 2025 році (%) (S6_04). Зворотний квартиль: Q1=2, Q2=1, Q3=1, Q4=0.'}},
  d6_4: {maxPoints:2, valueType:'percentage',
    desc:{uk:'Частка дітей до 4 років, охоплених плановими оглядами у 18 місяців, 2 та 3 роки (%) (S6_04A). Зворотний квартиль: Q1=2, Q2=1, Q3=1, Q4=0.'}},
  d6_5: {maxPoints:2, valueType:'percentage',
    desc:{uk:'Частка дітей до 6 місяців на виключно грудному вигодовуванні у 2025 році (%) (S6_05). Зворотний квартиль: Q1=2, Q2=1, Q3=1, Q4=0.'}},

  d7_1: {maxPoints:4, valueType:'other',
    desc:{uk:'Участь і ролі в програмах міжнародної технічної допомоги у сфері ПМД, 2020–2025 (S7_01, S7_01B_*, S7_01C). Найвищий відповідний бал: виконавець 2+ програм=4; виконавець 1 програми=3; партнер=2; отримувач послуг=1; участь відсутня=0.'}},
  d7_2: {maxPoints:3, valueType:'other',
    desc:{uk:"Наявність і структура відділу/підрозділу охорони здоров'я громади (S7_02, S7_03A_T, S7_03B). Окремий підрозділ 3+ посад=3; окремий підрозділ <3 посад=2; суміщена відповідальність=1; відповідального підрозділу немає=0."}},
  d7_3: {maxPoints:3, valueType:'other',
    desc:{uk:'Якість трьох мотиваційних відповідей громади (S7_04A/B/C). Конкретна проблема + конкретні кроки + реалістичні очікування=3; часткова конкретика без прикладів=1; формальна відповідь без змісту=0.'}},

  score_survey: {maxPoints:8, valueType:'other',
    desc:{uk:"Зважена сума балів доменів 1–7 (Фаза 1, опитувальник) — максимум 8,0 з 10,0 загальних; решта 2,0 додає оцінка інтерв'ю (домен 8)."}},
  final_score: {maxPoints:10, valueType:'other',
    desc:{uk:"Підсумковий бал: сума зважених балів усіх 8 доменів (Фаза 1 + оцінка інтерв'ю), максимум 10,0."}},
  rank: {maxPoints:null, valueType:'other', desc:{uk:'Позиція громади в рейтингу за фінальним/поточним балом серед допущених до оцінювання громад.'}},
  population_survey: {maxPoints:null, valueType:'other', desc:{uk:'Загальна чисельність населення громади за поданою анкетою (S2_POP_T), станом на 01.01.2026.'}},
  children_u1_confirmed: {maxPoints:null, valueType:'other', desc:{uk:'Кількість дітей віком до 1 року за поданою анкетою (S2_CH01_T), станом на 01.01.2026.'}},
};
function indicatorMeta(k){ return INDICATOR_META[k] || null; }

// Показники, чиї значення сумірні на одній шкалі (0-10, домени й
// підпоказники опитування — max ~8-10) — тільки для них має сенс
// згрупований барчарт "усі показники поруч". population_survey/
// children_u1_confirmed/rank навмисно виключені: інші порядки величин,
// в одному графіку зі шкалою 0-10 вони або зникнуть, або зламають вісь.
const COMPARABLE_SCALE_FIELDS = new Set([
  ...SUB_INDICATOR_FIELDS,
  'd1','d2','d3','d4','d5','d6','d4a','score_survey','final_score',
]);
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
window.COMPARABLE_SCALE_FIELDS = COMPARABLE_SCALE_FIELDS;
window.INDICATOR_META = INDICATOR_META;
window.indicatorMeta = indicatorMeta;
window.DOMAIN_WEIGHTS = DOMAIN_WEIGHTS;
window.PASSPORT_INTERVIEW_BLOCKS = PASSPORT_INTERVIEW_BLOCKS;
window.SBC = SBC;
window.KC = KC;
window.CHART_FONT = CHART_FONT;
window.CHART_OPTS = CHART_OPTS;
