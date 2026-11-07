#!/usr/bin/env python3
"""
LEXICON Naming Architect AST Auditor (`naming_audit.py`).
Audits Python and TypeScript files for overly verbose function, class, and file names.
"""
import ast
import pathlib
import re
import sys

MAX_FN_WORDS = 3
MAX_FN_CHARS = 24
MAX_FILE_CHARS = 18

BANNED_SUBSTRINGS = (
    "system_or_",
    "SystemOr",
    "ForColleague",
    "FromMessage",
    "forwarding_mailbox",
    "conversation_reply",
    "root_tenant_contact",
    "harvest_and_",
)

CAMEL_SPLIT_RE = re.compile(r"[A-Z]?[a-z0-9]+|[A-Z]+(?=[A-Z][a-z]|\d|\W|$)")
TS_DECL_RE = re.compile(
    r"^\s*(?:export\s+)?(?:async\s+)?(?:function|interface|type)\s+([A-Za-z0-9_]+)",
    re.MULTILINE,
)


def split_words(name: str) -> list[str]:
    clean = name.strip("_")
    if not clean:
        return []
    if "_" in clean:
        return [p for p in clean.split("_") if p]
    return CAMEL_SPLIT_RE.findall(clean)


def check_identifier(kind: str, name: str, path: pathlib.Path, line: int) -> list[str]:
    issues: list[str] = []
    if name.startswith("__") and name.endswith("__"):
        return issues
    for banned in BANNED_SUBSTRINGS:
        if banned in name:
            issues.append(f"{path}:{line} [{kind}] '{name}' contains banned verbose phrase '{banned}'")
    words = split_words(name)
    if len(words) > MAX_FN_WORDS and len(name.strip("_")) > MAX_FN_CHARS:
        issues.append(
            f"{path}:{line} [{kind}] '{name}' is too long ({len(words)} words, {len(name)} chars; max {MAX_FN_WORDS} words / {MAX_FN_CHARS} chars)"
        )
    return issues


def audit_python(path: pathlib.Path) -> list[str]:
    issues: list[str] = []
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    except Exception as exc:
        return [f"{path}:1 [SyntaxError] {exc}"]
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if node.name.startswith("test_"):
                continue
            issues.extend(check_identifier("function", node.name, path, node.lineno))
        elif isinstance(node, ast.ClassDef):
            issues.extend(check_identifier("class", node.name, path, node.lineno))
    return issues


def audit_ts(path: pathlib.Path) -> list[str]:
    issues: list[str] = []
    text = path.read_text(encoding="utf-8")
    for match in TS_DECL_RE.finditer(text):
        name = match.group(1)
        line = text.count("\n", 0, match.start()) + 1
        issues.extend(check_identifier("ts-decl", name, path, line))
    return issues


def main(argv: list[str]) -> int:
    targets = [pathlib.Path(p) for p in argv[1:]]
    all_issues: list[str] = []
    for target in targets:
        if not target.exists():
            continue
        files = [target] if target.is_file() else list(target.rglob("*"))
        for f in files:
            if f.suffix == ".py":
                all_issues.extend(audit_python(f))
            elif f.suffix in (".ts", ".tsx"):
                all_issues.extend(audit_ts(f))
    if all_issues:
        for item in all_issues:
            print(item)
        return 1
    print("LEXICON_NAMING_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
