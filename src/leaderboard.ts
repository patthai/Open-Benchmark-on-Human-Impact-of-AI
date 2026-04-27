import type { AIModel, BenchmarkData, Taxonomy } from './types';
import { formatScore } from './color-scale';
import { makeBenchmarkKey } from './data-loader';

// ===== Module State =====

let _models: AIModel[] = [];
let _benchmarkData: BenchmarkData = {};
let _taxonomy: Taxonomy = { areas: [] };
let _onModelSelect: (modelId: string) => void = () => {};
let _age = 'adult';
let _selectedAreaId: string | null = null;
let _selectedSubareaId: string | null = null;

// ===== Score Computation =====

interface SplitScore {
  avg: number;   // overall average [0..1] for ranking
  pos: number;   // avg score on positive-polarity metrics [0..1] — higher = promotes good behavior more
  neg: number;   // avg score on negative-polarity metrics [0..1] — higher = avoids harmful behavior more
}

function computeSplitScore(
  modelId: string,
  areaId: string | null,
  subareaId: string | null
): SplitScore {
  const key = makeBenchmarkKey(modelId, _age);
  const scores = _benchmarkData[key];
  if (!scores) return { avg: 0.5, pos: 0.5, neg: 0.5 };

  const posIds: string[] = [];
  const negIds: string[] = [];

  for (const area of _taxonomy.areas) {
    if (areaId && area.id !== areaId) continue;
    for (const sub of area.subareas) {
      if (subareaId && sub.id !== subareaId) continue;
      for (const m of sub.metrics) {
        if (m.harmful) negIds.push(m.id);
        else posIds.push(m.id);
      }
    }
  }

  if (posIds.length + negIds.length === 0) return { avg: 0.5, pos: 0.5, neg: 0.5 };

  const posVals = posIds.map((id) => scores[id] ?? 0);
  const negVals = negIds.map((id) => scores[id] ?? 0);
  const allVals = [...posVals, ...negVals];

  const pos = posVals.length ? posVals.reduce((a, b) => a + b, 0) / posVals.length : 0.5;
  const neg = negVals.length ? negVals.reduce((a, b) => a + b, 0) / negVals.length : 0.5;
  const avg = allVals.reduce((a, b) => a + b, 0) / allVals.length;

  return { avg, pos, neg };
}

// ===== Render Rankings =====

function renderRankings(): void {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;

  const ranked = _models
    .map((m) => ({ model: m, split: computeSplitScore(m.id, _selectedAreaId, _selectedSubareaId) }))
    .sort((a, b) => b.split.avg - a.split.avg);

  list.innerHTML = '';
  ranked.forEach(({ model, split }, idx) => {
    const rank = idx + 1;
    const row = document.createElement('div');
    row.className = 'lb-row';
    row.dataset.modelId = model.id;

    // Green bar: positive-polarity avg [0..1] — longer = better at promoting good behavior
    const posPct = Math.round(split.pos * 100);
    // Red bar: inverted — shorter = better at avoiding harm (longer = more harmful)
    const negPct = Math.round((1 - split.neg) * 100);

    const scoreStr = formatScore(split.avg);
    const rankClass = rank <= 3 ? 'lb-rank top-3' : 'lb-rank';

    row.innerHTML = `
      <span class="${rankClass}">${rank}</span>
      <div class="lb-info">
        <div class="lb-name">${model.name}</div>
        <div class="lb-provider">${model.provider}</div>
      </div>
      <div class="lb-split-track" aria-hidden="true"
           title="Harm avoidance: ${formatScore(split.neg)} (shorter = better) | Promotes good behavior: ${formatScore(split.pos)} (longer = better)">
        <div class="lb-split-neg-half">
          <div class="lb-split-neg-fill" style="width:${negPct}%"></div>
        </div>
        <div class="lb-split-center"></div>
        <div class="lb-split-pos-half">
          <div class="lb-split-pos-fill" style="width:${posPct}%"></div>
        </div>
      </div>
      <span class="lb-score-badge">${scoreStr}</span>
    `;

    row.addEventListener('click', () => {
      selectLeaderboardModel(model.id);
      _onModelSelect(model.id);
    });

    list.appendChild(row);
  });
}

