"""
Drug-Drug Interaction Checker — looks up extracted drug pairs
against the curated interaction knowledge base.
"""

import yaml
import os
from itertools import combinations


_INTERACTIONS_DB = None


def _load_interactions() -> list[dict]:
    global _INTERACTIONS_DB
    if _INTERACTIONS_DB is None:
        db_path = os.path.join(os.path.dirname(__file__), "..", "knowledge_base", "drug_interactions.yaml")
        with open(db_path, "r") as f:
            data = yaml.safe_load(f)
        _INTERACTIONS_DB = data.get("interactions", [])
    return _INTERACTIONS_DB


def check_interactions(entities: list[dict]) -> list[dict]:
    """
    Check all drug pairs for known interactions.
    Returns list of interaction records.
    """
    db = _load_interactions()
    drug_names = [e["drugName"].lower() for e in entities]
    found = []

    for i, j in combinations(range(len(drug_names)), 2):
        d1, d2 = drug_names[i], drug_names[j]
        for record in db:
            r1, r2 = record["drug1"].lower(), record["drug2"].lower()
            if (d1 == r1 and d2 == r2) or (d1 == r2 and d2 == r1):
                found.append({
                    "drug1": entities[i]["drugName"],
                    "drug2": entities[j]["drugName"],
                    "severity": record["severity"],
                    "description": record["description"],
                    "recommendation": record["recommendation"],
                })

    return found
