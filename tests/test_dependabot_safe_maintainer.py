import os
import unittest
from unittest import mock

from scripts import dependabot_safe_maintainer as m


class DependabotSafeMaintainerTests(unittest.TestCase):
    def test_version_classifier_is_fail_closed(self):
        self.assertTrue(
            m.same_major_safe("bump lucide-react from 1.29.0 to 1.47.0")
        )
        self.assertTrue(
            m.same_major_safe(
                "update streamlit requirement from <2,>=1.40 to >=1.64.0,<2"
            )
        )
        self.assertTrue(
            m.same_major_safe(
                "update matplotlib requirement from <4,>=3.9 to >=3.11.2,<4"
            )
        )
        self.assertFalse(
            m.same_major_safe("bump next from 15.5.23 to 16.3.1")
        )
        self.assertFalse(
            m.same_major_safe(
                "update docx2txt requirement from <1,>=0.8 to >=0.9,<1"
            )
        )
        self.assertFalse(m.same_major_safe("mysterious dependency update"))

    def test_files_are_narrowly_allowlisted(self):
        self.assertTrue(m.files_safe(["requirements.txt"]))
        self.assertTrue(
            m.files_safe(
                ["frontend/package.json", "frontend/pnpm-lock.yaml"]
            )
        )
        self.assertFalse(m.files_safe(["src/app.tsx"]))
        self.assertFalse(m.files_safe([]))

    def test_checks_require_both_verify_jobs_and_every_check_green(self):
        good = [
            {
                "name": "python",
                "status": "completed",
                "conclusion": "success",
            },
            {
                "name": "frontend",
                "status": "completed",
                "conclusion": "success",
            },
        ]
        self.assertTrue(m.checks_green(good))
        self.assertFalse(m.checks_green(good[:1]))
        self.assertFalse(
            m.checks_green(
                good
                + [
                    {
                        "name": "security",
                        "status": "completed",
                        "conclusion": "failure",
                    }
                ]
            )
        )
        self.assertFalse(
            m.checks_green(
                [
                    {
                        "name": "python",
                        "status": "completed",
                        "conclusion": "success",
                    },
                    {
                        "name": "frontend",
                        "status": "in_progress",
                        "conclusion": None,
                    },
                ]
            )
        )

    def candidate(self, **kwargs):
        base = dict(
            number=24,
            title="update streamlit requirement from <2,>=1.40 to >=1.64.0,<2",
            head_sha="head",
            base_sha="main",
            base_ref="main",
            author="dependabot[bot]",
            draft=False,
            mergeable=True,
            mergeable_state="clean",
            files=("requirements.txt",),
        )
        base.update(kwargs)
        return m.Candidate(**base)

    def test_validate_candidate_blocks_major_pre1_and_unexpected_files(self):
        m.validate_candidate(self.candidate())

        with self.assertRaises(m.Refused):
            m.validate_candidate(
                self.candidate(title="bump next from 15.5.23 to 16.3.1")
            )
        with self.assertRaises(m.Refused):
            m.validate_candidate(
                self.candidate(
                    title=(
                        "update docx2txt requirement from <1,>=0.8 "
                        "to >=0.9,<1"
                    )
                )
            )
        with self.assertRaises(m.Refused):
            m.validate_candidate(self.candidate(files=("src/app.py",)))
        with self.assertRaises(m.Refused):
            m.validate_candidate(self.candidate(author="someone-else"))

    @mock.patch.dict(os.environ, {"GITHUB_REPOSITORY": "J321-D/resume-screener-bot"})
    def test_successful_current_head_would_merge_only_after_green_checks(self):
        run = {
            "event": "pull_request",
            "conclusion": "success",
            "head_sha": "head",
            "pull_requests": [{"number": 24}],
        }
        candidate = self.candidate()
        checks = [
            {"name": "python", "status": "completed", "conclusion": "success"},
            {
                "name": "frontend",
                "status": "completed",
                "conclusion": "success",
            },
        ]
        with (
            mock.patch.object(m, "load_workflow_run", return_value=run),
            mock.patch.object(m, "load_candidate", return_value=candidate),
            mock.patch.object(m, "current_main_sha", return_value="main"),
            mock.patch.object(m, "check_runs", return_value=checks),
        ):
            out = m.run(123, execute=False)
        self.assertEqual(out["action"], "WOULD_MERGE")
        self.assertEqual(out["head_sha"], "head")

    @mock.patch.dict(os.environ, {"GITHUB_REPOSITORY": "J321-D/resume-screener-bot"})
    def test_stale_base_requests_rebase_before_using_old_green_run(self):
        run = {
            "event": "pull_request",
            "conclusion": "success",
            "head_sha": "head",
            "pull_requests": [{"number": 24}],
        }
        candidate = self.candidate(base_sha="old-main")
        with (
            mock.patch.object(m, "load_workflow_run", return_value=run),
            mock.patch.object(m, "load_candidate", return_value=candidate),
            mock.patch.object(m, "current_main_sha", return_value="new-main"),
        ):
            out = m.run(123, execute=False)
        self.assertEqual(out["action"], "WOULD_REQUEST_REBASE")

    @mock.patch.dict(os.environ, {"GITHUB_REPOSITORY": "J321-D/resume-screener-bot"})
    def test_failed_run_gets_bounded_retry_path_not_merge(self):
        run = {
            "event": "pull_request",
            "conclusion": "failure",
            "head_sha": "head",
            "pull_requests": [{"number": 24}],
        }
        candidate = self.candidate()
        with (
            mock.patch.object(m, "load_workflow_run", return_value=run),
            mock.patch.object(m, "load_candidate", return_value=candidate),
            mock.patch.object(m, "current_main_sha", return_value="main"),
        ):
            out = m.run(123, execute=False)
        self.assertEqual(out["action"], "WOULD_BOUNDED_RETRY")

    def test_merge_refuses_uncertain_mergeability(self):
        for mergeable, state in [
            (None, "unknown"),
            (False, "dirty"),
            (True, "unstable"),
        ]:
            with self.subTest(mergeable=mergeable, state=state):
                with self.assertRaises(m.Refused):
                    m.merge(
                        "J321-D/resume-screener-bot",
                        self.candidate(
                            mergeable=mergeable,
                            mergeable_state=state,
                        ),
                    )

    def test_rebase_request_is_idempotent(self):
        candidate = self.candidate()
        marker = "<!-- pj-safe-dep-rebase:head:new-main -->"
        with (
            mock.patch.object(
                m,
                "_comments",
                return_value=[{"body": marker + "\nold request"}],
            ),
            mock.patch.object(m, "_comment") as comment,
        ):
            out = m.request_rebase(
                "J321-D/resume-screener-bot",
                candidate,
                "new-main",
            )
        self.assertEqual(out["action"], "REBASE_ALREADY_REQUESTED")
        comment.assert_not_called()

    def test_bounded_retry_stops_after_exact_head_marker(self):
        candidate = self.candidate()
        marker = "<!-- pj-safe-dep-rerun:head -->"
        with (
            mock.patch.object(
                m,
                "_comments",
                return_value=[{"body": marker + "\nold retry"}],
            ),
            mock.patch.object(m, "_comment") as comment,
            mock.patch.object(m, "_run") as run,
        ):
            out = m.bounded_retry(
                "J321-D/resume-screener-bot",
                candidate,
                123,
            )
        self.assertEqual(out["action"], "BLOCKED_AFTER_BOUNDED_RETRY")
        comment.assert_not_called()
        run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
