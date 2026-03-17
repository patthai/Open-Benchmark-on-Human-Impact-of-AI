import type { AIModel, FilterState } from './types';

// ===== Option Definitions =====

export const AUDIENCE_OPTIONS = [
  { value: 'generic', label: 'General Population' },
  { value: 'student', label: 'Students' },
  { value: 'professional', label: 'Professionals' },
  { value: 'elderly', label: 'Elderly' },
  { value: 'vulnerable', label: 'Vulnerable Groups' },
];

export const AGE_OPTIONS = [
  { value: 'adult', label: 'Adult (18–64)' },
  { value: 'youth', label: 'Youth (13–17)' },
  { value: 'child', label: 'Child (6–12)' },
  { value: 'senior', label: 'Senior (65+)' },
];

export const GENDER_OPTIONS = [
  { value: 'all', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Non-binary' },
];

export const DEFAULT_FILTERS: FilterState = {
  model: 'claude-3',
  audience: 'generic',
  age: 'adult',
  gender: 'all',
};

// ===== Populate Dropdowns =====

export function initControls(
  models: AIModel[],
  onFilterChange: (filters: FilterState) => void
): FilterState {
  populateModelSelect(models);
  populateSelect('filter-audience', AUDIENCE_OPTIONS);
  populateSelect('filter-age', AGE_OPTIONS);
  populateSelect('filter-gender', GENDER_OPTIONS);

  // Set defaults
  setSelectValue('filter-model', DEFAULT_FILTERS.model);
  setSelectValue('filter-audience', DEFAULT_FILTERS.audience);
  setSelectValue('filter-age', DEFAULT_FILTERS.age);
  setSelectValue('filter-gender', DEFAULT_FILTERS.gender);

  // Bind events
  const ids = ['filter-model', 'filter-audience', 'filter-age', 'filter-gender'];
  ids.forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      onFilterChange(getCurrentFilters());
    });
  });

  return getCurrentFilters();
}

function populateModelSelect(models: AIModel[]): void {
  const select = document.getElementById('filter-model') as HTMLSelectElement;
  if (!select) return;

  // Group by provider
  const byProvider: Record<string, AIModel[]> = {};
  for (const m of models) {
    if (!byProvider[m.provider]) byProvider[m.provider] = [];
    byProvider[m.provider].push(m);
  }

  select.innerHTML = '';
  for (const [provider, providerModels] of Object.entries(byProvider)) {
    const group = document.createElement('optgroup');
    group.label = provider;
    for (const m of providerModels) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      group.appendChild(opt);
    }
    select.appendChild(group);
  }
}

function populateSelect(id: string, options: { value: string; label: string }[]): void {
  const select = document.getElementById(id) as HTMLSelectElement;
  if (!select) return;
  select.innerHTML = options
    .map((o) => `<option value="${o.value}">${o.label}</option>`)
    .join('');
}

function setSelectValue(id: string, value: string): void {
  const select = document.getElementById(id) as HTMLSelectElement;
  if (!select) return;
  select.value = value;
}

export function getCurrentFilters(): FilterState {
  return {
    model: getSelectValue('filter-model'),
    audience: getSelectValue('filter-audience'),
    age: getSelectValue('filter-age'),
    gender: getSelectValue('filter-gender'),
  };
}

function getSelectValue(id: string): string {
  const el = document.getElementById(id) as HTMLSelectElement;
  return el?.value ?? '';
}
