// ===== Taxonomy Types =====

export interface Behavior {
  id: string;
  name: string;
  valence: 'positive' | 'negative';
  description?: string;
}

export interface Subarea {
  id: string;
  name: string;
  icon: string;
  behaviors: Behavior[];
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

export type BenchmarkKey = string; // "modelId|audience|age|gender"
export type BehaviorScores = Record<string, number>; // behaviorId -> score [-1, 1]
export type BenchmarkData = Record<BenchmarkKey, BehaviorScores>;

// ===== Filter State =====

export interface FilterState {
  model: string;
  audience: string;
  age: string;
  gender: string;
}

// ===== D3 Hierarchy Types =====

export interface SunburstNodeData {
  id: string;
  name: string;
  icon?: string;
  score?: number;           // computed average for non-leaf, direct for leaf
  depth: number;
  type: 'root' | 'area' | 'subarea' | 'behavior';
  areaId?: string;
  subareaId?: string;
  color?: string;           // area color
  valence?: 'positive' | 'negative';
  description?: string;
  children?: SunburstNodeData[];
  value?: number;           // arc size (abs(score) with floor)
}

export interface DetailBehavior {
  id: string;
  name: string;
  score: number;
  valence: 'positive' | 'negative';
}

export interface DetailSubarea {
  id: string;
  name: string;
  icon: string;
  areaName: string;
  areaColor: string;
  areaIcon: string;
  avgScore: number;
  behaviors: DetailBehavior[];
}

// ===== App State =====

export interface AppState {
  taxonomy: Taxonomy;
  models: AIModel[];
  benchmarkData: BenchmarkData;
  filters: FilterState;
}
