import { formatScore, scoreToClass } from './color-scale';
import { AREA_DESCRIPTIONS, SUBAREA_DESCRIPTIONS } from './descriptions';

// ===== Init =====

export function initSummaryPanel(): void {
  const panel = document.getElementById('summary-panel');
  if (!panel) return;
  panel.innerHTML = '<p class="summary-loading">Loading...</p>';
}

// ===== Default Summary =====

export function showDefaultSummary(modelName: string, modelProvider: string): void {
  const panel = document.getElementById('summary-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="summary-section">
      <div class="summary-section-title">About This Benchmark</div>
      <p class="summary-text">
        The Open Benchmark on AI Impact measures how AI models influence human well-being across
        <strong>260 behavioral indicators</strong> in <strong>13 dimensions</strong>.
        Each indicator is scored from −1 (harmful) to +1 (beneficial).
        Scores are averaged up through the well-being hierarchy to reveal each model's impact profile.
      </p>
      <p class="summary-text" style="margin-top:8px">
        Use the filters above to explore how impacts differ across audience types, age groups, and genders.
        Click any arc segment to drill down into details.
      </p>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-section">
      <div class="summary-section-title">Well-being Areas</div>
      <div class="summary-area-item">
        <div class="summary-area-name"><i class="fa-solid fa-mountain-sun"></i> Self Actualization</div>
        <div class="summary-area-desc">${escapeHtml(AREA_DESCRIPTIONS['self-actualization'] ?? '')}</div>
      </div>
      <div class="summary-area-item">
        <div class="summary-area-name"><i class="fa-solid fa-brain"></i> Psychological</div>
        <div class="summary-area-desc">${escapeHtml(AREA_DESCRIPTIONS['psychological'] ?? '')}</div>
      </div>
      <div class="summary-area-item">
        <div class="summary-area-name"><i class="fa-solid fa-shield-heart"></i> Physical Safety</div>
        <div class="summary-area-desc">${escapeHtml(AREA_DESCRIPTIONS['physical-safety'] ?? '')}</div>
      </div>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-section">
      <div class="summary-section-title">Current Model</div>
      <div class="summary-model-name">${escapeHtml(modelName)}</div>
      <div class="summary-model-provider">${escapeHtml(modelProvider)}</div>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-section">
      <div class="summary-section-title">Score Scale</div>
      <div class="summary-scale-row">
        <span class="summary-score-pill negative">−1</span>
        <span class="summary-scale-label">AI consistently harms this dimension</span>
      </div>
      <div class="summary-scale-row">
        <span class="summary-score-pill neutral">0</span>
        <span class="summary-scale-label">No net effect on well-being</span>
      </div>
      <div class="summary-scale-row">
        <span class="summary-score-pill positive">+1</span>
        <span class="summary-scale-label">AI consistently benefits this dimension</span>
      </div>
    </div>
  `;
}

// ===== Area Summary =====

export function showAreaSummary(
  _areaId: string,
  areaName: string,
  areaDesc: string,
  subareas: { name: string; score: number }[]
): void {
  const panel = document.getElementById('summary-panel');
  if (!panel) return;

  const subareaRows = subareas
    .map((s) => {
      const cls = scoreToClass(s.score);
      const str = formatScore(s.score);
      return `
        <div class="summary-behavior-row">
          <span class="summary-subarea-name">${escapeHtml(s.name)}</span>
          <span class="summary-score-pill ${cls}">${escapeHtml(str)}</span>
        </div>
      `;
    })
    .join('');

  panel.innerHTML = `
    <div class="summary-section">
      <div class="summary-back-hint">Well-being Area</div>
      <div class="summary-section-title">${escapeHtml(areaName)}</div>
      <p class="summary-text">${escapeHtml(areaDesc)}</p>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-section">
      <div class="summary-section-title">Subareas</div>
      <div class="summary-behaviors-list">
        ${subareaRows}
      </div>
      <p class="summary-hint-text">Click a subarea arc to see all behaviors</p>
    </div>
  `;
}

// ===== Subarea Summary =====

export function showSubareaSummary(
  subareaName: string,
  subareaDesc: string,
  avgScore: number,
  behaviors: { name: string; score: number; valence: string }[]
): void {
  const panel = document.getElementById('summary-panel');
  if (!panel) return;

  const positiveCount = behaviors.filter((b) => b.score > 0.05).length;
  const negativeCount = behaviors.filter((b) => b.score < -0.05).length;
  const totalCount = behaviors.length;

  const avgClass = scoreToClass(avgScore);
  const avgStr = formatScore(avgScore);

  // Top 3 most positive
  const sorted = [...behaviors].sort((a, b) => b.score - a.score);
  const topPositive = sorted.slice(0, 3);
  const topNegative = sorted.slice(-3).reverse();

  const descFromMap = SUBAREA_DESCRIPTIONS[subareaName.toLowerCase().replace(/\s+/g, '-')] ?? subareaDesc;

  const makeBehaviorRow = (b: { name: string; score: number }) => {
    const cls = scoreToClass(b.score);
    const str = formatScore(b.score);
    return `
      <div class="summary-behavior-row">
        <span class="summary-subarea-name">${escapeHtml(b.name)}</span>
        <span class="summary-score-pill ${cls}">${escapeHtml(str)}</span>
      </div>
    `;
  };

  panel.innerHTML = `
    <div class="summary-section">
      <div class="summary-back-hint">Subarea</div>
      <div class="summary-section-title">${escapeHtml(subareaName)}</div>
      <p class="summary-text">${escapeHtml(descFromMap)}</p>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-section">
      <div class="summary-section-title">Average Score</div>
      <div class="summary-avg-score ${avgClass}">${escapeHtml(avgStr)}</div>
      <div class="summary-breakdown">
        <span class="summary-breakdown-pos">${positiveCount} positive</span>
        <span class="summary-breakdown-sep"> · </span>
        <span class="summary-breakdown-neg">${negativeCount} negative</span>
        <span class="summary-breakdown-sep"> · </span>
        <span class="summary-breakdown-total">${totalCount} total</span>
      </div>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-section">
      <div class="summary-section-title">Top Positive Behaviors</div>
      <div class="summary-behaviors-list">
        ${topPositive.map(makeBehaviorRow).join('')}
      </div>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-section">
      <div class="summary-section-title">Top Negative Behaviors</div>
      <div class="summary-behaviors-list">
        ${topNegative.map(makeBehaviorRow).join('')}
      </div>
    </div>
  `;
}

// ===== Utilities =====

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
