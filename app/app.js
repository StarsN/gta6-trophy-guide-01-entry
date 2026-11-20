// Leonida Platinum — guide & tracker logic.
// State lives in localStorage; the trophy data is app/data/trophies.json.
// No network at run time: the only fetch is that one relative data file.

const STORAGE_KEY = 'leonida-platinum-tracker/v1';
const RING_CIRCUMFERENCE = 257.6;

const KIND_FILTERS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'story', label: 'Story', test: (t) => t.kind === 'story' },
  { key: 'missable', label: 'Missable', test: (t) => t.missable },
  { key: 'collectible', label: 'Collectibles', test: (t) => t.kind === 'collectible' },
  { key: 'activity', label: 'Activities', test: (t) => t.kind === 'activity' },
  { key: 'grind', label: 'Grinds', test: (t) => t.kind === 'grind' },
  { key: 'strangers', label: 'Strangers & Strands', test: (t) => t.kind === 'strangers' },
  { key: 'partner', label: 'Partner', test: (t) => t.kind === 'partner' },
  { key: 'world', label: 'World & Exploration', test: (t) => t.kind === 'world' },
  { key: 'money', label: 'Money & Property', test: (t) => t.kind === 'money' },
  { key: 'completion', label: 'Completion', test: (t) => t.kind === 'completion' },
  { key: 'online', label: 'Online', test: (t) => t.kind === 'online' },
];

const KIND_LABELS = {
  story: 'Story', strangers: 'Strangers & Strands', collectible: 'Collectible',
  activity: 'Activity', grind: 'Grind', partner: 'Partner', world: 'World',
  money: 'Money & Property', completion: 'Completion', online: 'Online',
};

const STAGE_INFO = [
  {
    stage: 1, title: 'Story first — the campaign and its one-off moments', hours: '≈ 35–45 hours',
    blurb: 'Play the campaign in order: the opening, Chapters 1–4, the named missions and the finale. All five missable trophies live inside this pass — an airport departure, a beach cocktail, a showroom exit, a bowling follow-through and a story choice — so work this stage with the Missables tab open, and keep a spare manual save before big decisions. Do not grind yet: half the map’s activities, properties and robbery targets only unlock as the chapters advance.',
  },
  {
    stage: 2, title: 'Partners & strangers — finish every strand', hours: '≈ 25 hours',
    blurb: 'Clear the stranger strands (Andy, Kenton, Billy, Randy, Tyrone, Bret’s hunt, and three more strands for the eight the silver counts) and take the partner trophies while the two protagonists are together in free roam: the four-star escape and the three-shop robbery run are far easier to arrange now than as an afterthought.',
  },
  {
    stage: 3, title: 'Collectibles & the whole map — the great Leonida sweep', hours: '≈ 30 hours',
    blurb: 'One region-by-region sweep that uncovers the whole map: meditation spots, WAiNK photo spots at 100 locations, collectible cards toward three finished sets, and 100 discovered vehicles on the way. Combining the sweeps means no corner of Leonida is visited twice.',
  },
  {
    stage: 4, title: 'Activities, robberies & the long grinds', hours: '≈ 90 hours',
    blurb: 'The bulk of the platinum: 250 stunts, gold in all 42 shooting-range challenges, 20 race wins and every drone course, the robbery set (vaults, armoured truck, jewelry store, gang operations), 50 challenges, and the money line — $250,000 laundered, $100,000 spent, every garage bought, 10 vehicles registered. Robbery income funds the property trophies, so rob first and buy after.',
  },
  {
    stage: 5, title: '100% — and the platinum', hours: '≈ 10 hours of mop-up',
    blurb: 'Check the completion counter and mop up whichever category it still wants; roadmap reporting calls the 100% checklist lenient, so this stage is a tidy-up, not a second game. When A Long Road lands, Vice Got a Price! follows automatically — you are a Leonida Legend.',
  },
];

const SOURCE_NOTES = {
  'Exophase': 'The official PS5 trophy list as mirrored at launch: every name, description, grade and hidden flag in this app was cross-checked against it, trophy by trophy.',
  'PSNProfiles': 'Trophy list and community guide: used to cross-check methods for the activity, robbery, partner and one-off trophies.',
  'PowerPyx': 'Trophy guide and platinum roadmap: source of the roughly 200-hour completion estimate, the lenient 100% checklist finding, and the strand structure behind Stage 2.',
  'PlayStation Blog': 'Launch coverage: release context for the game’s launch window on PlayStation 5.',
};

