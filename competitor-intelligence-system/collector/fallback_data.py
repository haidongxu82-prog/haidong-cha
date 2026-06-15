from __future__ import annotations

from datetime import datetime, timedelta


def fallback_products(shop_url: str, platform: str) -> list[dict]:
    base_names = [
        ("民族风刺绣衬衫", 129, 980, "极简白底"),
        ("妈妈装宽松套装", 139, 860, "生活场景"),
        ("新中式盘扣上衣", 169, 520, "品牌质感"),
        ("基础福利T恤", 29, 760, "促销风"),
        ("高腰阔腿休闲裤", 99, 430, "极简白底"),
        ("轻薄防晒开衫", 69, 310, "生活场景"),
        ("复古印花短袖", 59, 220, "促销风"),
        ("香云纱感上衣", 229, 160, "品牌质感"),
        ("直播福利打底衫", 19, 680, "促销风"),
        ("通勤桑蚕丝感衬衫", 199, 190, "品牌质感"),
        ("民族风半身裙", 119, 360, "生活场景"),
        ("小香风短外套", 189, 140, "品牌质感"),
    ]
    now = datetime(2026, 6, 15, 10, 0, 0)
    return [
        {
            "product_name": name,
            "price": price,
            "sales": sales,
            "publish_time": (now - timedelta(days=index * 2)).strftime("%Y-%m-%d %H:%M:%S"),
            "category": "民族服饰" if "民族" in name or "妈妈" in name or "新中式" in name else "女装",
            "image_url": f"{shop_url.rstrip('/')}/image-{index + 1}.jpg",
            "image_style": style,
            "platform": platform,
        }
        for index, (name, price, sales, style) in enumerate(base_names)
    ]
