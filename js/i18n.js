// Двомовність UA/EN. Українська — мова за замовчуванням (CLAUDE.md);
// англійська — опція, яку вмикає користувач і яка запам'ятовується в
// браузері. Назви громад/областей сюди НЕ входять — вони транслітеруються
// окремим словником (js/translit.js, Крок 7.3), не перекладаються.
const I18N = {
  uk: {
    page_title: 'Інструмент відбору громад',
    app_title: 'Відбір громад',
    tab_map: '◉ Карта', tab_dash: '▦ Дашборд', tab_tbl: '≡ Таблиця',

    filters: 'Фільтри', all_oblasts: 'Всі області', search_hromada: 'Пошук громади...',
    reset: 'Скинути', data_section: 'Дані', refresh_data: '⟳ Оновити дані',

    not_synced: 'Не синхронізовано', syncing: '⟳ Синхронізація...', synced_ok: '✓ Дані оновлено',
    sync_schema_warn: '⚠ Відсутні очікувані колонки — див. консоль',
    sync_error: '✗ Помилка з\'єднання',
    synced_just_now: 'Щойно оновлено', synced_mins_ago: n=>`Оновлено ${n} хв тому`,

    legend_title: 'Легенда — Статус подачі',
    status_interviewed: "Пройшли інтерв'ю", status_submitted: 'Подали опитувальник',
    status_not_submitted: 'Не подали опитувальник',

    indicators_title: 'Показники', shown: 'Показано', population_k: 'Населення (тис)',
    children_u1: 'Дітей до 1р.', oblasts: 'Областей',
    show_boundaries: 'Показувати межі громад',

    population: 'Населення', share: 'Частка', status_lbl: 'Статус',

    kpi_total: 'Громад у вибірці', kpi_shortlist: 'Short-list', kpi_selected: 'Відібрано',
    kpi_oblasts: 'Областей',

    hstat_submitted: 'з 68 подали опитувальник', hstat_interviewed: "з 68 пройшли інтерв'ю",

    donut_submitted_title: n=>`Подали опитувальник — ${n} з 68`,
    donut_interviewed_title: n=>`Пройшли інтерв'ю — ${n} з 68`,
    donut_submitted: 'Подали', donut_not_submitted: 'Не подали',
    donut_interviewed_short: 'Пройшли', donut_not_yet: 'Ще ні',

    indicator_analytics_title: 'Аналітика за показником',
    col_hromada: 'Громада', col_indicator: 'Показник',
    all: 'Усі', none: 'Жодної', display_btn: '▸ Відобразити',
    no_indicator_data: 'Немає обраних громад із даними по цьому показнику.',

    top20_title: 'Топ-20 громад за зваженим балом',
    domains_avg_title: 'Середні бали по доменах (вибірка)',
    dist_title: 'Розподіл зважених балів опитування',
    radar_title: "Бали по доменах — радар (середнє по вибірці)",
    avg_score_axis: 'Середній бал (макс 10)', avg_dataset_label: 'Середнє',
    oblast_summary_title: 'Зведення по областях',
    col_oblast: 'Область', col_count: 'Громад', col_avg_score: 'Сер. бал',

    search_generic: 'Пошук...', tcnt: (a,b)=>`${a} з ${b}`,
    col_id: 'ID', col_pop: 'Населення', col_share: 'Частка %',
    col_unicef_status: 'UNICEF статус', col_interview: "Інтерв'ю",
    col_final_status: 'Фінальний статус',

    children_u1_confirmed_lbl: n=>`Дітей до 1 року (${n} з 68 підтв.)`,
    children_u1_none_lbl: 'Дітей до 1 року (даних ще нема)',

    footer: 'v0.5 · дані з воркбука відбору',
  },
  en: {
    page_title: 'Hromada Selection Tool',
    app_title: 'Hromada Selection',
    tab_map: '◉ Map', tab_dash: '▦ Dashboard', tab_tbl: '≡ Table',

    filters: 'Filters', all_oblasts: 'All oblasts', search_hromada: 'Search hromada...',
    reset: 'Reset', data_section: 'Data', refresh_data: '⟳ Refresh data',

    not_synced: 'Not synced', syncing: '⟳ Syncing...', synced_ok: '✓ Data updated',
    sync_schema_warn: '⚠ Expected columns missing — see console',
    sync_error: '✗ Connection error',
    synced_just_now: 'Updated just now', synced_mins_ago: n=>`Updated ${n} min ago`,

    legend_title: 'Legend — Submission status',
    status_interviewed: 'Interviewed', status_submitted: 'Survey submitted',
    status_not_submitted: 'Not submitted',

    indicators_title: 'Indicators', shown: 'Shown', population_k: 'Population (thousands)',
    children_u1: 'Children under 1', oblasts: 'Oblasts',
    show_boundaries: 'Show hromada boundaries',

    population: 'Population', share: 'Share', status_lbl: 'Status',

    kpi_total: 'Hromadas in sample', kpi_shortlist: 'Short-list', kpi_selected: 'Selected',
    kpi_oblasts: 'Oblasts',

    hstat_submitted: 'of 68 submitted survey', hstat_interviewed: 'of 68 interviewed',

    donut_submitted_title: n=>`Survey submitted — ${n} of 68`,
    donut_interviewed_title: n=>`Interviewed — ${n} of 68`,
    donut_submitted: 'Submitted', donut_not_submitted: 'Not submitted',
    donut_interviewed_short: 'Interviewed', donut_not_yet: 'Not yet',

    indicator_analytics_title: 'Indicator analytics',
    col_hromada: 'Hromada', col_indicator: 'Indicator',
    all: 'All', none: 'None', display_btn: '▸ Show',
    no_indicator_data: 'No selected hromadas have data for this indicator.',

    top20_title: 'Top 20 hromadas by weighted score',
    domains_avg_title: 'Average domain scores (sample)',
    dist_title: 'Distribution of weighted survey scores',
    radar_title: 'Domain scores — radar (sample average)',
    avg_score_axis: 'Average score (max 10)', avg_dataset_label: 'Average',
    oblast_summary_title: 'Summary by oblast',
    col_oblast: 'Oblast', col_count: 'Hromadas', col_avg_score: 'Avg. score',

    search_generic: 'Search...', tcnt: (a,b)=>`${a} of ${b}`,
    col_id: 'ID', col_pop: 'Population', col_share: 'Share %',
    col_unicef_status: 'UNICEF status', col_interview: 'Interview',
    col_final_status: 'Final status',

    children_u1_confirmed_lbl: n=>`Children under 1 (${n} of 68 confirmed)`,
    children_u1_none_lbl: 'Children under 1 (no data yet)',

    footer: 'v0.5 · data from the selection workbook',
  },
};

