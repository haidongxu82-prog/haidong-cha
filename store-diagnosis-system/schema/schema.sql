CREATE TABLE store_product (
    sku VARCHAR(64) PRIMARY KEY,
    title TEXT,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    stock INT,
    sales_7d INT,
    sales_30d INT,
    ctr DECIMAL(10,4),
    conversion_rate DECIMAL(10,4)
);

CREATE TABLE store_ad_campaign (
    campaign_id VARCHAR(64) PRIMARY KEY,
    sku VARCHAR(64),
    spend DECIMAL(10,2),
    impressions INT,
    clicks INT,
    orders INT,
    avg_order_value DECIMAL(10,2)
);

CREATE TABLE store_competitor (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(64),
    competitor_name VARCHAR(255),
    price DECIMAL(10,2),
    sales_estimate INT
);

CREATE TABLE store_diagnosis_result (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    report_date DATE,
    sku VARCHAR(64),
    product_layer VARCHAR(8),
    pricing_flag VARCHAR(64),
    ads_status VARCHAR(64),
    risk_level VARCHAR(32),
    action TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
