import pandas as pd


STANDARD_FIELDS = [
    "product_id",
    "title",
    "price",
    "current_sales",
    "past_sales",
    "likes",
    "favorites",
    "comments",
    "exposure_estimation",
    "platform",
    "shop_name",
    "category",
    "url",
    "crawl_time",
    "image_urls",
    "description",
]


def standardize_products(df):
    normalized = df.copy()
    for field in STANDARD_FIELDS:
        if field not in normalized.columns:
            normalized[field] = ""

    numeric_fields = [
        "price",
        "current_sales",
        "past_sales",
        "likes",
        "favorites",
        "comments",
        "exposure_estimation",
    ]
    for field in numeric_fields:
        normalized[field] = pd.to_numeric(normalized[field], errors="coerce").fillna(0)

    normalized["title"] = normalized["title"].fillna("")
    normalized["description"] = normalized["description"].fillna("")
    normalized["platform"] = normalized["platform"].fillna("unknown")
    normalized["category"] = normalized["category"].fillna("unknown")
    normalized["image_urls"] = normalized["image_urls"].fillna("")
    return normalized[STANDARD_FIELDS]
