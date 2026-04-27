import type {
  Taxonomy,
  AIModel,
  BenchmarkData,
  FilterState,
  SunburstNodeData,
  DetailSubarea,
  DetailMetric,
  ScenarioIndex,
  ScenarioDetail,
} from './types';
import { averageScore, scoreToArcValue } from './color-scale';

// ===== Data Loading =====

export async function loadTaxonomy(): Promise<Taxonomy> {
  const res = await fetch('./data/taxonomy.json');
  if (!res.ok) throw new Error(`Failed to load taxonomy: ${res.status}`);
  return res.json();
}

export async function loadModels(): Promise<AIModel[]> {
  const res = await fetch('./data/models.json');
  if (!res.ok) throw new Error(`Failed to load models: ${res.status}`);
  const data = await res.json();
  return data.models;
}

export async function loadBenchmarkData(): Promise<BenchmarkData> {
  const res = await fetch('./data/benchmark-data.json');
  if (!res.ok) throw new Error(`Failed to load benchmark data: ${res.status}`);
  return res.json();
}

export async function loadScenarioIndex(): Promise<ScenarioIndex> {
  const res = await fetch('./data/scenario-index.json');
  if (!res.ok) throw new Error(`Failed to load scenario index: ${res.status}`);
  return res.json();
}

export async function loadScenarioDetail(
  benchmark: string,
  modelId: string,
  scenarioId: string
): Promise<ScenarioDetail> {
  const res = await fetch(`./data/scenarios/${benchmark}/${modelId}/${scenarioId}.json`);
  if (!res.ok) throw new Error(`Failed to load scenario: ${res.status}`);
  return res.json();
}

// ===== Benchmark Key =====

export function makeBenchmarkKey(modelId: string, age: string): string {
  return `${modelId}|${age}`;
}

// ===== Score Lookup =====

export function getScoresForFilter(
  benchmarkData: BenchmarkData,
  filters: FilterState
): Record<string, number> {
  const key = makeBenchmarkKey(filters.model, filters.age);
  return benchmarkData[key] ?? {};
}

// ===== Hierarchy Builder =====

export function buildHierarchy(
  taxonomy: Taxonomy,
  scores: Record<string, number>
): SunburstNodeData {
  const root: SunburstNodeData = {
    id: 'root',
    name: 'AI Impact',
    depth: 0,
    type: 'root',
    children: [],
  };

  for (const area of taxonomy.areas) {
    const areaNode: SunburstNodeData = {
      id: area.id,
      name: area.name,
      icon: area.icon,
      depth: 1,
      type: 'area',
      areaId: area.id,
      color: area.color,
      children: [],
    };

    const areaScores: number[] = [];

    for (const subarea of area.subareas) {
      const subareaNode: SunburstNodeData = {
        id: subarea.id,
        name: subarea.name,
        icon: subarea.icon,
        depth: 2,
        type: 'subarea',
        areaId: area.id,
        subareaId: subarea.id,
        color: area.color,
        children: [],
      };

      const subareaScores: number[] = [];

      for (const metric of subarea.metrics) {
        const score = scores[metric.id] ?? 0;
        subareaScores.push(score);

        const metricNode: SunburstNodeData = {
          id: metric.id,
          name: metric.name,
          depth: 3,
          type: 'metric',
          areaId: area.id,
          subareaId: subarea.id,
          color: area.color,
          harmful: metric.harmful,
          score,
          value: scoreToArcValue(score),
        };

        subareaNode.children!.push(metricNode);
      }

      const subareaAvg = averageScore(subareaScores);
      subareaNode.score = subareaAvg;
      subareaNode.value = scoreToArcValue(subareaAvg);
      areaScores.push(...subareaScores);

      areaNode.children!.push(subareaNode);
    }

    const areaAvg = averageScore(areaScores);
    areaNode.score = areaAvg;
    areaNode.value = scoreToArcValue(areaAvg);

    root.children!.push(areaNode);
  }

  root.score = averageScore(
    root.children!.map((c) => c.score ?? 0)
  );

  return root;
}

// ===== Detail Panel Data =====

export function buildSubareaDetail(
  taxonomy: Taxonomy,
  scores: Record<string, number>,
  subareaId: string
): DetailSubarea | null {
  for (const area of taxonomy.areas) {
    for (const subarea of area.subareas) {
      if (subarea.id !== subareaId) continue;

      const metrics: DetailMetric[] = subarea.metrics.map((m) => ({
        id: m.id,
        name: m.name,
        score: scores[m.id] ?? 0,
        harmful: m.harmful,
      }));

      metrics.sort((a, b) => b.score - a.score);

      const avgScore = averageScore(metrics.map((m) => m.score));

      return {
        id: subarea.id,
        name: subarea.name,
        icon: subarea.icon,
        areaName: area.name,
        areaColor: area.color,
        areaIcon: area.icon,
        avgScore,
        metrics,
      };
    }
  }
  return null;
}
