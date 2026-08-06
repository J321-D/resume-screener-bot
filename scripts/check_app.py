"""Verify the audited application baseline without executing Streamlit."""

from __future__ import annotations

import argparse
import ast
import hashlib
import importlib.util
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
APP_PATH = PROJECT_ROOT / "app.py"
BASELINE_SHA256 = "c3062bfa418b79bc31a1ea33d0e99e5b56db46b91c7d2a7feed55c88d14b5c41"

REQUIRED_MODULES = {
    "docx2txt": "docx2txt",
    "fpdf2": "fpdf",
    "matplotlib": "matplotlib",
    "openai": "openai",
    "pandas": "pandas",
    "plotly": "plotly",
    "PyMuPDF": "fitz",
    "python-dotenv": "dotenv",
    "streamlit": "streamlit",
}


def verify_baseline() -> None:
    """Confirm exact baseline bytes and valid Python syntax."""
    source_bytes = APP_PATH.read_bytes()
    actual_hash = hashlib.sha256(source_bytes).hexdigest()

    if actual_hash != BASELINE_SHA256:
        raise SystemExit(
            "app.py no longer matches the audited baseline: "
            f"expected {BASELINE_SHA256}, found {actual_hash}"
        )

    ast.parse(source_bytes, filename=str(APP_PATH))
    print(f"Baseline hash verified: {actual_hash}")
    print("Python syntax verified: app.py")


def verify_dependencies() -> None:
    """Confirm that modules imported by the baseline are discoverable."""
    missing = [
        distribution
        for distribution, module in REQUIRED_MODULES.items()
        if importlib.util.find_spec(module) is None
    ]

    if missing:
        raise SystemExit("Missing dependencies: " + ", ".join(sorted(missing)))

    print("Required imports are available.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check-dependencies",
        action="store_true",
        help="also verify that required third-party modules are installed",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    verify_baseline()
    if args.check_dependencies:
        verify_dependencies()


if __name__ == "__main__":
    main()
