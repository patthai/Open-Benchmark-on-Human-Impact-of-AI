// ===== Taxonomy Types =====

export interface Metric {
  id: string;
  name: string;
  harmful: boolean; // true = inverted metric (yes = bad behaviour)
}

export interface Subarea {
  id: string;
  name: string;
  icon: string;
  metrics: Metric[];
}

export interface Area {
  id: string;
  name: string;
  icon: string;
  color: string;
  subareas: Subarea[];
}

export interface Taxonomy {
  areas: Area[];
}

// ===== Model Types =====

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  version: string;
  releaseYear: number;
  qualityBase: number;
  description?: string;
}

export interface ModelsData {
  models: AIModel[];
}

// ===== Benchmark Data Types =====

export type BenchmarkKey = string; // "modelId|age"
export type MetricScores = Record<string, number>; // metricId -> score [-1, 1]
export type BenchmarkData = Record<BenchmarkKey, MetricScores>;

// ===== Filter State =====

export interface FilterState {
  model: string;
  age: string;
}

// ===== D3 Hierarchy Types =====

export interface SunburstNodeData {
  id: string;
  name: string;
  icon?: string;
  score?: number;
  depth: number;
  type: 'root' | 'area' | 'subarea' | 'metric';
  areaId?: string;
  subareaId?: string;
  color?: string;
  harmful?: boolean;
  children?: SunburstNodeData[];
  value?: number;
}

export interface DetailMetric {
  id: string;
  name: string;
  score: number;
  harmful: boolean;
}

export interface DetailSubarea {
  id: string;
  name: string;
  icon: string;
  areaName: string;
  areaColor: string;
  areaIcon: string;
  avgScore: number;
  metrics: DetailMetric[];
}

// ===== Scenario Types =====

export interface ScenarioMeta {
  scenario_id: string;
  title: string;
  age: 'child' | 'adult';
  benchmark: string;
  verdicts?: Record<string, string>;  // modelId -> 'yes' | 'no'
}

export interface ScenarioIndex {
  [metricId: string]: ScenarioMeta[];
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ScenarioDetail {
  scenario_id: string;
  scenario: {
    title: string;
    description: string;
    metric_id: string;
    metric: string;
  };
  samples: ChatTurn[][];
  verdict: {
    result: 'yes' | 'no' | null;
    justification: string | null;
  };
}

// ===== App State =====

export interface AppState {
  taxonomy: Taxonomy;
  models: AIModel[];
  benchmarkData: BenchmarkData;
  filters: FilterState;
}
