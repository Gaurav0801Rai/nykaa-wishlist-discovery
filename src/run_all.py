"""
Run the whole analysis pipeline end-to-end (Stages 2-6) from whatever is already
in data/raw/. Collection scripts are run separately (network-dependent); this
re-runs the deterministic analysis so outputs are reproducible.

Usage:
  python run_all.py            # heuristic_v0 tagging (free)
  python run_all.py --use-api  # Anthropic Haiku tagging (paid; needs key + --yes)
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
STAGES = [
    ("Stage 2 filter", ["filter.py"]),
    ("Stage 3 classify", ["classify.py"] + sys.argv[1:]),
    ("Stage 4 quantify", ["quantify.py"]),
    ("Stage 5 segment", ["segment.py"]),
    ("Stage 6 synthesize", ["synthesize.py"]),
]


def main() -> int:
    for name, cmd in STAGES:
        print(f"\n===== {name} =====")
        r = subprocess.run([sys.executable, "-X", "utf8", *cmd], cwd=HERE)
        if r.returncode != 0:
            print(f"!! {name} exited {r.returncode}; stopping.")
            return r.returncode
    print("\nPipeline complete. See FINDINGS.md and outputs/. "
          "Browse: streamlit run app.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
