"""
Run the analysis pipeline end-to-end (filter, classify, report) from whatever is already
in data/raw/. Collection scripts are run separately (network-dependent); this
re-runs the deterministic analysis so outputs are reproducible.

Usage:
  python run_all.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
STAGES = [
    ("Apply manual analysis", ["apply_tags.py"]),
    ("Report (ranking, crosstab, FINDINGS)", ["report.py"]),
]


def main() -> int:
    for name, cmd in STAGES:
        print(f"\n===== {name} =====")
        r = subprocess.run([sys.executable, "-X", "utf8", *cmd], cwd=HERE)
        if r.returncode != 0:
            print(f"!! {name} exited {r.returncode}; stopping.")
            return r.returncode
    print("\nPipeline complete. See FINDINGS.md and outputs/. "
          "Site: cd web && npm run dev")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
