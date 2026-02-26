"""
ArogyaScript ML Pipeline — Main Entry Point
=============================================
Usage:
    python run_pipeline.py --image <path_to_prescription_image>

Outputs structured JSON to stdout (consumed by backend in Round-2).
"""

import argparse
import json
import sys
import time

from preprocessing.image_preprocessor import preprocess_image
from ocr.ocr_engine import extract_text
from extraction.entity_extractor import extract_entities
from normalization.drug_normalizer import normalize_entities
from interaction.interaction_checker import check_interactions
from risk.risk_scorer import compute_risk_score


def run_pipeline(image_path: str) -> dict:
    start = time.time()

    # Step 1: Preprocess
    processed_image = preprocess_image(image_path)

    # Step 2: OCR
    raw_lines = extract_text(processed_image)

    # Step 3: Entity extraction
    raw_entities = extract_entities(raw_lines)

    # Step 4: Drug name normalization
    entities = normalize_entities(raw_entities)

    # Step 5: Interaction detection
    interactions = check_interactions(entities)

    # Step 6: Risk scoring
    risk_score = compute_risk_score(entities, interactions)

    elapsed = int((time.time() - start) * 1000)

    return {
        "extractedEntities": entities,
        "interactions": interactions,
        "riskScore": risk_score,
        "metadata": {
            "ocrEngine": "PaddleOCR",
            "processingTimeMs": elapsed,
            "imageQuality": "good",
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ArogyaScript ML Pipeline")
    parser.add_argument("--image", required=True, help="Path to prescription image")
    args = parser.parse_args()

    try:
        result = run_pipeline(args.image)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
