from modules.classification import classify_row
from modules.embedding_service import fit_embeddings, similarity_matrix
from modules.llm_service import summarize_competitors


def price_within_range(sku_price, market_price, max_gap_ratio):
    sku_price = float(sku_price or 0)
    market_price = float(market_price or 0)
    if sku_price <= 0:
        return True
    return abs(sku_price - market_price) / sku_price <= max_gap_ratio


def style_gap(sku_row, market_row):
    if sku_row.get("style") == market_row.get("style"):
        return "same_style"
    return f"{sku_row.get('style', 'unknown')} vs {market_row.get('style', 'unknown')}"


def price_gap(sku_price, market_price):
    sku_price = float(sku_price or 0)
    market_price = float(market_price or 0)
    diff = market_price - sku_price
    if abs(diff) < 1:
        return "same_price"
    return f"{diff:+.0f}"


def classify_sku_data(sku_df, config):
    classified = sku_df.copy()
    results = [classify_row(row, config) for row in classified.to_dict("records")]
    for field in ["style", "scene", "material", "price_segment"]:
        classified[field] = [item[field] for item in results]
    return classified


def match_competitors(classified_market_df, sku_df, config):
    sku_classified = classify_sku_data(sku_df, config)
    market_rows = classified_market_df.to_dict("records")
    sku_rows = sku_classified.to_dict("records")
    market_vectors, sku_vectors = fit_embeddings(market_rows, sku_rows)
    similarities = similarity_matrix(sku_vectors, market_vectors)

    output = []
    for sku_index, sku in enumerate(sku_rows):
      candidates = []
      for market_index, market in enumerate(market_rows):
          similarity = float(similarities[sku_index][market_index])
          same_category = sku.get("category") == market.get("category")
          price_ok = price_within_range(sku.get("price"), market.get("price"), config["price_gap_ratio"])
          if not same_category or not price_ok or similarity < config["similarity_threshold"]:
              continue
          candidates.append(
              {
                  "product_id": market["product_id"],
                  "title": market["title"],
                  "category": market["category"],
                  "price": float(market["price"]),
                  "style": market.get("style", ""),
                  "material": market.get("material", ""),
                  "sales_volume": int(market.get("sales_volume", 0)),
                  "gmv": float(market.get("gmv", 0)),
                  "similarity_score": round(similarity, 4),
                  "style_gap": style_gap(sku, market),
                  "price_gap": price_gap(sku.get("price"), market.get("price")),
              }
          )

      top_competitors = sorted(candidates, key=lambda item: item["similarity_score"], reverse=True)[
          : config["top_k_competitors"]
      ]
      output.append(
          {
              "sku_id": sku["sku_id"],
              "title": sku["title"],
              "category": sku["category"],
              "competitors": top_competitors,
              "analysis": summarize_competitors(sku, top_competitors),
          }
      )

    return sku_classified, output
