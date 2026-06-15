from __future__ import annotations

from dataclasses import dataclass


@dataclass
class CompetitorShop:
    platform: str
    shop_name: str
    shop_url: str
    category: str


@dataclass
class ProductSku:
    product_name: str
    price: float
    sales: int
    publish_time: str
    category: str
    image_url: str = ""
    image_style: str = "unknown"
    is_hot: bool = False
    sku_type: str = ""
