from __future__ import annotations


def route_category(category: str) -> str:
    normalized = category.strip().lower()
    if normalized in ["shirt", "tshirt", "top", "blouse"]:
        return "upper_body_model"
    if normalized in ["dress"]:
        return "full_body_model"
    if normalized in ["pants", "skirt"]:
        return "lower_body_model"
    return "full_body_model"


def default_pose_for_route(route: str) -> str:
    return {
        "upper_body_model": "front_stand",
        "full_body_model": "front_stand",
        "lower_body_model": "front_stand",
    }.get(route, "front_stand")
