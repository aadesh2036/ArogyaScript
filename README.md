# ArogyaScript

> AI-powered Medical Prescription Intelligence System

---

## What It Does

- Accepts prescription image upload
- Performs image preprocessing and OCR
- Extracts medical entities (drug, dosage, frequency, duration)
- Normalizes drug names via fuzzy matching
- Detects drug-drug interactions using a curated knowledge base
- Computes a multi-signal prescription risk score
- Generates explainable structured JSON output
- Displays results and analytics in a frontend dashboard

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Backend** | Node.js, Express, MongoDB, Mongoose, JWT, Multer |
| **Frontend** | Next.js (React), Tailwind CSS, Axios, Chart.js |
| **ML Pipeline** | Python, OpenCV, PaddleOCR, YOLOv8, RapidFuzz |

---

## Repo Structure

```
ArogyaScript/
├── backend/                # Express API server
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, upload, error
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── utils/           # Mock pipeline, helpers
│   │   └── server.js        # Entry point
│   └── uploads/             # Stored prescription images
├── frontend/               # Next.js app
│   └── src/
│       ├── components/      # UI components
│       ├── context/         # Auth context
│       ├── lib/             # Axios instance
│       ├── pages/           # Next.js pages
│       └── styles/          # Tailwind globals
├── ml-pipeline/            # Python ML workspace
│   ├── preprocessing/       # Image preprocessing
│   ├── ocr/                 # PaddleOCR engine
│   ├── extraction/          # Entity extraction
│   ├── normalization/       # Drug name normalization
│   ├── interaction/         # Drug interaction checker
│   ├── risk/                # Risk scoring
│   ├── knowledge_base/      # Drug names + interactions YAML
│   └── run_pipeline.py      # Main entry point
├── shared/                 # Shared contracts
│   └── contracts/           # API schema + examples
├── docs/                   # Documentation
└── package.json            # Root workspace scripts
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- MongoDB running locally (or MongoDB Atlas URI)
- Python >= 3.10 (for ML pipeline, optional in Round-1)

### 1. Clone & Install

```bash
git clone <repo-url> ArogyaScript
cd ArogyaScript
npm install           # root deps (concurrently)
npm run install:all   # backend + frontend
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Edit `backend/.env` with your MongoDB URI and JWT secret.

### 3. Run Development Servers

```bash
npm run dev   # starts backend (port 5000) + frontend (port 3000)
```

Or individually:

```bash
npm run backend:dev
npm run frontend:dev
```

### 4. Test the API

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123"}'

# Upload (use returned token)
curl -X POST http://localhost:5000/api/prescriptions/upload \
  -H "Authorization: Bearer <token>" \
  -F "image=@sample.jpg"
```

---

## Branch Strategy

| Branch | Owner | Purpose |
|--------|-------|---------|
| `main` | — | Production-ready, protected |
| `dev` | — | Integration branch |
| `feature/backend` | Backend Engineer | API, auth, schemas |
| `feature/frontend` | Frontend Engineer | UI pages, components |
| `feature/ml-pipeline` | AI/ML Engineer | Python pipeline scripts |

### Workflow

1. Each contributor works on their `feature/*` branch
2. PRs go to `dev` — never directly to `main`
3. After Round-1 integration testing on `dev`, merge to `main`

---

## Team Roles

| Role | Scope | Works In |
|------|-------|----------|
| **Backend Engineer** | Auth, API, MongoDB schemas, mock pipeline | `backend/` |
| **Frontend Engineer** | UI pages, components, API integration | `frontend/` |
| **AI/ML Engineer** | Preprocessing, OCR, extraction, risk scoring | `ml-pipeline/` |

---

## API Contract

See [shared/contracts/API_CONTRACT.md](shared/contracts/API_CONTRACT.md) for full endpoint specs.

Example response schema: [shared/contracts/prescription-response.schema.json](shared/contracts/prescription-response.schema.json)

---

## Round-1 (Prototype)

- Backend returns **mock analysis** data (no real ML)
- Frontend connects to backend mock endpoints
- ML engineer develops pipeline independently, outputs JSON to stdout
- Integration happens in Round-2 via HTTP bridge or child process

---

## License

MIT
