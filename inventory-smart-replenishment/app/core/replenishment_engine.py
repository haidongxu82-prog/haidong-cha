from __future__ import annotations

from datetime import date, timedelta


def calc_avg_sales(sales_list: list[int | float]) -> float:
    if not sales_list:
        return 0
    return sum(sales_list) / 14


def calc_days_cover(stock: int | float, avg_sales: int | float) -> float:
    if avg_sales == 0:
        return 999
    return stock / avg_sales


def need_restock(days_cover: float, lead_time: int, safety_buffer: int = 3) -> bool:
    return days_cover < (lead_time + safety_buffer)


def calc_restock_qty(avg_sales: float, lead_time: int, safety_stock: int) -> int:
    return int(avg_sales * lead_time + safety_stock)


def classify_priority(days_cover: float, lead_time: int) -> str:
    if days_cover < lead_time:
        return "P0"
    if days_cover < lead_time + 3:
        return "P1"
    if days_cover < 2 * lead_time:
        return "P2"
    return "OK"


def predicted_stockout_date(today: date, days_cover: float) -> str | None:
    if days_cover >= 999:
        return None
    return (today + timedelta(days=int(days_cover))).isoformat()


def build_reason(priority: str, days_cover: float, lead_time: int, avg_sales: float) -> str:
    if priority == "P0":
        return f"库存覆盖{days_cover:.1f}天，低于采购提前期{lead_time}天，存在立即缺货风险。"
    if priority == "P1":
        return f"库存覆盖{days_cover:.1f}天，低于采购提前期+安全缓冲，需预警补货。"
    if priority == "P2":
        return f"库存覆盖{days_cover:.1f}天，低于两倍采购提前期，建议观察。"
    return f"库存覆盖{days_cover:.1f}天，日均销量{avg_sales:.1f}，暂不需要补货。"


def generate_suggestion(sku: dict, current_stock: int, sales_trend_14d: list[int], today: date | None = None) -> dict:
    today = today or date(2026, 6, 15)
    avg_sales = calc_avg_sales(sales_trend_14d)
    days_cover = calc_days_cover(current_stock, avg_sales)
    lead_time = int(sku["lead_time_days"])
    priority = classify_priority(days_cover, lead_time)
    recommended_qty = calc_restock_qty(avg_sales, lead_time, int(sku["safety_stock"])) if priority in {"P0", "P1", "P2"} else 0
    return {
        "sku_id": sku["sku_id"],
        "sku_name": sku["sku_name"],
        "supplier_id": sku["supplier_id"],
        "current_stock": current_stock,
        "avg_sales": round(avg_sales, 2),
        "days_cover": round(days_cover, 2),
        "lead_time_days": lead_time,
        "safety_stock": int(sku["safety_stock"]),
        "recommended_qty": recommended_qty,
        "priority": priority,
        "reason": build_reason(priority, days_cover, lead_time, avg_sales),
        "predicted_stockout_date": predicted_stockout_date(today, days_cover),
    }