let trophies = [];
let earned = new Set();
let settings = { spoiler: false, hideEarned: false };
let activeKind = 'all';
let selectedId = 1;

const $ = (id) => document.getElementById(id);

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (raw) {
      earned = new Set((raw.earned ?? []).filter((id) => Number.isInteger(id)));
      settings = { ...settings, ...(raw.settings ?? {}) };
    }
  } catch { /* a corrupt save must never break the guide */ }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earned], settings }));
}

function isMasked(trophy) {
  return settings.spoiler && trophy.hidden && !earned.has(trophy.id);
}

function displayName(trophy) {
  return isMasked(trophy) ? 'Hidden Trophy' : trophy.name;
}

function displayDesc(trophy) {
  return isMasked(trophy) ? 'Hidden on PlayStation until earned — the spoiler shield is keeping this one dark.' : trophy.description;
}

function gradeTotals() {
  const totals = {};
  for (const t of trophies) {
    totals[t.grade] ??= { total: 0, got: 0 };
    totals[t.grade].total += 1;
    if (earned.has(t.id)) totals[t.grade].got += 1;
  }
  return totals;
}

function renderProgress() {
  const total = trophies.length;
  const got = earned.size;
  const points = trophies.filter((t) => earned.has(t.id)).reduce((sum, t) => sum + t.points, 0);
  $('earnedCount').textContent = String(got);
  $('pointsCount').textContent = String(points);
  $('progressPct').textContent = `${Math.round((got / total) * 100)}%`;
  $('ringFill').style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - got / total));
  const totals = gradeTotals();
  $('gradeBars').replaceChildren(...['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const g = totals[grade] ?? { total: 0, got: 0 };
    const wrap = document.createElement('div');
    wrap.className = 'grade-bar';
    wrap.innerHTML = `<div class="gb-top"><span class="gb-name">${grade}</span><span>${g.got}/${g.total}</span></div><div class="track"><div class="fill ${grade}" style="width:${g.total ? (g.got / g.total) * 100 : 0}%"></div></div>`;
    return wrap;
  }));
  $('progressHint').textContent = got === total
    ? 'Platinum earned — you are a Leonida Legend. Export your progress to keep the proof.'
    : `${total - got} trophies stand between you and the platinum. Progress saves in this browser; export it before you switch machines.`;
  $('missableBadge').textContent = String(trophies.filter((t) => t.missable && !earned.has(t.id)).length);
}

function renderKindChips() {
  const box = $('kindChips');
  box.replaceChildren(...KIND_FILTERS.map((f) => {
    const n = trophies.filter(f.test).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `chip${activeKind === f.key ? ' is-active' : ''}`;
    b.innerHTML = `${f.label} <span class="n">${n}</span>`;
    b.addEventListener('click', () => { activeKind = f.key; renderKindChips(); renderTrophyList(); });
    return b;
  }));
}

function visibleTrophies() {
  const filter = KIND_FILTERS.find((f) => f.key === activeKind) ?? KIND_FILTERS[0];
  const grade = $('gradeFilter').value;
  const query = $('searchBox').value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (!filter.test(t)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (settings.hideEarned && earned.has(t.id)) return false;
    if (query && !`${t.name} ${t.description} ${t.guide} ${KIND_LABELS[t.kind] ?? ''}`.toLowerCase().includes(query)) return false;
    return true;
  });
}

function tagRow(trophy) {
  const tags = [`<span class="tag grade-${trophy.grade}">${trophy.grade} · ${trophy.points} pts</span>`,
    `<span class="tag">${KIND_LABELS[trophy.kind] ?? trophy.kind}</span>`,
    `<span class="tag">Stage ${trophy.stage}</span>`];
  if (trophy.missable) tags.push('<span class="tag missable">Missable</span>');
  if (trophy.hidden) tags.push('<span class="tag hidden-tag">Hidden on PSN</span>');
  return tags.join('');
}

