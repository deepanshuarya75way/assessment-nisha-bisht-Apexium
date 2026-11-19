from crypt import methods
import os 
import numpy as np 
import cv2
import pandas as pd
import tensorflow as tf
from flask import Flask,jsonify,request
from flask_cors import CORS
app=Flask(__name__)
CORS(app)
model =None
try:
    model =tf.keras.models.load_model("oil_spill_model.h5")
except Exception :
    model=None
            
ais_df =pd.DataFrame({  # pyright: ignore[reportUnknownVariableType]
                "mmsi":[11111111,22222222,3333333],
                "vessel_name":["MT SAMPLE ONE","MV SAMPLE TWO","MT SAMPLE THREE"],
                "lat":[26.10,26.15,27.00],
                "lon":[51.20,51.25,52.00],
                "base_date_time":["2026-11-18 10:00","2026-11-18 10:30","2026-11-18 12:00"],
            })
ais_df["base_date_time"]=pd.to_datetime(ais_df["base_date_time"])
@app.route("/predict",methods=["POST"])
def predict():
    f=request.files.get("image")
    if f is None:
        return jsonify({"error":"NO image uploaded"}),400
    gray= cv2.imdecode(np.frombuffer(f.read(),np.unit8),cv2.IMREAD_GRAYSCALE)
    if gray is None:
       return jsonify({"error":"Invalid iamge"}),400
    score=float(np.mean(gray<60))
    return jsonify({"is_oil_spill":score >0.15,"spill detected":score>0.15,"confidence":score})

@app.route("/find_vessels",methods=["POST"])
def vessels():
     d=request.get_json(silent=True)or {}
     if any(d.get(K) in (None,"")for K in ("latitude","longitude","acquisition_time")):
         return jsonify({"error":"Latitude,longitude and acquisition time are required."}),400
     try:
         lat,lon=float(d["latitude"]),float(d["longitude"])
         t=pd.to_datetime(d["acquisition_time"])
     except Exception:
            return jsonify({"erorr":"Invalid latitude,longitude or time."}),400
     if not (-90<=lat<=90 and -180<=lon<=180):
            return jsonify({"error":"Latitude must be -90 to 90 and longitude -180 to 180."}),400
     df =ais_df[abs(ais_df["base_date_time"]-t)<=pd.Timedelta(hours=2)].copy()
     df=df[df["distance_nm"]<=25].sort_values("distance_nm")
     df["base_data_time"]=df["base_date_time"].astype(str)
     return jsonify({"scene":{"latitude": lat, "longitude": lon, "acuisition_time":str(t)},"vessels":df.to_dict("records")})



if __name__=="__main__":
         app.run(host="0.0.0.0",port=5000,debug=True)