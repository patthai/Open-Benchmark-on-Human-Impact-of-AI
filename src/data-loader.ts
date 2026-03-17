import type {
  Taxonomy,
  AIModel,
  BenchmarkData,
  FilterState,
  SunburstNodeData,
  DetailSubarea,
  DetailBehavior,
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

// ===== Benchmark Key =====

export function makeBenchmarkKey(
  modelId: string,
  audience: string,
  age: string,
  gender: string
): string {
  return `${modelId}|${audience}|${age}|${gender}`;
}

// ===== Score Lookup =====

export function getScoresForFilter(
  benchmarkData: BenchmarkData,
  filters: FilterState
): Record<string, number> {
  const key = makeBenchmarkKey(filters.model, filters.audience, filters.age, filters.gender);
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

      for (const behavior of subarea.behaviors) {
        const score = scores[behavior.id] ?? 0;
        subareaScores.push(score);

        const behaviorNode: SunburstNodeData = {
          id: behavior.id,
          name: behavior.name,
          depth: 3,
          type: 'behavior',
          areaId: area.id,
          subareaId: subarea.id,
          color: area.color,
          valence: behavior.valence,
          score,
          value: scoreToArcValue(score),
        };

        subareaNode.children!.push(behaviorNode);
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

      const behaviors: DetailBehavior[] = subarea.behaviors.map((b) => ({
        id: b.id,
        name: b.name,
        score: scores[b.id] ?? 0,
        valence: b.valence,
      }));

      // Sort: most positive first, then most negative
      behaviors.sort((a, b) => b.score - a.score);

      const avgScore = averageScore(behaviors.map((b) => b.score));

      return {
        id: subarea.id,
        name: subarea.name,
        icon: subarea.icon,
        areaName: area.name,
        areaColor: area.color,
        areaIcon: area.icon,
        avgScore,
        behaviors,
      };
    }
  }
  return null;
}
