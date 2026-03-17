import type { FilterState, Taxonomy, AIModel, BenchmarkData } from './types';
import {
  loadTaxonomy,
  loadModels,
  loadBenchmarkData,
  getScoresForFilter,
  buildHierarchy,
  buildSubareaDetail,
} from './data-loader';
import { initSunburst, renderSunburst, updateSunburst, resetZoom } from './sunburst';
import { initControls, getCurrentFilters } from './controls';
import { initTooltip } from './tooltip';
import { initLeaderboard, selectLeaderboardModel } from './leaderboard';
import {
  initSummaryPanel,
  showDefaultSummary,
  showAreaSummary,
  showSubareaSummary,
} from './summary-panel';
import { AREA_DESCRIPTIONS, SUBAREA_DESCRIPTIONS } from './descriptions';

// ===== Model Name Label =====

function updateModelNameLabel(name: string): void {
  const el = document.getElementById('model-name-label');
  if (el) el.textContent = name;
}

// ===== App State =====

let taxonomy: Taxonomy;
let models: AIModel[];
let benchmarkData: BenchmarkData;
let currentFilters: FilterState;

// ===== Bootstrap =====

async function main(): Promise<void> {
  initTooltip();
  initSummaryPanel();

  // Init sunburst with placeholder size
  initSunburst('sunburst-svg', {
    onSubareaClick: handleSubareaClick,
    onAreaClick: handleAreaClick,
    onCenterClick: handleCenterClick,
  });

  try {
    // Load all data in parallel
    [taxonomy, models, benchmarkData] = await Promise.all([
      loadTaxonomy(),
      loadModels(),
      loadBenchmarkData(),
    ]);

    // Init controls with loaded models
    currentFilters = initControls(models, handleFilterChange);

    // Init leaderboard
    initLeaderboard(models, benchmarkData, handleLeaderboardModelSelect);

    // Highlight initial active model in leaderboard
    selectLeaderboardModel(currentFilters.model);

    // Show default summary for initial model
    const initialModel = models.find((m) => m.id === currentFilters.model);
    showDefaultSummary(
      initialModel?.name ?? currentFilters.model,
      initialModel?.provider ?? ''
    );
    updateModelNameLabel(initialModel?.name ?? currentFilters.model);

    // Initial render
    renderWithFilters(currentFilters, false);

    // Hide loading
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');

  } catch (err) {
    console.error('Failed to load data:', err);
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
        <div style="text-align:center;padding:20px;">
          <i class="fa-solid fa-circle-exclamation" style="font-size:32px;color:#dc2626;margin-bottom:12px;"></i>
          <p style="color:#dc2626;font-weight:600;">Failed to load data</p>
          <p style="color:#6b7280;font-size:13px;margin-top:8px;">${(err as Error).message}</p>
        </div>
      `;
    }
  }
}

// ===== Rendering =====

function renderWithFilters(filters: FilterState, animate: boolean): void {
  const scores = getScoresForFilter(benchmarkData, filters);
  const hierarchyData = buildHierarchy(taxonomy, scores);

  if (animate) {
    updateSunburst(hierarchyData);
  } else {
    renderSunburst(hierarchyData, false);
  }
}

// ===== Event Handlers =====

function handleFilterChange(filters: FilterState): void {
  currentFilters = filters;
  renderWithFilters(filters, true);
  selectLeaderboardModel(filters.model);

  // Update summary with new model
  const activeModel = models?.find((m) => m.id === filters.model);
  showDefaultSummary(
    activeModel?.name ?? filters.model,
    activeModel?.provider ?? ''
  );
  updateModelNameLabel(activeModel?.name ?? filters.model);
}

function handleLeaderboardModelSelect(modelId: string): void {
  // Update the model dropdown
  const modelSelect = document.getElementById('filter-model') as HTMLSelectElement | null;
  if (modelSelect) {
    modelSelect.value = modelId;
  }
  // Get current full filters but override model
  const updatedFilters = { ...getCurrentFilters(), model: modelId };
  currentFilters = updatedFilters;
  renderWithFilters(updatedFilters, true);

  // Update summary panel with new model
  const activeModel = models?.find((m) => m.id === modelId);
  showDefaultSummary(
    activeModel?.name ?? modelId,
    activeModel?.provider ?? ''
  );
  updateModelNameLabel(activeModel?.name ?? modelId);
}

function handleSubareaClick(subareaId: string): void {
  const scores = getScoresForFilter(benchmarkData, currentFilters);
  const detail = buildSubareaDetail(taxonomy, scores, subareaId);
  if (detail) {
    // Find the subarea description from the map or fall back
    const descKey = subareaId;
    const subareaDesc = SUBAREA_DESCRIPTIONS[descKey] ?? '';
    showSubareaSummary(
      detail.name,
      subareaDesc,
      detail.avgScore,
      detail.behaviors.map((b) => ({
        name: b.name,
        score: b.score,
        valence: b.valence,
      }))
    );
  }
}

function handleAreaClick(areaId: string): void {
  const scores = getScoresForFilter(benchmarkData, currentFilters);
  const hierarchyData = buildHierarchy(taxonomy, scores);

  // Find the area node and its subareas with scores
  const areaNode = hierarchyData.children?.find((a) => a.id === areaId);
  if (!areaNode) return;

  const areaDesc = AREA_DESCRIPTIONS[areaId] ?? '';
  const subareas = (areaNode.children ?? []).map((s) => ({
    name: s.name,
    score: s.score ?? 0,
  }));

  showAreaSummary(areaId, areaNode.name, areaDesc, subareas);
}

function handleCenterClick(): void {
  resetZoom();
  // Reset summary to default
  const activeModel = models?.find((m) => m.id === currentFilters?.model);
  if (activeModel) {
    showDefaultSummary(activeModel.name, activeModel.provider);
  }
}

// ===== Start =====

document.addEventListener('DOMContentLoaded', main);
