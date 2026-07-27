#!/usr/bin/env python3
"""Fail-closed validator for byungskerlab pull-request target versions."""

from __future__ import annotations

import argparse
import base64
import fnmatch
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any, Callable


SEMVER = r"(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)"
WORK_TYPES = "feature|fix|chore|refactor|docs|ci|migration|sync"
WORK_RE = re.compile(
    rf"^(?P<type>{WORK_TYPES})/"
    rf"(?P<unit>[a-z0-9][a-z0-9-]*)/"
    rf"(?P<version>{SEMVER})/"
    r"(?P<scope>[A-Za-z0-9][A-Za-z0-9._-]*)$"
)
PROMOTION_RE = re.compile(
    rf"^(?P<type>release|hotfix)/"
    rf"(?P<unit>[a-z0-9][a-z0-9-]*)/"
    rf"(?P<version>{SEMVER})$"
)
METADATA_KEYS = (
    "Target-Delivery-Unit",
    "Target-Version",
    "Delivery-Profile",
)


class PolicyError(ValueError):
    """Raised when PR state violates the target-version policy."""


def _load_config(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise PolicyError(f"policy config not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise PolicyError(f"policy config is invalid JSON: {exc}") from exc

    if data.get("schema_version") != 1:
        raise PolicyError("policy config schema_version must be 1")
    units = data.get("delivery_units")
    if not isinstance(units, dict) or not units:
        raise PolicyError("policy config delivery_units must be a non-empty object")
    return data


def _load_release_registry(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise PolicyError(f"release registry not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise PolicyError(f"release registry is invalid JSON: {exc}") from exc
    if data.get("schema_version") != 1:
        raise PolicyError("release registry schema_version must be 1")
    if not isinstance(data.get("delivery_units"), dict):
        raise PolicyError("release registry delivery_units must be an object")
    return data


def _metadata(body: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for key in METADATA_KEYS:
        matches = re.findall(
            rf"(?mi)^[ \t]*{re.escape(key)}[ \t]*:[ \t]*(\S.*?)[ \t]*$",
            body,
        )
        if len(matches) != 1:
            raise PolicyError(
                f"{key} must appear exactly once with a non-empty value; "
                f"found {len(matches)}"
            )
        values[key] = matches[0].strip()
    return values


def _single_metadata(body: str, key: str) -> str:
    matches = re.findall(
        rf"(?mi)^[ \t]*{re.escape(key)}[ \t]*:[ \t]*(\S.*?)[ \t]*$",
        body,
    )
    if len(matches) != 1:
        raise PolicyError(
            f"{key} must appear exactly once with a non-empty value; "
            f"found {len(matches)}"
        )
    return matches[0].strip()


def _strip_actor_prefix(head: str, config: dict[str, Any]) -> str:
    prefixes = config.get("allowed_actor_prefixes", ["codex"])
    if not isinstance(prefixes, list) or not all(
        isinstance(prefix, str) and prefix for prefix in prefixes
    ):
        raise PolicyError("allowed_actor_prefixes must be a list of names")
    for prefix in prefixes:
        marker = f"{prefix}/"
        if head.startswith(marker):
            return head[len(marker) :]
    return head


def _validate_changed_files(
    unit: str,
    unit_policy: dict[str, Any],
    changed_files: list[str],
) -> None:
    allowed_paths = unit_policy.get("allowed_paths")
    if not isinstance(allowed_paths, list) or not allowed_paths or not all(
        isinstance(pattern, str) and pattern for pattern in allowed_paths
    ):
        raise PolicyError(f"delivery unit {unit} has no allowed_paths policy")
    if not changed_files:
        raise PolicyError("changed-file evidence is empty")

    rejected: list[str] = []
    for path in changed_files:
        if (
            not isinstance(path, str)
            or not path
            or path.startswith("/")
            or ".." in Path(path).parts
        ):
            raise PolicyError(f"invalid changed path: {path!r}")
        if not any(fnmatch.fnmatchcase(path, pattern) for pattern in allowed_paths):
            rejected.append(path)

    if rejected:
        rendered = ", ".join(rejected[:5])
        suffix = "" if len(rejected) <= 5 else f" (+{len(rejected) - 5} more)"
        raise PolicyError(
            f"changed paths are outside delivery unit {unit}: {rendered}{suffix}"
        )


def _decode_changed_files(encoded: str) -> list[str]:
    if not encoded:
        raise PolicyError("missing changed-file evidence")
    try:
        payload = base64.b64decode(encoded, validate=True)
        changed_files = json.loads(payload)
    except (ValueError, json.JSONDecodeError) as exc:
        raise PolicyError("changed-file evidence is malformed") from exc
    if not isinstance(changed_files, list) or not all(
        isinstance(path, str) for path in changed_files
    ):
        raise PolicyError("changed-file evidence must be a JSON string array")
    return changed_files


def validate(
    config: dict[str, Any],
    head: str,
    base: str,
    body: str,
    changed_files: list[str],
    release_registry: dict[str, Any],
    ancestry_checker: Callable[[str], bool] | None = None,
) -> str:
    metadata = _metadata(body)
    normalized_head = _strip_actor_prefix(head, config)
    match = WORK_RE.fullmatch(normalized_head)
    promotion = PROMOTION_RE.fullmatch(normalized_head)
    if not match and not promotion:
        raise PolicyError(
            "head branch must be "
            "[codex/]<type>/<delivery-unit>/<x.y.z>/<scope> or "
            "[codex/](release|hotfix)/<delivery-unit>/<x.y.z>"
        )

    branch = match or promotion
    assert branch is not None
    branch_type = branch.group("type")
    unit = branch.group("unit")
    version = branch.group("version")

    units = config["delivery_units"]
    unit_policy = units.get(unit)
    if not isinstance(unit_policy, dict):
        raise PolicyError(f"unknown delivery unit: {unit}")

    profile = unit_policy.get("profile")
    mode = unit_policy.get("mode")
    active_versions = unit_policy.get("active_versions")
    version_source = unit_policy.get("target_version_source")
    if not isinstance(profile, str) or not profile:
        raise PolicyError(f"delivery unit {unit} has no profile")
    if mode not in {"version-line", "continuous"}:
        raise PolicyError(
            f"delivery unit {unit} mode must be version-line or continuous"
        )
    if not isinstance(active_versions, list) or not all(
        isinstance(item, str) and re.fullmatch(SEMVER, item)
        for item in active_versions
    ):
        raise PolicyError(
            f"delivery unit {unit} active_versions must contain exact SemVer values"
        )
    if version not in active_versions:
        rendered = ", ".join(active_versions) if active_versions else "none"
        raise PolicyError(
            f"target version {version} is not active for {unit}; active: {rendered}"
        )
    if (
        not isinstance(version_source, str)
        or not version_source.strip()
        or version_source.lower().startswith("pending")
    ):
        raise PolicyError(
            f"delivery unit {unit} has no authoritative target_version_source"
        )
    registry_unit = release_registry["delivery_units"].get(unit)
    if not isinstance(registry_unit, dict):
        raise PolicyError(f"release registry has no delivery unit {unit}")
    registry_versions = registry_unit.get("active_versions")
    if registry_versions != active_versions:
        raise PolicyError(
            f"active version source mismatch for {unit}: "
            f"policy={active_versions!r}, registry={registry_versions!r}"
        )
    _validate_changed_files(unit, unit_policy, changed_files)

    expected_metadata = {
        "Target-Delivery-Unit": unit,
        "Target-Version": version,
        "Delivery-Profile": profile,
    }
    for key, expected in expected_metadata.items():
        observed = metadata[key]
        if observed != expected:
            raise PolicyError(f"{key} mismatch: observed {observed!r}, expected {expected!r}")

    production_branch = unit_policy.get("production_branch", "main")
    if not isinstance(production_branch, str) or not production_branch:
        raise PolicyError(f"delivery unit {unit} has invalid production_branch")

    if promotion:
        promotion_sources = registry_unit.get("promotion_sources")
        source = (
            promotion_sources.get(branch_type, {}).get(version)
            if isinstance(promotion_sources, dict)
            else None
        )
        if not isinstance(source, dict):
            raise PolicyError(
                f"no approved {branch_type} promotion source for {unit} {version}"
            )
        source_branch = source.get("branch")
        source_sha = source.get("sha")
        if (
            not isinstance(source_branch, str)
            or not source_branch
            or not isinstance(source_sha, str)
            or re.fullmatch(r"[0-9a-f]{40}", source_sha) is None
        ):
            raise PolicyError(
                f"approved {branch_type} promotion source is malformed"
            )
        observed_source_sha = _single_metadata(body, "Promotion-Source-SHA")
        if observed_source_sha != source_sha:
            raise PolicyError(
                "Promotion-Source-SHA mismatch: "
                f"observed {observed_source_sha!r}, expected {source_sha!r}"
            )
        if ancestry_checker is None or not ancestry_checker(source_sha):
            raise PolicyError(
                f"promotion head is not verified as a descendant of {source_branch} "
                f"at {source_sha}"
            )
        if base != production_branch:
            raise PolicyError(
                f"{branch_type} PR base mismatch: observed {base!r}, "
                f"expected {production_branch!r}"
            )
    elif branch_type == "sync":
        allowed_sync_bases = unit_policy.get(
            "sync_bases",
            ["dev", f"version/{unit}/{version}"],
        )
        if base not in allowed_sync_bases:
            raise PolicyError(
                f"sync PR base mismatch: observed {base!r}, "
                f"expected one of {allowed_sync_bases!r}"
            )
    elif mode == "continuous":
        work_bases = unit_policy.get("work_bases", [production_branch])
        if (
            not isinstance(work_bases, list)
            or not work_bases
            or not all(isinstance(item, str) and item for item in work_bases)
        ):
            raise PolicyError(f"delivery unit {unit} has invalid work_bases")
        if base not in work_bases:
            raise PolicyError(
                f"continuous PR base mismatch: observed {base!r}, "
                f"expected one of {work_bases!r}"
            )
    else:
        normal_base = f"version/{unit}/{version}"
        release_base = f"release/{unit}/{version}"
        integration_prefix = f"integration/{unit}/{version}/"
        allowed = base == normal_base
        allowed = allowed or (
            branch_type == "fix" and base == release_base
        )
        allowed = allowed or base.startswith(integration_prefix)
        if not allowed:
            raise PolicyError(
                f"version-line PR base mismatch: observed {base!r}, "
                f"expected {normal_base!r}; matching release fixes and "
                "integration-test PRs are the only exceptions"
            )

    return (
        f"target-version policy passed: unit={unit} profile={profile} "
        f"version={version} head={head} base={base}"
    )


def _github_ancestry_checker(source_sha: str) -> bool:
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    head_sha = os.environ.get("PR_HEAD_SHA", "")
    token = os.environ.get("GH_TOKEN", "")
    if (
        re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository) is None
        or re.fullmatch(r"[0-9a-f]{40}", head_sha) is None
        or not token
    ):
        return False
    url = f"https://api.github.com/repos/{repository}/compare/{source_sha}...{head_sha}"
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.load(response)
    except (OSError, ValueError):
        return False
    merge_base = payload.get("merge_base_commit", {})
    return (
        payload.get("status") in {"ahead", "identical"}
        and merge_base.get("sha") == source_sha
    )


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config",
        default=os.environ.get(
            "BRANCH_POLICY_CONFIG",
            ".byungskerlab/branch-policy.json",
        ),
    )
    parser.add_argument("--head", default=os.environ.get("PR_HEAD_REF"))
    parser.add_argument("--base", default=os.environ.get("PR_BASE_REF"))
    parser.add_argument("--body", default=os.environ.get("PR_BODY"))
    parser.add_argument(
        "--changed-files-b64",
        default=os.environ.get("PR_CHANGED_FILES_B64"),
    )
    return parser


def main() -> int:
    args = _parser().parse_args()
    missing = [
        name
        for name, value in (
            ("head", args.head),
            ("base", args.base),
            ("body", args.body),
            ("changed-files-b64", args.changed_files_b64),
        )
        if value is None
    ]
    if missing:
        print(
            "target-version policy failed: missing input "
            + ", ".join(missing),
            file=sys.stderr,
        )
        return 1

    try:
        config = _load_config(Path(args.config))
        sources = {
            unit.get("target_version_source")
            for unit in config["delivery_units"].values()
            if isinstance(unit, dict)
        }
        if len(sources) != 1:
            raise PolicyError("all delivery units must use one release registry")
        source_path = next(iter(sources))
        if not isinstance(source_path, str):
            raise PolicyError("release registry path is missing")
        result = validate(
            config,
            args.head,
            args.base,
            args.body,
            _decode_changed_files(args.changed_files_b64),
            _load_release_registry(Path(source_path)),
            _github_ancestry_checker,
        )
    except PolicyError as exc:
        print(f"target-version policy failed: {exc}", file=sys.stderr)
        return 1

    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
