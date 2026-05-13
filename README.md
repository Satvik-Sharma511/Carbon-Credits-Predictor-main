# SolarCarbon ☀️

**Indian solar carbon credit prediction system** — estimates carbon credits, avoided CO₂ emissions, and solar energy yield from rooftop and industrial solar panel setups across India.

🔗 Live: carbon-credits-predictor-main.onrender.com

---

## Overview

SolarCarbon is a web application that lets Indian solar users calculate their potential carbon credit impact. Users select their location on an interactive map (or type coordinates manually), enter their panel area and a timeframe, and receive an estimated report covering:

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
