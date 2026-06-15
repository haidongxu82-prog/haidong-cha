def normalize(series):
    min_value = series.min()
    max_value = series.max()
    if max_value == min_value:
        return series * 0 + 0.5
    return (series - min_value) / (max_value - min_value)


def supply_chain_score(row):
    score = 0
    fabric = row.get("fabric", "unknown")
    elements = str(row.get("design_elements", ""))
    if fabric in {"cotton", "polyester", "knit", "chiffon"}:
        score += 1
    if fabric in {"silk", "leather"}:
        score -= 1
    if "embroidery" in elements or "cutout" in elements:
        score -= 1
    if "solid color" in elements or "print" in elements:
        score += 1
    return max(0, min(1, (score + 2) / 4))


def trend_stage(row):
    growth = row.get("growth_rate_raw", 0)
    if growth > 0.5:
        return "rising"
    if growth < -0.1:
        return "decline"
    return "peak"


def score_products(df, config):
    scored = df.copy()
    scored["growth_rate_raw"] = (
        (scored["current_sales"] - scored["past_sales"]) / scored["past_sales"].replace(0, 1)
    )
    scored["engagement_raw"] = scored["likes"] + scored["comments"] + scored["favorites"]
    scored["conversion_raw"] = scored["current_sales"] / scored["exposure_estimation"].replace(0, 1)
    scored["supply_chain_raw"] = scored.apply(supply_chain_score, axis=1)

    scored["growth_rate_score"] = normalize(scored["growth_rate_raw"]).fillna(0)
    scored["engagement_score"] = normalize(scored["engagement_raw"]).fillna(0)
    scored["conversion_score"] = normalize(scored["conversion_raw"]).fillna(0)
    scored["supply_chain_score"] = scored["supply_chain_raw"]

    weights = config["score_weights"]
    scored["hot_score"] = (
        scored["growth_rate_score"] * weights["growth_rate"]
        + scored["engagement_score"] * weights["engagement"]
        + scored["conversion_score"] * weights["conversion"]
        + scored["supply_chain_score"] * weights["supply_chain"]
    ) * 100
    scored["hot_score"] = scored["hot_score"].round(2)

    def level(value):
        if value >= config["level_thresholds"]["A"]:
            return "A"
        if value >= config["level_thresholds"]["B"]:
            return "B"
        return "C"

    scored["level"] = scored["hot_score"].apply(level)
    scored["trend_stage"] = scored.apply(trend_stage, axis=1)
    return scored.sort_values("hot_score", ascending=False)
