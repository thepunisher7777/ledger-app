# Ledger 1.6.1: estabilidad, activación y crecimiento

Revisión: 23 octubre 2026. Rama `feature/growth-foundation-20261023`, basada en `main` **c1d414530e9ba9c07c642d9b9927e54ff15f3bef**. No contiene migraciones de producción, cambios de credenciales ni restricciones Premium. El estado de publicación debe consultarse en el PR y Actions: crear la rama no publica GitHub Pages.

## Estado inicial verificado

- Producción HTTP 200, `APP_VERSION='Beta 1.6.0'`, selector de ciclos futuros presente; últimas ejecuciones CI y Pages para c1d4145 completadas correctamente. CI: 39929783585; Pages: 39929783170.
- Ramas reales: main, codex/multicurrency, docs/rea-integrity-diagnostic, feature/couple-mode, fix/couple-registration-errors, fix/couple-session-20261020 y fix/future-cycles-20261023. No se ha sustituido trabajo de otras ramas. PR #3 de diagnóstico anterior sigue abierto.
- HTML/CSS/JS sin compilación, PWA con service worker; SDK Supabase vendorizado/pinado 2.117.3. `flowfi.public.v27`, `.safety` y `.corrupt` conservados. Esquema financiero versión 2.
- Personal permanece en el dispositivo sin registro. Pareja es opcional, usa Supabase Auth, identidades sin correo, invitaciones de 24 horas y tablas compartidas protegidas por RLS/RPC. La configuración pública del backend ya estaba presente en producción; el nombre del proyecto contiene «test», pero se ha tratado como producción.
- Suites existentes cubren navegación/CRUD, préstamos, recurrentes, importaciones, presupuestos, seis idiomas, multidivisa, XML, meses futuros y separación Personal/Pareja. Una prueba HTTP tenía un falso positivo aleatorio: buscaba «9000» dentro de UUID y tokens además de importes. Se corrige comprobando valores estructurados y se demuestra que sigue rechazando datos privados reales de la fixture.

## Cambios funcionales

| Área | Implementación |
| --- | --- |
| Sesiones Pareja | Invalida respuestas Auth/lecturas/RPC antiguas tras cerrar o cambiar sesión; bloqueo durante cierre remoto. Cuatro pruebas reproducen las carreras. No cambia permisos del servidor. |
| Integridad local | Presupuesto y cambio del día de ciclo solo se confirman si se guardan; rollback en memoria al fallar almacenamiento. Pruebas con cuota ficticia agotada. |
| Primera experiencia | Guía de tres pasos, reabrible desde Ajustes; consentimiento analítico aplazado mientras esté abierta. |
| Demo | Página separada, datos ficticios en memoria, CRUD de movimientos y presupuesto; cero lectura/escritura de finanzas o Auth y cero red. Es práctica básica, no una copia completa de todos los módulos. |
| Captación | Landing `/descubre/`, calculadora `/reparto/`, enlaces desde Ajustes, preguntas frecuentes y propuesta de privacidad. |
| Calculadora | Dos ingresos, alquiler y otros gastos; 50/50 y proporcional con céntimos exactos; cero ingresos, déficit, validación y ejemplo ficticio. Comparte solo la herramienta, no resultados/importes privados. |
| Offline | Lista cerrada de assets públicos; navegación cacheada por ruta, sin devolver el inicio en la demo o calculadora. GitHub Pages bajo `/ledger-app/` comprobado mediante prueba. |
| Accesibilidad | Se permite zoom en móvil; nuevos formularios tienen etiquetas y foco visible. Sin librerías de producción nuevas. |
| Analítica | Eventos de valor, hitos deduplicados, validación estricta de nombres/valores, sin sondeo de guardas cada segundo; corrige Response 204 con cuerpo. |
| Distribución | Beta 1.6.1, caché nueva, manifest, changelog, documentación y CI ampliada. |

No se han rediseñado todos los gráficos ni reescrito el formulario principal: se conservan filtros por cuenta/divisa y las capacidades actuales. La mejora de captura inicial se apoya en la guía/demo; una simplificación adicional requiere observar uso después de publicar la instrumentación.

## Métricas reales (PostHog)

