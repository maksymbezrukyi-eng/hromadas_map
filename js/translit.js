// Транслітерація назв громад/областей — офіційний стандарт КМУ №55 від
// 27.01.2010 (той самий, що використовують у закордонних паспортах). Це не
// переклад — назви лишаються тими самими словами, лише латинницею.
// Правила: апостроф і м'який знак не передаються; є/ї/й/ю/я на початку слова
// — Ye/Yi/Y/Yu/Ya, всередині слова — ie/i/i/iu/ia; решта літер — за прямою
// відповідністю (г→h, х→kh, ц→ts, ч→ch, ш→sh, щ→shch, ж→zh).
//
// Ключ — точний рядок, який зараз стоїть у H[].n/H[].o (js/data.js). Один
// словник обслуговує і назви громад, і назви областей, бо там, де слово
// збігається (наприклад "Харківська" — і назва громади, і назва області),
// транслітерація однакова.
//
// Звірено вручну з усіма 68 громадами й 15 областями (Крок 7.3, 2026-08-29).
// Кілька складних випадків (подвійне г: "Ужгородська"→Uzhhorodska,
// "Вишгородська"→Vyshhorodska; "ьо" без окремого маркера пом'якшення:
// "Верхньодніпровська"→Verkhnodniprovska) — звірені окремо за офіційним
// правилом "м'який знак не передається", без винятків.
const TRANSLIT = {
  // Області
  'Чернігівська':'Chernihivska', 'Дніпропетровська':'Dnipropetrovska',
  'Харківська':'Kharkivska', 'Кіровоградська':'Kirovohradska',
  'Київська':'Kyivska', 'Київська (місто)':'Kyiv (city)',
  'Львівська':'Lvivska', 'Миколаївська':'Mykolaivska', 'Одеська':'Odeska',
  'Полтавська':'Poltavska', 'Сумська':'Sumska', 'Волинська':'Volynska',
  'Закарпатська':'Zakarpatska', 'Запорізька':'Zaporizka',
  'Житомирська':'Zhytomyrska',

  // Громади
  'Бахматська':'Bakhmatska', 'Бобровицька':'Bobrovytska',
  'Куликівська':'Kulykivska', 'Менська':'Menska', 'Ніжинська':'Nizhynska',
  'Криворізька':'Kryvorizka', 'Новомосковська':'Novomoskovska',
  'Жовтоводська':'Zhovtovodska', 'Верхньодніпровська':'Verkhnodniprovska',
  'Підгороднєнська':'Pidhorodnienska', 'Перещепинська':'Pereshchepynska',
  'Царичанська':'Tsarychanska', 'Балаклійська':'Balakliiska',
  'Чугуївська':'Chuhuivska', 'Кегичівська':'Kehychivska',
  'Пісочинська':'Pisochynska', 'Валківська':'Valkivska',
  'Лозівська':'Lozivska', 'Зміївська':'Zmiivska',
  'Височанська':'Vysochanska', 'Мерефянська':'Merefianska',
  'Люботинська':'Liubotynska', 'Первомайська':'Pervomaiska',
  'Кропивницький':'Kropyvnytskyi', 'Новоукраїнська':'Novoukrainska',
  'Олександрійська':'Oleksandriiska', 'Ірпінська':'Irpinska',
  'Бородянська':'Borodianska', 'Бучанська':'Buchanska',
  'Димерська':'Dymerska', 'Гостомельська':'Hostomelska',
  'Іванківська':'Ivankivska', 'Макарівська':'Makarivska',
  'Великодимерська':'Velykodymerska', 'Вишгородська':'Vyshhorodska',
  'Київ':'Kyiv', 'Ходорівська':'Khodorivska', 'Львів (місто)':'Lviv (city)',
  'Новороздільська':'Novorozdilska', 'Рудківська':'Rudkivska',
  'Самбірська':'Sambirska', 'Славська':'Slavska', 'Стрийська':'Stryiska',
  'Баштанська':'Bashtanska', 'Вознесенська':'Voznesenska',
  'Новоодеська':'Novoodeska', 'Кілійська':'Kiliiska',
  'Болградська':'Bolhradska', 'Подільська':'Podilska', 'Балта':'Balta',
  'Полтава (місто)':'Poltava (city)', 'Роменська':'Romenska',
  'Луцька':'Lutska', 'Мукачівська':'Mukachivska',
  'Ужгородська':'Uzhhorodska', 'Широківська':'Shyrokivska',
  'Андрушівська':'Andrushivska', 'Хорошівська':'Khoroshivska',
  'Коростенська':'Korostenska', 'Олевська':'Olevska',
  'Новоград-Волинська':'Novohrad-Volynska',
};

// LANG-aware: повертає латинницю в англійському режимі, оригінал —
// в українському. Той самий принцип, що й statusLabel()/indicatorLabel().
function trName(s){
  if(typeof LANG!=='undefined' && LANG==='en') return TRANSLIT[s] || s;
  return s;
}

window.TRANSLIT = TRANSLIT;
window.trName = trName;
