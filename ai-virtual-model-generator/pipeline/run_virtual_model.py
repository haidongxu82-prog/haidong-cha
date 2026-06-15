from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_DIR))

from app.core_service import run_generation_pipeline


OUTPUT_DIR = PROJECT_DIR / "output"


def run() -> dict[str, str]:
    sku = json.loads((PROJECT_DIR / "data" / "sample_sku.json").read_text(encoding="utf-8"))
    result = run_generation_pipeline(sku)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    result_path = OUTPUT_DIR / "generation_result.json"
    queue_path = OUTPUT_DIR / "review_queue.json"
    result_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    queue_path.write_text(json.dumps([result["review"]], ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "result": str(result_path),
        "review_queue": str(queue_path),
    }


if __name__ == "__main__":
    print(run())