Proyecto 294006, zona Europe/Madrid. Corte reproducible **23/10/2026 16:32:34 CEST** (`2026-10-23T14:32:34.396Z`). Consultas nativas con `filterTestAccounts:true`, que excluye cohorte **262989 Internal / Test users**; en esta consulta la cohorte tenía cero miembros. No se han enviado eventos de prueba reales a PostHog.

| Ventana | Identidades activas (`ledger_active`, únicas) | Aperturas (`ledger_session_started`, total) | Identidades con evento legacy `ledger_install` | Identidades con uso de función |
| --- | ---: | ---: | ---: | ---: |
| Desde 04/10 a corte | 14 | 123 | 13 | 1 |
| Últimas 168 horas exactas | 4 | 36 | 1 | 0 |
| Últimas 24 horas exactas | 3 | 8 | 0 | 0 |

Retención primera cohorte semanal iniciada el 4 octubre: 13 identidades iniciales; 3 en semana siguiente (**23,1 %**), 3 en segunda semana. Las columnas futuras/incompletas no se interpretan como abandono. El único valor de `feature` observado es `migration-receiver-open`; la instrumentación antigua no permite concluir que las demás funciones no se utilizan.

**13 eventos legacy NO equivalen a 13 instalaciones PWA verificadas**: el código los enviaba en la primera sesión con consentimiento. Se conserva la historia y se deja de emitir ese evento. Tampoco son 14 personas verificadas: un navegador/dispositivo puede generar una identidad diferente; la analítica voluntaria omite a quien no consiente.

