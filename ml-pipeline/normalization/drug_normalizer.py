"""
Drug Name Normalization — fuzzy matches OCR-extracted drug names
against a curated knowledge base of known drug names.
"""

import yaml
import os
from rapidfuzz import process, fuzz


_DRUG_DB = None


def _load_drug_db() -> list[str]:
    global _DRUG_DB
    if _DRUG_DB is None:
        db_path = os.path.join(os.path.dirname(__file__), "..", "knowledge_base", "drug_names.yaml")
        with open(db_path, "r") as f:
            data = yaml.safe_load(f)
        _DRUG_DB = data.get("drugs", [])
    return _DRUG_DB


def normalize_drug_name(raw_name: str, threshold: int = 75) -> str:
    """
    Fuzzy-match raw drug name against known names.
    Returns best match if score >= threshold, else returns original.
    """
    db = _load_drug_db()
    if not db:
        return raw_name

    result = process.extractOne(raw_name, db, scorer=fuzz.WRatio)
    if result and result[1] >= threshold:
        return result[0]
    return raw_name


def normalize_entities(entities: list[dict]) -> list[dict]:
    """Normalize all drug names in entity list."""
    for entity in entities:
        original = entity["drugName"]
        entity["drugName"] = normalize_drug_name(original)
    return entities
