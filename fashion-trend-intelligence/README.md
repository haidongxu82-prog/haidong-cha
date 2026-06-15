# Fashion Trend & Bestseller Intelligence System

爆款款式与面料趋势分析系统 MVP。

## Run

```bash
pip install -r requirements.txt
python pipeline/run_all.py
```

## Input

```text
data/raw_products.csv
```

## Output

```text
output/trending_products.xlsx
output/trend_analysis.json
output/weekly_report.md
output/database_schema.sql
```

## MVP Scope

- 多平台商品数据标准化
- AI标签识别 fallback：款式、面料、设计元素、风格、季节、性别
- 爆款评分：增长、互动、转化、供应链
- 趋势分析：面料、款式、设计元素、机会、下滑趋势
- 周报 Markdown 输出

真实平台采集、数据库写入、PDF、飞书发送已预留接口，后续可接 n8n / RPA / API。
