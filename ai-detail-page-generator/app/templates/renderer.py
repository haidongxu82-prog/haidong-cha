from __future__ import annotations

from html import escape


def render_html(product: dict, payload: dict) -> str:
    section_map = {section["type"]: section for section in payload["sections"]}
    hero = section_map["hero"]["content"]
    main_images = product["images"].get("main_white_bg", [])
    selling_points = section_map["selling_points"]["items"]
    fabric = section_map["fabric"]["content"]
    fit = section_map["fit_analysis"]["content"]
    scenes = section_map["scene"]["items"]
    details = section_map["detail_showcase"]["image_mapping"]
    size = section_map["size_guide"]["content"]

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(hero["title"])}</title>
  <style>
    body {{ margin: 0; background: #f7f4ef; color: #1f2328; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; }}
    .product-detail {{ max-width: 920px; margin: 0 auto; background: #fff; }}
    section {{ padding: 48px 40px; border-bottom: 1px solid #eee8df; }}
    .hero {{ text-align: center; background: #fbfaf7; }}
    h1 {{ font-size: 42px; margin: 0 0 12px; }}
    h2 {{ font-size: 26px; margin: 0 0 22px; }}
    .images {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 28px; }}
    .image-box {{ aspect-ratio: 1; background: #fff; border: 1px solid #eee8df; display: grid; place-items: center; color: #8a8f98; }}
    .points {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }}
    .point, .scene-card, .fit-box {{ border: 1px solid #eee8df; padding: 18px; background: #fffdfa; }}
    .muted {{ color: #6b7280; }}
  </style>
</head>
<body>
  <div class="product-detail">
    <section class="hero">
      <h1>{escape(hero["title"])}</h1>
      <p class="muted">{escape(hero["subtitle"])}</p>
      <div class="images">
        {render_images(main_images)}
      </div>
    </section>
    <section class="selling-points">
      <h2>核心卖点</h2>
      <div class="points">{render_points(selling_points)}</div>
    </section>
    <section class="fabric">
      <h2>面料说明</h2>
      <p>{escape(fabric)}</p>
    </section>
    <section class="fit">
      <h2>版型分析</h2>
      <div class="fit-box">
        <p>{escape(fit["body_shape_effect"])}</p>
        <p class="muted">推荐人群：{escape("、".join(fit["recommended_people"]))}</p>
        <p class="muted">置信度：{fit["confidence"]}</p>
      </div>
    </section>
    <section class="scene">
      <h2>穿着场景</h2>
      <div class="points">{render_scenes(scenes)}</div>
    </section>
    <section class="detail-images">
      <h2>细节展示</h2>
      <div class="images">{render_detail_images(details)}</div>
    </section>
    <section class="size-guide">
      <h2>尺码说明</h2>
      <p>{escape(size)}</p>
    </section>
  </div>
</body>
</html>"""


def render_images(urls: list[str]) -> str:
    return "\n".join(f'<div class="image-box">主图：{escape(url)}</div>' for url in urls)


def render_points(points: list[dict]) -> str:
    return "\n".join(f'<div class="point"><strong>{escape(item["type"])}</strong><p>{escape(item["text"])}</p></div>' for item in points)


def render_scenes(scenes: list[dict]) -> str:
    return "\n".join(f'<div class="scene-card"><strong>{escape(item["scene"])}</strong><p>{escape(item["copy"])}</p><p class="muted">匹配度：{item["match"]}</p></div>' for item in scenes)


def render_detail_images(details: list[dict]) -> str:
    return "\n".join(f'<div class="image-box">{escape(item["purpose"])}：{escape(item["image"])}</div>' for item in details)
