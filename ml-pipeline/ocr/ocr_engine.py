"""
OCR Engine — uses EasyOCR to extract text lines from preprocessed image.
"""

import easyocr
import numpy as np


_ocr = None


def _get_ocr():
    global _ocr
    if _ocr is None:
        _ocr = easyocr.Reader(['en'])
    return _ocr


def extract_text(image: np.ndarray) -> list[dict]:
    """
    Run OCR on preprocessed image.
    Returns list of { "text": str, "confidence": float, "bbox": list }
    """
    ocr = _get_ocr()
    results = ocr.readtext(image)

    lines = []
    for result in results:
        bbox, text, conf = result
        # Convert numpy types to plain Python for JSON serialization
        clean_bbox = [[float(pt[0]), float(pt[1])] for pt in bbox]
        lines.append({
            "text": text.strip(),
            "confidence": round(float(conf), 3),
            "bbox": clean_bbox,
        })

    # Sort by vertical position (top to bottom)
    lines.sort(key=lambda l: l["bbox"][0][1])
    return lines