function renderTrophyList() {
  const list = $('trophyList');
  const shown = visibleTrophies();
  $('shownCount').textContent = `Showing ${shown.length} of ${trophies.length}`;
  if (!shown.length) {
    list.innerHTML = '<li class="empty-note">No trophies match — the PS5 list has no online trophies, and everything else is one filter away.</li>';
    return;
  }
  list.replaceChildren(...shown.map((t) => {
    const li = document.createElement('li');
    li.className = `trophy-card${earned.has(t.id) ? ' is-earned' : ''}${selectedId === t.id ? ' is-selected' : ''}`;
    li.dataset.id = String(t.id);
    const masked = isMasked(t);
    li.innerHTML = `
      <button class="tick" type="button" role="checkbox" aria-checked="${earned.has(t.id)}" aria-label="Mark ${t.name} as earned">${earned.has(t.id) ? '✓' : ''}</button>
      <div class="gem ${t.grade}" aria-hidden="true">★</div>
      <div class="trophy-main">
        <p class="trophy-name${masked ? ' spoiler-mask' : ''}">${displayName(t)}</p>
        <p class="trophy-desc${masked ? ' spoiler-mask' : ''}">${displayDesc(t)}</p>
        <div class="trophy-tags">${tagRow(t)}</div>
      </div>
      <div class="trophy-side"><span class="pts">${t.points}</span>points</div>`;
    li.querySelector('.tick').addEventListener('click', (ev) => { ev.stopPropagation(); toggleEarned(t.id); });
    li.addEventListener('click', () => openDetail(t.id, false));
    return li;
  }));
}

function openDetail(id, scroll = true) {
  selectedId = id;
  const t = trophies.find((x) => x.id === id);
  if (!t) return;
  const panel = $('detailPanel');
  const masked = isMasked(t);
  const got = earned.has(t.id);
  panel.innerHTML = `
    <div class="d-head">
      <div class="gem ${t.grade}" aria-hidden="true">★</div>
      <div><h3 class="${masked ? 'spoiler-mask' : ''}">${displayName(t)}</h3>
      <p class="d-grade">${t.grade} · ${t.points} points · ${KIND_LABELS[t.kind] ?? t.kind} · Roadmap stage ${t.stage}</p></div>
    </div>
    <p class="d-label">Official description</p>
    <blockquote class="${masked ? 'spoiler-mask' : ''}">${displayDesc(t)}</blockquote>
    ${t.missable ? '<div class="warn"><strong>Missable — read before you play on.</strong> This flag is built from the official description: it names one moment, one place or one choice, and the list promises no way back. The guide below says where the chance lives.</div>' : ''}
    <p class="d-label">Guide — in our own words</p>
    ${masked
      ? '<p>The spoiler shield is hiding this guide until you earn the trophy. Turn the shield off in the toolbar to read it now.</p>'
      : `<p>${t.guide}</p>`}
    <p class="d-label">Sources for this guide</p>
    <ul class="source-list">${t.sources.map((s) => `<li>${s}</li>`).join('')}</ul>
    <button class="earn-btn${got ? ' is-earned' : ''}" type="button">${got ? '✓ Earned — tap to undo' : 'Mark as earned'}</button>`;
  panel.querySelector('.earn-btn').addEventListener('click', () => toggleEarned(t.id));
  document.querySelectorAll('.trophy-card').forEach((c) => c.classList.toggle('is-selected', Number(c.dataset.id) === id));
  if (scroll) panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id); else earned.add(id);
  saveState();
  renderProgress();
  renderTrophyList();
  renderRoadmap();
  renderMissables();
  openDetail(selectedId, false);
}

