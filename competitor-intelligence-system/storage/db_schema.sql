CREATE TABLE competitor_shop (
    id INT PRIMARY KEY AUTO_INCREMENT,
    platform VARCHAR(20),
    shop_name VARCHAR(255),
    shop_url TEXT,
    category VARCHAR(100),
    created_at DATETIME
);

CREATE TABLE product_sku (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT,
    product_name TEXT,
    price DECIMAL(10,2),
    sales INT,
    publish_time DATETIME,
    category VARCHAR(100),
    is_hot BOOLEAN,
    sku_type VARCHAR(50),
    image_style VARCHAR(50),
    created_at DATETIME
);

CREATE TABLE analysis_report (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT,
    report_type VARCHAR(20),
    report_content LONGTEXT,
    created_at DATETIME
);
