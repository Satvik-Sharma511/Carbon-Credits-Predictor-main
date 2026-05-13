
import os
import requests

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
    "https://wwddsd-solarcarbon-model-api.hf.space/predict",
)

HF_SPACE_HEALTH_URL = os.getenv(
    "HF_SPACE_HEALTH_URL",
    "https://wwddsd-solarcarbon-model-api.hf.space/health",
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
# API Routes
# =========================================================

@app.get("/api/info")
def info():
    return {
        "status": "Backend running",
        "message": "Backend is online",
        "model_api": HF_MODEL_API_URL,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "backend": "online",
    }


@app.get("/api/backend-status")
def backend_status():
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
# Serve React Frontend
# Keep this section AFTER all API routes
# =========================================================

STATIC_DIR = "static"
ASSETS_DIR = os.path.join(STATIC_DIR, "assets")
INDEX_FILE = os.path.join(STATIC_DIR, "index.html")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


@app.get("/")
def serve_root():
    if os.path.exists(INDEX_FILE):
        return FileResponse(INDEX_FILE)

    raise HTTPException(
        status_code=404,
        detail="Frontend build not found. Make sure Docker copied frontend/dist to backend/static.",
    )


@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")

    if full_path == "health":
        raise HTTPException(status_code=404, detail="Route not found")

    if os.path.exists(INDEX_FILE):
        return FileResponse(INDEX_FILE)

    raise HTTPException(
        status_code=404,
        detail="Frontend build not found. Make sure Docker copied frontend/dist to backend/static.",
    )


# =========================================================
# Local Run
# =========================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
