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

`npm ci --ignore-scripts && npm test` passes 216 regression groups across Spanish, English, French, German, Italian and Portuguese, plus four service-worker assertions. CI runs these automatically alongside the release smoke checks.

Coverage: empty/populated navigation, expense create/edit, income, duplicate submit protection, invalid amount handling, accounts, transfers, split-to-transfer conversion, recurring creation/record/pause, budgets, goals, loans, payment reversal, amortization, calendar transaction dates, deletion/undo, protected account/category deletion, CSV import/deduplication, rejected CSV rows, JSON validation/roundtrip, failed restore preserving state, synthetic storage persistence, export execution, dates, currency input and UI language initialization.

## Limits

This is not a proof of every possible flow. JSDOM exercises DOM events and application logic but does not validate layout, touch interactions, native download contents, actual service-worker installation, or iOS/Android PWA behavior. Chromium installation failed in the execution environment. Offline caching is tested with mocks; real device offline/update behavior still needs a browser/device run. Export functions execute, but generated Excel files are not opened in Excel. Translations are checked for language initialization and runtime stability, not complete linguistic coverage. Analytics and FlowFi migration invariants pass existing smoke checks; external telemetry and real migration are not exercised.

No production finance state was read or modified.

## Recovery follow-up — 2026-10-05

The ThreadFox recovery scenario is now a permanent regression task in all six UI languages. Synthetic forms create a recurring bill (49.99 EUR), record it, create a loan (1200 EUR at 12% annual interest), record a 110 EUR installment (12 EUR interest, 98 EUR principal, 1102 EUR remaining), create a payday income, and set a financial cycle starting on day 15.

Tests capture and read the actual JSON export Blob, restore it through the import handler, and compare the complete normalized financial state, projected account balance, payment history, recurring references, and cycle boundaries. The restored state is also loaded in a fresh isolated document. Repeated restore must not duplicate bills or loan payments. Export metadata and normalization defaults are excluded from the financial comparison.

A reproduced storage failure previously changed in-memory state and displayed a successful restore despite failing to persist it. JSON restore and local safety recovery now share a persistence-aware commit: preserve the previous safety snapshot, cancel on snapshot failure, roll back memory and the safety snapshot when the finance write fails, and show success only after persistence. Local safety recovery now uses the same strict backup validation. Successful recovery clears stale editing, calendar and undo state. The service-worker cache is refreshed for this patch.

Checks additionally cover cancelled restore, malformed local safety copies, and preservation of the previous state and safety snapshot during a simulated storage quota failure. `npm test` passes 216 functional regression groups plus the four service-worker assertions; release smoke checks pass. Chromium download again returned an invalid archive, so real-browser layout, touch, native downloads and device PWA behavior remain unverified. No real financial data was accessed.

## Beta 1.5.0 — multidivisa (2026-10-05)

Datos ficticios exclusivamente. Se mantienen las 216 comprobaciones funcionales en seis idiomas. Añadidas 25 pruebas específicas EUR/USD/XML y la auditoría del service worker; smoke de versión, privacidad, migración y PWA aprobado.

Verificado: conversiones en ambos sentidos, cambio de moneda base sin reescribir importes, patrimonio y deuda, ambas patas de transferencia, importe recibido real, rechazo de cuota en divisa distinta, fijos USD, gráficas/filtros nativos, ausencia de cambio sin equivalencia inventada, restauración de backups antiguos EUR y nuevos campos aditivos, CSV con divisas y deduplicación, exportación/reimportación, XML malformado/entidades/fechas, vista previa sin mutaciones, error de red, respuesta de cambio invertida y cuota de almacenamiento.

El endpoint público BCE/Frankfurter respondió con estructura `date/base/quote/rate` y el mismo contrato validado por el runtime. Los tests usan respuestas simuladas para evitar dependencia de red y enviar solo datos ficticios.

Límites: XML se prepara como vista previa, sin importación de carteras; no hay valoración bursátil ni FX histórico. Gráficas de saldo empiezan en conciliación y siguen el orden de registro. La instalación PWA y los gestos en iPhone físico requieren verificación en ese dispositivo.
