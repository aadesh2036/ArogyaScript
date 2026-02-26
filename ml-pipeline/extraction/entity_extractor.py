"""
Entity Extraction — Rule-based extraction of drug, dosage, frequency, duration
from OCR text lines.
"""

import re


# Patterns
DOSAGE_PATTERN = re.compile(r"(\d+\.?\d*)\s*(mg|ml|mcg|g|iu|units?)", re.IGNORECASE)
FREQUENCY_PATTERN = re.compile(
    r"\b(od|bd|tds|qds|qid|tid|bid|sos|prn|once\s*daily|twice\s*daily|"
    r"three\s*times?\s*daily|four\s*times?\s*daily|every\s*\d+\s*h(?:ou)?rs?|"
    r"at\s*(?:night|bedtime|morning))\b",
    re.IGNORECASE,
)
DURATION_PATTERN = re.compile(
    r"(\d+)\s*(days?|weeks?|months?|d|w|m)\b", re.IGNORECASE
)


def extract_entities(ocr_lines: list[dict]) -> list[dict]:
    """
    Extract structured medication entities from OCR lines.
    Returns list of { drugName, rawText, dosage, frequency, duration, confidence }
    """
    entities = []

    for line_info in ocr_lines:
        text = line_info["text"]
        confidence = line_info.get("confidence", 0.0)

        # Try to find dosage — indicates a medication line
        dosage_match = DOSAGE_PATTERN.search(text)
        if not dosage_match:
            continue

        dosage = dosage_match.group(0)

        # Drug name: text before the dosage
        drug_name = text[: dosage_match.start()].strip().rstrip("-–—")
        drug_name = re.sub(r"^\d+[\.\)]\s*", "", drug_name).strip()  # remove numbering

        if len(drug_name) < 2:
            continue

        # Frequency
        freq_match = FREQUENCY_PATTERN.search(text)
        frequency = freq_match.group(0) if freq_match else ""

        # Duration
        dur_match = DURATION_PATTERN.search(text)
        duration = dur_match.group(0) if dur_match else ""

        entities.append({
            "drugName": drug_name,
            "rawText": text,
            "dosage": dosage,
            "frequency": frequency,
            "duration": duration,
            "confidence": confidence,
        })

    return entities
