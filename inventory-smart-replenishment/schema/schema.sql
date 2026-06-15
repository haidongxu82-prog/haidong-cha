CREATE TABLE product_sku (
  sku_id VARCHAR PRIMARY KEY,
  sku_name TEXT,
  category TEXT,
  supplier_id VARCHAR,
  lead_time_days INT,
  safety_stock INT DEFAULT 0
);

CREATE TABLE inventory_stock (
  sku_id VARCHAR,
  warehouse_id VARCHAR,
  available_qty INT,
  locked_qty INT,
  updated_time TIMESTAMP
);

CREATE TABLE sales_daily (
  sku_id VARCHAR,
  platform VARCHAR,
  sale_qty INT,
  sale_date DATE
);

CREATE TABLE replenishment_suggestion (
  id SERIAL PRIMARY KEY,
  sku_id VARCHAR,
  recommended_qty INT,
  priority VARCHAR,
  reason TEXT,
  predicted_stockout_date DATE,
  status VARCHAR DEFAULT 'pending',
  created_time TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_order (
  po_id SERIAL PRIMARY KEY,
  sku_id VARCHAR,
  qty INT,
  supplier_id VARCHAR,
  status VARCHAR DEFAULT 'draft',
  created_time TIMESTAMP DEFAULT NOW()
);
