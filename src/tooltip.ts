import type { SunburstNodeData } from './types';
import { formatScore, scoreToClass } from './color-scale';
import { AREA_DESCRIPTIONS, SUBAREA_DESCRIPTIONS } from './descriptions';

// ===== State =====

let tooltipEl: HTMLElement;
let hideTimer: number | null = null;

export function initTooltip(): void {
  tooltipEl = document.getElementById('tooltip') as HTMLElement;
}

export function showTooltip(
  event: MouseEvent,
  node: SunburstNodeData
): void {
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  const score = node.score ?? 0;
  const scoreClass = scoreToClass(score);
  const scoreStr = formatScore(score);

  let typeLabel = '';
  switch (node.type) {
    case 'area': typeLabel = 'Well-being Area'; break;
    case 'subarea': typeLabel = 'Subarea'; break;
    case 'behavior': typeLabel = 'Behavior'; break;
    default: typeLabel = '';
  }

  // Score bar
  const pct = Math.round(((score + 1) / 2) * 100);
  const scoreBarHtml = `
    <div class="tooltip-score-bar-track">
      <div class="tooltip-score-bar-fill ${scoreClass}" style="width:${pct}%"></div>
    </div>
  `;

  // Description line
  let descriptionHtml = '';
  if (node.type === 'area') {
    const desc = AREA_DESCRIPTIONS[node.id] ?? '';
    if (desc) {
      descriptionHtml = `<div class="tooltip-description">${escapeHtml(desc)}</div>`;
    }
    const subareaCount = node.children?.length ?? 0;
    if (subareaCount > 0) {
      descriptionHtml += `<div class="tooltip-meta">${subareaCount} subareas</div>`;
    }
  } else if (node.type === 'subarea') {
    const desc = SUBAREA_DESCRIPTIONS[node.id] ?? '';
    if (desc) {
      descriptionHtml = `<div class="tooltip-description">${escapeHtml(desc)}</div>`;
    }
    const total = node.children?.length ?? 0;
    const positive = node.children?.filter((c) => c.valence === 'positive').length ?? 0;
    if (total > 0) {
      descriptionHtml += `<div class="tooltip-meta">${positive} of ${total} behaviors positive</div>`;
    }
  } else if (node.type === 'behavior') {
    descriptionHtml = `<div class="tooltip-meta">${node.valence === 'positive' ? '↑ Positive behavior' : '↓ Negative behavior'}</div>`;
  }

  tooltipEl.innerHTML = `
    <div class="tooltip-title">${escapeHtml(node.name)}</div>
    <div class="tooltip-score ${scoreClass}">${scoreStr}</div>
    ${scoreBarHtml}
    <div class="tooltip-meta">${typeLabel}</div>
    ${descriptionHtml}
  `;

  tooltipEl.classList.add('visible');
  tooltipEl.setAttribute('aria-hidden', 'false');

  positionTooltip(event);
}

export function moveTooltip(event: MouseEvent): void {
  positionTooltip(event);
}

export function hideTooltip(): void {
  hideTimer = window.setTimeout(() => {
    tooltipEl.classList.remove('visible');
    tooltipEl.setAttribute('aria-hidden', 'true');
    hideTimer = null;
  }, 80);
}

function positionTooltip(event: MouseEvent): void {
  const rect = tooltipEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = event.clientX + 14;
  let y = event.clientY - 10;

  // Keep within viewport
  if (x + rect.width + 10 > vw) {
    x = event.clientX - rect.width - 14;
  }
  if (y + rect.height + 10 > vh) {
    y = event.clientY - rect.height + 10;
  }
  if (y < 8) y = 8;

  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
