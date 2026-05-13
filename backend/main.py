# import pickle
# import pandas as pd
# import requests
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel

# app = FastAPI()

# # Enable CORS for Vite frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class SolarRequest(BaseModel):
#     lat: float
#     lon: float
#     area: float
#     eff: float
#     days: int

# # Load the ML Model
# try:
#     with open("backend/co2_emission_model.pkl", "rb") as f:
#         model = pickle.load(f)
# except Exception as e:
#     print(f"Model Error: {e}")
#     model = None

# def get_irradiance(lat, lon):
#     try:
#         url = f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude={lon}&latitude={lat}&start=20240101&end=20240101&format=JSON"
#         response = requests.get(url, timeout=5)
#         return list(response.json()['properties']['parameter']['ALLSKY_SFC_SW_DWN'].values())[0]
#     except:
#         return 5.25 # Fallback average

# @app.post("/api/calculate")
# async def calculate_credits(data: SolarRequest):
#     # 1. Fetch Irradiance
#     irradiance = get_irradiance(data.lat, data.lon)
    
#     # 2. Predict Grid Emission Factor (Z) in kg/kWh
#     if model:
#         features = pd.DataFrame([{
#             'Latitude': data.lat, 'Longitude': data.lon,
#             'State Name': 'Default', 'Region': 'Default',
#             'Tech_Clean': 'Subcritical', 'Age': 15,
#             'Coal_Intensity': 0.8, 'Import_Ratio': 0.1, 'Load_Factor': 0.7
#         }])
#         z_factor = model.predict(features)[0]
#     else:
#         z_factor = 0.82 # Average grid intensity fallback

#     # 3. Solar Generation (kWh)
#     # Formula: Irradiance * Area * Efficiency * Performance Ratio (0.75)
#     daily_kwh = irradiance * data.area * data.eff * 0.75
#     total_kwh = daily_kwh * data.days
    
#     # 4. Carbon Credit Conversion
#     # Total kg avoided = kWh * Z. 
#     # Credits = kg / 1000 (Metric Tonnes)
#     co2_avoided_kg = total_kwh * z_factor
#     carbon_credits = co2_avoided_kg / 1000

#     return {
#         "total_yield_kwh": round(total_kwh, 2),
#         "co2_avoided_kg": round(co2_avoided_kg, 2),
#         "carbon_credits": round(carbon_credits, 6), # Official Metric Tonne Value
#         "z_factor": round(z_factor, 3),
#         "days": data.days
#     }

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="127.0.0.1", port=8000)
import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# =========================================================
# FastAPI App
# =========================================================

app = FastAPI(
    title="Solar Carbon Backend",
    description="Backend that calls Hugging Face model API",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Config
# =========================================================

HF_MODEL_API_URL = os.getenv(
    "HF_MODEL_API_URL",
    "https://wwddsd-solarcarbon-model-api.hf.space/predict"
)

HF_SPACE_HEALTH_URL = os.getenv(
    "HF_SPACE_HEALTH_URL",
    "https://wwddsd-solarcarbon-model-api.hf.space/health"
)

HF_API_TIMEOUT = int(os.getenv("HF_API_TIMEOUT", "120"))
HF_HEALTH_TIMEOUT = int(os.getenv("HF_HEALTH_TIMEOUT", "8"))


# =========================================================
# Request Schema
# =========================================================

class SolarRequest(BaseModel):
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")
    area: float = Field(..., gt=0, description="Panel area in square meters")
    eff: float = Field(0.18, gt=0, le=1, description="Panel efficiency")
    days: int = Field(..., gt=0, description="Prediction timeframe in days")


# =========================================================
# Routes
# =========================================================

@app.get("/")
def home():
    return {
        "status": "Backend running",
        "message": "Backend is online",
        "model_api": HF_MODEL_API_URL,
    }


@app.get("/health")
def health():
    """
    Fast health route.
    Render/Vite/frontend can use this to check backend only.
    This does NOT call Hugging Face, so it remains fast.
    """
    return {
        "status": "ok",
        "backend": "online",
    }


@app.get("/api/backend-status")
def backend_status():
    """
    Frontend can call this endpoint.
    It checks:
    1. Backend is online
    2. Hugging Face model API is reachable
    """

    hf_online = False
    hf_model_loaded = False
    hf_error = None

    try:
        response = requests.get(
            HF_SPACE_HEALTH_URL,
            timeout=HF_HEALTH_TIMEOUT,
        )

        if response.status_code == 200:
            hf_online = True
            data = response.json()
            hf_model_loaded = bool(data.get("model_loaded", False))
        else:
            hf_error = f"Hugging Face returned status {response.status_code}"

    except requests.exceptions.Timeout:
        hf_error = "Hugging Face model API timeout"

    except requests.exceptions.ConnectionError:
        hf_error = "Could not connect to Hugging Face model API"

    except Exception as error:
        hf_error = str(error)

    return {
        "backend": "online",
        "backend_online": True,
        "hf_online": hf_online,
        "hf_model_loaded": hf_model_loaded,
        "hf_error": hf_error,
    }


@app.post("/api/calculate")
def calculate_credits(data: SolarRequest):
    payload = {
        "lat": data.lat,
        "lon": data.lon,
        "area": data.area,
        "eff": data.eff,
        "days": data.days,
    }

    try:
        response = requests.post(
            HF_MODEL_API_URL,
            json=payload,
            timeout=HF_API_TIMEOUT,
        )

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Model API timeout. Hugging Face Space may be waking up. Please try again.",
        )

    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Hugging Face model API. Check if Space is running.",
        )

    except requests.exceptions.RequestException as error:
        raise HTTPException(
            status_code=500,
            detail=f"Model API request failed: {str(error)}",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Model API returned error: {response.text}",
        )

    try:
        result = response.json()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Model API returned invalid JSON response.",
        )

    if "error" in result:
        raise HTTPException(
            status_code=500,
            detail=f"Model API error: {result['error']}",
        )

    required_keys = [
        "total_yield_kwh",
        "co2_avoided_kg",
        "carbon_credits",
        "z_factor",
    ]

    missing_keys = [key for key in required_keys if key not in result]

    if missing_keys:
        raise HTTPException(
            status_code=500,
            detail=f"Model API response missing keys: {missing_keys}",
        )

    return {
        "total_yield_kwh": result["total_yield_kwh"],
        "co2_avoided_kg": result["co2_avoided_kg"],
        "carbon_credits": result["carbon_credits"],
        "z_factor": result["z_factor"],
        "irradiance": result.get("irradiance"),
        "days": result.get("days", data.days),
        "lat": result.get("lat", data.lat),
        "lon": result.get("lon", data.lon),
        "area": result.get("area", data.area),
        "eff": result.get("eff", data.eff),
    }


# =========================================================
# Local Run
# =========================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)