function stageTrophyChip(t) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `stage-trophy${earned.has(t.id) ? ' is-earned' : ''}`;
  b.innerHTML = `<span class="mini-gem ${t.grade}"></span>${displayName(t)}`;
  b.addEventListener('click', () => { switchView('trophies'); openDetail(t.id); document.querySelector(`.trophy-card[data-id="${t.id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  return b;
}

function renderRoadmap() {
  const box = $('roadmapStages');
  box.replaceChildren(...STAGE_INFO.map((info) => {
    const inStage = trophies.filter((t) => t.stage === info.stage);
    const done = inStage.filter((t) => earned.has(t.id)).length;
    const el = document.createElement('article');
    el.className = 'stage';
    el.innerHTML = `
      <div class="stage-num">${info.stage}</div>
      <div>
        <h3>${info.title}</h3>
        <p class="stage-meta">${info.hours} · ${done}/${inStage.length} earned</p>
        <p>${info.blurb}</p>
        <div class="stage-trophies"></div>
      </div>`;
    el.querySelector('.stage-trophies').replaceChildren(...inStage.map(stageTrophyChip));
    return el;
  }));
}

function renderMissables() {
  const grid = $('missableGrid');
  grid.replaceChildren(...trophies.filter((t) => t.missable).map((t) => {
    const card = document.createElement('article');
    card.className = 'missable-card';
    card.innerHTML = `
      <div class="mc-top"><h3 class="${isMasked(t) ? 'spoiler-mask' : ''}">${displayName(t)}</h3><span class="tag missable">Missable</span></div>
      <p class="d-grade" style="color:var(--ink-faint);font-size:12.5px;text-transform:uppercase;letter-spacing:.08em;font-weight:700">${t.grade} · Roadmap stage ${t.stage}${earned.has(t.id) ? ' · ✓ Earned' : ''}</p>
      <blockquote>“${displayDesc(t)}”</blockquote>
      <p>${isMasked(t) ? 'Guide hidden by the spoiler shield until earned.' : t.guide}</p>`;
    card.addEventListener('click', () => { switchView('trophies'); openDetail(t.id); });
    return card;
  }));
}

function renderSources() {
  const grid = $('sourcesGrid');
  const doc = trophiesDoc;
  grid.replaceChildren(...doc.sources.map((s) => {
    const key = Object.keys(SOURCE_NOTES).find((k) => s.name.startsWith(k)) ?? '';
    const card = document.createElement('article');
    card.className = 'source-card';
    card.innerHTML = `<h3>${s.name}</h3><p>${SOURCE_NOTES[key] ?? ''}</p>${s.url ? `<a href="${s.url}" target="_blank" rel="noreferrer">${s.url}</a>` : ''}`;
    return card;
  }));
}

function exportProgress() {
  const payload = { app: 'leonida-platinum', version: 1, exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b), settings };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  file.text().then((text) => {
    try {
      const data = JSON.parse(text);
      const ids = (data.earned ?? []).filter((id) => trophies.some((t) => t.id === id));
      earned = new Set(ids);
      if (data.settings) settings = { ...settings, ...data.settings };
      syncControls();
      saveState();
      renderAll();
    } catch { alert('That file is not a Leonida Platinum progress export.'); }
  });
}

function switchView(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('is-active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${name}`));
  if (location.hash !== `#/${name}`) history.replaceState(null, '', `#/${name}`);
  window.scrollTo({ top: 0 });
}

function syncControls() {
  $('spoilerToggle').checked = settings.spoiler;
  $('hideEarnedToggle').checked = settings.hideEarned;
}

function renderAll() {
  renderProgress();
  renderKindChips();
  renderTrophyList();
  renderRoadmap();
  renderMissables();
  renderSources();
  openDetail(selectedId, false);
}

let trophiesDoc = { trophies: [], sources: [] };

async function boot() {
  loadState();
  const res = await fetch('data/trophies.json');
  trophiesDoc = await res.json();
  trophies = trophiesDoc.trophies;
  syncControls();
  renderAll();
  const m = location.hash.match(/^#\/trophy\/(\d+)$/);
  if (m) { openDetail(Number(m[1])); }
  else if (location.hash.startsWith('#/')) {
    const view = location.hash.slice(2);
    if (['roadmap', 'missables', 'sources'].includes(view)) switchView(view);
  }
}

document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));
$('searchBox').addEventListener('input', renderTrophyList);
$('gradeFilter').addEventListener('change', renderTrophyList);
$('spoilerToggle').addEventListener('change', (e) => { settings.spoiler = e.target.checked; saveState(); renderAll(); });
$('hideEarnedToggle').addEventListener('change', (e) => { settings.hideEarned = e.target.checked; saveState(); renderTrophyList(); });
$('exportBtn').addEventListener('click', exportProgress);
$('importFile').addEventListener('change', (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); e.target.value = ''; });

boot();
