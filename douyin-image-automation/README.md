# Douyin Image Automation

抖店商品主图自动加 Logo 系统。

## 运行前准备

1. 安装依赖：

```bash
pip install -r requirements.txt
```

2. 放入品牌 Logo：

```text
config/logo.png
```

3. 运行：

```bash
python main.py
```

## 当前状态

- 图片下载、加 Logo、顺序处理、日志、失败重试已实现。
- 抖店后台抓取和上传已预留 Selenium RPA 接口，需要根据实际后台页面选择器补齐。
- 默认使用 `rpa/scraper.py` 中的模拟商品数据，便于先验证图片处理链路。

## 目录

```text
douyin-image-automation/
├── rpa/
├── processor/
├── config/
├── data/
├── logs/
├── main.py
└── requirements.txt
```
