# Setup Guide

## Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Create `.env`
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/arogyascript
JWT_SECRET=your_secret_here
JWT_EXPIRE=7d
```

### 3. Start MongoDB
Make sure MongoDB is running locally on port 27017, or use a MongoDB Atlas connection string.

### 4. Start server
```bash
npm run dev
```

Server runs at `http://localhost:5000`

---

## Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Create `.env.local`
```bash
cp .env.local.example .env.local
```

### 3. Start dev server
```bash
npm run dev
```

App runs at `http://localhost:3000`

---

## ML Pipeline Setup (Optional — Round 2)

### 1. Create virtual environment
```bash
cd ml-pipeline
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run pipeline
```bash
python run_pipeline.py --image path/to/prescription.jpg
```

Output is structured JSON printed to stdout.
