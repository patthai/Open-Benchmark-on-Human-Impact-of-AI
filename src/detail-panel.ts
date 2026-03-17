import type { DetailSubarea } from './types';
import { formatScore, scoreToClass } from './color-scale';

let panelEl: HTMLElement;
let titleEl: HTMLElement;
let bodyEl: HTMLElement;
let closeBtn: HTMLElement;

export function initDetailPanel(): void {
  panelEl = document.getElementById('detail-panel') as HTMLElement;
  titleEl = document.getElementById('detail-title') as HTMLElement;
  bodyEl = document.getElementById('detail-body') as HTMLElement;
  closeBtn = document.getElementById('detail-close') as HTMLElement;

  closeBtn.addEventListener('click', () => hideDetailPanel());
}

export function showSubareaDetail(detail: DetailSubarea): void {
  titleEl.textContent = detail.name;

  const avgClass = scoreToClass(detail.avgScore);
  const avgStr = formatScore(detail.avgScore);

  // Build bar chart HTML
  const barsHtml = detail.behaviors
    .map((b) => {
      const cls = scoreToClass(b.score);
      const barColor = b.score > 0.05
        ? '#16a34a'
        : b.score < -0.05
          ? '#dc2626'
          : '#9ca3af';

      // For the bar, center at 50% (score=0) and extend left or right
      const isPos = b.score >= 0;
      const barWidth = Math.abs(b.score) * 50;
      const barLeft = isPos ? 50 : (50 - barWidth);

      return `
        <div class="behavior-bar-row" title="${escapeHtml(b.name)}">
          <div class="behavior-bar-label">${escapeHtml(truncate(b.name, 22))}</div>
          <div class="behavior-bar-track" style="position:relative;">
            <div style="
              position:absolute;
              left:${barLeft}%;
              width:${barWidth}%;
              height:100%;
              background:${barColor};
              border-radius:${isPos ? '0 7px 7px 0' : '7px 0 0 7px'};
              opacity:0.85;
              transition: width 0.4s ease, left 0.4s ease;
            "></div>
            <div style="
              position:absolute;
              left:50%;
              top:0;
              width:1px;
              height:100%;
              background:#d1d5db;
            "></div>
          </div>
          <div class="behavior-bar-value ${cls}">${escapeHtml(formatScore(b.score))}</div>
        </div>
      `;
    })
    .join('');

  bodyEl.innerHTML = `
    <div class="detail-subarea-meta">
      <div class="detail-area-badge" style="background:${hexToRgba(detail.areaColor, 0.12)}; color:${detail.areaColor};">
        <i class="fa-solid ${detail.areaIcon}"></i>
        ${escapeHtml(detail.areaName)}
      </div>
      <div class="detail-avg-score">
        Average score:
        <span class="detail-avg-value ${avgClass}">${escapeHtml(avgStr)}</span>
      </div>
    </div>
    <div class="behavior-bars">
      ${barsHtml}
    </div>
  `;

  panelEl.classList.add('visible');
}

export function hideDetailPanel(): void {
  panelEl.classList.remove('visible');
  setTimeout(() => {
    bodyEl.innerHTML = '<p class="detail-hint">Click on a subarea segment to see detailed behavior scores.</p>';
    titleEl.textContent = 'Select a subarea';
  }, 300);
}

// ===== Utilities =====

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
