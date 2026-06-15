CREATE TABLE product_launch (
    id BIGINT PRIMARY KEY,
    sku VARCHAR(64),
    product_id VARCHAR(64),
    title TEXT,
    platform VARCHAR(32),
    shop_id VARCHAR(32),
    launch_time DATETIME,
    category VARCHAR(64),
    price DECIMAL(10,2),
    status VARCHAR(32)
);

CREATE TABLE product_metrics_daily (
    id BIGINT PRIMARY KEY,
    sku VARCHAR(64),
    stat_date DATE,
    impressions INT,
    clicks INT,
    ctr DECIMAL(10,4),
    orders INT,
    paid_orders INT,
    paid_amount DECIMAL(10,2),
    conversion_rate DECIMAL(10,4)
);

CREATE TABLE order_fact (
    order_id BIGINT,
    sku VARCHAR(64),
    create_time DATETIME,
    pay_time DATETIME,
    amount DECIMAL(10,2),
    status VARCHAR(32)
);

CREATE OR REPLACE VIEW v_daily_new_products AS
SELECT
    DATE(launch_time) AS stat_date,
    COUNT(*) AS new_products
FROM product_launch
GROUP BY DATE(launch_time);

CREATE OR REPLACE VIEW v_daily_payment_rate AS
SELECT
    stat_date,
    SUM(paid_orders) / NULLIF(SUM(orders), 0) AS payment_rate
FROM product_metrics_daily
GROUP BY stat_date;

CREATE OR REPLACE VIEW v_product_health_base AS
SELECT
    l.sku,
    l.product_id,
    l.title,
    l.category,
    l.platform,
    l.price,
    m.stat_date,
    m.impressions,
    m.clicks,
    COALESCE(m.ctr, m.clicks / NULLIF(m.impressions, 0)) AS ctr,
    m.orders,
    m.paid_orders,
    m.paid_amount,
    COALESCE(m.conversion_rate, m.paid_orders / NULLIF(m.clicks, 0)) AS conversion_rate,
    m.paid_orders / NULLIF(m.orders, 0) AS payment_rate
FROM product_launch l
LEFT JOIN product_metrics_daily m
ON l.sku = m.sku;
