"""
Image Preprocessing Module
- Load image
- Resize / normalize
- Grayscale conversion
- Adaptive thresholding
- Noise removal
- Deskew (optional)
"""

import cv2
import numpy as np


def preprocess_image(image_path: str) -> np.ndarray:
    """Load and preprocess a prescription image for OCR."""
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Resize if too large (max 2000px width)
    h, w = gray.shape
    if w > 2000:
        scale = 2000 / w
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # Adaptive threshold
    binary = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 11
    )

    return binary
