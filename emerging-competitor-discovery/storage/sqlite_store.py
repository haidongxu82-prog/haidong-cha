from __future__ import annotations

import sqlite3
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT_DIR / "storage" / "schema.sql"


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    return conn


def save_results(conn: sqlite3.Connection, rows: list[dict], alerts: list[dict], run_date: str = "2026-06-15") -> None:
    for row in rows:
        record = row["record"]
        analysis = row["analysis"]
        metrics = record["metrics"]
        conn.execute(
            """
            INSERT OR REPLACE INTO stores (store_id, store_name, platform, category, first_seen_date)
            VALUES (?, ?, ?, ?, ?)
            """,
            (record["store_id"], record["store_name"], record["platform"], record["category"], record["first_seen_date"]),
        )
        conn.execute(
            """
            INSERT INTO store_metrics (store_id, date, sales_index, ad_index, social_index, growth_score, competitor_level)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["store_id"],
                run_date,
                metrics["sales_index"],
                metrics["ad_index"],
                metrics["social_index"],
                analysis["growth_score"],
                analysis["competitor_level"],
            ),
        )
    for alert in alerts:
        conn.execute(
            """
            INSERT INTO alerts (store_id, alert_type, message, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (alert["store_id"], alert["alert_type"], alert["message"], run_date),
        )
    conn.commit()


def fetch_competitors(conn: sqlite3.Connection) -> list[dict]:
    cursor = conn.execute(
        """
        SELECT s.store_id, s.store_name, s.platform, s.category, m.growth_score, m.competitor_level
        FROM stores s
        JOIN store_metrics m ON s.store_id = m.store_id
        WHERE m.growth_score >= 45
        ORDER BY m.growth_score DESC
        """
    )
    return [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]


def fetch_alerts(conn: sqlite3.Connection) -> list[dict]:
    cursor = conn.execute("SELECT store_id, alert_type, message, created_at FROM alerts ORDER BY id DESC")
    return [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
