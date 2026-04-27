import * as d3 from 'd3';

// Color scale: red (0 = always bad) -> neutral (0.5) -> green (1 = always good)
const colorScale = d3.scaleLinear<string>()
  .domain([0, 0.5, 1])
  .range(['#dc2626', '#e5e7eb', '#16a34a'])
  .clamp(true);

// Slightly brighter version for hover states
const colorScaleBright = d3.scaleLinear<string>()
  .domain([0, 0.5, 1])
  .range(['#ef4444', '#f3f4f6', '#22c55e'])
  .clamp(true);

export function scoreToColor(score: number): string {
  return colorScale(score);
}

export function scoreToColorBright(score: number): string {
  return colorScaleBright(score);
}

/**
 * Given an array of scores, compute the average
 */
export function averageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Score to CSS class for text coloring
 */
export function scoreToClass(score: number): string {
  if (score > 0.55) return 'positive';
  if (score < 0.45) return 'negative';
  return 'neutral';
}

/**
 * Format score for display as 0.00–1.00
 */
export function formatScore(score: number): string {
  return score.toFixed(2);
}

/**
 * Compute arc value (size) from score — distance from 0.5 with minimum floor
 */
export function scoreToArcValue(score: number, floor = 0.1): number {
  return Math.max(Math.abs(score - 0.5), floor);
}
