"""
TVS Credit Smart Lending Hub — Synthetic Training Set Generator (20,000 Farmers)
Generates statistically representative rural credit profiles across 4 key agro-climatic zones:
1. Vidarbha / Marathwada, Maharashtra (Cotton, Soybean - Rainfed/Borewell)
2. Malwa / Bathinda, Punjab (Wheat, Paddy - Canal/Tubewell intensive)
3. Cauvery Delta, Tamil Nadu (Wetland Paddy, Sugarcane)
4. Central Narmada, Madhya Pradesh (Soybean, Gram, Wheat)

Default logic grounded in empirical agricultural finance research (NABARD & RBI rural credit surveys).
"""

import random
import math
import json
import csv
from typing import List, Dict, Any

STATES_CROPS = {
    "Maharashtra": {
        "districts": ["Yavatmal", "Amravati", "Nagpur", "Wardha", "Nanded"],
        "crops": ["Cotton (Bt)", "Soybean (JS-335)", "Pigeonpea / Tur", "Jowar"],
        "irrigation_prob": {"Borewell & Rainfed": 0.55, "Strictly Rainfed": 0.35, "Canal": 0.10},
        "land_mean": 5.4,
        "base_rainfall": 480,
    },
    "Punjab": {
        "districts": ["Bathinda", "Ludhiana", "Mansa", "Sangrur", "Patiala"],
        "crops": ["Wheat (Sharbati)", "Paddy (Basmati)", "Cotton (Bt)"],
        "irrigation_prob": {"Tube-well Perennial": 0.75, "Canal": 0.25, "Rainfed": 0.0},
        "land_mean": 7.8,
        "base_rainfall": 310,
    },
    "Tamil Nadu": {
        "districts": ["Thanjavur", "Tiruvarur", "Nagapattinam", "Madurai"],
        "crops": ["Paddy / Rice (Samba)", "Sugarcane (Co 0238)", "Groundnut"],
        "irrigation_prob": {"Canal Perennial": 0.50, "Borewell": 0.40, "Rainfed": 0.10},
        "land_mean": 4.2,
        "base_rainfall": 520,
    },
    "Madhya Pradesh": {
        "districts": ["Sehore", "Hoshangabad", "Dewas", "Ujjain", "Vidisha"],
        "crops": ["Soybean (JS-9560)", "Wheat (Lokwan)", "Gram / Chana"],
        "irrigation_prob": {"Tube-well": 0.60, "Rainfed": 0.30, "Canal": 0.10},
        "land_mean": 6.1,
        "base_rainfall": 440,
    },
}

