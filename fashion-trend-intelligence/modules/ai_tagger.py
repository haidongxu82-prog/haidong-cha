STYLE_VALUES = ["oversize", "slim", "A-line", "cropped", "loose", "unknown"]
FABRIC_VALUES = ["denim", "cotton", "polyester", "silk", "knit", "leather", "chiffon", "unknown"]
FASHION_STYLE_VALUES = ["Y2K", "street", "minimal", "casual", "sporty", "office", "unknown"]
SEASON_VALUES = ["spring", "summer", "autumn", "winter", "unknown"]
GENDER_VALUES = ["male", "female", "unisex", "unknown"]


def contains(text, keywords):
    return any(keyword.lower() in text.lower() for keyword in keywords)


def tag_product(row):
    text = f"{row.get('title', '')} {row.get('description', '')}"
    style = "unknown"
    if contains(text, ["收腰", "显瘦", "slim"]):
        style = "slim"
    elif contains(text, ["短款", "cropped"]):
        style = "cropped"
    elif contains(text, ["宽松", "oversize"]):
        style = "oversize"
    elif contains(text, ["长裙", "A-line", "伞裙"]):
        style = "A-line"
    elif contains(text, ["休闲", "开衫"]):
        style = "loose"

    fabric = "unknown"
    fabric_rules = [
        ("denim", ["牛仔", "denim"]),
        ("cotton", ["棉", "棉麻", "cotton"]),
        ("polyester", ["聚酯", "防晒"]),
        ("silk", ["真丝", "silk"]),
        ("knit", ["针织", "knit"]),
        ("leather", ["皮革", "leather"]),
        ("chiffon", ["雪纺", "chiffon"]),
    ]
    for label, keywords in fabric_rules:
        if contains(text, keywords):
            fabric = label
            break

    design_elements = []
    element_rules = [
        ("solid color", ["纯色"]),
        ("print", ["印花", "碎花"]),
        ("patchwork", ["拼接"]),
        ("cutout", ["镂空"]),
        ("zipper", ["拉链"]),
        ("embroidery", ["刺绣"]),
    ]
    for label, keywords in element_rules:
        if contains(text, keywords):
            design_elements.append(label)
    if not design_elements:
        design_elements.append("unknown")

    fashion_style = "unknown"
    if contains(text, ["Y2K"]):
        fashion_style = "Y2K"
    elif contains(text, ["街头", "机车"]):
        fashion_style = "street"
    elif contains(text, ["极简", "纯色"]):
        fashion_style = "minimal"
    elif contains(text, ["休闲", "日常"]):
        fashion_style = "casual"
    elif contains(text, ["运动", "速干"]):
        fashion_style = "sporty"
    elif contains(text, ["通勤", "衬衫"]):
        fashion_style = "office"

    season = "unknown"
    if contains(text, ["夏", "防晒", "背心", "雪纺"]):
        season = "summer"
    elif contains(text, ["春秋", "外套", "开衫"]):
        season = "autumn"

    return {
        "style": style,
        "fabric": fabric,
        "design_elements": design_elements,
        "fashion_style": fashion_style,
        "season": season,
        "gender": "female",
    }


def tag_products(df):
    tagged = df.copy()
    tags = [tag_product(row) for row in tagged.to_dict("records")]
    for field in ["style", "fabric", "fashion_style", "season", "gender"]:
        tagged[field] = [item[field] for item in tags]
    tagged["design_elements"] = [",".join(item["design_elements"]) for item in tags]
    return tagged
