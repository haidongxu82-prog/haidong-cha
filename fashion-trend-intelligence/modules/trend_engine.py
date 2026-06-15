from collections import Counter


def split_elements(values):
    elements = []
    for value in values:
        elements.extend([item for item in str(value).split(",") if item and item != "unknown"])
    return elements


def top_values(series, n=5):
    return [item for item, _ in Counter(series.dropna()).most_common(n) if item != "unknown"]


def trend_analysis(scored_df):
    rising = scored_df[scored_df["trend_stage"] == "rising"]
    decline = scored_df[scored_df["trend_stage"] == "decline"]

    top_fabrics = top_values(scored_df["fabric"])
    top_styles = top_values(scored_df["fashion_style"])
    elements = [item for item, _ in Counter(split_elements(scored_df["design_elements"])).most_common(5)]

    emerging = []
    if not rising.empty:
        emerging.extend(top_values(rising["fabric"], 3))
        emerging.extend(split_elements(rising["design_elements"])[:3])

    declining = []
    if not decline.empty:
        declining.extend(top_values(decline["fashion_style"], 3))
        declining.extend(top_values(decline["style"], 3))

    return {
        "top_fabrics": top_fabrics,
        "top_styles": top_styles,
        "top_design_elements": elements,
        "emerging_trends": list(dict.fromkeys(emerging))[:5],
        "declining_trends": list(dict.fromkeys(declining))[:5],
    }
