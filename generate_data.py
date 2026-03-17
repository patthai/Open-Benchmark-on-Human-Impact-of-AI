#!/usr/bin/env python3
"""
Generate synthetic benchmark-data.json for the AI Impact Benchmark visualization.
Each entry key: "modelId|audience|age|gender"  -> {behaviorId: score}
Score range: -1.0 to 1.0
"""
import json
import random
import math
import os

# ─── Reproducible seed ───────────────────────────────────────────────────────
random.seed(42)

# ─── Paths ───────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TAXONOMY_PATH = os.path.join(SCRIPT_DIR, "public", "data", "taxonomy.json")
MODELS_PATH   = os.path.join(SCRIPT_DIR, "public", "data", "models.json")
OUTPUT_PATH   = os.path.join(SCRIPT_DIR, "public", "data", "benchmark-data.json")

# ─── Load taxonomy & models ───────────────────────────────────────────────────
with open(TAXONOMY_PATH) as f:
    taxonomy = json.load(f)

with open(MODELS_PATH) as f:
    models_data = json.load(f)

# ─── Dimension values ─────────────────────────────────────────────────────────
MODELS    = [m["id"] for m in models_data["models"]]
MODEL_QUALITY = {m["id"]: m["qualityBase"] for m in models_data["models"]}

# Override quality bases to span a wider range so scores clearly differ visually
MODEL_QUALITY_OVERRIDE = {
    # Original models
    "chatgpt-3.5":      0.20,   # clearly below average → more red
    "chatgpt-4":        0.55,
    "chatgpt-4o":       0.82,   # very positive
    "claude-3":         0.78,
    "claude-3.5-sonnet":0.88,   # best performer
    "claude-3.5-haiku": 0.60,
    "gemini-pro":       0.35,   # below average → mixed
    "gemini-ultra":     0.80,
    "gemini-flash":     0.45,
    "llama-3":          0.30,   # mostly negative
    "mistral-large":    0.50,
    "grok-2":           0.25,   # clearly negative
    # New 2025 frontier models
    "gpt-4.5":          0.75,
    "gpt-5":            0.72,
    "o3":               0.68,
    "claude-3.7-sonnet":0.85,
    "gemini-2.0-flash": 0.55,
    "gemini-2.5-pro":   0.74,
    # New 2025 open-source models
    "llama-3.3":        0.45,
    "llama-4":          0.52,
    "mistral-large-2":  0.48,
    "deepseek-r1":      0.50,
    "deepseek-v3":      0.42,
    "qwen-2.5":         0.38,
    "phi-4":            0.44,
    "command-r-plus":   0.35,
}
# Merge overrides into MODEL_QUALITY
for mid, val in MODEL_QUALITY_OVERRIDE.items():
    if mid in MODEL_QUALITY:
        MODEL_QUALITY[mid] = val

AUDIENCES = ["generic", "student", "professional", "elderly", "vulnerable"]
AGES      = ["adult", "youth", "child", "senior"]
GENDERS   = ["all", "male", "female", "nonbinary"]

# ─── Collect all behaviors ────────────────────────────────────────────────────
behaviors = []  # list of dicts with id, valence, area_id, subarea_id
for area in taxonomy["areas"]:
    for subarea in area["subareas"]:
        for b in subarea["behaviors"]:
            behaviors.append({
                "id": b["id"],
                "valence": b["valence"],
                "area_id": area["id"],
                "subarea_id": subarea["id"],
            })

print(f"Total behaviors: {len(behaviors)}")  # should be 260

# ─── Per-model area biases ────────────────────────────────────────────────────
# Each model has slightly different strengths per area
def area_bias_for_model(model_id: str) -> dict:
    """Return a ±0.35 bias per area for a given model — wider spread."""
    rng = random.Random(model_id + "area_bias")
    areas = [a["id"] for a in taxonomy["areas"]]
    return {aid: rng.uniform(-0.35, 0.35) for aid in areas}

MODEL_AREA_BIAS = {mid: area_bias_for_model(mid) for mid in MODELS}

# ─── Audience / Age / Gender modifiers ───────────────────────────────────────
AUDIENCE_MOD = {
    "generic":      0.00,
    "student":      0.05,
    "professional": 0.08,
    "elderly":     -0.05,
    "vulnerable":  -0.10,
}

AGE_MOD = {
    "adult":   0.00,
    "youth":  -0.04,
    "child":  -0.08,
    "senior": -0.03,
}

GENDER_MOD = {
    "all":       0.00,
    "male":      0.01,
    "female":    0.02,
    "nonbinary": 0.00,
}

# ─── Score generation ─────────────────────────────────────────────────────────
def gaussian_noise(rng: random.Random, std: float = 0.12) -> float:
    """Box-Muller gaussian noise."""
    u1 = rng.random()
    u2 = rng.random()
    z  = math.sqrt(-2 * math.log(max(u1, 1e-10))) * math.cos(2 * math.pi * u2)
    return z * std

def clamp(v: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))

def generate_score(
    behavior: dict,
    model_id: str,
    audience: str,
    age: str,
    gender: str,
) -> float:
    """
    Produce a score for one (behavior, model, audience, age, gender) tuple.
    Better models → higher scores for positive behaviors, less negative for negative.
    """
    base_quality = MODEL_QUALITY[model_id]          # 0.3 – 0.8
    area_bias    = MODEL_AREA_BIAS[model_id][behavior["area_id"]]
    aud_mod      = AUDIENCE_MOD[audience]
    age_mod      = AGE_MOD[age]
    gender_mod   = GENDER_MOD[gender]

    # Seed per (model, behavior) for reproducibility across filter combos
    rng = random.Random(model_id + behavior["id"])

    if behavior["valence"] == "positive":
        # Positive behaviors: base around (quality - 0.5) * 2 → wider spread, clearly red vs green
        base = (base_quality - 0.5) * 2.0 + area_bias + aud_mod + age_mod + gender_mod
    else:
        # Negative behaviors: better models have LESS negative impact (closer to 0 or positive)
        base = -(1 - base_quality) * 1.8 + area_bias * 0.6 + aud_mod * 0.5 + age_mod * 0.5 + gender_mod * 0.5

    noise = gaussian_noise(rng, std=0.28)
    score = clamp(base + noise)
    return round(score, 4)

# ─── Build benchmark data ─────────────────────────────────────────────────────
benchmark: dict = {}

total_keys = len(MODELS) * len(AUDIENCES) * len(AGES) * len(GENDERS)
print(f"Generating {total_keys} filter combinations × {len(behaviors)} behaviors …")

for model_id in MODELS:
    for audience in AUDIENCES:
        for age in AGES:
            for gender in GENDERS:
                key = f"{model_id}|{audience}|{age}|{gender}"
                scores: dict = {}
                for b in behaviors:
                    scores[b["id"]] = generate_score(b, model_id, audience, age, gender)
                benchmark[key] = scores

# ─── Write output ─────────────────────────────────────────────────────────────
with open(OUTPUT_PATH, "w") as f:
    json.dump(benchmark, f, separators=(",", ":"))

size_mb = os.path.getsize(OUTPUT_PATH) / 1_048_576
print(f"Written: {OUTPUT_PATH}  ({size_mb:.2f} MB, {len(benchmark)} keys)")
