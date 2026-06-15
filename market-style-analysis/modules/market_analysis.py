def ensure_gmv(df):
    df = df.copy()
    if "gmv" not in df.columns or df["gmv"].isna().all():
        df["gmv"] = df["price"].fillna(0) * df["sales_volume"].fillna(0)
    return df


def aggregate(df, group_cols):
    grouped = (
        df.groupby(group_cols, dropna=False)
        .agg(
            count=("product_id", "count"),
            sales_volume=("sales_volume", "sum"),
            gmv=("gmv", "sum"),
        )
        .reset_index()
        .sort_values("gmv", ascending=False)
    )
    total_gmv = grouped["gmv"].sum() or 1
    grouped["share"] = grouped["gmv"] / total_gmv
    return grouped


def build_market_analysis(classified_df):
    df = ensure_gmv(classified_df)
    style_analysis = aggregate(df, ["style"])
    price_segment_analysis = aggregate(df, ["price_segment"])
    category_style_analysis = aggregate(df, ["category", "style"])
    return {
        "classified_market_data": df,
        "style_analysis": style_analysis,
        "price_segment_analysis": price_segment_analysis,
        "category_style_analysis": category_style_analysis,
        "json": {
            "style_analysis": style_analysis.to_dict("records"),
            "price_segment_analysis": price_segment_analysis.to_dict("records"),
            "category_style_analysis": category_style_analysis.to_dict("records"),
        },
    }
