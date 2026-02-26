"""
OCR Engine — uses PaddleOCR to extract text lines from preprocessed image.
"""

from paddleocr import PaddleOCR
import numpy as np


_ocr = None


def _get_ocr():
    global _ocr
    if _ocr is None:
        _ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
    return _ocr


def extract_text(image: np.ndarray) -> list[dict]:
    """
    Run OCR on preprocessed image.
    Returns list of { "text": str, "confidence": float, "bbox": list }
    """
    ocr = _get_ocr()
    results = ocr.ocr(image, cls=True)

    lines = []
    if results and results[0]:
        for line in results[0]:
            bbox, (text, conf) = line
            lines.append({
                "text": text.strip(),
                "confidence": round(conf, 3),
                "bbox": bbox,
            })

    # Sort by vertical position (top to bottom)
    lines.sort(key=lambda l: l["bbox"][0][1])
    return lines
