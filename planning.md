# AI Impact Benchmark Visualization - Implementation Plan
 
## Context
Build a modern interactive sunburst visualization website showing how different AI models impact humans across well-being dimensions. The visualization centers on a Vitruvian man figure (`images/human-figure.png`) with concentric rings showing 3 areas, 13 subareas, and individual behavior measurements. Green = positive impact, red = negative. Filters at the top allow selection by age, gender, audience type, and AI model.
 
## Tech Stack
- **Vite** + vanilla TypeScript (no React)
- **D3.js** for sunburst (`d3.hierarchy` + `d3.partition` + `d3.arc`)
- **FontAwesome** (CDN) for area/subarea icons
- Separate JSON data files
 
## File Structure
```
├── images/human-figure.png          (existing)
├── data/
│   ├── taxonomy.json                (areas, subareas, 260 behaviors)
│   ├── models.json                  (12+ AI models with metadata)
│   └── benchmark-data.json          (synthetic scores by model/audience/age/gender)
├── src/
│   ├── main.ts                      (entry: init controls, load data, render)
│   ├── types.ts                     (TypeScript interfaces)
│   ├── sunburst.ts                  (D3 sunburst rendering + transitions)
│   ├── controls.ts                  (top-bar filter dropdowns)
│   ├── data-loader.ts               (load JSON, build D3 hierarchy from filters)
│   ├── color-scale.ts               (green/red diverging color utilities)
│   └── tooltip.ts                   (hover tooltip component)
├── styles/main.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
 
## Data Schema
 
### taxonomy.json
3 areas with FontAwesome icons, 13 subareas, each subarea has 20 behaviors (10 positive, 10 negative valence):
- **Self Actualization** (`fa-mountain-sun`): Meaning & Purpose, Autonomy, Learning, Life Satisfaction
- **Psychological** (`fa-brain`): Mental Health, Creativity, Social Relationship, Character & Virtue
- **Physical Safety** (`fa-shield-heart`): Food, Sleep, Shelter, Health, Financial Security
 
### models.json
12 models: ChatGPT 3.5/4/4o, Claude 3/3.5 Sonnet/3.5 Haiku/3 Opus, Gemini Pro/Ultra/Flash, Llama 3, Mistral Large
 
### benchmark-data.json
Compact key format: `"modelId|audience|age|gender": { "behaviorId": score }` where score is -1.0 to 1.0.
 
## Sunburst Design
- **Center**: Vitruvian man image (~200px diameter)
- **Ring 1** (depth 1): 3 area arcs with FA icons, ~120-200px radius
- **Ring 2** (depth 2): 13 subarea arcs with labels, ~200-300px radius
- **Ring 3** (depth 3): 260 behavior arcs (shown on drill-down), ~300-420px radius
- **Color**: `d3.scaleLinear().domain([-1, 0, 1]).range(["#dc2626", "#f5f5f5", "#16a34a"])` — parent nodes show averaged children scores
- **Sizing**: leaf arc angle proportional to `Math.abs(score)` with 0.1 floor
 
## Interactivity
- **Hover**: highlight arc + ancestors, dim others, show tooltip with score/label
- **Click area**: zoom sunburst so that area fills 360 degrees
- **Click center**: zoom back out
- **Click subarea**: show detail panel with all 20 behaviors as a bar chart
- **Filter change**: smooth D3 arc transitions to new data
 
## Controls (top sticky bar)
Horizontal row of styled `<select>` dropdowns: Age, Gender, Audience, AI Model. Default: adult / all / generic / ChatGPT 4o.
 
## Styling (Anthropic aesthetic)
- Background: `#fafaf9`, text: `#1a1a1a`, font: Inter/system
- Control bar: white, subtle shadow, sticky top
- Dropdowns: rounded corners, light borders
- Transitions: 400ms ease-in-out
 
## Synthetic Data Generation
- Each model gets a base quality (0.3-0.8, newer = higher)
- Per-area bias per model, gaussian noise ±0.15
- Audience/age/gender modifiers as small additive adjustments
- Produces plausible patterns: better models greener, all have some red
 
## Implementation Steps
 
### Step 1: Scaffold project
- `npm create vite@latest . -- --template vanilla-ts`
- Install d3, @types/d3
- Add FontAwesome CDN to index.html
- Create directory structure
 
### Step 2: Data files
- Write `src/types.ts` with all interfaces
- Write `data/taxonomy.json` (all 260 behaviors)
- Write `data/models.json`
- Generate `data/benchmark-data.json` with synthetic data
 
### Step 3: Core sunburst
- Implement `src/color-scale.ts`
- Implement `src/data-loader.ts` (JSON loading, hierarchy builder)
- Implement `src/sunburst.ts` (D3 partition + arc rendering + center image)
- Write `styles/main.css`
 
### Step 4: Interactivity
- Add hover tooltips (`src/tooltip.ts`)
- Add click-to-zoom drill-down
- Add detail panel for subarea click
 
### Step 5: Controls
- Build top bar in `index.html`
- Implement `src/controls.ts` (populate dropdowns, bind events)
- Wire filter changes to sunburst update with transitions
 
### Step 6: Polish
- Responsive scaling
- Legend for green/red scale
- Loading state
- Final typography/spacing
 
## Verification
1. `npm run dev` — site loads with sunburst visible
2. Center shows Vitruvian man, 3 colored area arcs visible in inner ring
3. Hovering arcs shows tooltip with behavior details
4. Changing model dropdown transitions colors smoothly
5. Clicking an area zooms in to show behaviors
6. All 5 audience types and model selections produce visually distinct patterns
7. `npm run build` produces deployable static files
 