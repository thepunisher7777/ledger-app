(() => {
  'use strict';

  const STORAGE_KEY = 'ledger.ui.language.v1';
  const SUPPORTED = ['es','en','fr','de','it','pt'];
  const LOCALES = { es:'es-ES', en:'en-GB', fr:'fr-FR', de:'de-DE', it:'it-IT', pt:'pt-PT' };

  const D = {
    en: {
      'Inicio':'Home','Movimientos':'Transactions','Estadísticas':'Statistics','Plan':'Plan','Ajustes':'Settings',
      'Año':'Year','Mes':'Month','Semana':'Week','Día':'Day','Todo':'All','Categorías':'Categories','Ver todas':'View all',
      'Resumen financiero':'Financial summary','Libre del ciclo':'Free this cycle','Saldo real':'Actual balance','periodo actual':'current period',
      'Buscar movimiento':'Search transaction','Todos':'All','Resumen':'Summary','Ingresos totales':'Total income','Gastos totales':'Total expenses',
      'Balance':'Balance','Ticket medio':'Average transaction','Panel de decisiones':'Decision panel','Dinero flexible mensual':'Monthly flexible money',
      'Compromisos / ingresos':'Commitments / income','Próximos 30 días':'Next 30 days','Cobertura de compromisos':'Commitment coverage',
      'Calidad de datos':'Data quality','Comparativa':'Comparison','Calendario financiero':'Financial calendar','Ingresos registrados':'Recorded income',
      'Gastos registrados':'Recorded expenses','Fijos pendientes':'Pending recurring','Presupuestos':'Budgets','Sin límites por categoría':'No category limits',
      'Movimientos fijos':'Recurring transactions','Registrar':'Record','Editar':'Edit','Importar Monefy / CSV':'Import Monefy / CSV','Importar':'Import',
      'Exportar CSV':'Export CSV','Exportar':'Export','Exportar Excel':'Export Excel','Copia de seguridad':'Backup','Guardar':'Save','Restaurar copia':'Restore backup',
      'Restaurar':'Restore','Estado anterior':'Previous state','Recuperar':'Recover','Situación financiera global':'Overall financial position','Activos':'Assets',
      'Deudas':'Debts','Patrimonio neto':'Net worth','Conciliar':'Reconcile','Ciclo financiero':'Financial cycle','Día de inicio':'Start day','Semana empieza':'Week starts',
      'Categorías personalizadas':'Custom categories','Datos locales':'Local data','Analítica anónima':'Anonymous analytics','Desactivar':'Disable','Activar':'Enable',
      'Face ID / biometría':'Face ID / biometrics','Historial Monefy cargado':'Imported Monefy history','Borrar todos los datos':'Delete all data','Borrar':'Delete',
      'Beta cerrada':'Closed beta','Enviar feedback':'Send feedback','Instalar Ledger':'Install Ledger','Idioma':'Language','Automático (dispositivo)':'Automatic (device)',
      'Añadir gasto':'Add expense','Añadir ingreso':'Add income','Gasto':'Expense','Ingreso':'Income','Importe':'Amount','Categoría':'Category','Seleccionada':'Selected',
      'Nota':'Note','Cuenta':'Account','Fecha':'Date','Más opciones':'More options','Guardar movimiento':'Save transaction','Nueva':'New','Eliminar':'Delete',
      'Préstamo':'Loan','Préstamos':'Loans','Capital pendiente':'Outstanding principal','Capital amortizado':'Principal repaid','Cuota mensual':'Monthly payment',
      'Progreso':'Progress','Registrar cuota':'Record payment','Evolución de la deuda':'Debt evolution','Simulador de amortización':'Repayment simulator',
      'Historial de cuotas':'Payment history','Gasto por categorías':'Spending by category','Evolución de 6 ciclos':'6-cycle trend','Calendario':'Calendar',
      'Entradas previstas':'Expected income','Salidas previstas':'Expected expenses','Balance previsto fijo':'Expected recurring balance','Mismo avance del ciclo anterior':'Same progress in previous cycle',
      'Sin datos':'No data','Sin cuotas registradas':'No payments recorded','Sin importación inicial':'No initial import','Sin categorías':'No categories','Sin movimientos':'No transactions',
      'Comida':'Food','Automóvil':'Car','Casa':'Home','Comunicaciones':'Communications','Deportes':'Sports','Entretenimiento':'Entertainment','Facturas':'Bills',
      'Higiene':'Personal care','Mascotas':'Pets','Regalos':'Gifts','Restaurante':'Dining','Ropa':'Clothing','Salud':'Health','Taxi':'Taxi','Transporte':'Transport',
      'Ahorros':'Savings','Depósitos':'Deposits','Salario':'Salary','Otros':'Other','Banco':'Bank','Ahorro':'Savings','Inversión':'Investment','Otra':'Other',
      'Principal':'Main','Transferencia':'Transfer','Movimiento dividido':'Split transaction','DIVIDIDO':'SPLIT','PRÉSTAMO':'LOAN','DÍA SELECCIONADO':'SELECTED DAY','PROGRAMADOS':'SCHEDULED',
      'Ahora no':'Not now','Permitir analítica anónima':'Allow anonymous analytics','Analítica anónima de la beta':'Anonymous beta analytics'
    },
    fr: {
      'Inicio':'Accueil','Movimientos':'Transactions','Estadísticas':'Statistiques','Plan':'Plan','Ajustes':'Réglages','Año':'Année','Mes':'Mois','Semana':'Semaine','Día':'Jour','Todo':'Tout',
      'Categorías':'Catégories','Ver todas':'Voir tout','Resumen financiero':'Résumé financier','Libre del ciclo':'Disponible sur le cycle','Saldo real':'Solde réel','periodo actual':'période actuelle',
      'Buscar movimiento':'Rechercher une transaction','Todos':'Tous','Resumen':'Résumé','Ingresos totales':'Revenus totaux','Gastos totales':'Dépenses totales','Balance':'Solde',
      'Ticket medio':'Transaction moyenne','Panel de decisiones':'Tableau de décision','Dinero flexible mensual':'Argent flexible mensuel','Compromisos / ingresos':'Engagements / revenus',
      'Próximos 30 días':'30 prochains jours','Cobertura de compromisos':'Couverture des engagements','Calidad de datos':'Qualité des données','Comparativa':'Comparaison',
      'Calendario financiero':'Calendrier financier','Ingresos registrados':'Revenus enregistrés','Gastos registrados':'Dépenses enregistrées','Fijos pendientes':'Récurrents en attente',
      'Presupuestos':'Budgets','Sin límites por categoría':'Aucune limite par catégorie','Movimientos fijos':'Transactions récurrentes','Registrar':'Enregistrer','Editar':'Modifier',
      'Importar Monefy / CSV':'Importer Monefy / CSV','Importar':'Importer','Exportar CSV':'Exporter CSV','Exportar':'Exporter','Exportar Excel':'Exporter Excel','Copia de seguridad':'Sauvegarde',
      'Guardar':'Sauvegarder','Restaurar copia':'Restaurer la sauvegarde','Restaurar':'Restaurer','Estado anterior':'État précédent','Recuperar':'Récupérer','Situación financiera global':'Situation financière globale',
      'Activos':'Actifs','Deudas':'Dettes','Patrimonio neto':'Patrimoine net','Conciliar':'Rapprocher','Ciclo financiero':'Cycle financier','Día de inicio':'Jour de début','Semana empieza':'Début de semaine',
      'Categorías personalizadas':'Catégories personnalisées','Datos locales':'Données locales','Analítica anónima':'Analyse anonyme','Desactivar':'Désactiver','Activar':'Activer','Borrar':'Supprimer',
      'Beta cerrada':'Bêta fermée','Enviar feedback':'Envoyer un retour','Instalar Ledger':'Installer Ledger','Idioma':'Langue','Automático (dispositivo)':'Automatique (appareil)',
      'Añadir gasto':'Ajouter une dépense','Añadir ingreso':'Ajouter un revenu','Gasto':'Dépense','Ingreso':'Revenu','Importe':'Montant','Categoría':'Catégorie','Seleccionada':'Sélectionnée','Nota':'Note','Cuenta':'Compte','Fecha':'Date','Más opciones':'Plus d’options','Guardar movimiento':'Enregistrer','Nueva':'Nouvelle','Eliminar':'Supprimer',
      'Comida':'Alimentation','Automóvil':'Voiture','Casa':'Maison','Comunicaciones':'Communications','Deportes':'Sport','Entretenimiento':'Divertissement','Facturas':'Factures','Higiene':'Hygiène','Mascotas':'Animaux','Regalos':'Cadeaux','Restaurante':'Restaurant','Ropa':'Vêtements','Salud':'Santé','Taxi':'Taxi','Transporte':'Transport','Ahorros':'Épargne','Depósitos':'Dépôts','Salario':'Salaire','Otros':'Autres','Banco':'Banque','Ahorro':'Épargne','Inversión':'Investissement','Otra':'Autre','Principal':'Principal','Transferencia':'Virement','Préstamo':'Prêt','Préstamos':'Prêts','DÍA SELECCIONADO':'JOUR SÉLECTIONNÉ','PROGRAMADOS':'PLANIFIÉS','Ahora no':'Pas maintenant','Permitir analítica anónima':'Autoriser l’analyse anonyme','Analítica anónima de la beta':'Analyse anonyme de la bêta'
    },
    de: {
      'Inicio':'Start','Movimientos':'Buchungen','Estadísticas':'Statistiken','Plan':'Plan','Ajustes':'Einstellungen','Año':'Jahr','Mes':'Monat','Semana':'Woche','Día':'Tag','Todo':'Alles',
      'Categorías':'Kategorien','Ver todas':'Alle anzeigen','Resumen financiero':'Finanzübersicht','Libre del ciclo':'Frei im Zyklus','Saldo real':'Tatsächlicher Saldo','periodo actual':'aktueller Zeitraum',
      'Buscar movimiento':'Buchung suchen','Todos':'Alle','Resumen':'Übersicht','Ingresos totales':'Gesamteinnahmen','Gastos totales':'Gesamtausgaben','Balance':'Saldo','Ticket medio':'Durchschnittsbuchung',
      'Panel de decisiones':'Entscheidungsübersicht','Dinero flexible mensual':'Monatlich flexibel','Compromisos / ingresos':'Verpflichtungen / Einnahmen','Próximos 30 días':'Nächste 30 Tage','Cobertura de compromisos':'Deckung der Verpflichtungen',
      'Calidad de datos':'Datenqualität','Comparativa':'Vergleich','Calendario financiero':'Finanzkalender','Ingresos registrados':'Erfasste Einnahmen','Gastos registrados':'Erfasste Ausgaben','Fijos pendientes':'Offene Fixkosten',
      'Presupuestos':'Budgets','Sin límites por categoría':'Keine Kategorielimits','Movimientos fijos':'Wiederkehrende Buchungen','Registrar':'Buchen','Editar':'Bearbeiten','Importar Monefy / CSV':'Monefy / CSV importieren','Importar':'Importieren','Exportar CSV':'CSV exportieren','Exportar':'Exportieren','Exportar Excel':'Excel exportieren','Copia de seguridad':'Sicherung','Guardar':'Speichern','Restaurar copia':'Sicherung wiederherstellen','Restaurar':'Wiederherstellen','Estado anterior':'Vorheriger Stand','Recuperar':'Wiederherstellen','Situación financiera global':'Gesamtfinanzlage','Activos':'Vermögen','Deudas':'Schulden','Patrimonio neto':'Nettovermögen','Conciliar':'Abgleichen','Ciclo financiero':'Finanzzyklus','Día de inicio':'Starttag','Semana empieza':'Wochenstart','Categorías personalizadas':'Eigene Kategorien','Datos locales':'Lokale Daten','Analítica anónima':'Anonyme Analyse','Desactivar':'Deaktivieren','Activar':'Aktivieren','Borrar':'Löschen','Beta cerrada':'Geschlossene Beta','Enviar feedback':'Feedback senden','Instalar Ledger':'Ledger installieren','Idioma':'Sprache','Automático (dispositivo)':'Automatisch (Gerät)','Añadir gasto':'Ausgabe hinzufügen','Añadir ingreso':'Einnahme hinzufügen','Gasto':'Ausgabe','Ingreso':'Einnahme','Importe':'Betrag','Categoría':'Kategorie','Seleccionada':'Ausgewählt','Nota':'Notiz','Cuenta':'Konto','Fecha':'Datum','Más opciones':'Mehr Optionen','Guardar movimiento':'Buchung speichern','Nueva':'Neu','Eliminar':'Löschen','Comida':'Lebensmittel','Automóvil':'Auto','Casa':'Wohnen','Comunicaciones':'Kommunikation','Deportes':'Sport','Entretenimiento':'Unterhaltung','Facturas':'Rechnungen','Higiene':'Pflege','Mascotas':'Haustiere','Regalos':'Geschenke','Restaurante':'Restaurant','Ropa':'Kleidung','Salud':'Gesundheit','Taxi':'Taxi','Transporte':'Transport','Ahorros':'Sparen','Depósitos':'Einlagen','Salario':'Gehalt','Otros':'Sonstiges','Banco':'Bank','Ahorro':'Sparen','Inversión':'Investition','Otra':'Sonstiges','Principal':'Hauptkonto','Transferencia':'Überweisung','Préstamo':'Darlehen','Préstamos':'Darlehen','DÍA SELECCIONADO':'AUSGEWÄHLTER TAG','PROGRAMADOS':'GEPLANT','Ahora no':'Jetzt nicht','Permitir analítica anónima':'Anonyme Analyse erlauben','Analítica anónima de la beta':'Anonyme Beta-Analyse'
    },
    it: {
      'Inicio':'Home','Movimientos':'Movimenti','Estadísticas':'Statistiche','Plan':'Piano','Ajustes':'Impostazioni','Año':'Anno','Mes':'Mese','Semana':'Settimana','Día':'Giorno','Todo':'Tutto','Categorías':'Categorie','Ver todas':'Vedi tutte','Resumen financiero':'Riepilogo finanziario','Libre del ciclo':'Disponibile nel ciclo','Saldo real':'Saldo reale','periodo actual':'periodo attuale','Buscar movimiento':'Cerca movimento','Todos':'Tutti','Resumen':'Riepilogo','Ingresos totales':'Entrate totali','Gastos totales':'Spese totali','Balance':'Saldo','Ticket medio':'Movimento medio','Panel de decisiones':'Pannello decisionale','Dinero flexible mensual':'Denaro flessibile mensile','Compromisos / ingresos':'Impegni / entrate','Próximos 30 días':'Prossimi 30 giorni','Cobertura de compromisos':'Copertura impegni','Calidad de datos':'Qualità dati','Comparativa':'Confronto','Calendario financiero':'Calendario finanziario','Ingresos registrados':'Entrate registrate','Gastos registrados':'Spese registrate','Fijos pendientes':'Ricorrenti in sospeso','Presupuestos':'Budget','Sin límites por categoría':'Nessun limite per categoria','Movimientos fijos':'Movimenti ricorrenti','Registrar':'Registra','Editar':'Modifica','Importar Monefy / CSV':'Importa Monefy / CSV','Importar':'Importa','Exportar CSV':'Esporta CSV','Exportar':'Esporta','Exportar Excel':'Esporta Excel','Copia de seguridad':'Backup','Guardar':'Salva','Restaurar copia':'Ripristina backup','Restaurar':'Ripristina','Estado anterior':'Stato precedente','Recuperar':'Recupera','Situación financiera global':'Situazione finanziaria globale','Activos':'Attività','Deudas':'Debiti','Patrimonio neto':'Patrimonio netto','Conciliar':'Riconcilia','Ciclo financiero':'Ciclo finanziario','Día de inicio':'Giorno iniziale','Semana empieza':'Inizio settimana','Categorías personalizadas':'Categorie personalizzate','Datos locales':'Dati locali','Analítica anónima':'Analisi anonima','Desactivar':'Disattiva','Activar':'Attiva','Borrar':'Elimina','Beta cerrada':'Beta chiusa','Enviar feedback':'Invia feedback','Instalar Ledger':'Installa Ledger','Idioma':'Lingua','Automático (dispositivo)':'Automatico (dispositivo)','Añadir gasto':'Aggiungi spesa','Añadir ingreso':'Aggiungi entrata','Gasto':'Spesa','Ingreso':'Entrata','Importe':'Importo','Categoría':'Categoria','Seleccionada':'Selezionata','Nota':'Nota','Cuenta':'Conto','Fecha':'Data','Más opciones':'Altre opzioni','Guardar movimiento':'Salva movimento','Nueva':'Nuova','Eliminar':'Elimina','Comida':'Alimentari','Automóvil':'Auto','Casa':'Casa','Comunicaciones':'Comunicazioni','Deportes':'Sport','Entretenimiento':'Intrattenimento','Facturas':'Bollette','Higiene':'Igiene','Mascotas':'Animali','Regalos':'Regali','Restaurante':'Ristorante','Ropa':'Abbigliamento','Salud':'Salute','Taxi':'Taxi','Transporte':'Trasporti','Ahorros':'Risparmi','Depósitos':'Depositi','Salario':'Stipendio','Otros':'Altro','Banco':'Banca','Ahorro':'Risparmio','Inversión':'Investimento','Otra':'Altro','Principal':'Principale','Transferencia':'Trasferimento','Préstamo':'Prestito','Préstamos':'Prestiti','DÍA SELECCIONADO':'GIORNO SELEZIONATO','PROGRAMADOS':'PROGRAMMATI','Ahora no':'Non ora','Permitir analítica anónima':'Consenti analisi anonima','Analítica anónima de la beta':'Analisi anonima della beta'
    },
    pt: {
      'Inicio':'Início','Movimientos':'Movimentos','Estadísticas':'Estatísticas','Plan':'Plano','Ajustes':'Definições','Año':'Ano','Mes':'Mês','Semana':'Semana','Día':'Dia','Todo':'Tudo','Categorías':'Categorias','Ver todas':'Ver todas','Resumen financiero':'Resumo financeiro','Libre del ciclo':'Livre no ciclo','Saldo real':'Saldo real','periodo actual':'período atual','Buscar movimiento':'Procurar movimento','Todos':'Todos','Resumen':'Resumo','Ingresos totales':'Receitas totais','Gastos totales':'Despesas totais','Balance':'Saldo','Ticket medio':'Movimento médio','Panel de decisiones':'Painel de decisões','Dinero flexible mensual':'Dinheiro flexível mensal','Compromisos / ingresos':'Compromissos / receitas','Próximos 30 días':'Próximos 30 dias','Cobertura de compromisos':'Cobertura de compromissos','Calidad de datos':'Qualidade dos dados','Comparativa':'Comparação','Calendario financiero':'Calendário financeiro','Ingresos registrados':'Receitas registadas','Gastos registrados':'Despesas registadas','Fijos pendientes':'Fixos pendentes','Presupuestos':'Orçamentos','Sin límites por categoría':'Sem limites por categoria','Movimientos fijos':'Movimentos fixos','Registrar':'Registar','Editar':'Editar','Importar Monefy / CSV':'Importar Monefy / CSV','Importar':'Importar','Exportar CSV':'Exportar CSV','Exportar':'Exportar','Exportar Excel':'Exportar Excel','Copia de seguridad':'Cópia de segurança','Guardar':'Guardar','Restaurar copia':'Restaurar cópia','Restaurar':'Restaurar','Estado anterior':'Estado anterior','Recuperar':'Recuperar','Situación financiera global':'Situação financeira global','Activos':'Ativos','Deudas':'Dívidas','Patrimonio neto':'Património líquido','Conciliar':'Conciliar','Ciclo financiero':'Ciclo financeiro','Día de inicio':'Dia de início','Semana empieza':'Semana começa','Categorías personalizadas':'Categorias personalizadas','Datos locales':'Dados locais','Analítica anónima':'Análise anónima','Desactivar':'Desativar','Activar':'Ativar','Borrar':'Apagar','Beta cerrada':'Beta fechada','Enviar feedback':'Enviar feedback','Instalar Ledger':'Instalar Ledger','Idioma':'Idioma','Automático (dispositivo)':'Automático (dispositivo)','Añadir gasto':'Adicionar despesa','Añadir ingreso':'Adicionar receita','Gasto':'Despesa','Ingreso':'Receita','Importe':'Montante','Categoría':'Categoria','Seleccionada':'Selecionada','Nota':'Nota','Cuenta':'Conta','Fecha':'Data','Más opciones':'Mais opções','Guardar movimiento':'Guardar movimento','Nueva':'Nova','Eliminar':'Eliminar','Comida':'Alimentação','Automóvil':'Automóvel','Casa':'Casa','Comunicaciones':'Comunicações','Deportes':'Desporto','Entretenimiento':'Entretenimento','Facturas':'Contas','Higiene':'Higiene','Mascotas':'Animais','Regalos':'Presentes','Restaurante':'Restaurante','Ropa':'Roupa','Salud':'Saúde','Taxi':'Táxi','Transporte':'Transporte','Ahorros':'Poupanças','Depósitos':'Depósitos','Salario':'Salário','Otros':'Outros','Banco':'Banco','Ahorro':'Poupança','Inversión':'Investimento','Otra':'Outra','Principal':'Principal','Transferencia':'Transferência','Préstamo':'Empréstimo','Préstamos':'Empréstimos','DÍA SELECCIONADO':'DIA SELECIONADO','PROGRAMADOS':'PROGRAMADOS','Ahora no':'Agora não','Permitir analítica anónima':'Permitir análise anónima','Analítica anónima de la beta':'Análise anónima da beta'
    }
  };

  const EXT = {
  "en": {
    "Ingresos": "Income",
    "Gastado": "Spent",
    "Patrimonio": "Net worth",
    "Últimos movimientos": "Recent transactions",
    "Próximos compromisos": "Upcoming commitments",
    "Disponible después de gastos, fijos pendientes y ahorro objetivo.": "Available after expenses, pending recurring payments and savings target.",
    "Gastos": "Expenses",
    "Periodo actual": "Current period",
    "Periodo seleccionado": "Selected period",
    "Ahorro mensual": "Monthly savings",
    "Reservado antes de calcular tu dinero libre.": "Reserved before calculating your free money.",
    "Activos globales": "Total assets",
    "Activos menos deudas pendientes.": "Assets minus outstanding debt.",
    "Deudas y préstamos": "Debts & loans",
    "Próximas cuotas": "Upcoming payments",
    "Día de cobro": "Payment day",
    "Mayor gasto": "Largest expense",
    "Mayor ingreso": "Largest income",
    "Media mov.": "Avg. transaction",
    "Día más caro": "Most expensive day",
    "Día semanal más caro": "Most expensive weekday",
    "Mayor racha sin gasto": "Longest no-spend streak",
    "Hábitos útiles": "Useful habits",
    "Posibles recurrentes": "Possible recurring expenses",
    "Fin de semana": "Weekend",
    "Porcentaje del gasto hecho sábado o domingo.": "Share of spending made on Saturday or Sunday.",
    "Datos pensados para responder “qué tengo comprometido, qué me queda flexible y qué viene después”.": "Data designed to answer “what is committed, what stays flexible and what comes next”.",
    "Saldo líquido registrado ÷ compromisos mensuales.": "Recorded liquid balance ÷ monthly commitments.",
    "Ingresos base − fijos − cuotas − objetivo de ahorro.": "Base income − recurring costs − payments − savings target.",
    "Sin movimientos": "No transactions",
    "No hay pagos o ingresos fijos próximos configurados.": "No upcoming recurring payments or income configured.",
    "No tienes movimientos fijos o cuotas previstos en los próximos 30 días.": "You have no recurring transactions or payments scheduled in the next 30 days.",
    "Comprobando instalación…": "Checking installation…",
    "Datos locales": "Local data",
    "Situación financiera global": "Overall financial position",
    "Los saldos conciliados se actualizan con los movimientos que registres desde ese momento.": "Reconciled balances update with transactions recorded from that point onward.",
    "Movimientos, saldos y deudas se guardan en este dispositivo.": "Transactions, balances and debts are stored on this device.",
    "Importación incremental sin duplicar movimientos.": "Incremental import without duplicating transactions.",
    "Incluye gastos, ingresos y transferencias.": "Includes expenses, income and transfers.",
    "JSON con todos tus datos de Ledger.": "JSON with all your Ledger data.",
    "Recupera una copia JSON de Ledger.": "Restore a Ledger JSON backup.",
    "Recuperación local del último cambio importante.": "Local recovery of the latest important change.",
    "Idioma": "Language",
    "Ledger puede seguir el idioma del dispositivo o usar uno fijo.": "Ledger can follow the device language or use a fixed language.",
    "El idioma solo cambia la interfaz. Tus categorías internas, copias de seguridad y datos financieros no se modifican.": "Language only changes the interface. Your internal categories, backups and financial data are not modified.",
    "Semana empieza": "Week starts",
    "Saldo actual": "Current balance",
    "Nombre": "Name",
    "Tipo": "Type",
    "Añadir cuenta": "Add account",
    "Tu ciclo actual:": "Your current cycle:",
    "Categorías personalizadas": "Custom categories",
    "Las categorías de sistema se conservan; aquí puedes retirar las que hayas creado tú.": "System categories are preserved; here you can remove categories you created.",
    "No has creado categorías personalizadas.": "You have not created custom categories.",
    "Borrar todos los datos": "Delete all data",
    "Elimina movimientos, objetivos, presupuestos, fijos, cuentas y deudas.": "Deletes transactions, goals, budgets, recurring items, accounts and debts.",
    "Beta cerrada": "Closed beta",
    "Préstamos": "Loans",
    "Ahorro": "Savings",
    "Inversión": "Investment",
    "Otra": "Other",
    "Banco": "Bank",
    "Principal": "Main",
    "Ingreso": "Income",
    "Gasto": "Expense",
    "REGISTRADO": "RECORDED",
    "PAUSADO": "PAUSED",
    "LISTO": "READY"
  },
  "fr": {
    "Ingresos": "Revenus",
    "Gastado": "Dépensé",
    "Patrimonio": "Patrimoine",
    "Últimos movimientos": "Dernières transactions",
    "Próximos compromisos": "Engagements à venir",
    "Disponible después de gastos, fijos pendientes y ahorro objetivo.": "Disponible après les dépenses, les récurrents en attente et l’objectif d’épargne.",
    "Gastos": "Dépenses",
    "Periodo actual": "Période actuelle",
    "Periodo seleccionado": "Période sélectionnée",
    "Ahorro mensual": "Épargne mensuelle",
    "Reservado antes de calcular tu dinero libre.": "Réservé avant de calculer votre argent disponible.",
    "Activos globales": "Actifs totaux",
    "Activos menos deudas pendientes.": "Actifs moins dettes restantes.",
    "Deudas y préstamos": "Dettes et prêts",
    "Próximas cuotas": "Prochaines échéances",
    "Día de cobro": "Jour de paiement",
    "Mayor gasto": "Dépense la plus élevée",
    "Mayor ingreso": "Revenu le plus élevé",
    "Media mov.": "Transaction moyenne",
    "Día más caro": "Jour le plus coûteux",
    "Día semanal más caro": "Jour de la semaine le plus coûteux",
    "Mayor racha sin gasto": "Plus longue série sans dépense",
    "Hábitos útiles": "Habitudes utiles",
    "Posibles recurrentes": "Récurrents possibles",
    "Fin de semana": "Week-end",
    "Porcentaje del gasto hecho sábado o domingo.": "Part des dépenses effectuées le samedi ou le dimanche.",
    "Datos pensados para responder “qué tengo comprometido, qué me queda flexible y qué viene después”.": "Données conçues pour répondre à « ce qui est engagé, ce qui reste flexible et ce qui vient ensuite ».",
    "Saldo líquido registrado ÷ compromisos mensuales.": "Solde liquide enregistré ÷ engagements mensuels.",
    "Ingresos base − fijos − cuotas − objetivo de ahorro.": "Revenus de base − récurrents − échéances − objectif d’épargne.",
    "No hay pagos o ingresos fijos próximos configurados.": "Aucun paiement ou revenu récurrent à venir configuré.",
    "No tienes movimientos fijos o cuotas previstos en los próximos 30 días.": "Aucune transaction récurrente ni échéance prévue dans les 30 prochains jours.",
    "Comprobando instalación…": "Vérification de l’installation…",
    "Situación financiera global": "Situation financière globale",
    "Los saldos conciliados se actualizan con los movimientos que registres desde ese momento.": "Les soldes rapprochés sont mis à jour avec les transactions enregistrées ensuite.",
    "Movimientos, saldos y deudas se guardan en este dispositivo.": "Les transactions, soldes et dettes sont stockés sur cet appareil.",
    "Importación incremental sin duplicar movimientos.": "Importation incrémentale sans doublons.",
    "Incluye gastos, ingresos y transferencias.": "Inclut dépenses, revenus et virements.",
    "JSON con todos tus datos de Ledger.": "JSON contenant toutes vos données Ledger.",
    "Recupera una copia JSON de Ledger.": "Restaure une sauvegarde JSON de Ledger.",
    "Recuperación local del último cambio importante.": "Récupération locale du dernier changement important.",
    "Ledger puede seguir el idioma del dispositivo o usar uno fijo.": "Ledger peut suivre la langue de l’appareil ou utiliser une langue fixe.",
    "El idioma solo cambia la interfaz. Tus categorías internas, copias de seguridad y datos financieros no se modifican.": "La langue ne change que l’interface. Vos catégories internes, sauvegardes et données financières ne sont pas modifiées.",
    "Saldo actual": "Solde actuel",
    "Nombre": "Nom",
    "Tipo": "Type",
    "Añadir cuenta": "Ajouter un compte",
    "Tu ciclo actual:": "Votre cycle actuel:",
    "Las categorías de sistema se conservan; aquí puedes retirar las que hayas creado tú.": "Les catégories système sont conservées ; vous pouvez supprimer ici celles que vous avez créées.",
    "No has creado categorías personalizadas.": "Vous n’avez créé aucune catégorie personnalisée.",
    "Borrar todos los datos": "Supprimer toutes les données",
    "Elimina movimientos, objetivos, presupuestos, fijos, cuentas y deudas.": "Supprime transactions, objectifs, budgets, récurrents, comptes et dettes.",
    "Principal": "Principal",
    "Ingreso": "Revenu",
    "Gasto": "Dépense",
    "REGISTRADO": "ENREGISTRÉ",
    "PAUSADO": "EN PAUSE",
    "LISTO": "PRÊT"
  },
  "de": {
    "Ingresos": "Einnahmen",
    "Gastado": "Ausgegeben",
    "Patrimonio": "Nettovermögen",
    "Últimos movimientos": "Letzte Buchungen",
    "Próximos compromisos": "Bevorstehende Verpflichtungen",
    "Disponible después de gastos, fijos pendientes y ahorro objetivo.": "Verfügbar nach Ausgaben, offenen Fixkosten und Sparziel.",
    "Gastos": "Ausgaben",
    "Periodo actual": "Aktueller Zeitraum",
    "Periodo seleccionado": "Ausgewählter Zeitraum",
    "Ahorro mensual": "Monatliches Sparziel",
    "Reservado antes de calcular tu dinero libre.": "Reserviert, bevor das frei verfügbare Geld berechnet wird.",
    "Activos globales": "Gesamtvermögen",
    "Activos menos deudas pendientes.": "Vermögen abzüglich offener Schulden.",
    "Deudas y préstamos": "Schulden & Darlehen",
    "Próximas cuotas": "Nächste Raten",
    "Día de cobro": "Zahlungstag",
    "Mayor gasto": "Größte Ausgabe",
    "Mayor ingreso": "Größte Einnahme",
    "Media mov.": "Ø Buchung",
    "Día más caro": "Teuerster Tag",
    "Día semanal más caro": "Teuerster Wochentag",
    "Mayor racha sin gasto": "Längste Serie ohne Ausgaben",
    "Hábitos útiles": "Nützliche Gewohnheiten",
    "Posibles recurrentes": "Mögliche Wiederholungen",
    "Fin de semana": "Wochenende",
    "Porcentaje del gasto hecho sábado o domingo.": "Anteil der Ausgaben am Samstag oder Sonntag.",
    "Datos pensados para responder “qué tengo comprometido, qué me queda flexible y qué viene después”.": "Daten für die Fragen: Was ist gebunden, was bleibt flexibel und was kommt als Nächstes?",
    "Saldo líquido registrado ÷ compromisos mensuales.": "Erfasster liquider Saldo ÷ monatliche Verpflichtungen.",
    "Ingresos base − fijos − cuotas − objetivo de ahorro.": "Basiseinnahmen − Fixkosten − Raten − Sparziel.",
    "No hay pagos o ingresos fijos próximos configurados.": "Keine bevorstehenden wiederkehrenden Zahlungen oder Einnahmen eingerichtet.",
    "No tienes movimientos fijos o cuotas previstos en los próximos 30 días.": "Keine wiederkehrenden Buchungen oder Raten in den nächsten 30 Tagen geplant.",
    "Comprobando instalación…": "Installation wird geprüft…",
    "Situación financiera global": "Gesamtfinanzlage",
    "Los saldos conciliados se actualizan con los movimientos que registres desde ese momento.": "Abgeglichene Salden werden ab diesem Zeitpunkt mit neuen Buchungen aktualisiert.",
    "Movimientos, saldos y deudas se guardan en este dispositivo.": "Buchungen, Salden und Schulden werden auf diesem Gerät gespeichert.",
    "Importación incremental sin duplicar movimientos.": "Inkrementeller Import ohne doppelte Buchungen.",
    "Incluye gastos, ingresos y transferencias.": "Enthält Ausgaben, Einnahmen und Überweisungen.",
    "JSON con todos tus datos de Ledger.": "JSON mit allen Ledger-Daten.",
    "Recupera una copia JSON de Ledger.": "Stellt eine Ledger-JSON-Sicherung wieder her.",
    "Recuperación local del último cambio importante.": "Lokale Wiederherstellung der letzten wichtigen Änderung.",
    "Ledger puede seguir el idioma del dispositivo o usar uno fijo.": "Ledger kann der Gerätesprache folgen oder eine feste Sprache verwenden.",
    "El idioma solo cambia la interfaz. Tus categorías internas, copias de seguridad y datos financieros no se modifican.": "Die Sprache ändert nur die Oberfläche. Interne Kategorien, Sicherungen und Finanzdaten bleiben unverändert.",
    "Saldo actual": "Aktueller Saldo",
    "Nombre": "Name",
    "Tipo": "Typ",
    "Añadir cuenta": "Konto hinzufügen",
    "Tu ciclo actual:": "Dein aktueller Zyklus:",
    "Las categorías de sistema se conservan; aquí puedes retirar las que hayas creado tú.": "Systemkategorien bleiben erhalten; eigene Kategorien können hier entfernt werden.",
    "No has creado categorías personalizadas.": "Du hast keine eigenen Kategorien erstellt.",
    "Borrar todos los datos": "Alle Daten löschen",
    "Elimina movimientos, objetivos, presupuestos, fijos, cuentas y deudas.": "Löscht Buchungen, Ziele, Budgets, Wiederholungen, Konten und Schulden.",
    "Principal": "Hauptkonto",
    "Ingreso": "Einnahme",
    "Gasto": "Ausgabe",
    "REGISTRADO": "ERFASST",
    "PAUSADO": "PAUSIERT",
    "LISTO": "BEREIT"
  },
  "it": {
    "Ingresos": "Entrate",
    "Gastado": "Speso",
    "Patrimonio": "Patrimonio netto",
    "Últimos movimientos": "Ultimi movimenti",
    "Próximos compromisos": "Impegni prossimi",
    "Disponible después de gastos, fijos pendientes y ahorro objetivo.": "Disponibile dopo spese, ricorrenti in sospeso e obiettivo di risparmio.",
    "Gastos": "Spese",
    "Periodo actual": "Periodo attuale",
    "Periodo seleccionado": "Periodo selezionato",
    "Ahorro mensual": "Risparmio mensile",
    "Reservado antes de calcular tu dinero libre.": "Riservato prima di calcolare il denaro disponibile.",
    "Activos globales": "Attività totali",
    "Activos menos deudas pendientes.": "Attività meno debiti residui.",
    "Deudas y préstamos": "Debiti e prestiti",
    "Próximas cuotas": "Prossime rate",
    "Día de cobro": "Giorno di pagamento",
    "Mayor gasto": "Spesa maggiore",
    "Mayor ingreso": "Entrata maggiore",
    "Media mov.": "Movimento medio",
    "Día más caro": "Giorno più costoso",
    "Día semanal más caro": "Giorno della settimana più costoso",
    "Mayor racha sin gasto": "Serie più lunga senza spese",
    "Hábitos útiles": "Abitudini utili",
    "Posibles recurrentes": "Possibili ricorrenti",
    "Fin de semana": "Fine settimana",
    "Porcentaje del gasto hecho sábado o domingo.": "Percentuale di spesa effettuata sabato o domenica.",
    "Datos pensados para responder “qué tengo comprometido, qué me queda flexible y qué viene después”.": "Dati pensati per capire cosa è impegnato, cosa resta flessibile e cosa viene dopo.",
    "Saldo líquido registrado ÷ compromisos mensuales.": "Saldo liquido registrato ÷ impegni mensili.",
    "Ingresos base − fijos − cuotas − objetivo de ahorro.": "Entrate base − ricorrenti − rate − obiettivo di risparmio.",
    "No hay pagos o ingresos fijos próximos configurados.": "Nessun pagamento o reddito ricorrente imminente configurato.",
    "No tienes movimientos fijos o cuotas previstos en los próximos 30 días.": "Nessun movimento ricorrente o rata prevista nei prossimi 30 giorni.",
    "Comprobando instalación…": "Verifica installazione…",
    "Situación financiera global": "Situazione finanziaria globale",
    "Los saldos conciliados se actualizan con los movimientos que registres desde ese momento.": "I saldi riconciliati si aggiornano con i movimenti registrati da quel momento.",
    "Movimientos, saldos y deudas se guardan en este dispositivo.": "Movimenti, saldi e debiti sono salvati su questo dispositivo.",
    "Importación incremental sin duplicar movimientos.": "Importazione incrementale senza duplicati.",
    "Incluye gastos, ingresos y transferencias.": "Include spese, entrate e trasferimenti.",
    "JSON con todos tus datos de Ledger.": "JSON con tutti i tuoi dati Ledger.",
    "Recupera una copia JSON de Ledger.": "Ripristina un backup JSON di Ledger.",
    "Recuperación local del último cambio importante.": "Ripristino locale dell’ultima modifica importante.",
    "Ledger puede seguir el idioma del dispositivo o usar uno fijo.": "Ledger può seguire la lingua del dispositivo o usarne una fissa.",
    "El idioma solo cambia la interfaz. Tus categorías internas, copias de seguridad y datos financieros no se modifican.": "La lingua cambia solo l’interfaccia. Categorie interne, backup e dati finanziari non vengono modificati.",
    "Saldo actual": "Saldo attuale",
    "Nombre": "Nome",
    "Tipo": "Tipo",
    "Añadir cuenta": "Aggiungi conto",
    "Tu ciclo actual:": "Il tuo ciclo attuale:",
    "Las categorías de sistema se conservan; aquí puedes retirar las que hayas creado tú.": "Le categorie di sistema restano; qui puoi rimuovere quelle create da te.",
    "No has creado categorías personalizadas.": "Non hai creato categorie personalizzate.",
    "Borrar todos los datos": "Elimina tutti i dati",
    "Elimina movimientos, objetivos, presupuestos, fijos, cuentas y deudas.": "Elimina movimenti, obiettivi, budget, ricorrenti, conti e debiti.",
    "Principal": "Principale",
    "Ingreso": "Entrata",
    "Gasto": "Spesa",
    "REGISTRADO": "REGISTRATO",
    "PAUSADO": "IN PAUSA",
    "LISTO": "PRONTO"
  },
  "pt": {
    "Ingresos": "Receitas",
    "Gastado": "Gasto",
    "Patrimonio": "Património líquido",
    "Últimos movimientos": "Últimos movimentos",
    "Próximos compromisos": "Próximos compromissos",
    "Disponible después de gastos, fijos pendientes y ahorro objetivo.": "Disponível após despesas, fixos pendentes e objetivo de poupança.",
    "Gastos": "Despesas",
    "Periodo actual": "Período atual",
    "Periodo seleccionado": "Período selecionado",
    "Ahorro mensual": "Poupança mensal",
    "Reservado antes de calcular tu dinero libre.": "Reservado antes de calcular o dinheiro disponível.",
    "Activos globales": "Ativos totais",
    "Activos menos deudas pendientes.": "Ativos menos dívidas pendentes.",
    "Deudas y préstamos": "Dívidas e empréstimos",
    "Próximas cuotas": "Próximas prestações",
    "Día de cobro": "Dia de pagamento",
    "Mayor gasto": "Maior despesa",
    "Mayor ingreso": "Maior receita",
    "Media mov.": "Movimento médio",
    "Día más caro": "Dia mais caro",
    "Día semanal más caro": "Dia da semana mais caro",
    "Mayor racha sin gasto": "Maior sequência sem gastos",
    "Hábitos útiles": "Hábitos úteis",
    "Posibles recurrentes": "Possíveis recorrentes",
    "Fin de semana": "Fim de semana",
    "Porcentaje del gasto hecho sábado o domingo.": "Percentagem da despesa feita ao sábado ou domingo.",
    "Datos pensados para responder “qué tengo comprometido, qué me queda flexible y qué viene después”.": "Dados pensados para responder ao que está comprometido, ao que fica flexível e ao que vem a seguir.",
    "Saldo líquido registrado ÷ compromisos mensuales.": "Saldo líquido registado ÷ compromissos mensais.",
    "Ingresos base − fijos − cuotas − objetivo de ahorro.": "Receitas base − fixos − prestações − objetivo de poupança.",
    "No hay pagos o ingresos fijos próximos configurados.": "Não existem pagamentos ou receitas fixas próximas configuradas.",
    "No tienes movimientos fijos o cuotas previstos en los próximos 30 días.": "Não há movimentos fixos ou prestações previstos nos próximos 30 dias.",
    "Comprobando instalación…": "A verificar instalação…",
    "Situación financiera global": "Situação financeira global",
    "Los saldos conciliados se actualizan con los movimientos que registres desde ese momento.": "Os saldos conciliados atualizam-se com os movimentos registados a partir desse momento.",
    "Movimientos, saldos y deudas se guardan en este dispositivo.": "Movimentos, saldos e dívidas são guardados neste dispositivo.",
    "Importación incremental sin duplicar movimientos.": "Importação incremental sem duplicar movimentos.",
    "Incluye gastos, ingresos y transferencias.": "Inclui despesas, receitas e transferências.",
    "JSON con todos tus datos de Ledger.": "JSON com todos os teus dados Ledger.",
    "Recupera una copia JSON de Ledger.": "Restaura uma cópia JSON do Ledger.",
    "Recuperación local del último cambio importante.": "Recuperação local da última alteração importante.",
    "Ledger puede seguir el idioma del dispositivo o usar uno fijo.": "O Ledger pode seguir o idioma do dispositivo ou usar um idioma fixo.",
    "El idioma solo cambia la interfaz. Tus categorías internas, copias de seguridad y datos financieros no se modifican.": "O idioma altera apenas a interface. Categorias internas, cópias de segurança e dados financeiros não são modificados.",
    "Saldo actual": "Saldo atual",
    "Nombre": "Nome",
    "Tipo": "Tipo",
    "Añadir cuenta": "Adicionar conta",
    "Tu ciclo actual:": "O teu ciclo atual:",
    "Las categorías de sistema se conservan; aquí puedes retirar las que hayas creado tú.": "As categorias do sistema mantêm-se; aqui podes remover as que criaste.",
    "No has creado categorías personalizadas.": "Ainda não criaste categorias personalizadas.",
    "Borrar todos los datos": "Apagar todos os dados",
    "Elimina movimientos, objetivos, presupuestos, fijos, cuentas y deudas.": "Apaga movimentos, objetivos, orçamentos, fixos, contas e dívidas.",
    "Principal": "Principal",
    "Ingreso": "Receita",
    "Gasto": "Despesa",
    "REGISTRADO": "REGISTADO",
    "PAUSADO": "PAUSADO",
    "LISTO": "PRONTO"
  }
};
  for (const [lang, values] of Object.entries(EXT)) Object.assign(D[lang], values);

  const CATEGORY_KEYS = new Set(['Comida','Automóvil','Casa','Comunicaciones','Deportes','Entretenimiento','Facturas','Higiene','Mascotas','Regalos','Restaurante','Ropa','Salud','Taxi','Transporte','Ahorros','Depósitos','Salario','Otros']);
  const sourceText = new WeakMap();
  const lastApplied = new WeakMap();
  const sourceAttrs = new WeakMap();
  let translating = false;

  const currencyLabels={"en": {"Divisas y conversión": "Currencies and conversion", "Moneda base": "Base currency", "Divisa": "Currency", "Cuentas y divisas": "Accounts and currencies", "Importe recibido": "Amount received", "Guardar cambio manual": "Save manual rate", "Actualizar cambio": "Refresh rate", "Todas": "All accounts", "Divisa del objetivo": "Goal currency", "Importar Monefy / CSV / XML": "Import Monefy / CSV / XML"}, "fr": {"Divisas y conversión": "Devises et conversion", "Moneda base": "Devise de référence", "Divisa": "Devise", "Cuentas y divisas": "Comptes et devises", "Importe recibido": "Montant reçu", "Guardar cambio manual": "Enregistrer le taux manuel", "Actualizar cambio": "Actualiser le taux", "Todas": "Tous les comptes", "Divisa del objetivo": "Devise de l’objectif", "Importar Monefy / CSV / XML": "Importer Monefy / CSV / XML"}, "de": {"Divisas y conversión": "Währungen und Umrechnung", "Moneda base": "Basiswährung", "Divisa": "Währung", "Cuentas y divisas": "Konten und Währungen", "Importe recibido": "Empfangener Betrag", "Guardar cambio manual": "Manuellen Kurs speichern", "Actualizar cambio": "Kurs aktualisieren", "Todas": "Alle Konten", "Divisa del objetivo": "Zielwährung", "Importar Monefy / CSV / XML": "Monefy / CSV / XML importieren"}, "it": {"Divisas y conversión": "Valute e conversione", "Moneda base": "Valuta base", "Divisa": "Valuta", "Cuentas y divisas": "Conti e valute", "Importe recibido": "Importo ricevuto", "Guardar cambio manual": "Salva cambio manuale", "Actualizar cambio": "Aggiorna cambio", "Todas": "Tutti i conti", "Divisa del objetivo": "Valuta dell’obiettivo", "Importar Monefy / CSV / XML": "Importa Monefy / CSV / XML"}, "pt": {"Divisas y conversión": "Moedas e conversão", "Moneda base": "Moeda base", "Divisa": "Moeda", "Cuentas y divisas": "Contas e moedas", "Importe recibido": "Montante recebido", "Guardar cambio manual": "Guardar câmbio manual", "Actualizar cambio": "Atualizar câmbio", "Todas": "Todas as contas", "Divisa del objetivo": "Moeda do objetivo", "Importar Monefy / CSV / XML": "Importar Monefy / CSV / XML"}};
  for(const lang of Object.keys(currencyLabels))Object.assign(D[lang],currencyLabels[lang]);

  function storedLanguage(){
    try { return localStorage.getItem(STORAGE_KEY) || 'auto'; } catch { return 'auto'; }
  }
  function deviceLanguage(){
    const list = navigator.languages?.length ? navigator.languages : [navigator.language || 'es'];
    for (const item of list) {
      const base = String(item || '').toLowerCase().split('-')[0];
      if (SUPPORTED.includes(base)) return base;
    }
    return 'en';
  }
  function language(){ const s=storedLanguage(); return SUPPORTED.includes(s) ? s : deviceLanguage(); }
  function locale(){ return LOCALES[language()] || 'en-GB'; }
  function t(value){
    const s=String(value ?? '');
    if (language()==='es') return s;
    return D[language()]?.[s] || s;
  }
  function category(value){ return CATEGORY_KEYS.has(String(value)) ? t(String(value)) : String(value ?? ''); }

  function replaceDynamic(s){
    const lang=language();
    if(lang==='es') return s;
    const dict=D[lang]||{};
    let out=s;
    const phraseMap = {
      'porcentaje sobre el gasto total.': {en:'percentage of total spending.',fr:'pourcentage des dépenses totales.',de:'Anteil an den Gesamtausgaben.',it:'percentuale della spesa totale.',pt:'percentagem da despesa total.'},
      'toca para editar': {en:'tap to edit',fr:'toucher pour modifier',de:'zum Bearbeiten tippen',it:'tocca per modificare',pt:'toque para editar'},
      'este ciclo': {en:'this cycle',fr:'ce cycle',de:'dieser Zyklus',it:'questo ciclo',pt:'este ciclo'},
      'Ciclo ': {en:'Cycle ',fr:'Cycle ',de:'Zyklus ',it:'Ciclo ',pt:'Ciclo '},
      'Semana ': {en:'Week ',fr:'Semaine ',de:'Woche ',it:'Settimana ',pt:'Semana '},
      'Hoy · ': {en:'Today · ',fr:"Aujourd’hui · ",de:'Heute · ',it:'Oggi · ',pt:'Hoje · '},
      ' · cuota ': {en:' · payment ',fr:' · mensualité ',de:' · Rate ',it:' · rata ',pt:' · prestação '},
      ' · registrado': {en:' · recorded',fr:' · enregistré',de:' · erfasst',it:' · registrato',pt:' · registado'},
      'Sin datos': {en:'No data',fr:'Aucune donnée',de:'Keine Daten',it:'Nessun dato',pt:'Sem dados'}
    };
    for(const [src,byLang] of Object.entries(phraseMap)) out=out.split(src).join(byLang[lang]||src);

    const systemTokens=['Principal','Ingreso','Gasto','Banco','Ahorro','Inversión','Otra','REGISTRADO','PAUSADO','LISTO'];
    for(const key of systemTokens){
      const tr=dict[key];
      if(!tr||tr===key) continue;
      const esc=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      out=out.replace(new RegExp(`(^|[\\s·+,(])${esc}(?=$|[\\s·+),])`,'g'),(_,p)=>p+tr);
    }

    // Category names are replaced only as whole words in display text; internal values are untouched.
    for(const key of CATEGORY_KEYS){
      const tr=dict[key]; if(!tr||tr===key) continue;
      out=out.replace(new RegExp(`(^|[\\s·+,(])${key.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}(?=$|[\\s·+),])`,'g'),(_,p)=>p+tr);
    }
    const dayWord={en:'Day',fr:'Jour',de:'Tag',it:'Giorno',pt:'Dia'}[lang];
    out=out.replace(/^Día (\d+)$/i,`${dayWord} $1`);
    const inDays={en:'in $1 days',fr:'dans $1 jours',de:'in $1 Tagen',it:'tra $1 giorni',pt:'em $1 dias'}[lang];
    out=out.replace(/^en (\d+) días$/i,inDays);
    if(/^hoy$/i.test(out)) out={en:'today',fr:"aujourd’hui",de:'heute',it:'oggi',pt:'hoje'}[lang];
    if(/^mañana$/i.test(out)) out={en:'tomorrow',fr:'demain',de:'morgen',it:'domani',pt:'amanhã'}[lang];
    return out;
  }

  function translateString(raw){
    const m=String(raw).match(/^(\s*)([\s\S]*?)(\s*)$/); if(!m) return raw;
    const core=m[2]; if(!core) return raw;
    const exact=t(core);
    const translated=exact!==core ? exact : replaceDynamic(core);
    return m[1]+translated+m[3];
  }

  function skipTextNode(node){
    const p=node.parentElement; if(!p) return true;
    if(p.closest('script,style,textarea,option,[contenteditable="true"]')) return true;
    // User-entered transaction titles should remain exactly as entered.
    if(p.closest('.transaction-row .row-title,.home-recent-row .row-title,.loan-detail-title h2,.account-meta b')) return true;
    return false;
  }

  function processText(node){
    if(node.nodeType!==Node.TEXT_NODE || skipTextNode(node)) return;
    const current=node.nodeValue;
    if(current!==lastApplied.get(node)) sourceText.set(node,current);
    const source=sourceText.get(node) ?? current;
    const translated=translateString(source);
    lastApplied.set(node,translated);
    if(current!==translated){ translating=true; node.nodeValue=translated; translating=false; }
  }

  function processAttrs(el){
    if(!(el instanceof Element)) return;
    const attrs=['placeholder','aria-label','title'];
    let store=sourceAttrs.get(el); if(!store){store={};sourceAttrs.set(el,store);}
    for(const attr of attrs){
      if(!el.hasAttribute(attr)) continue;
      const current=el.getAttribute(attr);
      if(store[attr]===undefined || current!==store[attr].last) store[attr]={source:current,last:current};
      const translated=translateString(store[attr].source);
      store[attr].last=translated;
      if(current!==translated) el.setAttribute(attr,translated);
    }
  }

  function walk(root=document.body){
    if(!root) return;
    if(root.nodeType===Node.TEXT_NODE){processText(root);return;}
    if(root instanceof Element) processAttrs(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n;
    while((n=walker.nextNode())) processText(n);
    if(root.querySelectorAll) root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(processAttrs);
  }

  function applyDocumentLanguage(){
    document.documentElement.lang=language();
    document.documentElement.dataset.ledgerLanguage=language();
  }
  function refresh(){ applyDocumentLanguage(); walk(document.body); }
  function setLanguage(value){
    const v=(value==='auto'||SUPPORTED.includes(value))?value:'auto';
    try{localStorage.setItem(STORAGE_KEY,v);}catch{}
    location.reload();
  }
  function optionMarkup(selected=storedLanguage()){
    const options=[
      ['auto',t('Automático (dispositivo)')],['es','Español'],['en','English'],['fr','Français'],['de','Deutsch'],['it','Italiano'],['pt','Português']
    ];
    return options.map(([value,label])=>`<option value="${value}" ${selected===value?'selected':''}>${label}</option>`).join('');
  }

  window.LedgerI18n={ language, locale, t, category, setLanguage, storedLanguage, optionMarkup, refresh, supported:[...SUPPORTED], storageKey:STORAGE_KEY };
  applyDocumentLanguage();

  const start=()=>{
    refresh();
    const observer=new MutationObserver(mutations=>{
      if(translating) return;
      for(const m of mutations){
        if(m.type==='characterData') processText(m.target);
        else m.addedNodes.forEach(n=>walk(n));
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
