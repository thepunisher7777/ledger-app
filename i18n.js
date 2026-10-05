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

  const CATEGORY_KEYS = new Set(['Comida','Automóvil','Casa','Comunicaciones','Deportes','Entretenimiento','Facturas','Higiene','Mascotas','Regalos','Restaurante','Ropa','Salud','Taxi','Transporte','Ahorros','Depósitos','Salario','Otros']);
  const sourceText = new WeakMap();
  const lastApplied = new WeakMap();
  const sourceAttrs = new WeakMap();
  let translating = false;

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
