from flask import Flask, jsonify, request
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
import pandas as pd

app = Flask(__name__)
CORS(app)

# --- Load the trained CNN model once at startup ---
print("Loading model...")
model = tf.keras.models.load_model("oil_spill_model.h5")
print("Model loaded successfully.")

# --- Load the filtered AIS data once at startup ---
print("Loading AIS data...")
ais_df = pd.read_csv("ais_gulf_filtered.csv")
ais_df["base_date_time"] = pd.to_datetime(ais_df["base_date_time"])
print("AIS data loaded.")


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate real-world distance (nautical miles) between two lat/lon points."""
    R = 3440.065  # Earth radius in nautical miles
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c


@app.route("/")
def home():
    return jsonify({"message": "Oil Spill Detection API is running"})


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]

    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_GRAYSCALE)

    if img is None:
        return jsonify({"error": "Could not read image file"}), 400

    img_resized = cv2.resize(img, (128, 128))
    img_normalized = img_resized.astype("float32") / 255.0
    img_final = np.expand_dims(img_normalized, axis=(0, -1))  # shape: (1, 128, 128, 1)

    prediction = model.predict(img_final)
    confidence = float(prediction[0][0])
    is_oil = confidence > 0.5

    return jsonify({
        "is_oil_spill": bool(is_oil),
        "confidence": round(confidence, 4)
    })


@app.route("/find_vessels", methods=["POST"])
def find_vessels():
    data = request.get_json()

    spill_lat = data["latitude"]
    spill_lon = data["longitude"]
    spill_time = pd.to_datetime(data["detected_at"])

    # Filter by time window (±3 hours)
    time_window = pd.Timedelta(hours=3)
    time_mask = (ais_df["base_date_time"] >= spill_time - time_window) & \
                (ais_df["base_date_time"] <= spill_time + time_window)
    df_time_filtered = ais_df[time_mask].copy()

    # Calculate distance from spill point
    df_time_filtered["distance_nm"] = haversine_distance(
        spill_lat, spill_lon,
        df_time_filtered["latitude"], df_time_filtered["longitude"]
    )

    # Keep ships within 20nm, one entry per ship (closest ping only)
    nearby = df_time_filtered[df_time_filtered["distance_nm"] <= 20].copy()
    closest_per_ship = nearby.sort_values("distance_nm").drop_duplicates(subset="mmsi", keep="first")
    ranked = closest_per_ship.sort_values("distance_nm").head(10)

    result = ranked[["mmsi", "vessel_name", "vessel_type", "distance_nm"]].to_dict(orient="records")

    return jsonify({"candidate_vessels": result})


if __name__ == "__main__":
    app.run(debug=True, port=5000)