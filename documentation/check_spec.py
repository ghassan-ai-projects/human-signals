"""Validate this documentation package, not the future application.

Run from any directory: python3 /absolute/project/path/documentation/check_spec.py
Only files under this documentation directory are read. Standard library only.
"""

import json
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parent


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


def project_fixture(timeline, cursor):
    """Small independent oracle for the fictional example's absolute commands."""
    frame = {"highlights": {}, "visibleRelationshipIds": set(), "trends": {}}
    cursor = min(max(cursor, 0), timeline["durationMs"])
    for event in sorted(timeline["events"], key=lambda item: (item["atMs"], item["order"])):
        if event["atMs"] > cursor:
            break
        command = event["command"]
        if command["type"] == "set-highlight":
            frame["highlights"][command["anatomyId"]] = command["value"]
        elif command["type"] == "set-relation":
            action = "add" if command["visible"] else "discard"
            getattr(frame["visibleRelationshipIds"], action)(command["relationshipId"])
        elif command["type"] == "set-trend":
            frame["trends"][command["signalId"]] = command["value"]
        else:
            raise AssertionError(f"Unknown fictional command: {command['type']}")
    frame["visibleRelationshipIds"] = sorted(frame["visibleRelationshipIds"])
    return frame


class SpecificationChecks(unittest.TestCase):
    def test_internal_links_and_code_fences(self):
        for path in ROOT.rglob("*.md"):
            content = path.read_text(encoding="utf-8")
            with self.subTest(document=path.name):
                self.assertEqual(len(re.findall(r"^```", content, re.MULTILINE)) % 2, 0)
                for destination in re.findall(r"\]\(([^)]+)\)", content):
                    if "://" in destination or destination.startswith("#"):
                        continue
                    target = (path.parent / destination.split("#")[0]).resolve()
                    self.assertTrue(target.is_relative_to(ROOT), destination)
                    self.assertTrue(target.is_file(), destination)

    def test_index_covers_all_numbered_documents(self):
        index = read("README.md")
        for path in ROOT.glob("[0-9][0-9]-*.md"):
            self.assertIn(f"]({path.name})", index)

    def test_requirement_traceability_is_complete(self):
        pattern = r"^\| (REQ-\d+) \|"
        required = re.findall(pattern, read("01-product-requirements.md"), re.MULTILINE)
        traced = re.findall(pattern, read("11-verification-and-acceptance.md"), re.MULTILINE)
        self.assertEqual(len(required), len(set(required)))
        self.assertEqual(len(traced), len(set(traced)))
        self.assertEqual(set(required), {f"REQ-{i:03d}" for i in range(1, 32)})
        self.assertEqual(set(required), set(traced))

    def test_acceptance_references_resolve(self):
        content = read("11-verification-and-acceptance.md")
        referenced = set(re.findall(r"\bAC-\d+\b", content))
        defined = set(re.findall(r"^### (AC-\d+)", content, re.MULTILINE))
        self.assertEqual(referenced, defined)
        self.assertEqual(len(defined), 18)

    def test_curriculum_inventory(self):
        content = read("03-curriculum-and-content.md")
        for prefix, count in (("sig-", 14), ("j-", 9), ("state-", 3)):
            ids = re.findall(r"^\| (" + prefix + r"[a-z0-9-]+) \|", content, re.MULTILINE)
            self.assertEqual(len(ids), count, prefix)
            self.assertEqual(len(set(ids)), count, prefix)

    def test_fictional_example_commands_and_expected_frames(self):
        fixture = json.loads(read("examples/synthetic-feedback.json"))
        self.assertTrue(fixture["fictional"])
        self.assertEqual(fixture["fixtureVersion"], 1)
        timeline = fixture["timeline"]
        self.assertEqual(len({event["order"] for event in timeline["events"]}), len(timeline["events"]))
        self.assertTrue(all(0 <= event["atMs"] <= timeline["durationMs"] for event in timeline["events"]))
        for expected in fixture["checks"]:
            with self.subTest(cursor=expected["atMs"]):
                actual = project_fixture(timeline, expected["atMs"])
                for key in ("visibleRelationshipIds", "trends"):
                    self.assertEqual(actual[key], expected[key])
        simultaneous = project_fixture(timeline, 2000)["highlights"]
        self.assertEqual(simultaneous["anat-fictional-intermediary"], "target")
        self.assertEqual(simultaneous["anat-fictional-peripheral"], "target")
        checkpoint = timeline["checkpoint"]
        self.assertLess(checkpoint["atMs"], checkpoint["revealAtMs"])
        self.assertNotIn("sig-gamma", project_fixture(timeline, checkpoint["atMs"])["trends"])
        self.assertEqual(project_fixture(timeline, checkpoint["revealAtMs"])["trends"]["sig-gamma"], "increasing")


if __name__ == "__main__":
    unittest.main(verbosity=2)
