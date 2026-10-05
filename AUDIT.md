# Ledger Beta 1.4.1 audit — fixes in Beta 1.4.2 — 2026-10-05

Base: main at 0d3e0c6 (Beta 1.4.1 international hotfix), rebased after it arrived during the audit. The translation hotfix is retained. Corrections are released as Beta 1.4.2.

All functional tests use synthetic data in isolated JSDOM instances at ledger.test. They never open the production application or access a user's storage, transactions, backups, or credentials. The existing finance storage key and schema version are preserved.

## Fixed and reproduced

- Impossible calendar dates were accepted by CSV parsing; strict calendar validation now rejects them. Transaction forms also reject invalid dates.
- Infinity and overflowing numeric strings could enter transaction state; monetary parsing now accepts only finite numbers.
- Malformed JSON backups could replace state and then crash rendering (null budgets, object-valued category collections). Validation rejects invalid collections, numeric fields, dates, split sums, duplicate IDs and unsafe IDs before restoration.
- Converting split expenses to transfers retained split allocations; transfers now clear them.
- Global assets excluded transfers even when reconciliation timestamps differed; global assets now equal the sum of projected individual account balances.
- Simulated upfront repayment could exceed the outstanding balance; it is capped at principal.
- Custom categories could be deleted while budgets or recurring payments still used them; deletion now protects those references.
- Custom icons and imported source labels were rendered as markup; these displays are escaped.
- CSV transfers with missing/identical destination were treated as income; they are rejected. Re-importing exported rows with an existing transaction ID is skipped.
- Service worker cached external requests and error responses; caching is limited to successful same-origin GET responses, with cache writes included in event lifetime.

## Verification

`npm ci --ignore-scripts && npm test` passes 156 regression groups across Spanish, English, French, German, Italian and Portuguese, plus four service-worker assertions. CI runs these automatically alongside the release smoke checks.

Coverage: empty/populated navigation, expense create/edit, income, duplicate submit protection, invalid amount handling, accounts, transfers, split-to-transfer conversion, recurring creation/record/pause, budgets, goals, loans, payment reversal, amortization, calendar transaction dates, deletion/undo, protected account/category deletion, CSV import/deduplication, rejected CSV rows, JSON validation/roundtrip, failed restore preserving state, synthetic storage persistence, export execution, dates, currency input and UI language initialization.

## Limits

This is not a proof of every possible flow. JSDOM exercises DOM events and application logic but does not validate layout, touch interactions, native download contents, actual service-worker installation, or iOS/Android PWA behavior. Chromium installation failed in the execution environment. Offline caching is tested with mocks; real device offline/update behavior still needs a browser/device run. Export functions execute, but generated Excel files are not opened in Excel. Translations are checked for language initialization and runtime stability, not complete linguistic coverage. Analytics and FlowFi migration invariants pass existing smoke checks; external telemetry and real migration are not exercised.

No production finance state was read or modified.