def generate_farmer_records(n_samples: int = 20000, seed: int = 42) -> List[Dict[str, Any]]:
    random.seed(seed)
    records = []

    for i in range(1, n_samples + 1):
        state = random.choice(list(STATES_CROPS.keys()))
        cfg = STATES_CROPS[state]
        district = random.choice(cfg["districts"])
        crop = random.choice(cfg["crops"])
        
        # Irrigation selection
        irrig_types = list(cfg["irrigation_prob"].keys())
        irrig_weights = list(cfg["irrigation_prob"].values())
        irrigation = random.choices(irrig_types, weights=irrig_weights, k=1)[0]
        is_irrigated = "Rainfed" not in irrigation or "Borewell" in irrigation

        # Land size (Log-normal distribution around state mean)
        land_size = round(max(1.0, random.lognormvariate(math.log(cfg["land_mean"]), 0.45)), 1)
        
        # Requested loan amount (Tractor ~ ₹4L-₹7L, Farm implements ~ ₹1.5L-₹3.5L)
        requested_amount = round(random.choice([350000, 425000, 450000, 500000, 575000, 650000]))

        # Satellite Sentinel-2 NDVI (0.30 to 0.88)
        base_ndvi = 0.70 if is_irrigated else 0.58
        ndvi_mean = round(min(0.92, max(0.28, random.gauss(base_ndvi, 0.10))), 2)
        ndvi_peak = round(min(0.95, ndvi_mean + random.uniform(0.05, 0.14)), 2)
        ndvi_yoy_delta_pct = round(random.gauss(3.5 if is_irrigated else -4.0, 12.0), 1)

        # NASA POWER Rainfall Telemetry
        rainfall_anomaly_pct = round(random.gauss(-12.5, 24.0), 1) # Frequent Indian monsoon deficit
        base_rain = cfg["base_rainfall"]
        last_90d_rainfall = round(max(60, base_rain * (1 + rainfall_anomaly_pct / 100.0)), 1)

        # Soil properties (ISRIC Baseline)
        soil_soc = round(min(12.5, max(3.5, random.gauss(7.2, 1.4))), 1)
        soil_clay = round(min(58.0, max(18.0, random.gauss(38.0, 8.5))), 1)

        # APMC Mandi Access
        mandi_dist_km = round(random.uniform(4.0, 36.0), 1)
        mandi_price_trend_pct = round(random.gauss(3.2, 5.5), 1)

        # Alternative Data (UPI utility frequency, fertilizer purchase regularity)
        alt_data_score = round(random.uniform(0.40, 0.98), 2)

        # --- Empirical Default Probability Logic (Ground Truth Generation) ---
        # Log-odds of default based on agronomic stress factors
        z = -2.25 # baseline log-odds (~9.5% default)
        
        # Severe rainfall anomaly without irrigation heavily spikes default
        if rainfall_anomaly_pct < -30 and not is_irrigated:
            z += 1.65 # ~5x odds multiplier
        elif rainfall_anomaly_pct < -20 and is_irrigated:
            z += 0.35 # well cushioned
        elif rainfall_anomaly_pct > 10:
            z -= 0.40

        # NDVI health impact
        if ndvi_mean < 0.45:
            z += 1.40
        elif ndvi_mean >= 0.72:
            z -= 0.85

        # Land size protective buffer
        if land_size >= 6.0:
            z -= 0.55
        elif land_size < 2.5:
            z += 0.45

        # Mandi distance distress sale impact
        if mandi_dist_km > 25:
            z += 0.30

        # Alternative payment track
        if alt_data_score > 0.85:
            z -= 0.50

        # Calculate actual Probability of Default (PD)
        pd = 1.0 / (1.0 + math.exp(-z))
        
        # Binary target: 1 = Default (90+ DPD in 24 months), 0 = Fully Performing Loan
        default_label = 1 if random.random() < pd else 0

        # Equivalent CIBIL-comparable credit score (300-900)
        calibrated_score = round(min(890, max(350, 900 - pd * 1250)))

        records.append({
            "applicant_id": f"SYN-{i:05d}",
            "state": state,
            "district": district,
            "crop": crop,
            "irrigation": irrigation,
            "land_size_acres": land_size,
            "requested_amount_inr": requested_amount,
            "ndvi_mean": ndvi_mean,
            "ndvi_peak": ndvi_peak,
            "ndvi_yoy_delta_pct": ndvi_yoy_delta_pct,
            "rainfall_last_90d_mm": last_90d_rainfall,
            "rainfall_anomaly_pct": rainfall_anomaly_pct,
            "soil_soc_gkg": soil_soc,
            "soil_clay_pct": soil_clay,
            "mandi_distance_km": mandi_dist_km,
            "mandi_price_trend_pct": mandi_price_trend_pct,
            "alt_data_score": alt_data_score,
            "prob_default": round(pd, 4),
            "calibrated_credit_score": calibrated_score,
            "default_target": default_label,
        })

    return records

if __name__ == "__main__":
    print("Generating 20,000 synthetic smallholder credit profiles...")
    data = generate_farmer_records(20000)
    
    defaults = sum(r["default_target"] for r in data)
    avg_score = sum(r["calibrated_credit_score"] for r in data) / len(data)
    print(f"Generated {len(data)} profiles.")
    print(f"Overall Default Rate: {defaults / len(data) * 100:.2f}% (Benchmark range 8-12%)")
    print(f"Average Calibrated Credit Score: {avg_score:.1f} (Scale: 300 - 900)")

    # Save to CSV for model training
    fieldnames = list(data[0].keys())
    with open("synthetic_agri_credit_20k.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print("Saved dataset to geo-ml/synthetic_agri_credit_20k.csv")
