from __future__ import annotations


def classify_competitor(growth_score: float) -> str:
    if growth_score >= 85:
        return "S"
    if growth_score >= 70:
        return "A"
    if growth_score >= 50:
        return "B"
    return "C"
