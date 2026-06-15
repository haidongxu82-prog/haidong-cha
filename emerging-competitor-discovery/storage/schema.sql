CREATE TABLE IF NOT EXISTS stores (
    store_id TEXT PRIMARY KEY,
    store_name TEXT,
    platform TEXT,
    category TEXT,
    first_seen_date DATE
);

CREATE TABLE IF NOT EXISTS store_metrics (
    store_id TEXT,
    date DATE,
    sales_index FLOAT,
    ad_index FLOAT,
    social_index FLOAT,
    growth_score FLOAT,
    competitor_level TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT,
    alert_type TEXT,
    message TEXT,
    created_at DATE
);
