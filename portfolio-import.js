/* Portfolio Performance XML preparation: local preview only, no finance writes. */
(() => {
  'use strict';
  function preview(text) {
    if (typeof text !== 'string' || text.length > 10 * 1024 * 1024) throw Error('XML demasiado grande (máximo 10 MB)');
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw Error('XML con entidades externas no admitido');
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror') || doc.documentElement.tagName !== 'client') throw Error('No es un XML de Portfolio Performance válido');
    const child = (node, tag) => Array.from(node.children).find(x => x.tagName === tag);
    const value = (node, tag) => child(node, tag)?.textContent.trim() || '';
    const warnings = [], accounts = [], transactions = [];
    const seen = new Set();
    const types = {DEPOSIT:'income',REMOVAL:'expense',DIVIDENDS:'income',INTEREST:'income',INTEREST_CHARGE:'expense',FEES:'expense',TAXES:'expense',TAX_REFUND:'income',FEES_REFUND:'income'};
    const nodes = Array.from(child(doc.documentElement, 'accounts')?.children || []).filter(n => n.tagName === 'account');
    for (const node of nodes) {
      if(node.hasAttribute('reference')) {warnings.push('Cuenta referenciada sin definición directa');continue;}
      const uuid = value(node,'uuid'), name = value(node,'name'), currency = value(node,'currencyCode');
      if(!uuid || !name || !['EUR','USD'].includes(currency)) {warnings.push('Cuenta incompleta o divisa no soportada');continue;}
      accounts.push({sourceId:uuid,name,currency});
      for(const tx of Array.from(child(node,'transactions')?.children || [])) {
        if(tx.tagName !== 'account-transaction')continue;
        const id=value(tx,'uuid'),kind=value(tx,'type'),amountText=value(tx,'amount'),date=value(tx,'date').slice(0,10),txCurrency=value(tx,'currencyCode')||currency;
        const amount=Number(amountText);
        const dt=new Date(date+'T12:00:00Z');
        if(!id||seen.has(id)||!/^[0-9]+$/.test(amountText)||!Number.isSafeInteger(amount)||amount<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(dt.getTime())||dt.toISOString().slice(0,10)!==date||txCurrency!==currency||tx.hasAttribute('reference')) {warnings.push(`Movimiento no válido en ${name}`);continue;}
        seen.add(id);
        if(!types[kind]) {warnings.push(`${kind||'Tipo desconocido'}: requiere mapeo de transferencias o valores`);continue;}
        transactions.push({sourceId:id,sourceAccountId:uuid,type:types[kind],currency,account:name,date,amount:amount/100,note:value(tx,'note'),sourceType:kind});
      }
    }
    const securities=Array.from(child(doc.documentElement,'securities')?.children||[]).filter(n=>n.tagName==='security').length;
    const portfolios=Array.from(child(doc.documentElement,'portfolios')?.children||[]).filter(n=>n.tagName==='portfolio').length;
    if(securities||portfolios)warnings.push('Valores, cotizaciones, posiciones y cuentas de inversión no se importan');
    if(!accounts.length)throw Error('No hay cuentas EUR/USD legibles en este XML');
    return {baseCurrency:value(doc.documentElement,'baseCurrency'),accounts,transactions,securities,portfolios,warnings};
  }
  window.LedgerPortfolio = {preview};
})();
