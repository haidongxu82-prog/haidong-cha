import re

from modules.llm_service import classify_with_llm


def parse_attributes(attributes):
    result = {}
    if not isinstance(attributes, str) or not attributes.strip():
        return result

    for part in re.split(r"[;；,，]", attributes):
        if "=" in part:
            key, value = part.split("=", 1)
            result[key.strip()] = value.strip()
    return result


def price_segment(price, config):
    price = float(price or 0)
    rule = config["price_segment"]
    if price < rule["low"]:
        return "low"
    if price < rule["mid"]:
        return "mid"
    if price < rule["mid_high"]:
        return "mid_high"
    return "high"


def classify_row(row, config):
    attrs = parse_attributes(row.get("attributes", ""))
    text = f"{row.get('title', '')} {row.get('attributes', '')}"
    llm_result = classify_with_llm(text, model=config.get("llm_model", "gpt-4o-mini"))

    return {
        "style": attrs.get("风格") or llm_result["style"],
        "scene": attrs.get("场景") or llm_result["scene"],
        "material": attrs.get("材质") or llm_result["material"],
        "price_segment": price_segment(row.get("price", 0), config),
        "keywords": llm_result.get("keywords", []),
        "classification_source": llm_result.get("source", "unknown"),
    }


def classify_market_data(df, config):
    classified = df.copy()
    results = [classify_row(row, config) for row in classified.to_dict("records")]
    for field in ["style", "scene", "material", "price_segment", "classification_source"]:
        classified[field] = [item[field] for item in results]
    classified["keywords"] = [",".join(item["keywords"]) for item in results]
    return classified
