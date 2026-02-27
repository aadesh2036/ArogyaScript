<div align="center">

# 💊 ArogyaScript

### AI-Powered Medical Prescription Intelligence System

*Upload a prescription. Understand the risks. Save a life.*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-Explainable-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Object_Detection-FF6F00?style=for-the-badge&logo=yolo&logoColor=white)](https://ultralytics.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

**Adverse drug interactions** cause **1.3 million emergency visits/year** in the US alone.
Most are **preventable** — if caught early.

ArogyaScript is a full-stack AI system that **scans prescription images**, **detects dangerous drug interactions**, **computes risk scores**, and **generates explainable clinical recommendations** — all in seconds.

[Getting Started](#-quick-start) · [Architecture](#-architecture) · [Features](#-features) · [API Reference](#-api-reference) · [Contributing](#-contributing)

</div>

---

## 🧠 How It Works

```
┌──────────────┐     ┌──────────────────────────────────────────────────────┐     ┌──────────────────┐
│              │     │              PIPELINE (Async, Fault-Tolerant)        │     │                  │
│   Upload     │     │                                                      │     │   Interactive    │
│   Prescription ──►│  ┌───────┐  ┌─────┐  ┌──────────┐  ┌─────────────┐  │     │   Dashboard      │
│   Image      │     │  │ YOLO  │─►│ OCR │─►│ Entity   │─►│ Drug Name   │  │──►  │                  │
│              │     │  │ Crop  │  │(2x) │  │ Extract  │  │ Normalize   │  │     │  • Risk Score    │
└──────────────┘     │  └───────┘  └─────┘  └──────────┘  └──────┬──────┘  │     │  • Drug Cards    │
                     │                                           │         │     │  • Interactions   │
                     │  ┌──────────────┐  ┌────────────┐  ┌──────▼──────┐  │     │  • AI Reasoning  │
                     │  │   Gemini AI  │◄─│Intervention│◄─│ Interaction │  │     │  • Analytics     │
                     │  │  Reasoning   │  │  Engine    │  │   Check     │  │     │                  │
                     │  └──────────────┘  └────────────┘  └─────────────┘  │     └──────────────────┘
                     │                                                      │
                     └──────────────────────────────────────────────────────┘
```

1. **Upload** — User uploads a prescription image (JPEG/PNG/WebP)
2. **YOLO Crop** — A custom-trained YOLOv8 model detects and crops the prescription region
3. **Dual-Path OCR** — EasyOCR runs on *both* original and cropped images, merging results with intelligent deduplication
4. **Entity Extraction** — Regex + dictionary-based extraction of drugs, dosages, frequencies, durations
5. **Drug Normalization** — RapidFuzz fuzzy matching against a curated 40-drug knowledge base
6. **Interaction Detection** — Pairwise drug-drug interaction check against 12 curated clinical interaction rules
7. **Risk Scoring** — Multi-signal composite score (0–100) considering interactions, polypharmacy, missing info, extreme dosages, and OCR confidence
8. **Clinical Interventions** — Prioritized, actionable recommendations (consult physician, verify dosage, review duplication)
9. **Gemini Explainability** — Google Gemini generates pharmacological reasoning, evidence-based explanations, and uncertainty flags
10. **Results** — Rich interactive dashboard with 3D flip cards, analytics charts, and clinical decision support

---

## ⚡ Features

<table>
<tr>
<td width="50%">

### 🔍 Intelligent Prescription Analysis
- **YOLOv8 Document Detection** — auto-crops prescriptions from photos
- **Dual-Path OCR** — EasyOCR on original + cropped image, merged with deduplication
- **Entity Extraction** — drugs, dosages (mg/mcg/ml), frequencies (OD/BD/TDS/QID/SOS/PRN), durations
- **Fuzzy Drug Normalization** — RapidFuzz matching (75% threshold) against curated drug database

</td>
<td width="50%">

### 🛡️ Safety & Risk Engine
- **12 Drug-Drug Interactions** — curated clinical rules with severity levels (low → critical)
- **Multi-Signal Risk Score** (0–100) — interaction severity, polypharmacy, missing info, extreme dosage, OCR confidence
- **5 Risk Levels** — Safe / Low / Moderate / High / Critical
- **Extreme Dosage Validation** — per-drug maximum thresholds (e.g., Paracetamol 4000mg)

</td>
</tr>
<tr>
<td>

### 🤖 Explainable AI (Gemini)
- **4-Model Fallback Chain** — `gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-2.0-flash-lite`
- **Interaction Explanations** — pharmacological mechanism, clinical significance, evidence basis
- **Uncertainty Flags** — explicit field-level uncertainty with clinical impact
- **Rule-Based Fallback** — generates explanations from KB when Gemini is unavailable
- **OCR Confidence Analysis** — highlights low-confidence tokens with clinical concern

</td>
<td>

### 📊 Rich Dashboard
- **6 Tabs** — Overview, History, Anomalies, Analytics, Drug Database, Settings
- **Interactive Charts** — upload trends, risk distribution (doughnut), top drugs (bar), monthly averages
- **3D Drug Flip Cards** — front: drug info + risk badge + Lottie animation; back: AI explanations
- **Pipeline Progress Tracker** — animated 6-step visualization with per-stage timing
- **Glass-Morphism UI** — ocean gradient theme, floating bubbles, `prefers-reduced-motion` support

</td>
</tr>
<tr>
<td>

### 🏗️ Fault-Tolerant Architecture
- **Async Pipeline** — upload returns instantly; processing runs in background
- **Non-Critical AI Layer** — YOLO + Gemini failures never block the pipeline
- **Dual-Path Anomaly Detection** — ML pipeline preferred → rule-based fallback
- **Real-Time Polling** — frontend polls every 1.5s with animated progress
- **Graceful Degradation** — server starts even without MongoDB connection

</td>
<td>

### 🔐 Authentication & Security
- **JWT-Based Auth** — configurable expiry, bcrypt (12 rounds) password hashing
- **Role-Based Access** — `user` and `admin` roles
- **Protected Routes** — middleware guards all prescription/dashboard endpoints
- **File Validation** — 10MB limit, JPEG/PNG/WebP only, Multer sanitization
- **CORS Configured** — cross-origin support for frontend-backend communication

</td>
</tr>
</table>

---

## 🏛️ Architecture

```
ArogyaScript/
├── backend/                    # 🟢 Node.js + Express API Server (Port 5000)
│   ├── src/
│   │   ├── controllers/        #   Route handlers (auth, prescriptions, dashboard)
│   │   ├── middleware/          #   Auth guard, file upload, error handler
│   │   ├── models/             #   Mongoose schemas (User, Prescription)
│   │   ├── routes/             #   Express routers
│   │   ├── services/           #   Pipeline orchestrator, Gemini client, anomaly detector,
│   │   │                       #   intervention engine, OCR/ML clients, YOLO cropper bridge
│   │   └── server.js           #   Entry point
│   └── uploads/                #   Stored prescription images
│
├── frontend/                   # 🔵 Next.js 14 App (Port 3000)
│   └── src/
│       ├── components/         #   DrugFlipCard, ExplainabilityCard, PipelineProgress,
│       │                       #   ResultCard, UploadZone, PreprocessingCard, Dashboard tabs
│       ├── context/            #   AuthContext (JWT + Axios interceptors)
│       ├── lib/                #   Axios instance with auth headers
│       ├── pages/              #   Home, Login, Register, Upload, Dashboard, Results
│       └── styles/             #   Tailwind + Glass-morphism theme
│
├── ml-pipeline/                # 🟡 Python FastAPI Server (Port 8000)
│   ├── preprocessing/          #   OpenCV: grayscale, denoise, adaptive threshold, resize
│   ├── ocr/                    #   EasyOCR engine (English)
│   ├── extraction/             #   Regex-based drug/dosage/frequency extraction
│   ├── normalization/          #   RapidFuzz fuzzy matching (40 drugs, 75% threshold)
│   ├── interaction/            #   Pairwise drug interaction checker (12 pairs)
│   ├── risk/                   #   Multi-signal risk scorer
│   ├── knowledge_base/         #   drug_names.yaml + drug_interactions.yaml
│   └── api_server.py           #   FastAPI entry point
│
├── yolo_cropper/               # 🟠 YOLOv8 Document Detector
│   ├── cropper.py              #   Ultralytics inference + auto-crop
│   ├── _node_bridge.py         #   Subprocess bridge for Node.js integration
│   └── weights/best.pt         #   Custom-trained model weights
│
├── shared/contracts/           # 📋 API Contract & JSON Schemas
│   ├── API_CONTRACT.md         #   Full endpoint documentation
│   ├── prescription-response.schema.json
│   ├── gemini-reasoning.schema.json
│   └── example-response.json
│
└── docs/                       # 📚 Setup & Contributing guides
```

### System Components

| Component | Technology | Port | Responsibility |
|-----------|-----------|:----:|----------------|
| **API Server** | Node.js, Express, Mongoose | `5000` | REST API, auth, pipeline orchestration, MongoDB persistence |
| **Web App** | Next.js 14, React 18, Tailwind CSS | `3000` | Interactive dashboard, upload, results visualization |
| **ML Pipeline** | Python, FastAPI, OpenCV, EasyOCR | `8000` | Image preprocessing, OCR, entity extraction, normalization, risk analysis |
| **YOLO Cropper** | Python, Ultralytics YOLOv8 | *subprocess* | Prescription document detection & cropping |
| **AI Reasoning** | Google Gemini (multi-model chain) | *API* | Explainable clinical reasoning & uncertainty quantification |
| **Database** | MongoDB (local or Atlas) | `27017` | User accounts, prescription records, analysis results |

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="20%"><strong>Backend</strong></td>
<td align="center" width="20%"><strong>Frontend</strong></td>
<td align="center" width="20%"><strong>ML / AI</strong></td>
<td align="center" width="20%"><strong>DevOps</strong></td>
<td align="center" width="20%"><strong>Design</strong></td>
</tr>
<tr>
<td>

Node.js 18+
Express 4.18
MongoDB
Mongoose 8.2
JWT Auth
Multer
bcryptjs

</td>
<td>

Next.js 14.1
React 18.2
Tailwind CSS 3.4
Framer Motion 11
Chart.js 4.4
Axios
react-dropzone
Lottie Animations

</td>
<td>

Python 3.10+
FastAPI
OpenCV 4.9+
EasyOCR 1.7+
YOLOv8 (Ultralytics)
RapidFuzz 3.6+
Google Gemini API
NumPy, Pillow

</td>
<td>

Concurrently
Nodemon
Uvicorn (ASGI)
dotenv
Git branching

</td>
<td>

Glass-Morphism UI
Ocean Gradient Theme
3D CSS Flip Cards
Lottie Animations
Responsive Sidebar
Floating Bubble BG
Reduced Motion A11y

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | ≥ 18 | Backend + Frontend |
| **MongoDB** | ≥ 6.0 | Database (local or Atlas) |
| **Python** | ≥ 3.10 | ML Pipeline + YOLO Cropper |
| **pip** | latest | Python dependencies |

### 1. Clone & Install

```bash
git clone https://github.com/aadesh2036/ArogyaScript.git
cd ArogyaScript

# Install all dependencies (root + backend + frontend)
npm install
npm run install:all
```

### 2. Set Up ML Pipeline

```bash
cd ml-pipeline
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cd ..
```

### 3. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/arogyascript
JWT_SECRET=your-super-secret-key
GEMINI_API_KEY=your-gemini-api-key        # Get from https://ai.google.dev/
ML_PIPELINE_URL=http://localhost:8000
```

### 4. Launch Everything

```bash
# Terminal 1 — ML Pipeline
cd ml-pipeline
uvicorn api_server:app --host 0.0.0.0 --port 8000

# Terminal 2 — Backend + Frontend
npm run dev    # Starts Express (5000) + Next.js (3000) concurrently
```

### 5. Open the App

Navigate to **http://localhost:3000** — register an account and upload your first prescription!

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Body | Description |
|:------:|----------|------|-------------|
| `POST` | `/api/auth/register` | `{ name, email, password }` | Create new account |
| `POST` | `/api/auth/login` | `{ email, password }` | Login → JWT token |
| `GET` | `/api/auth/me` | — | Get current user profile |
| `POST` | `/api/auth/change-password` | `{ currentPassword, newPassword }` | Update password |

### Prescriptions (🔒 Auth Required)

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/api/prescriptions/upload` | Upload prescription image → triggers async pipeline |
| `GET` | `/api/prescriptions` | List all user prescriptions (summary view) |
| `GET` | `/api/prescriptions/:id` | Full prescription analysis with all results |
| `GET` | `/api/prescriptions/:id/status` | Lightweight status polling for pipeline progress |

### Dashboard (🔒 Auth Required)

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `GET` | `/api/dashboard/stats` | Aggregated stats: totals, avg risk, distributions, top drugs |

### ML Pipeline (Internal — Port 8000)

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/ocr` | OCR only: image → preprocessed text + confidence |
| `POST` | `/analyze` | Full pipeline: image → entities + interactions + risk |
| `POST` | `/analyze-text` | Text-based analysis (skip OCR) |
| `GET` | `/health` | Health check |

> 📄 Full API specification: [shared/contracts/API_CONTRACT.md](shared/contracts/API_CONTRACT.md)

---

## 🔬 Pipeline Deep Dive

### Stage-by-Stage Breakdown

| # | Stage | Module | Key Logic |
|:-:|-------|--------|-----------|
| 0 | **YOLO Crop** | `yolo_cropper/` | YOLOv8 custom model detects prescription boundaries → crops to ROI. Fallback: original image |
| 1 | **OCR** | `ml-pipeline/ocr/` | EasyOCR (English) runs on **both** original + cropped images. Results merged with substring deduplication, higher confidence wins |
| 2 | **Entity Extraction** | `ml-pipeline/extraction/` | Line-by-line regex scan for dosage patterns (`mg`, `mcg`, `ml`, `tablets`), frequency codes (`OD`, `BD`, `TDS`), duration (`X days/weeks`) |
| 3 | **Normalization** | `ml-pipeline/normalization/` | RapidFuzz `WRatio` scorer fuzzy-matches extracted names to 40-drug YAML knowledge base (≥75% threshold) |
| 4 | **Interaction Check** | `ml-pipeline/interaction/` | Pairwise combination scan against 12 curated drug-drug interaction rules with severity + recommendations |
| 5 | **Risk Scoring** | `ml-pipeline/risk/` | Composite 0–100 score: interaction severity (×0.35 weight), polypharmacy (≥5 drugs: +15–20), missing info (+5/drug, cap 20), extreme dosage (+15 each), low OCR confidence (+5 each) |
| 6 | **Intervention Engine** | `backend/services/` | Generates prioritized clinical suggestions: `urgent` → `high` → `medium` → `low` |
| 7 | **Gemini Reasoning** | `backend/services/` | Explainable AI: pharmacological mechanisms, evidence basis, uncertainty flags, entity reconciliation |

### Fault Tolerance Design

```
Every module wrapped in try/catch
│
├── YOLO failure?    → Use original image (non-critical)
├── OCR failure?     → Pipeline stops (critical)
├── ML unreachable?  → Rule-based anomaly fallback
├── Gemini quota?    → Try next model in 4-model chain
├── Gemini down?     → Rule-based explanation fallback
└── Any module fail? → Error logged, status tracked, pipeline continues
```

---

## 🎨 UI Highlights

<table>
<tr>
<td align="center"><strong>3D Drug Flip Cards</strong></td>
<td align="center"><strong>Pipeline Progress</strong></td>
</tr>
<tr>
<td>

Interactive cards per medication — **flip to reveal**:
- Front: Drug name, dosage, risk badge, Lottie animation
- Back: Gemini interaction explanations, anomaly details, suggested actions
- Keyboard accessible (Enter/Space/Esc)
- Crossfade fallback for reduced-motion preference

</td>
<td>

6-step animated progress tracker:
- Per-stage status icons (spinner, check, error)
- Duration display per step
- Animated progress bar
- Real-time updates via 1.5s polling

</td>
</tr>
<tr>
<td align="center"><strong>Preprocessing Comparison</strong></td>
<td align="center"><strong>Analytics Dashboard</strong></td>
</tr>
<tr>
<td>

Side-by-side or **slider-compare** view:
- Original image vs. YOLO-cropped result
- Skeleton loading states
- Visual proof of intelligent cropping

</td>
<td>

6-tab interactive dashboard:
- Weekly upload trends (line chart)
- Risk level distribution (doughnut)
- Top 10 most prescribed drugs (bar chart)
- Monthly average risk scores

</td>
</tr>
</table>

### Design System

- **Glass-Morphism** — `backdrop-filter: blur(12px)` + saturated overlays on every card
- **Ocean Gradient Theme** — Navy sidebar, light ocean-blue backgrounds, custom CSS variables
- **Floating Bubbles** — Animated background particles via CSS keyframes
- **Lottie Animations** — `alert.json` (danger), `safe.json` (all clear), `scan.json` (processing)
- **Responsive** — Mobile hamburger menu + overlay sidebar, adaptive grids
- **Accessibility** — `prefers-reduced-motion` support, keyboard navigation, ARIA attributes

---

## 🗄️ Data Models

### Prescription Schema (MongoDB)

```javascript
{
  prescriptionId: "rx_a1b2c3d4",        // Unique ID (rx_ + uuid8)
  userId: ObjectId,                       // Reference → User
  imagePath: String,                      // Uploaded file path
  croppedImagePath: String,               // YOLO-cropped result
  cropStatus: "success|fallback_original|pending",

  ocrText: String,                        // Extracted text
  ocrConfidence: Number,                  // Average OCR confidence

  extractedEntities: [{
    drugName: "Amoxicillin",
    dosage: "500mg",
    frequency: "TDS",
    duration: "5 days",
    confidence: 0.85
  }],

  interactions: [{
    drug1: "Ibuprofen",
    drug2: "Warfarin",
    severity: "critical",                 // low | moderate | high | critical
    description: "Increased bleeding risk",
    recommendation: "Avoid concurrent use"
  }],

  riskScore: {
    overall: 72,                          // 0–100
    level: "high",                        // safe | low | moderate | high | critical
    signals: [{ signal, weight, detail }]
  },

  geminiReasoning: {
    explainability_summary: String,       // 2-4 sentence risk overview
    interaction_explanations: [...],      // Pharmacological mechanisms
    anomaly_explanations: [...],          // Clinical meaning per anomaly
    interventions: [...],                 // Evidence-referenced actions
    uncertainty_flags: [...],             // Field-level uncertainty
    gemini_status: "success|fallback|skipped"
  },

  pipelineStatus: {
    preprocessing: { status, durationMs },
    ocr: { status, durationMs },
    structuring: { status, durationMs },
    anomaly: { status, durationMs },
    intervention: { status, durationMs },
    gemini: { status, durationMs },
    overall: "processing|completed|failed"
  }
}
```

---

## 💡 Explainable AI — Gemini Integration

ArogyaScript goes beyond black-box predictions. The Gemini reasoning layer generates **human-readable, evidence-referenced clinical explanations**:

| Output | Description |
|--------|-------------|
| **Explainability Summary** | 2–4 sentence plain-English risk overview |
| **Interaction Explanations** | Pharmacological mechanism + clinical significance + evidence basis per drug pair |
| **Anomaly Explanations** | Clinical meaning + suggested cause + uncertainty flag per anomaly |
| **Clinical Interventions** | Prioritized actions (`urgent`/`high`/`medium`/`low`) with evidence references |
| **Uncertainty Flags** | Explicit field-level uncertainty with reason and clinical impact |
| **OCR Uncertainty** | Low-confidence tokens flagged with clinical concern descriptions |
| **Entity Reconciliation** | Missing fields, ambiguous entities, completeness assessment |

### Model Resilience

```
Primary:   gemini-2.5-flash-lite     ──► Quota hit?
Fallback1: gemini-2.5-flash          ──► Quota hit?
Fallback2: gemini-2.0-flash          ──► Quota hit?
Fallback3: gemini-2.0-flash-lite     ──► All exhausted?
                                          └► Rule-based KB fallback (always works)
```

---

## 📁 Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | API server port |
| `MONGO_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRE` | `7d` | Token expiry duration |
| `ML_PIPELINE_URL` | `http://localhost:8000` | FastAPI ML service URL |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Primary Gemini model |
| `GEMINI_MAX_RETRIES` | `2` | Max retry attempts |
| `GEMINI_TIMEOUT_MS` | `15000` | Gemini request timeout |
| `OCR_CONFIDENCE_THRESHOLD` | `0.75` | Minimum OCR confidence |
| `INTERACTION_WEIGHT` | `0.35` | Risk score interaction weight |
| `CROPPER_TIMEOUT_MS` | `30000` | YOLO cropper timeout |
| `LOG_LEVEL` | `debug` | Logging verbosity |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL |

---

## 🧪 Example Workflow

```bash
# 1. Register
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Smith","email":"smith@clinic.com","password":"secure123"}' \
  | jq .token

# 2. Upload a prescription
curl -s -X POST http://localhost:5000/api/prescriptions/upload \
  -H "Authorization: Bearer <token>" \
  -F "image=@prescription.jpg" \
  | jq .prescriptionId

# 3. Poll for results
curl -s http://localhost:5000/api/prescriptions/<id>/status \
  -H "Authorization: Bearer <token>" \
  | jq '.pipelineStatus.overall'

# 4. Get full analysis
curl -s http://localhost:5000/api/prescriptions/<id> \
  -H "Authorization: Bearer <token>" \
  | jq '{risk: .riskScore, drugs: [.extractedEntities[].drugName], interactions: .interactions}'
```

---

## 🌿 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready, protected |
| `dev` | Integration testing |
| `explainableAI` | Gemini explainability feature branch |
| `feature/backend` | Backend API development |
| `feature/frontend` | UI/UX development |
| `feature/ml-pipeline` | ML pipeline development |

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](docs/CONTRIBUTING.md) before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request to `dev`

> 📄 Setup instructions: [docs/SETUP.md](docs/SETUP.md)
> 📋 API Contract: [shared/contracts/API_CONTRACT.md](shared/contracts/API_CONTRACT.md)

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for safer prescriptions**

*ArogyaScript — Because every prescription deserves a second opinion.*

</div>
