CREATE TABLE products (
  product_id TEXT PRIMARY KEY,
  title TEXT,
  platform TEXT,
  price NUMERIC,
  sales_volume INTEGER,
  likes INTEGER,
  comments INTEGER,
  image_urls TEXT,
  crawl_time TIMESTAMP
);

CREATE TABLE ai_tags (
  product_id TEXT,
  style TEXT,
  fabric TEXT,
  design_elements TEXT,
  fashion_style TEXT,
  season TEXT,
  gender TEXT
);

CREATE TABLE hot_score (
  product_id TEXT,
  hot_score NUMERIC,
  level TEXT,
  trend_stage TEXT,
  calculated_time TIMESTAMP
);