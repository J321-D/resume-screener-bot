"""Contract tests for path-aware Verify CI routing."""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "verify.yml"


class VerifyWorkflowContractTests(unittest.TestCase):
    def test_named_python_and_frontend_checks_are_preserved(self) -> None:
        text = WORKFLOW.read_text()

        self.assertIn("\n  python:\n", text)
        self.assertIn("\n  frontend:\n", text)
        self.assertIn("needs: changes", text)

    def test_backend_only_changes_can_skip_frontend_runner(self) -> None:
        text = WORKFLOW.read_text()

        self.assertIn("frontend_changed:", text)
        self.assertIn("needs.changes.outputs.frontend_changed == 'true'", text)
        self.assertIn("frontend/*)", text)

    def test_frontend_only_changes_can_skip_python_runner(self) -> None:
        text = WORKFLOW.read_text()

        self.assertIn("python_changed:", text)
        self.assertIn("needs.changes.outputs.python_changed == 'true'", text)
        self.assertIn("only_frontend=true", text)
        self.assertIn("python_changed=false", text)

    def test_detector_failure_and_unknown_ancestry_fail_open(self) -> None:
        text = WORKFLOW.read_text()

        self.assertGreaterEqual(text.count("needs.changes.result != 'success'"), 2)
        self.assertIn("Unknown ancestry fails open.", text)
        self.assertIn("Empty/ambiguous diff fails open.", text)
        self.assertGreaterEqual(text.count("frontend_changed=true"), 2)
        self.assertGreaterEqual(text.count("python_changed=true"), 2)

    def test_workflow_change_runs_both_heavy_suites(self) -> None:
        text = WORKFLOW.read_text()

        self.assertIn(".github/workflows/verify.yml)", text)
        workflow_case = text.split(".github/workflows/verify.yml)", 1)[1].split(";;", 1)[0]
        self.assertIn("frontend_changed=true", workflow_case)
        self.assertIn("python_changed=true", workflow_case)


if __name__ == "__main__":
    unittest.main()