Dashboard creado y consultas ejecutadas: [Ledger · Crecimiento y activación](https://eu.posthog.com/project/294006/dashboard/1049553). Ocho paneles históricos: actividad diaria, identidades únicas de 7/30 días, nuevas identidades, aperturas semanales, retención, funciones y versiones. Dos paneles nuevos están rotulados **pendientes de Beta 1.6.1**: activación e instalación verificada; su vacío no acredita cero activación/instalaciones. Las ventanas relativas del dashboard siguen el calendario de PostHog; la tabla anterior usa cortes exactos. Queries reproducibles en [analytics-dashboard.json](analytics-dashboard.json).

No se obtuvo permiso de lectura del catálogo gobernado de métricas; su vista SQL no devolvió definiciones. Se documentan definiciones del proyecto sin declararlas métricas corporativas aprobadas.

### Contrato de instrumentación 4

- `ledger_session_started`: una apertura por carga con consentimiento y conexión; no login de Supabase.
- `ledger_active`: apertura y regreso con foco/conexión en un nuevo día Europe/Madrid. Las recargas no alteran conteos de identidades únicas.
- `ledger_screen_view`: pantalla de lista cerrada, una vez por pantalla/carga.
- `ledger_feature_used`: acciones confirmadas como guardar movimiento/presupuesto, abrir estadísticas, preparar exportación, comenzar registro, crear espacio o aceptar invitación. Nunca recibe la entrada del formulario ni identificadores de usuario/espacio.
- `ledger_milestone`: `first-measured-open`, `first-configuration` (divisa/actualización FX o día de ciclo guardados), `first-transaction` (nuevo movimiento, no edición), `first-budget` (nueva categoría presupuestada), `verified-pwa-install` (evento `appinstalled`). Todos significan **primer hito observado después del consentimiento**, no reconstrucción histórica.
- Exportaciones se miden tras preparar e iniciar descarga, sin poder certificar que el usuario conserve el archivo. Registro iniciado no implica cuenta creada.
- Safari iOS no expone `appinstalled`: no se inventa verificación usando solo modo standalone. Cobertura de instalaciones parcial.
- SDK anónimo existente, sin `identify`, sin grabaciones/autocaptura/perfiles, geolocalización desactivada para eventos nuevos y sin URLs/textos libres. No se han borrado ni modificado eventos históricos que pudieran tener enriquecimiento geográfico.
- `before_send` revalida consentimiento y filtra propiedades/valores. Los hitos usan marcadores de envío al SDK; es telemetría de mejor esfuerzo, no un acuse de entrega del servidor ni un registro contable exactamente una vez entre pestañas. Borrar almacenamiento puede volver a medirlos.

Referencia oficial: [Capture API](https://posthog.com/docs/api/capture), [eventos anónimos](https://posthog.com/docs/data/anonymous-vs-identified-events). No se usa la analítica para autorizar acceso a datos o Premium.

## Pruebas y límites

Comandos de aceptación: `npm ci --ignore-scripts`, `python scripts/smoke_check.py`, `npm test`, `git diff --check`. Resultados finales y CI enlazados en el PR.

- 216 regresiones sintéticas en seis idiomas; 26 comprobaciones multidivisa/XML/transferencias/exportación; 5 grupos de ciclos futuros.
- 39 controles PostgreSQL de autorización, 20 integración HTTP/sincronización, 12 aislamiento DOM; invitaciones, sesiones, recuperación y carreras cubiertas por suites específicas.
- Pruebas nuevas: onboarding/reapertura/conservación byte a byte, demo CRUD sin red/storage, 6 grupos calculadora/DOM/SEO, consentimiento y privacidad analítica, rollback por fallo de persistencia y caché por ruta/subdirectorio.
- Fixtures ficticias y PGlite/SDK real con transporte simulado. No se han creado usuarios ni cambiado contraseñas reales durante esta revisión. La revisión alojada de Supabase fue de permisos/metadatos, no una prueba manual de dos iPhones ni de las cuentas del propietario.
- Sin validación visual o iPhone físico, mediciones Lighthouse, prueba de consumo energético, captura real nueva ni verificación de instalación/offline en Safari. Estas limitaciones impiden afirmar validación móvil integral.

## SEO, crecimiento, Premium y coste

SEO implementado: canonical, títulos/descripciones, OG con icono auténtico, datos estructurados sin testimonios/valoraciones inventadas, sitemap, enlaces y contenido original. `robots.txt` bajo el subdirectorio de Pages no controla la raíz del dominio. Search Console e indexación no se han validado. Capturas reales pendientes; no se han fabricado imágenes.

[Investigación de crecimiento y Premium](GROWTH_PREMIUM_RESEARCH.md): fuentes primarias de precios, hipótesis SEO sin volumen inventado, experimentos, cuatro semanas de publicaciones, guiones y textos. No se ha publicado ni contactado a nadie. Se estudian 3,99 €/mes y 29,99 €/año sin asumir conversión, disposición a pagar ni beneficio neto.

Premium es **arquitectura documentada, no suscripción implementada**: catálogo Free conservado; derechos futuros comprobados en servidor; restauración mediante identidad opcional y verificación del proveedor; nunca un booleano local que autorice acceso backend. Pagos, webhooks, sincronización Personal y backups automáticos aún no están implementados. No se ha instalado pasarela ni bloqueado una función gratuita.

**Gasto nuevo contratado: 0 €.** Landing/demo/calculadora son estáticas y calculan localmente; no necesitan base adicional. Coste marginal previsto de esta fase: 0 € mientras el uso permanezca en los límites de las cuentas existentes. No se ha auditado facturación privada ni prometido coste total cero: backend, analítica, almacenamiento y mantenimiento futuros dependen de cuotas y uso. No hay procesos recurrentes de Work ni automatizaciones creadas.

## Pendientes por impacto

1. Validación aislada en Safari/PWA iPhone y dos dispositivos de registro/recuperación, invitación, sesión persistente y conflicto; revisar visualmente landing/demo/calculadora. Mantener cambios de esta rama fuera de producción hasta aceptar los límites de la revisión y superar CI.
2. Publicar la versión validada; comprobar eventos con consentimiento y exclusión real de identidades de prueba. La cohorte vacía no excluye pruebas por arte de magia. Revisar activación, retención y 50 MAU medidos antes de extender funciones.
3. Incorporar capturas con datos ficticios y verificar sitemap en Search Console con una propiedad autorizada. No hace falta comprar dominio.
4. Revisar disponibilidad de protección de contraseñas filtradas sin activar costes; completar evidencia alojada de Auth antes de cualquier cambio futuro del backend.
5. Experimentos orgánicos del plan, sin automatizar publicaciones externas. Decidir Premium tras señales de utilidad y entrevistas voluntarias; implementar derechos/pagos solo con autorización posterior.
