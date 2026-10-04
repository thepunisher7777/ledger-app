from __future__ import annotations

import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "index.html",
    "manifest.webmanifest",
    "sw.js",
    "posthog-stub.js",
    "posthog-bridge.js",
    "arx-analytics-guard.js",
    "README.md",
    "PRIVACY.md",
    "CHANGELOG.md",
    "metrics.html",
    "ledger-icon-192-v2.png",
    "ledger-icon-512-v2.png",
    "ledger-apple-touch-v2.png",
]


def fail(msg: str) -> None:
    raise SystemExit(f"[FAIL] {msg}")


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        fail(f"{path.name} is not a valid PNG")
    return struct.unpack(">II", data[16:24])


for name in REQUIRED:
    p = ROOT / name
    if not p.exists() or p.stat().st_size == 0:
        fail(f"Missing or empty required file: {name}")
ok("Required Ledger Beta 1.3 files are present")

manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
for key, value in {
    "name": "Ledger",
    "short_name": "Ledger",
    "start_url": "./",
    "scope": "./",
    "display": "standalone",
}.items():
    if manifest.get(key) != value:
        fail(f"manifest {key!r} must be {value!r}; got {manifest.get(key)!r}")
if "Beta 1.3" not in manifest.get("description", ""):
    fail("Manifest description must identify Beta 1.3")
ok("Manifest identity and project-page scope are stable")

html = (ROOT / "index.html").read_text(encoding="utf-8")
for marker in [
    "const APP_VERSION = 'Beta 1.3';",
    "const STORAGE_KEY = 'flowfi.public.v27';",
    "https://arx.local/telemetry/ledger",
    "maybeStartFlowFiMigration",
    "params.get('migration')!=='flowfi'",
    "migration-receiver-open",
    "Restaurar datos de FlowFi",
    "PostHog EU · sin nombre/email ni datos financieros",
    '<script src="posthog-stub.js"></script>',
    '<script src="posthog-bridge.js"></script>',
    '<script src="arx-analytics-guard.js"></script>',
]:
    if marker not in html:
        fail(f"Ledger runtime invariant missing: {marker}")
if not (html.find('posthog-stub.js') < html.find('posthog-bridge.js') < html.find('arx-analytics-guard.js')):
    fail("Analytics scripts must load in stub -> bridge -> guard order")
if "map(transactionRow)" in html:
    fail("Legacy transactionRow map bug reappeared")
ok("Ledger runtime, migration receiver and storage compatibility are intact")

sw = (ROOT / "sw.js").read_text(encoding="utf-8")
for marker in [
    "ledger-app-beta-1-3",
    "ledger-app-",
    "./posthog-stub.js",
    "./posthog-bridge.js",
    "./arx-analytics-guard.js",
]:
    if marker not in sw:
        fail(f"Service worker invariant missing: {marker}")
if "flowfi-ledger-migration-" in sw:
    fail("New Ledger service worker must not own FlowFi migration caches")
ok("Ledger service worker cache namespace is isolated")

bridge = (ROOT / "posthog-bridge.js").read_text(encoding="utf-8")
for marker in [
    "https://eu.i.posthog.com",
    "autocapture: false",
    "capture_pageview: false",
    "capture_pageleave: false",
    "capture_performance: false",
    "disable_session_recording: true",
    "person_profiles: 'never'",
    "opt_out_capturing_by_default: true",
    "ledger.analytics.consent.v1",
]:
    if marker not in bridge:
        fail(f"PostHog privacy invariant missing: {marker}")
for forbidden in ["state.transactions", "state.liabilities", "flowfi.public.v27"]:
    if forbidden in bridge:
        fail(f"PostHog bridge must not access finance state: {forbidden}")
ok("PostHog bridge is isolated from finance state")

guard = (ROOT / "arx-analytics-guard.js").read_text(encoding="utf-8")
for marker in [
    "before_send:sanitizeEvent",
    "autocapture:false",
    "capture_pageview:false",
    "capture_performance:false",
    "disable_session_recording:true",
    "person_profiles:'never'",
    "ledger.analytics.consent.v1",
]:
    if marker not in guard:
        fail(f"ARX analytics guard invariant missing: {marker}")
for forbidden in ["state.transactions", "state.liabilities", "flowfi.public.v27", "transaction.amount"]:
    if forbidden in guard:
        fail(f"ARX guard must not access finance state: {forbidden}")
ok("ARX analytics allowlist and consent guard are present")

for name, expected in {
    "ledger-icon-192-v2.png": (192, 192),
    "ledger-icon-512-v2.png": (512, 512),
    "ledger-apple-touch-v2.png": (180, 180),
}.items():
    actual = png_size(ROOT / name)
    if actual != expected:
        fail(f"{name} must be {expected}, got {actual}")
ok("PWA icon dimensions are correct")

metrics = (ROOT / "metrics.html").read_text(encoding="utf-8")
if "Beta 1.3" not in metrics or "POSTHOG EU" not in metrics:
    fail("metrics.html must describe Beta 1.3 / PostHog EU")
for forbidden in ["localStorage.getItem('flowfi.public.v27')", "state.transactions", "state.liabilities"]:
    if forbidden in metrics:
        fail(f"metrics page must not access finance data: {forbidden}")
ok("Public analytics status page is separated from finance state")

print("\nLedger Beta 1.3 smoke checks passed.")
