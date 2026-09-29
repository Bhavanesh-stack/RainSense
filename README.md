# 🌧️ RainSense AI

**AI-Based Rooftop Rainwater Harvesting Assessment & Recommendation System**

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![YOLOv8](https://img.shields.io/badge/AI%2FML-Ultralytics%20YOLOv8-00FFFF)](https://ultralytics.com/)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-blue?logo=python&logoColor=white)](https://python.org/)

---

## 📖 Overview

**RainSense AI** is an end-to-end intelligent web application designed to help homeowners, builders, and institutions assess their rooftop's potential for rainwater harvesting. 

By uploading a rooftop photo or satellite image along with basic property details, users receive an instant AI-powered assessment containing:
- 🔍 **Rooftop & Obstacle Detection** via YOLOv8 (identifying solar panels, AC units, tanks, vents)
- 📐 **Usable Rooftop Area Calculation**
- 🌦️ **Location-Aware Rainfall Analytics** (historical seasonal distribution & monthly breakdown)
- 💧 **Annual Harvestable Rainwater Potential** ($V = A \times R \times C$)
- 🎯 **Transparent Readiness Score (0–100)** with factor-by-factor breakdown
- 🛠️ **Custom Harvesting Component Sizing** (tank capacity, filters, gutters, first-flush diverters)
- 💰 **Financial Feasibility & Cost Estimation** in INR with estimated payback period
- 📄 **Downloadable Assessment Report (PDF)** formatted with charts and summaries
- 📊 **Assessment History Dashboard** to manage and track past assessments

---

## 🏗️ System Architecture

```text
       ┌────────────────────────┐
       │   React 18 + Vite UI   │  <-- Interactive assessment wizard & charts
       └───────────┬────────────┘
                   │ REST API / JSON
       ┌───────────▼────────────┐
       │     FastAPI Backend    │  <-- Authentication, validation, scoring
       └─────┬──────────────┬───┘
             │              │
    ┌────────▼───────┐  ┌───▼──────────────────┐
    │ OpenCV / YOLO  │  │ Weather Intelligence │
    │ Rooftop Vision │  │ Rainfall & Climate   │
    └────────┬───────┘  └───┬──────────────────┘
             │              │
       ┌─────▼──────────────▼───┐
       │ Rainwater Math Engine  │  <-- V = A × R × C, Storage Sizing, Costs
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │ Storage (JSON/MongoDB) │  <-- Automatic fallback for zero-setup demo
       └────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher) — [Download Node.js](https://nodejs.org/)
- **Python** (v3.10 to v3.13) — [Download Python](https://python.org/)
- **Git** — [Download Git](https://git-scm.com/)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Bhavanesh-stack/RainSense.git
cd RainSense
```

---

### 2️⃣ Backend Setup (FastAPI)

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. *(Optional but recommended)* Create and activate a virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration file:
   ```bash
   # Windows
   copy .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```

5. Start the backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   > 🌐 **Backend API will run at:** `http://127.0.0.1:8000`  
   > 📑 **Interactive API Docs (Swagger):** `http://127.0.0.1:8000/docs`

---

### 3️⃣ Frontend Setup (React + Vite)

1. Open a **second terminal** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install the JavaScript dependencies:
   ```bash
   npm install
   ```

3. Create the frontend `.env` file:
   ```bash
   # Windows
   copy .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > 🌐 **Frontend will run at:** `http://localhost:5173`

---

## ⚡ Zero-Setup Demo Mode

**No MongoDB or API keys are required to run the demo!**

* **Database**: When MongoDB is not running, the application automatically uses a built-in JSON file storage adapter (`backend/data/`) that persists registered users and assessments seamlessly.
* **Weather Data**: Includes built-in seasonal rainfall models for Indian and international cities with intelligent latitude/longitude interpolation.
* **Vision AI**: Includes fallback computer vision simulation for rooftop obstacle detection if YOLO model weights are still downloading.

*(Optional)* If you wish to connect live weather data, obtain a free API key from [OpenWeatherMap](https://openweathermap.org/api) and set `OPENWEATHER_API_KEY=your_key` in `backend/.env`.

---

## 💻 How to Use RainSense AI

1. **Register / Log In**:
   - Open [http://localhost:5173](http://localhost:5173) in your browser.
   - Click **Get Started** or **Register** to create a user account.
2. **Start an Assessment**:
   - Click **New Assessment** on the navbar or dashboard.
   - **Step 1 - Upload Image**: Upload a rooftop image (JPEG/PNG) from your computer.
   - **Step 2 - Location**: Enter your city/state or use the interactive location selector.
   - **Step 3 - Roof Details**: Specify roof area ($m^2$ or $sq\ ft$), roofing material (RCC Concrete, Metal Sheets, Clay Tiles, etc.), and roof condition.
   - Click **Run Assessment**.
3. **View AI Results**:
   - **Readiness Score**: Inspect your property's 0–100 score and factor breakdown.
   - **Water Harvest Forecast**: View annual harvestable litres and monthly rainfall distribution charts.
   - **Recommendations**: See custom-sized storage tank recommendations and required filtration components.
   - **Financials**: Review estimated setup costs (INR) and annual water bill savings.
4. **Download PDF Report**:
   - Click **Download PDF Report** to export an assessment summary document.
5. **Dashboard & History**:
   - Access **Dashboard** at any time to review your past assessments and lifetime water savings potential.

---

## 🧮 Mathematical Model

The harvestable water potential is calculated using the standard hydrological runoff formula:

$$V = A \times R \times C$$

Where:
- $V$ = Harvestable rainwater volume (Litres / year)
- $A$ = Rooftop catchment area ($m^2$)
- $R$ = Average annual rainfall ($mm$)
- $C$ = Runoff coefficient based on roof material:
  - **RCC / Concrete**: $0.85$
  - **Metal / Corrugated Sheets**: $0.90$
  - **Clay / Cement Tiles**: $0.80$
  - **Other**: $0.70$

---

## 📂 Project Structure

```
RainSense/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entry point & CORS configuration
│   │   ├── config.py                   # Environment settings & cost constants
│   │   ├── database/
│   │   │   ├── connection.py           # Database connection manager with auto-fallback
│   │   │   └── json_db.py              # Zero-setup JSON database adapter
│   │   ├── models/
│   │   │   └── schemas.py              # Pydantic data schemas & request models
│   │   ├── routes/
│   │   │   ├── auth.py                 # User authentication (register/login)
│   │   │   └── assessment.py           # Analysis pipeline & report endpoints
│   │   ├── services/
│   │   │   ├── image_processing.py     # OpenCV image enhancement pipeline
│   │   │   ├── yolo_service.py         # YOLOv8 rooftop obstacle detector
│   │   │   ├── weather_service.py      # Rainfall statistics & weather service
│   │   │   ├── rainwater_calculator.py # Mathematical formula calculation engine
│   │   │   ├── scoring_service.py      # 0–100 Readiness scoring algorithm
│   │   │   ├── recommendation_service.py # Component sizing & cost estimator
│   │   │   └── report_service.py       # ReportLab PDF generator
│   │   └── utils/
│   │       └── auth.py                 # Bcrypt password hashing & JWT handling
│   ├── requirements.txt                # Python backend dependencies
│   └── .env.example                    # Backend environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/                 # Navbar, Footer, ScoreCircle, Progress
│   │   ├── pages/                      # Landing, Login, Register, Assessment, Results, Dashboard
│   │   ├── services/                   # Axios API service
│   │   ├── hooks/                      # useAuth authentication hook
│   │   ├── App.jsx                     # Route definitions & protected routes
│   │   ├── index.css                   # Tailwind styles & animations
│   │   └── main.jsx                    # React root entry
│   ├── package.json                    # Node dependencies
│   └── vite.config.js                  # Vite configuration
│
├── README.md                           # Project documentation
└── .gitignore                          # Git ignore rules
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Log in and receive JWT token | ❌ |
| `POST` | `/api/analyze` | Upload image and run full assessment pipeline | ✅ |
| `GET` | `/api/assessments` | Retrieve user assessment history | ✅ |
| `GET` | `/api/assessments/{id}` | Get single assessment details | ✅ |
| `DELETE` | `/api/assessments/{id}` | Delete an assessment | ✅ |
| `GET` | `/api/reports/{id}` | Download generated PDF assessment report | ✅ |
| `GET` | `/api/dashboard/stats` | Retrieve aggregate user dashboard statistics | ✅ |
| `GET` | `/api/health` | Backend and database health status | ❌ |

---

## 🛡️ License & Academic Disclaimer

This project is distributed under the MIT License.

> ⚠️ **Disclaimer**: RainSense AI provides estimations based on mathematical models and satellite/photographic detection. It is designed for preliminary planning and educational purposes and should not replace a structural engineering site inspection before major civil construction.