"""
Risk Scorer — computes a multi-signal prescription risk score.
"""

SEVERITY_WEIGHTS = {
    "critical": 40,
    "high": 30,
    "moderate": 20,
    "low": 10,
}


def compute_risk_score(entities: list[dict], interactions: list[dict]) -> dict:
    """
    Compute overall risk score (0-100) from multiple signals.
    """
    signals = []
    overall = 0

    # Signal 1: Drug interactions
    if interactions:
        weight = sum(SEVERITY_WEIGHTS.get(i["severity"], 10) for i in interactions)
        signals.append({
            "signal": "drug_interaction",
            "weight": weight,
            "detail": f"{len(interactions)} interaction(s) detected",
        })
        overall += weight

    # Signal 2: Polypharmacy (>= 3 drugs)
    drug_count = len(entities)
    if drug_count >= 5:
        signals.append({"signal": "polypharmacy", "weight": 20, "detail": f"{drug_count} drugs prescribed"})
        overall += 20
    elif drug_count >= 3:
        signals.append({"signal": "polypharmacy", "weight": 10, "detail": f"{drug_count} drugs prescribed"})
        overall += 10

    # Signal 3: Low OCR confidence
    low_conf = [e for e in entities if e.get("confidence", 1) < 0.7]
    if low_conf:
        w = len(low_conf) * 5
        signals.append({
            "signal": "low_ocr_confidence",
            "weight": w,
            "detail": f"{len(low_conf)} entity(ies) with confidence < 70%",
        })
        overall += w

    # Signal 4: Missing fields
    missing = [e for e in entities if not e.get("frequency") or not e.get("duration")]
    if missing:
        w = len(missing) * 3
        signals.append({
            "signal": "incomplete_prescription",
            "weight": w,
            "detail": f"{len(missing)} entity(ies) missing frequency or duration",
        })
        overall += w

    overall = min(overall, 100)
    level = (
        "safe" if overall <= 10
        else "low" if overall <= 25
        else "moderate" if overall <= 50
        else "high" if overall <= 75
        else "critical"
    )

    return {"overall": overall, "level": level, "signals": signals}
