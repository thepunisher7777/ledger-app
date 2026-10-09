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
    "i18n.js",
    "money.js",
    "portfolio-import.js",
    "couple-core.js",
    "couple-sync.js",
    "couple-ui.js",
    "couple.css",
    "vendor/supabase.js",
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
ok("Required Ledger Beta 1.6.0 Couple Preview 2 files are present")

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
if "Beta 1.6.0 Couple Preview 2" not in manifest.get("description", ""):
    fail("Manifest description must identify Beta 1.6.0 Couple Preview 2")
ok("Manifest identity and project-page scope are stable")

html = (ROOT / "index.html").read_text(encoding="utf-8")
for marker in [
    "const APP_VERSION = 'Beta 1.6.0 Couple Preview 2';",
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
    '<script src="i18n.js"></script>',
    "ledger-language-select",
    "window.LedgerI18n?.setLanguage",
]:
    if marker not in html:
        fail(f"Ledger runtime invariant missing: {marker}")
if not (
    html.find('posthog-stub.js')
    < html.find('posthog-bridge.js')
    < html.find('arx-analytics-guard.js')
    < html.find('i18n.js')
):
    fail("Runtime scripts must load in analytics -> i18n order")
if "map(transactionRow)" in html:
    fail("Legacy transactionRow map bug reappeared")
ok("Ledger runtime, migration receiver, i18n hook and storage compatibility are intact")

# Internationalization is a UI-only layer. It must not read/write finance state.
i18n = (ROOT / "i18n.js").read_text(encoding="utf-8")
for marker in [
    "ledger.ui.language.v1",
    "const SUPPORTED = ['es','en','fr','de','it','pt'];",
    "es:'es-ES'",
    "en:'en-GB'",
    "fr:'fr-FR'",
    "de:'de-DE'",
    "it:'it-IT'",
    "pt:'pt-PT'",
    "window.LedgerI18n",
    "MutationObserver",
    "Automático (dispositivo)",
    "Español",
    "English",
    "Français",
    "Deutsch",
    "Italiano",
    "Português",
]:
    if marker not in i18n:
        fail(f"i18n invariant missing: {marker}")
for forbidden in [
    "flowfi.public.v27",
    "state.transactions",
    "state.liabilities",
    "state.accounts",
    "localStorage.removeItem",
]:
    if forbidden in i18n:
        fail(f"i18n layer must not access or mutate finance state: {forbidden}")
ok("Internationalization is isolated from finance data and supports six languages + automatic mode")

sw = (ROOT / "sw.js").read_text(encoding="utf-8")
for marker in [
    "ledger-app-beta-1-6-0-couple-preview-2",
    "ledger-app-",
    "./posthog-stub.js",
    "./posthog-bridge.js",
    "./arx-analytics-guard.js",
    "./i18n.js",
    "./money.js",
    "./portfolio-import.js",
]:
    if marker not in sw:
        fail(f"Service worker invariant missing: {marker}")
if "flowfi-ledger-migration-" in sw:
    fail("New Ledger service worker must not own FlowFi migration caches")
ok("Ledger Beta 1.6.0 Couple Preview 2 service worker cache namespace is isolated")

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
if "Beta 1.5.0" not in metrics or "POSTHOG EU" not in metrics:
    fail("metrics.html must describe Beta 1.6.0 Couple Preview 2 / PostHog EU")
for forbidden in ["localStorage.getItem('flowfi.public.v27')", "state.transactions", "state.liabilities"]:
    if forbidden in metrics:
        fail(f"metrics page must not access finance data: {forbidden}")
ok("Public analytics status page is separated from finance state")

readme = (ROOT / "README.md").read_text(encoding="utf-8")
privacy = (ROOT / "PRIVACY.md").read_text(encoding="utf-8")
changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
for label, doc in [("README", readme), ("CHANGELOG", changelog)]:
    if "Beta 1.6.0 Couple Preview 2" not in doc:
        fail(f"{label} must identify Beta 1.6.0 Couple Preview 2")
if "ledger.ui.language.v1" not in privacy or "flowfi.public.v27" not in privacy:
    fail("PRIVACY must document UI-language storage and finance-state compatibility")
ok("Release documentation matches Beta 1.6.0 Couple Preview 2 International")

print("\nLedger Beta 1.6.0 Couple Preview 2 International smoke checks passed.")
