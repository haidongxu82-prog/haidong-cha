from __future__ import annotations


MODEL_PROFILES = {
    "female_model_01": {
        "label": "亚洲标准",
        "identity_lock": "female_model_01",
        "face_policy": "fixed_reference_only",
    },
    "female_model_02": {
        "label": "欧美风",
        "identity_lock": "female_model_02",
        "face_policy": "fixed_reference_only",
    },
    "male_model_01": {
        "label": "男性标准",
        "identity_lock": "male_model_01",
        "face_policy": "fixed_reference_only",
    },
}


SCENES = {
    "studio_white": {
        "description": "clean white studio background",
        "background_policy": "template_only",
    },
    "minimal_home": {
        "description": "minimal home interior",
        "background_policy": "template_only",
    },
    "street_clean": {
        "description": "clean modern street",
        "background_policy": "template_only",
    },
    "luxury_indoor": {
        "description": "luxury indoor commercial scene",
        "background_policy": "template_only",
    },
}


POSES = {
    "front_stand": "front standing",
    "side_view": "side view",
    "walking": "walking pose",
    "close_up_upper_body": "close-up upper body",
}


TEMPLATES = {
    "female_model_01_studio_white_front": {
        "model_profile": "female_model_01",
        "pose": "front_stand",
        "scene": "studio_white",
        "lighting": "softbox",
        "camera": "50mm",
        "supported_routes": ["upper_body_model", "full_body_model"],
    },
    "female_model_01_minimal_home_front": {
        "model_profile": "female_model_01",
        "pose": "front_stand",
        "scene": "minimal_home",
        "lighting": "soft window light",
        "camera": "50mm",
        "supported_routes": ["upper_body_model", "full_body_model"],
    },
    "female_model_01_studio_white_lower": {
        "model_profile": "female_model_01",
        "pose": "front_stand",
        "scene": "studio_white",
        "lighting": "softbox",
        "camera": "50mm",
        "supported_routes": ["lower_body_model"],
    },
}


def get_template(template_id: str) -> dict:
    if template_id not in TEMPLATES:
        raise ValueError(f"unknown template_id: {template_id}")
    template = dict(TEMPLATES[template_id])
    template["template_id"] = template_id
    template["model_profile_detail"] = MODEL_PROFILES[template["model_profile"]]
    template["scene_detail"] = SCENES[template["scene"]]
    template["pose_detail"] = POSES[template["pose"]]
    return template


def select_template(route: str, preferred_template_id: str | None = None) -> dict:
    if preferred_template_id:
        template = get_template(preferred_template_id)
        if route not in template["supported_routes"]:
            raise ValueError(f"template {preferred_template_id} does not support route {route}")
        return template

    for template_id, template in TEMPLATES.items():
        if route in template["supported_routes"]:
            return get_template(template_id)
    raise ValueError(f"no template supports route: {route}")
