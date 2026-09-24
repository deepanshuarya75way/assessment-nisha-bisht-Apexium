import pandas as pd
import numpy as np
from spill_scenario import spill_event

# --- Load filtered AIS data ---
print("Loading filtered AIS data...")
df = pd.read_csv("ais_gulf_filtered.csv")
df["base_date_time"] = pd.to_datetime(df["base_date_time"])

# --- Define spill details ---
spill_lat = spill_event["latitude"]
spill_lon = spill_event["longitude"]
spill_time = pd.to_datetime(spill_event["detected_at"])

# --- Step 1: Filter by time window (±3 hours around spill detection) ---
time_window = pd.Timedelta(hours=3)
time_mask = (df["base_date_time"] >= spill_time - time_window) & (df["base_date_time"] <= spill_time + time_window)
df_time_filtered = df[time_mask].copy()

print(f"Ships pinging within ±3 hours of spill time: {len(df_time_filtered)} rows")

# --- Step 2: Calculate distance from spill location using the Haversine formula ---
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 3440.065  # Earth radius in nautical miles
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c

df_time_filtered["distance_nm"] = haversine_distance(
    spill_lat, spill_lon,
    df_time_filtered["latitude"], df_time_filtered["longitude"]
)

# --- Step 3: Keep only ships within 20 nautical miles ---
nearby_ships = df_time_filtered[df_time_filtered["distance_nm"] <= 20].copy()
print(f"Ships within 20 nm of spill location: {len(nearby_ships)} rows")

# --- Step 4: For each unique ship (MMSI), keep only its CLOSEST ping ---
closest_per_ship = nearby_ships.sort_values("distance_nm").drop_duplicates(subset="mmsi", keep="first")

# --- Step 5: Rank by distance (closest = most suspicious) ---
ranked = closest_per_ship.sort_values("distance_nm")[
    ["mmsi", "vessel_name", "vessel_type", "base_date_time", "latitude", "longitude", "distance_nm"]
]

print("\n=== Top candidate vessels (closest to spill) ===")
print(ranked.head(10).to_string(index=False))

# Save results
ranked.to_csv("candidate_vessels.csv", index=False)
print("\nSaved full ranked list to candidate_vessels.csv")