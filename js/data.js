const H=[
  {id:1,n:"Чернігівська",o:"Чернігівська",g:"KfW 1",pop:279492,ch:40980,lat:51.498,lng:31.289,us:"recommended",sl:"pending"},
  {id:2,n:"Бахматська",o:"Чернігівська",g:"KfW 2",pop:26076,ch:3795,lat:51.178,lng:32.807,us:"recommended",sl:"pending"},
  {id:3,n:"Бобровицька",o:"Чернігівська",g:"KfW 2",pop:21928,ch:3190,lat:51.238,lng:32.162,us:"recommended",sl:"pending"},
  {id:4,n:"Куликівська",o:"Чернігівська",g:"KfW 2",pop:13951,ch:2046,lat:51.527,lng:31.822,us:"recommended",sl:"pending"},
  {id:5,n:"Менська",o:"Чернігівська",g:"KfW 2",pop:20683,ch:3023,lat:51.518,lng:32.207,us:"recommended",sl:"pending"},
  {id:6,n:"Ніжинська",o:"Чернігівська",g:"KfW 2",pop:60272,ch:8771,lat:51.051,lng:31.891,us:"recommended",sl:"pending"},
  {id:7,n:"Криворізька",o:"Дніпропетровська",g:"KfW 2",pop:570154,ch:90126,lat:47.907,lng:33.391,us:"recommended",sl:"pending"},
  {id:8,n:"Новомосковська",o:"Дніпропетровська",g:"KfW 2+",pop:77101,ch:11972,lat:48.633,lng:35.252,us:"recommended",sl:"pending"},
  {id:9,n:"Жовтоводська",o:"Дніпропетровська",g:"KfW 2+",pop:46816,ch:7001,lat:48.353,lng:33.880,us:"recommended",sl:"pending"},
  {id:10,n:"Верхньодніпровська",o:"Дніпропетровська",g:"KfW 2+",pop:38186,ch:5221,lat:48.657,lng:34.324,us:"recommended",sl:"pending"},
  {id:11,n:"Підгороднєнська",o:"Дніпропетровська",g:"KfW 2+",pop:26915,ch:4142,lat:48.603,lng:35.074,us:"recommended",sl:"pending"},
  {id:12,n:"Перещепинська",o:"Дніпропетровська",g:"KfW 2+",pop:22263,ch:3729,lat:48.979,lng:35.355,us:"recommended",sl:"pending"},
  {id:13,n:"Царичанська",o:"Дніпропетровська",g:"KfW 2+",pop:14765,ch:2031,lat:48.992,lng:34.130,us:"recommended",sl:"pending"},
  {id:14,n:"Харківська",o:"Харківська",g:"KfW 1",pop:1070851,ch:107525,lat:49.994,lng:36.230,us:"recommended",sl:"pending"},
  {id:15,n:"Балаклійська",o:"Харківська",g:"KfW 2",pop:24952,ch:2459,lat:49.457,lng:36.843,us:"recommended",sl:"pending"},
  {id:16,n:"Чугуївська",o:"Харківська",g:"KfW 2",pop:24082,ch:2369,lat:49.833,lng:36.683,us:"recommended",sl:"pending"},
  {id:17,n:"Кегичівська",o:"Харківська",g:"KfW 2",pop:10133,ch:1139,lat:49.357,lng:35.596,us:"recommended",sl:"pending"},
  {id:18,n:"Пісочинська",o:"Харківська",g:"KfW 2",pop:24481,ch:2458,lat:49.938,lng:36.109,us:"recommended",sl:"pending"},
  {id:19,n:"Валківська",o:"Харківська",g:"KfW 2",pop:17379,ch:1730,lat:49.824,lng:35.645,us:"recommended",sl:"pending"},
  {id:20,n:"Лозівська",o:"Харківська",g:"KfW 2+",pop:45801,ch:4772,lat:48.889,lng:36.318,us:"recommended",sl:"pending"},
  {id:21,n:"Зміївська",o:"Харківська",g:"KfW 2+",pop:33945,ch:3217,lat:49.683,lng:36.368,us:"recommended",sl:"pending"},
  {id:22,n:"Височанська",o:"Харківська",g:"KfW 2+",pop:30241,ch:2672,lat:49.918,lng:37.068,us:"recommended",sl:"pending"},
  {id:23,n:"Мерефянська",o:"Харківська",g:"KfW 2+",pop:29941,ch:2836,lat:49.822,lng:36.067,us:"recommended",sl:"pending"},
  {id:24,n:"Люботинська",o:"Харківська",g:"KfW 2+",pop:29377,ch:2620,lat:49.948,lng:35.929,us:"recommended",sl:"pending"},
  {id:25,n:"Первомайська",o:"Харківська",g:"KfW 2+",pop:19505,ch:2185,lat:49.398,lng:36.240,us:"recommended",sl:"pending"},
  {id:26,n:"Кропивницький",o:"Кіровоградська",g:"KfW 1",pop:244372,ch:42945,lat:48.508,lng:32.262,us:"recommended",sl:"pending"},
  {id:27,n:"Новоукраїнська",o:"Кіровоградська",g:"KfW 1",pop:18427,ch:3163,lat:48.324,lng:31.535,us:"recommended",sl:"pending"},
  {id:28,n:"Олександрійська",o:"Кіровоградська",g:"KfW 1",pop:89802,ch:14869,lat:48.672,lng:33.112,us:"recommended",sl:"pending"},
  {id:29,n:"Ірпінська",o:"Київська",g:"KfW 1",pop:153160,ch:32380,lat:50.523,lng:30.252,us:"recommended",sl:"pending"},
  {id:30,n:"Бородянська",o:"Київська",g:"KfW 1",pop:54261,ch:11472,lat:50.651,lng:29.925,us:"recommended",sl:"pending"},
  {id:31,n:"Бучанська",o:"Київська",g:"KfW 1",pop:122019,ch:25794,lat:50.549,lng:30.221,us:"recommended",sl:"pending"},
  {id:32,n:"Димерська",o:"Київська",g:"KfW 1",pop:28249,ch:5192,lat:50.753,lng:30.864,us:"recommended",sl:"pending"},
  {id:33,n:"Гостомельська",o:"Київська",g:"KfW 1",pop:63443,ch:13410,lat:50.578,lng:30.264,us:"recommended",sl:"pending"},
  {id:34,n:"Іванківська",o:"Київська",g:"KfW 1",pop:38460,ch:7067,lat:51.025,lng:29.901,us:"recommended",sl:"pending"},
  {id:35,n:"Макарівська",o:"Київська",g:"KfW 1",pop:59009,ch:12476,lat:50.464,lng:29.804,us:"recommended",sl:"pending"},
  {id:36,n:"Великодимерська",o:"Київська",g:"KfW 1",pop:46429,ch:8886,lat:50.699,lng:31.254,us:"recommended",sl:"pending"},
  {id:37,n:"Вишгородська",o:"Київська",g:"KfW 1",pop:45752,ch:8409,lat:50.592,lng:30.420,us:"recommended",sl:"pending"},
  {id:38,n:"Київ",o:"Київська (місто)",g:"KfW 2",pop:3528517,ch:603985,lat:50.450,lng:30.523,us:"recommended",sl:"pending"},
  {id:39,n:"Ходорівська",o:"Львівська",g:"KfW 1",pop:20586,ch:3954,lat:49.413,lng:24.310,us:"recommended",sl:"pending"},
  {id:40,n:"Львів (місто)",o:"Львівська",g:"KfW 1",pop:894237,ch:169871,lat:49.840,lng:24.030,us:"recommended",sl:"pending"},
  {id:41,n:"Миколаївська",o:"Львівська",g:"KfW 1",pop:28177,ch:5414,lat:49.532,lng:23.986,us:"recommended",sl:"pending"},
  {id:42,n:"Новороздільська",o:"Львівська",g:"KfW 1",pop:31312,ch:6017,lat:49.483,lng:24.122,us:"recommended",sl:"pending"},
  {id:43,n:"Рудківська",o:"Львівська",g:"KfW 1",pop:13500,ch:2608,lat:49.672,lng:23.489,us:"recommended",sl:"pending"},
  {id:44,n:"Самбірська",o:"Львівська",g:"KfW 1",pop:19730,ch:3811,lat:49.518,lng:23.203,us:"recommended",sl:"pending"},
  {id:45,n:"Славська",o:"Львівська",g:"KfW 1",pop:12032,ch:2311,lat:48.856,lng:23.453,us:"recommended",sl:"pending"},
  {id:46,n:"Стрийська",o:"Львівська",g:"KfW 1",pop:84174,ch:16174,lat:49.261,lng:23.854,us:"recommended",sl:"pending"},
  {id:47,n:"Баштанська",o:"Миколаївська",g:"KfW 2",pop:10539,ch:964,lat:47.405,lng:32.444,us:"recommended",sl:"pending"},
  {id:48,n:"Миколаївська",o:"Миколаївська",g:"KfW 2",pop:292333,ch:25098,lat:46.975,lng:31.994,us:"recommended",sl:"pending"},
  {id:49,n:"Вознесенська",o:"Миколаївська",g:"KfW 2+",pop:61397,ch:9507,lat:47.565,lng:31.341,us:"recommended",sl:"pending"},
  {id:50,n:"Новоодеська",o:"Миколаївська",g:"KfW 2+",pop:14036,ch:2104,lat:47.295,lng:31.888,us:"recommended",sl:"pending"},
  {id:51,n:"Одеська",o:"Одеська",g:"KfW 2+",pop:1036380,ch:164012,lat:46.482,lng:30.723,us:"recommended",sl:"pending"},
  {id:52,n:"Кілійська",o:"Одеська",g:"KfW 2+",pop:25066,ch:4419,lat:45.449,lng:29.267,us:"recommended",sl:"pending"},
  {id:53,n:"Болградська",o:"Одеська",g:"KfW 2+",pop:17586,ch:2764,lat:45.687,lng:28.618,us:"recommended",sl:"pending"},
  {id:54,n:"Подільська",o:"Одеська",g:"KfW 2+",pop:16347,ch:2880,lat:47.745,lng:29.533,us:"recommended",sl:"pending"},
  {id:55,n:"Балта",o:"Одеська",g:"KfW 2+",pop:30298,ch:5137,lat:47.938,lng:29.617,us:"recommended",sl:"pending"},
  {id:56,n:"Полтава (місто)",o:"Полтавська",g:"KfW 1",pop:336336,ch:53655,lat:49.588,lng:34.551,us:"recommended",sl:"pending"},
  {id:57,n:"Роменська",o:"Сумська",g:"KfW 2+",pop:49284,ch:6185,lat:50.742,lng:33.471,us:"recommended",sl:"pending"},
  {id:58,n:"Луцька",o:"Волинська",g:"KfW 2",pop:231955,ch:52733,lat:50.747,lng:25.325,us:"recommended",sl:"pending"},
  {id:59,n:"Мукачівська",o:"Закарпатська",g:"KfW 2",pop:98256,ch:22608,lat:48.441,lng:22.720,us:"recommended",sl:"pending"},
  {id:60,n:"Ужгородська",o:"Закарпатська",g:"KfW 2",pop:122427,ch:28181,lat:48.621,lng:22.295,us:"recommended",sl:"pending"},
  {id:61,n:"Запорізька",o:"Запорізька",g:"KfW 2",pop:510443,ch:57715,lat:47.838,lng:35.166,us:"recommended",sl:"pending"},
  {id:62,n:"Широківська",o:"Запорізька",g:"KfW 2+",pop:8508,ch:1097,lat:47.679,lng:33.261,us:"recommended",sl:"pending"},
  {id:63,n:"Андрушівська",o:"Житомирська",g:"KfW 1",pop:18157,ch:3213,lat:50.016,lng:29.004,us:"recommended",sl:"pending"},
  {id:64,n:"Хорошівська",o:"Житомирська",g:"KfW 1",pop:17240,ch:3167,lat:50.517,lng:28.647,us:"recommended",sl:"pending"},
  {id:65,n:"Коростенська",o:"Житомирська",g:"KfW 1",pop:64667,ch:11554,lat:50.958,lng:28.658,us:"recommended",sl:"pending"},
  {id:66,n:"Олевська",o:"Житомирська",g:"KfW 1",pop:30924,ch:5525,lat:51.208,lng:27.649,us:"recommended",sl:"pending"},
  {id:67,n:"Житомирська",o:"Житомирська",g:"KfW 1",pop:258239,ch:47452,lat:50.255,lng:28.659,us:"recommended",sl:"pending"},
  {id:68,n:"Новоград-Волинська",o:"Житомирська",g:"KfW 2",pop:48781,ch:9599,lat:50.594,lng:27.617,us:"recommended",sl:"pending"},
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

window.H = H;
window.SHEETS = SHEETS;
window.INDICATOR_NAMES = INDICATOR_NAMES;
window.GC = GC;
window.SUA = SUA;
window.SBC = SBC;
window.KC = KC;
window.CHART_FONT = CHART_FONT;
window.CHART_OPTS = CHART_OPTS;
