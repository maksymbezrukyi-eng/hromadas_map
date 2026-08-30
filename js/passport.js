// PASSPORT — довідник методології відбору: усі 8 доменів, їхні ваги й
// підпоказники з описом методу оцінювання. Генерується з INDICATOR_GROUPS/
// DOMAIN_GROUPS/DOMAIN_WEIGHTS/INDICATOR_META (config.js) — не залежить від
// живих даних H[], бо це довідник методології, а не звіт по вибірці.
// Побудова через createElement/textContent, не innerHTML-рядки — описи в
// INDICATOR_META можуть містити "<"/">" (наприклад "<10%"), які зламали б
// розмітку, якби потрапили в HTML-рядок напряму (той самий фікс, що й у
// dashboard.js для порівняння показників).
function pspEl(tag, cls, text){
  const el = document.createElement(tag);
  if(cls) el.className = cls;
  if(text !== undefined && text !== null) el.textContent = text;
  return el;
}

function pspDomainCard(name, weightText, items){
  const card = pspEl('div', 'psp-domain');
  const hdr = pspEl('div', 'psp-domain-hdr');
  hdr.appendChild(pspEl('span', 'psp-domain-name', name));
  hdr.appendChild(pspEl('span', 'psp-domain-weight', weightText));
  card.appendChild(hdr);
  const list = pspEl('div', 'psp-items');
  items.forEach(it=>{
    const item = pspEl('div', 'psp-item');
    const top = pspEl('div', 'psp-item-top');
    top.appendChild(pspEl('span', 'psp-item-name', it.name));
    top.appendChild(pspEl('span', 'psp-item-max', it.maxPoints!=null ? t('psp_max_points', it.maxPoints) : t('psp_no_points')));
    item.appendChild(top);
    if(it.desc) item.appendChild(pspEl('div', 'psp-item-desc', it.desc));
    list.appendChild(item);
  });
  card.appendChild(list);
  return card;
}

function renderPassport(){
  const root = document.getElementById('passport-content');
  if(!root) return;
  root.innerHTML = '';

  const intro = pspEl('div', 'psp-intro', t('psp_intro'));
  root.appendChild(intro);

  ['d1','d2','d3','d4','d5','d6','d7'].forEach(gk=>{
    const g = INDICATOR_GROUPS.find(x=>x.groupKey===gk);
    const dg = DOMAIN_GROUPS.find(x=>x.key===gk);
    const w = DOMAIN_WEIGHTS[gk];
    if(!g || !dg || !w) return;
    const items = g.items.map(k=>{
      const meta = indicatorMeta(k);
      return {name: indicatorLabel(k), maxPoints: meta ? meta.maxPoints : null, desc: meta && meta.desc ? meta.desc.uk : null};
    });
    root.appendChild(pspDomainCard(domainGroupName(dg), `${w.weight} · ${t('psp_max_score', w.max.toFixed(1))}`, items));
  });

  // Домен 8 — окремо, бо не прив'язаний до жодного поля H[] (оцінюється за
  // інтерв'ю, не за опитувальником).
  const d8Items = PASSPORT_INTERVIEW_BLOCKS.map(b=>({
    name: b.name[LANG] || b.name.uk, maxPoints: b.max, desc: b.desc.uk,
  }));
  root.appendChild(pspDomainCard(t('psp_domain8_name'), `20% · ${t('psp_max_score', '2.0')}`, d8Items));
}
