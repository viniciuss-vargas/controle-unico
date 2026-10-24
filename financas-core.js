(function(root){
  'use strict';
  const cent = n => Math.round(Number(n || 0) * 100);
  const mes = s => /^\d{4}-\d{2}/.test(s || '') ? s.slice(0,7) : '';
  const dataSerial = n => n == null || n === '' ? '' : new Date(Date.UTC(1899,11,30) + Number(n)*86400000).toISOString().slice(0,10);
  function referencia(r){ return r.situacao === 'Pago' ? mes(r.pagoEm) || r.mesPrevisto : r.mesPrevisto || mes(r.vencimento); }
  function resumo(registros, km){
    const linhas = registros.filter(r => referencia(r) === km);
    return {mes:km,quantidade:linhas.length,
      pago:linhas.filter(r=>r.situacao==='Pago').reduce((s,r)=>s+cent(r.valor),0)/100,
      aPagar:linhas.filter(r=>r.situacao==='A pagar').reduce((s,r)=>s+cent(r.valor),0)/100,
      semValor:linhas.filter(r=>r.valor==null).length,
      conferir:linhas.filter(r=>r.valor==null || !r.categoria || !r.mesPrevisto || (r.situacao==='Pago' && !r.pagoEm && r.tipo!=='Ressarcimento')).length};
  }
  function validar(c){
    if(!c || c.caderno!=='financas' || c.versao!==1 || !Array.isArray(c.registros)) throw new Error('Escolha o caderno de finanças desta versão.');
    const ids=new Set(), fitids=new Set();
    for(const r of c.registros){
      if(!r.id || ids.has(r.id)) throw new Error('Há identificadores ausentes ou repetidos.'); ids.add(r.id);
      if(!['Pago','A pagar'].includes(r.situacao)) throw new Error('Situação de pagamento inválida.');
      if(r.valor!==null && (typeof r.valor!=='number' || !Number.isFinite(r.valor))) throw new Error('Há um valor inválido.');
      if(r.valor<0 && r.tipo!=='Ressarcimento') throw new Error('Valor negativo precisa ser um ressarcimento.');
      if(r.fitid){ if(fitids.has(r.fitid)) throw new Error('Há um ID de extrato repetido.'); fitids.add(r.fitid); }
      if(!r.descricao || !/^\d{4}-\d{2}$/.test(r.mesPrevisto || '')) throw new Error('Descrição ou mês previsto inválido.');
    }
    return c;
  }
  function migrar(fonte){
    const registros=fonte.rows.map(r=>({
      id:r.fitid ? 'cora:'+r.fitid : 'planilha:'+fonte.spreadsheetId+':'+r.row,
      descricao:r.description,categoria:r.category,valor:r.value,situacao:r.status,
      pagoEm:dataSerial(r.paid),vencimento:dataSerial(r.due),mesPrevisto:mes(dataSerial(r.month || r.summaryMonth)),
      tipo:r.type || 'Avulsa',pagamento:r.payment,observacoes:r.notes,fitid:r.fitid,origemNotion:r.notion,
      fonte:{planilha:fonte.spreadsheetId,aba:'Lançamentos',linha:r.row,conferencia:r.check,mesResumo:mes(dataSerial(r.summaryMonth))}
    }));
    const c=validar({versao:1,caderno:'financas',modelo:'financas-vinicius-v1',atualizadoEm:new Date().toISOString(),registros,
      categorias:[...new Set(registros.map(r=>r.categoria))].sort((a,b)=>a.localeCompare(b,'pt-BR')),
      migracao:{planilha:fonte.spreadsheetId,lidaEm:fonte.readAt,registros:registros.length}});
    for(const r of registros){ if(referencia(r)!==r.fonte.mesResumo) throw new Error('Mês divergente na linha '+r.fonte.linha); }
    for(const km of new Set(registros.map(referencia))){
      const orig=fonte.rows.filter(r=>mes(dataSerial(r.summaryMonth))===km);
      const atual=resumo(registros,km);
      if(cent(atual.pago)!==orig.reduce((s,r)=>s+cent(r.paidFormula),0) || cent(atual.aPagar)!==orig.reduce((s,r)=>s+cent(r.dueFormula),0)) throw new Error('Total divergente: '+km);
    }
    return c;
  }
  function tag(b,n){ return (b.match(new RegExp('<'+n+'>\\s*([^<\\r\\n]*)','i')) || [,''])[1].trim(); }
  function lerOFX(texto){
    if(!/<BANKTRANLIST>/i.test(texto)) throw new Error('Selecione um extrato OFX de conta.');
    const linhas=[], re=/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|(?=<\/BANKTRANLIST>))/gi;
    let m;
    while((m=re.exec(texto))){
      const b=m[1], d=tag(b,'DTPOSTED').match(/^(\d{4})(\d{2})(\d{2})/), v=Number(tag(b,'TRNAMT').replace(',','.'));
      if(!d || !Number.isFinite(v)) throw new Error('Data ou valor inválido no OFX.');
      linhas.push({fitid:tag(b,'FITID'),data:d[1]+'-'+d[2]+'-'+d[3],valor:v,memo:tag(b,'MEMO') || tag(b,'NAME')});
    }
    return linhas;
  }
  function prepararOFX(texto, caderno){
    validar(caderno);
    const conhecidos=new Set(caderno.registros.map(r=>r.fitid).filter(Boolean)), vistos=new Set(), novos=[], duplicados=[], creditos=[], conferir=[];
    for(const l of lerOFX(texto)){
      if(l.valor>=0){ creditos.push(l); continue; }
      if(!l.fitid){conferir.push({...l,motivo:'Sem FITID: não importar automaticamente.'});continue;}
      if(conhecidos.has(l.fitid) || vistos.has(l.fitid)){duplicados.push(l);continue;}
      vistos.add(l.fitid);
      // Uma conta já planejada pode corresponder ao débito. Exige escolha; não cria outra linha.
      const candidatos=caderno.registros.filter(r=>!r.fitid && r.valor!=null && Math.abs(cent(r.valor)-cent(-l.valor))<=0 && referencia(r)===mes(l.data));
      const base={id:'cora:'+l.fitid,descricao:l.memo || 'Débito Cora',categoria:'',valor:-l.valor,situacao:'Pago',pagoEm:l.data,vencimento:'',mesPrevisto:mes(l.data),tipo:'Avulsa',pagamento:'Pix',observacoes:'Importado do OFX Cora. Categoria a confirmar.',fitid:l.fitid,origemNotion:'',fonte:{extrato:'Cora'}};
      // Meio de pagamento não é inferido de débito genérico.
      base.pagamento=/pix/i.test(l.memo)?'Pix':'';
      novos.push({registro:base,candidatos:candidatos.map(r=>r.id)});
    }
    return {novos,duplicados,creditos,conferir};
  }
  function aplicarOFX(caderno, escolhas){
    const c=JSON.parse(JSON.stringify(validar(caderno)));
    for(const e of escolhas){
      const n=e.registro;
      if(!n.fitid || !n.categoria) throw new Error('Confira a categoria de cada débito.');
      if(c.registros.some(r=>r.fitid===n.fitid)) continue;
      if(e.vincular){
        const r=c.registros.find(r=>r.id===e.vincular);
        if(!r || r.fitid || cent(r.valor)!==cent(n.valor)) throw new Error('Conta escolhida não pode receber este débito.');
        Object.assign(r,{fitid:n.fitid,situacao:'Pago',pagoEm:n.pagoEm,pagamento:n.pagamento || r.pagamento,categoria:n.categoria});
      }else c.registros.push(n);
    }
    c.atualizadoEm=new Date().toISOString();return validar(c);
  }
  const api={cent,mes,dataSerial,referencia,resumo,validar,migrar,lerOFX,prepararOFX,aplicarOFX};
  if(typeof module!=='undefined' && module.exports)module.exports=api;else root.Financas=api;
})(typeof window!=='undefined'?window:this);
