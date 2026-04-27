import type { AIModel, FilterState } from './types';

// ===== Option Definitions =====

export const AGE_OPTIONS = [
  { value: 'adult', label: 'Adult (18+)' },
  { value: 'child', label: 'Child / Teenager (6–17)' },
];

export const DEFAULT_FILTERS: FilterState = {
  model: 'gpt-5',
  age: 'adult',
};

// ===== Populate Dropdowns =====

export function initControls(
  models: AIModel[],
  onFilterChange: (filters: FilterState) => void
): FilterState {
  populateModelSelect(models);
  populateSelect('filter-age', AGE_OPTIONS);

  // Set defaults
  setSelectValue('filter-model', DEFAULT_FILTERS.model);
  setSelectValue('filter-age', DEFAULT_FILTERS.age);

  // Bind events
  const ids = ['filter-model', 'filter-age'];
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
    age: getSelectValue('filter-age'),
  };
}

function getSelectValue(id: string): string {
  const el = document.getElementById(id) as HTMLSelectElement;
  return el?.value ?? '';
}
