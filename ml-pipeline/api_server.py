"""
ArogyaScript ML Pipeline — FastAPI Server
==========================================
Exposes the full pipeline and individual steps as REST endpoints.

Start:  uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import sys
import time
import uuid
import shutil
import traceback
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

# ── Ensure project root is importable ──
sys.path.insert(0, os.path.dirname(__file__))

from preprocessing.image_preprocessor import preprocess_image
from ocr.ocr_engine import extract_text
from extraction.entity_extractor import extract_entities
from normalization.drug_normalizer import normalize_entities
from interaction.interaction_checker import check_interactions
from risk.risk_scorer import compute_risk_score

import cv2
import numpy as np
from fastapi.responses import JSONResponse

# ──────────────────────────────────────────────
# NumPy serialization helper
# ──────────────────────────────────────────────
def _sanitize(obj):
    """Recursively convert numpy scalars/arrays to native Python types."""
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize(i) for i in obj]
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(title="ArogyaScript ML Pipeline", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).parent / "temp_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    entities: list[dict] = []
    ocrText: str = ""


class HealthResponse(BaseModel):
    status: str
    version: str


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
def _save_upload(file: UploadFile) -> str:
    """Save uploaded file to temp dir and return path."""
    ext = Path(file.filename or "image.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return str(filepath)


def _save_processed_image(image: np.ndarray, original_path: str) -> str:
    """Save processed (preprocessed) image and return path."""
    stem = Path(original_path).stem
    processed_path = UPLOAD_DIR / f"{stem}_processed.png"
    cv2.imwrite(str(processed_path), image)
    return str(processed_path)


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/ocr")
async def ocr_endpoint(image: UploadFile = File(...)):
    """
    OCR-only endpoint.
    Receives an image, preprocesses it, runs PaddleOCR, returns text + confidence.
    """
    filepath = _save_upload(image)
    try:
        start = time.time()

        # Preprocess
        processed = preprocess_image(filepath)
        processed_path = _save_processed_image(processed, filepath)

        # OCR
        ocr_lines = extract_text(processed)
        full_text = "\n".join(line["text"] for line in ocr_lines)
        avg_confidence = (
            sum(l["confidence"] for l in ocr_lines) / len(ocr_lines)
            if ocr_lines else 0.0
        )

        elapsed = int((time.time() - start) * 1000)

        return JSONResponse(_sanitize({
            "status": "success",
            "text": full_text,
            "lines": ocr_lines,
            "confidence": round(avg_confidence, 3),
            "engine": "EasyOCR",
            "processedImagePath": processed_path,
            "durationMs": elapsed,
        }))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup original (processed stays for serving)
        if os.path.exists(filepath):
            os.remove(filepath)


@app.post("/analyze")
async def analyze_endpoint(image: UploadFile = File(...)):
    """
    Full pipeline endpoint.
    Receives image → preprocess → OCR → extraction → normalization → interactions → risk.
    Returns complete structured result.
    """
    filepath = _save_upload(image)
    try:
        start = time.time()

        # Step 1: Preprocess
        processed = preprocess_image(filepath)
        processed_path = _save_processed_image(processed, filepath)

        # Step 2: OCR
        ocr_lines = extract_text(processed)
        full_text = "\n".join(line["text"] for line in ocr_lines)
        avg_confidence = (
            sum(l["confidence"] for l in ocr_lines) / len(ocr_lines)
            if ocr_lines else 0.0
        )

        # Step 3: Entity extraction
        raw_entities = extract_entities(ocr_lines)

        # Step 4: Normalize drug names
        entities = normalize_entities(raw_entities)

        # Step 5: Interaction check
        interactions = check_interactions(entities)

        # Step 6: Risk scoring
        risk_score = compute_risk_score(entities, interactions)

        elapsed = int((time.time() - start) * 1000)

        return JSONResponse(_sanitize({
            "status": "success",
            "ocrText": full_text,
            "ocrConfidence": round(avg_confidence, 3),
            "ocrLines": ocr_lines,
            "extractedEntities": entities,
            "interactions": interactions,
            "riskScore": risk_score,
            "processedImagePath": processed_path,
            "metadata": {
                "ocrEngine": "EasyOCR",
                "processingTimeMs": elapsed,
                "imageQuality": "good",
                "pipelineVersion": "1.0.0",
            },
        }))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.post("/analyze-text")
async def analyze_text_endpoint(request: AnalyzeRequest):
    """
    Text-based analysis (no OCR needed).
    Accepts pre-extracted entities + OCR text, runs normalization, interaction check & risk scoring.
    """
    try:
        start = time.time()

        entities = request.entities
        if entities:
            entities = normalize_entities(entities)

        interactions = check_interactions(entities)
        risk_score = compute_risk_score(entities, interactions)

        elapsed = int((time.time() - start) * 1000)

        return JSONResponse(_sanitize({
            "status": "success",
            "extractedEntities": entities,
            "interactions": interactions,
            "riskScore": risk_score,
            "metadata": {"processingTimeMs": elapsed},
        }))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/processed-image/{filename}")
async def get_processed_image(filename: str):
    """Serve a processed image file."""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(str(filepath), media_type="image/png")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