let LANG = 'uk';
try { LANG = localStorage.getItem('hromadas_lang') || 'uk'; } catch(e) {}

// Формат чисел (розділювачі розрядів) — уся англійська версія переходить
// на en-US, а не лишається з українськими розділювачами.
function numLocale(){ return LANG === 'en' ? 'en-US' : 'uk-UA'; }

function t(key, ...args){
  const dict = I18N[LANG] || I18N.uk;
  const entry = key in dict ? dict[key] : I18N.uk[key];
  if (typeof entry === 'function') return entry(...args);
  return entry !== undefined ? entry : key;
}

// Проходить усі статичні елементи з data-i18n/data-i18n-placeholder і
// підставляє переклад поточної мови. Викликається при завантаженні й при
// кожному перемиканні мови.
function applyI18n(){
  document.documentElement.lang = LANG;
  document.title = t('page_title');
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active', b.dataset.lang===LANG));
}

function setLang(lang){
  if(lang===LANG) return;
  LANG = lang;
  try { localStorage.setItem('hromadas_lang', lang); } catch(e) {}
  applyI18n();
  // Динамічний текст, який генерує сам JS (не просто статичні підписи),
  // треба перебудувати заново — інакше він лишиться попередньою мовою.
  updateHeaderStats();
  updateFooterDate();
  updateSyncLabel();
  populateOblastFilters();
  refreshMarkers();
  populateIndicatorPicker();
  populateHromadaList();
  rebuildDashboard();
  if(document.getElementById('pane-tbl').classList.contains('active')) renderT();
  if(lastHCardProps) showHCard(lastHCardProps);
}

window.I18N = I18N;
window.t = t;
window.numLocale = numLocale;
window.applyI18n = applyI18n;
window.setLang = setLang;
