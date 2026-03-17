import type { AIModel, BenchmarkData } from './types';
import { scoreToColor, formatScore, scoreToClass } from './color-scale';
import { makeBenchmarkKey } from './data-loader';

// ===== Compute overall score for a model (default audience/age/gender) =====

function computeOverallScore(
  modelId: string,
  benchmarkData: BenchmarkData,
  audience = 'generic',
  age = 'adult',
  gender = 'all'
): number {
  const key = makeBenchmarkKey(modelId, audience, age, gender);
  const scores = benchmarkData[key];
  if (!scores) return 0;
  const vals = Object.values(scores);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ===== Init Leaderboard =====

export function initLeaderboard(
  models: AIModel[],
  benchmarkData: BenchmarkData,
  onModelSelect: (modelId: string) => void
): void {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;

  // Compute scores and sort descending
  const ranked = models
    .map((m) => ({
      model: m,
      score: computeOverallScore(m.id, benchmarkData),
    }))
    .sort((a, b) => b.score - a.score);

  list.innerHTML = '';

  ranked.forEach(({ model, score }, idx) => {
    const rank = idx + 1;
    const row = document.createElement('div');
    row.className = 'lb-row';
    row.dataset.modelId = model.id;

    const pct = Math.round(((score + 1) / 2) * 100); // map -1..1 to 0..100%
    const colorHex = scoreToColor(score);
    const scoreClass = scoreToClass(score);
    const scoreStr = formatScore(score);
    const rankClass = rank <= 3 ? 'lb-rank top-3' : 'lb-rank';

    row.innerHTML = `
      <span class="${rankClass}">${rank}</span>
      <div class="lb-info">
        <div class="lb-name">${model.name}</div>
        <div class="lb-provider">${model.provider}</div>
      </div>
      <div class="lb-bar-track">
        <div class="lb-bar-fill" style="width:${pct}%;background:${colorHex}"></div>
      </div>
      <span class="lb-score-badge ${scoreClass}">${scoreStr}</span>
    `;

    row.addEventListener('click', () => {
      selectLeaderboardModel(model.id);
      onModelSelect(model.id);
    });

    list.appendChild(row);
  });
}

// ===== Highlight active row =====

export function selectLeaderboardModel(modelId: string): void {
  document.querySelectorAll('.lb-row').forEach((el) => {
    const row = el as HTMLElement;
    row.classList.toggle('active', row.dataset.modelId === modelId);
  });
}
