CREATE TABLE sku_base (
    sku_id VARCHAR(64) PRIMARY KEY,
    product_name VARCHAR(255),
    cost_price DECIMAL(10,2),
    category VARCHAR(64),
    brand VARCHAR(64)
);

CREATE TABLE competitor_price (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sku_id VARCHAR(64),
    competitor_name VARCHAR(255),
    price DECIMAL(10,2),
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sku_sales_metric (
    sku_id VARCHAR(64) PRIMARY KEY,
    sales_7d INT,
    sales_30d INT,
    conversion_rate DECIMAL(10,4)
);

CREATE TABLE pricing_suggestion (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sku_id VARCHAR(64),
    cost_price DECIMAL(10,2),
    market_min DECIMAL(10,2),
    market_max DECIMAL(10,2),
    market_avg DECIMAL(10,2),
    min_price DECIMAL(10,2),
    suggest_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    promotion_price DECIMAL(10,2),
    price_direction VARCHAR(16),
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
