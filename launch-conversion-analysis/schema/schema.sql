CREATE TABLE core_product_launch (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id VARCHAR(64),
    product_name VARCHAR(255),
    team_member VARCHAR(64),
    category VARCHAR(64),
    style_tag VARCHAR(64),
    launch_date DATE,
    source_platform VARCHAR(32),
    price DECIMAL(10,2)
);

CREATE TABLE product_performance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id VARCHAR(64),
    date DATE,
    impressions INT,
    clicks INT,
    orders INT,
    gmv DECIMAL(10,2)
);

CREATE TABLE market_benchmark (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(64),
    style_tag VARCHAR(64),
    avg_conversion_rate DECIMAL(5,4),
    avg_ctr DECIMAL(5,4),
    avg_gmv DECIMAL(10,2)
);
