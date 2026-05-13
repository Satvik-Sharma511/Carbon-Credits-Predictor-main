# SolarCarbon ☀️

**Indian solar carbon credit prediction system** — estimates carbon credits, avoided CO₂ emissions, and solar energy yield from rooftop and industrial solar panel setups across India.

---

## Overview

SolarCarbon is a full-stack web application that lets Indian solar users calculate their potential carbon credit impact. Users select their location on an interactive map (or type coordinates manually), enter their panel area and a timeframe, and receive an estimated report covering:

- **Carbon Credits** earned (1 credit = 1 ton CO₂ avoided)
- **CO₂ Avoided** (kg)
- **Total Energy Yield** (kWh)

The prediction is powered by a custom ML model hosted on Hugging Face Spaces, backed by a dataset built from Indian thermal power plant records and solar energy estimation logic.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Leaflet (react-leaflet), Axios |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| ML Model | Hugging Face Spaces (external inference API) |
| Geocoding | OpenStreetMap Nominatim (address search) |
| Solar Data | NASA POWER API (irradiance lookup) |

---

## Project Structure

```
├── src/                        # React frontend
│   └── src/
│       ├── App.jsx             # Main application and all page sections
│       ├── App.css             # Global styles
│       ├── index.css           # Base CSS and design tokens
│       ├── main.jsx            # React entry point
│       └── components/
│           ├── MapPicker.jsx   # Interactive map with address search
│           └── MapPicker.css   # Map component styles
│
└── backend/                    # FastAPI backend
    └── backend/
        ├── main.py             # API routes, request schemas, static file serving
        ├── utils.py            # NASA POWER API irradiance helper
        └── requirements.txt    # Python dependencies
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm (for the frontend)
- **Python** 3.10+ (for the backend)

---

### 1. Backend Setup

```bash
cd backend/backend

# Install dependencies
pip install -r requirements.txt

# Run the development server
python main.py
# OR
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`.

#### Environment Variables (optional)

| Variable | Default | Description |
|---|---|---|
| `HF_MODEL_API_URL` | `https://wwddsd-solarcarbon-model-api.hf.space/predict` | Hugging Face model prediction endpoint |
| `HF_SPACE_HEALTH_URL` | `https://wwddsd-solarcarbon-model-api.hf.space/health` | Hugging Face Space health check URL |
| `HF_API_TIMEOUT` | `120` | Timeout (seconds) for prediction requests |
| `HF_HEALTH_TIMEOUT` | `8` | Timeout (seconds) for health check requests |

---

### 2. Frontend Setup

```bash
cd src

# Install dependencies
npm install

# Start the development server (proxied to backend at port 8000)
npm run dev
```

Open `http://localhost:5173` in your browser.

> **Note:** The frontend proxies `/api/*` requests to the backend. Make sure the backend is running before using the calculator.

---

### 3. Production Build (Serving from FastAPI)

The backend is configured to serve the React build as static files:

```bash
# 1. Build the frontend
cd src
npm run build
# This produces src/dist/

# 2. Copy the build output into the backend's static folder
cp -r src/dist/ backend/backend/static/

# 3. Start the backend — it now serves both the API and the frontend
cd backend/backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## API Reference

### `GET /health`
Returns backend health status.

```json
{ "status": "ok", "backend": "online" }
```

---

### `GET /api/backend-status`
Checks backend connectivity and whether the Hugging Face model is loaded.

```json
{
  "backend": "online",
  "backend_online": true,
  "hf_online": true,
  "hf_model_loaded": true,
  "hf_error": null
}
```

---

### `POST /api/calculate`
Runs the carbon credit prediction.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `lat` | float | ✅ | Latitude of the solar installation |
| `lon` | float | ✅ | Longitude of the solar installation |
| `area` | float | ✅ | Total solar panel area in m² (must be > 0) |
| `eff` | float | ❌ | Panel efficiency as a decimal (default: `0.18`, i.e. 18%) |
| `days` | int | ✅ | Prediction timeframe in days (must be > 0) |

**Example request:**

```json
{
  "lat": 28.61,
  "lon": 77.20,
  "area": 50,
  "eff": 0.18,
  "days": 365
}
```

**Example response:**

```json
{
  "total_yield_kwh": 8190.0,
  "co2_avoided_kg": 6723.8,
  "carbon_credits": 6.72,
  "z_factor": 0.82,
  "irradiance": 5.2,
  "days": 365,
  "lat": 28.61,
  "lon": 77.20,
  "area": 50.0,
  "eff": 0.18
}
```

---

## How It Works

```
User Input (location + panel area + timeframe)
        │
        ▼
FastAPI Backend  ──►  Hugging Face Model API
        │                    │
        │   (solar irradiance from NASA POWER API)
        │                    │
        ◄────── Prediction result ──────────────
        │
        ▼
  React Frontend displays:
  • Carbon Credits
  • CO₂ Avoided (kg)
  • Energy Yield (kWh)
```

1. The user picks a location via the interactive Leaflet map (supports address search via OpenStreetMap Nominatim) or types coordinates manually.
2. Panel area (m²) and prediction timeframe (months or years) are entered.
3. The FastAPI backend forwards the request to the Hugging Face-hosted ML model.
4. The model uses solar irradiance data (fetched from the NASA POWER API) along with the Indian thermal power plant dataset to compute energy yield, avoided CO₂, and carbon credits.
5. Results are returned and displayed in the frontend report panel.

---

## Use Cases

- **Residential rooftop solar** — estimate CO₂ avoided by home solar setups
- **College and campus solar** — support sustainability reports and green energy dashboards
- **Industrial and MSME solar** — explore clean energy and carbon credit opportunities

---

## Team

| Name | Contributions |
|---|---|
| **Aritra Pradhan** | ML Model Development, Backend Integration, Carbon Credit Logic, Mathematical Formulations |
| **Satvik Sharma** | ML Model Development, Coordinate Verification, Feature Engineering, Frontend |
| **Sparsh Srivastava** | Complete Dataset Development, Dataset Integration, Data Cleaning, Outlier Removal, Feature Analysis |
| **Harsh Kumar Nimesh** | Dataset Validation, NASA POWER API Logic, Solar Energy Estimation, Mathematical Calculations |

---

## License

© 2026 SolarCarbon. Built for Indian solar impact and carbon credit prediction.
