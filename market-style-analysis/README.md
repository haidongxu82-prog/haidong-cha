# Market Style Analysis

电商款式分类、市场规模分析、竞品自动对标系统。

## 运行

```bash
pip install -r requirements.txt
python pipeline/run_all.py
```

## 输入

```text
data/market_data.csv
data/sku_data.csv
```

## 输出

```text
output/market_style_report.xlsx
output/sku_competitor_report.xlsx
output/market_analysis.json
output/competitor_analysis.json
```

## 当前实现

- 款式分类：结构化 attributes 优先，其次 title 关键词规则，最后 LLM fallback 接口。
- 市场规模：按 style、price_segment、category + style 聚合。
- 竞品匹配：TF-IDF 向量 + cosine similarity，支持类目和价格过滤。
- 报告输出：Excel + JSON。

## LLM说明

`modules/llm_service.py` 已预留真实 LLM 接口。默认无 API Key 时使用规则 fallback，保证 MVP 可离线运行。