// ===== Area / Subarea Filter Tabs =====

function renderAreaTabs(): void {
  const container = document.getElementById('lb-area-filter');
  if (!container) return;

  container.innerHTML = '';

  // "All Areas" tab
  const allBtn = document.createElement('button');
  allBtn.className = 'lb-area-tab' + (_selectedAreaId === null ? ' active' : '');
  allBtn.textContent = 'All Areas';
  allBtn.addEventListener('click', () => {
    _selectedAreaId = null;
    _selectedSubareaId = null;
    renderAreaTabs();
    renderRankings();
    updateSubtitle(null, null);
  });
  container.appendChild(allBtn);

  for (const area of _taxonomy.areas) {
    const btn = document.createElement('button');
    btn.className = 'lb-area-tab' + (_selectedAreaId === area.id ? ' active' : '');
    btn.textContent = area.name;
    btn.dataset.areaId = area.id;
    btn.addEventListener('click', () => {
      _selectedAreaId = area.id;
      _selectedSubareaId = null;
      renderAreaTabs();
      renderSubareaTabs(area.id);
      renderRankings();
      updateSubtitle(area.name, null);
    });
    container.appendChild(btn);
  }

  // Render subareas if area is selected
  if (_selectedAreaId) {
    renderSubareaTabs(_selectedAreaId);
  } else {
    const subRow = document.getElementById('lb-subarea-filter');
    if (subRow) subRow.innerHTML = '';
  }
}

function renderSubareaTabs(areaId: string): void {
  const container = document.getElementById('lb-subarea-filter');
  if (!container) return;

  const area = _taxonomy.areas.find((a) => a.id === areaId);
  if (!area) return;

  container.innerHTML = '';

  // "All [area]" tab
  const allBtn = document.createElement('button');
  allBtn.className = 'lb-subarea-tab' + (_selectedSubareaId === null ? ' active' : '');
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => {
    _selectedSubareaId = null;
    renderSubareaTabs(areaId);
    renderRankings();
    updateSubtitle(area.name, null);
  });
  container.appendChild(allBtn);

  for (const sub of area.subareas) {
    const btn = document.createElement('button');
    btn.className = 'lb-subarea-tab' + (_selectedSubareaId === sub.id ? ' active' : '');
    btn.textContent = sub.name;
    btn.dataset.subareaId = sub.id;
    btn.addEventListener('click', () => {
      _selectedSubareaId = sub.id;
      renderSubareaTabs(areaId);
      renderRankings();
      updateSubtitle(area.name, sub.name);
    });
    container.appendChild(btn);
  }
}

function updateSubtitle(areaName: string | null, subareaName: string | null): void {
  const el = document.getElementById('leaderboard-subtitle');
  if (!el) return;
  if (!areaName) {
    el.textContent = 'Rankings reflect average impact across all 260 behavioral indicators.';
  } else if (!subareaName) {
    el.textContent = `Rankings filtered to the ${areaName} area.`;
  } else {
    el.textContent = `Rankings filtered to ${subareaName} (${areaName}).`;
  }
}

// ===== Init =====

export function initLeaderboard(
  models: AIModel[],
  benchmarkData: BenchmarkData,
  taxonomy: Taxonomy,
  onModelSelect: (modelId: string) => void
): void {
  _models = models;
  _benchmarkData = benchmarkData;
  _taxonomy = taxonomy;
  _onModelSelect = onModelSelect;

  renderAreaTabs();
  renderRankings();
}

// ===== Update Filters (called when audience/age/gender changes) =====

export function updateLeaderboardFilters(age: string): void {
  _age = age;
  renderRankings();
}

// ===== Highlight active row =====

export function selectLeaderboardModel(modelId: string): void {
  document.querySelectorAll('.lb-row').forEach((el) => {
    const row = el as HTMLElement;
    row.classList.toggle('active', row.dataset.modelId === modelId);
  });
}
