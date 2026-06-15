import pandas as pd


def filter_launch_by_month(launch_df, month):
    launch = launch_df.copy()
    launch["launch_date"] = pd.to_datetime(launch["launch_date"])
    period = launch["launch_date"].dt.strftime("%Y-%m")
    return launch[period == month].copy()


def aggregate_performance(perf_df):
    perf = perf_df.copy()
    for col in ["impressions", "clicks", "orders", "gmv"]:
        perf[col] = pd.to_numeric(perf[col], errors="coerce").fillna(0)
    return (
        perf.groupby("product_id", as_index=False)
        .agg(
            impressions=("impressions", "sum"),
            clicks=("clicks", "sum"),
            orders=("orders", "sum"),
            gmv=("gmv", "sum"),
        )
    )


def build_product_fact(launch_df, perf_df, month):
    launch = filter_launch_by_month(launch_df, month)
    perf = aggregate_performance(perf_df)
    fact = launch.merge(perf, on="product_id", how="left")
    for col in ["impressions", "clicks", "orders", "gmv"]:
        fact[col] = fact[col].fillna(0)
    fact["is_success"] = fact["orders"] > 0
    fact["ctr"] = fact["clicks"] / fact["impressions"].replace(0, pd.NA)
    fact["conversion_rate"] = fact["orders"] / fact["clicks"].replace(0, pd.NA)
    fact["ctr"] = fact["ctr"].fillna(0)
    fact["conversion_rate"] = fact["conversion_rate"].fillna(0)
    return fact


def conversion_summary(fact):
    total_launch = fact["product_id"].nunique()
    success_launch = fact.loc[fact["is_success"], "product_id"].nunique()
    return {
        "total_launch": int(total_launch),
        "success_launch": int(success_launch),
        "conversion_rate": round(success_launch / total_launch, 4) if total_launch else 0,
    }


def group_summary(fact, group_cols):
    grouped = (
        fact.groupby(group_cols, dropna=False)
        .agg(
            total=("product_id", "nunique"),
            success=("is_success", "sum"),
            impressions=("impressions", "sum"),
            clicks=("clicks", "sum"),
            orders=("orders", "sum"),
            gmv=("gmv", "sum"),
            avg_price=("price", "mean"),
        )
        .reset_index()
    )
    grouped["conversion_rate"] = grouped["success"] / grouped["total"].replace(0, pd.NA)
    grouped["ctr"] = grouped["clicks"] / grouped["impressions"].replace(0, pd.NA)
    grouped["order_cvr"] = grouped["orders"] / grouped["clicks"].replace(0, pd.NA)
    return grouped.fillna(0).sort_values(["conversion_rate", "gmv"], ascending=False)
