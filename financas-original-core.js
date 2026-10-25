(function(root){
  'use strict';
  const F=typeof module!=='undefined'&&module.exports?require('./financas-core.js'):root.Financas;
  const copiar=x=>JSON.parse(JSON.stringify(x));
  const vazio=()=>({versao:1,caderno:'financas',modelo:'financas-vinicius-v1',registros:[],categorias:[]});
  const dataDe=r=>r.pagoEm||r.vencimento||r.mesPrevisto;
  const categoriaDe=r=>String(r.categoria||'').trim()||'Sem categoria';
  function paraOriginal(entrada){
    const c=F.validar(copiar(Array.isArray(entrada?.registros)?entrada:entrada?._fonte||vazio()));
    // Remove apenas a projeção de tela que versões anteriores misturavam à fonte.
    for(const campo of ['_fonte','lancamentos','gastosFixos','reserva','pendencias','limites','categoriasExtras'])delete c[campo];
    const o=c.organizacao||{};
    return {versao:1,caderno:'financas',_fonte:c,
      lancamentos:c.registros.filter(r=>!r.arquivado).map(r=>({id:r.id,data:dataDe(r),tipo:'Despesa',descricao:r.descricao,categoria:r.categoria,forma:r.pagamento,valor:r.valor,situacao:r.situacao,_financeiro:true})).concat(copiar(o.movimentos||[])),
      gastosFixos:[],reserva:{saldoBase:0,dataBase:null,meta:0,...o.reserva},
      pendencias:copiar(o.pendencias||[]),limites:copiar(o.limites||{}),categoriasExtras:copiar(o.categoriasExtras||[])};
  }
  function paraCaderno(livro){
    const c=copiar(livro._fonte||vazio()), anteriores=new Map(c.registros.map(r=>[r.id,r]));
    const despesas=livro.lancamentos.filter(l=>l.tipo==='Despesa'), ativos=new Set(despesas.map(l=>l.id));
    for(const r of c.registros)if(!r.arquivado&&!ativos.has(r.id))r.arquivado=true;
    for(const l of despesas){
      const anterior=anteriores.get(l.id);
      if(anterior){
        anterior.descricao=l.descricao;anterior.categoria=l.categoria;anterior.pagamento=l.forma||'';anterior.valor=l.valor;
        if(l.data!==dataDe(anterior)){
          if(!/^\d{4}-\d{2}-\d{2}$/.test(l.data||''))throw new Error('Informe a data completa do lançamento.');
          if(anterior.situacao==='Pago')anterior.pagoEm=l.data;else anterior.vencimento=l.data;
        }
      }else{
        if(!/^\d{4}-\d{2}-\d{2}$/.test(l.data||''))throw new Error('Informe a data completa do lançamento.');
        c.registros.push({id:l.id,descricao:l.descricao,categoria:l.categoria,valor:l.valor,situacao:'Pago',pagoEm:l.data,mesPrevisto:l.data.slice(0,7),vencimento:'',tipo:'Avulsa',pagamento:l.forma||'',observacoes:'',fitid:'',origemNotion:''});
      }
    }
    c.organizacao={...(c.organizacao||{}),reserva:copiar(livro.reserva),pendencias:copiar(livro.pendencias||[]),limites:copiar(livro.limites||{}),categoriasExtras:copiar(livro.categoriasExtras||[]),movimentos:copiar(livro.lancamentos.filter(l=>l.tipo!=='Despesa'))};
    c.categorias=[...new Set([...(c.categorias||[]),...c.registros.map(r=>r.categoria).filter(Boolean),...(livro.categoriasExtras||[]).filter(x=>!x.oculta).map(x=>x.nome)])];
    return F.validar(c);
  }
  const temDados=c=>!!(c&&(c.registros?.length||c.organizacao?.movimentos?.length||c.organizacao?.pendencias?.length||Object.keys(c.organizacao?.limites||{}).length||c.organizacao?.categoriasExtras?.length||Object.values(c.organizacao?.reserva||{}).some(Boolean)));
  const normalizar=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  function filtrar(registros,f={}){
    const termo=normalizar(f.busca).trim();
    return registros.filter(r=>!r.arquivado&&(f.todosMeses||!f.mes||F.referencia(r)===f.mes)
      &&(!f.categoria||categoriaDe(r)===f.categoria)&&(!f.tipo||r.tipo===f.tipo)
      &&(!f.situacao||(f.situacao==='semvalor'?r.valor==null:r.situacao===f.situacao))
      &&(!termo||normalizar([r.descricao,r.categoria,r.observacoes].join(' ')).includes(termo)));
  }
  function totais(registros){
    const a=registros.filter(r=>!r.arquivado);
    return {quantidade:a.length,pago:a.filter(r=>r.situacao==='Pago').reduce((s,r)=>s+F.cent(r.valor),0)/100,aPagar:a.filter(r=>r.situacao==='A pagar').reduce((s,r)=>s+F.cent(r.valor),0)/100,semValor:a.filter(r=>r.valor==null).length};
  }
  function porCategoria(registros){
    const grupos=new Map();
    for(const r of registros.filter(r=>!r.arquivado)){const nome=categoriaDe(r);if(!grupos.has(nome))grupos.set(nome,[]);grupos.get(nome).push(r);}
    return [...grupos].map(([nome,lista])=>({nome,...totais(lista)})).sort((a,b)=>b.pago-a.pago||a.nome.localeCompare(b.nome,'pt-BR'));
  }
  const api={vazio,temDados,paraOriginal,paraCaderno,dataDe,categoriaDe,filtrar,totais,porCategoria};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FinancasOriginal=api;
})(typeof window!=='undefined'?window:this);
