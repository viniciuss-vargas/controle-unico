'use strict';
const $=id=>document.getElementById(id), F=Financas, CH='controle-unico-financas-cache';
const dinheiro=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const hoje=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=s=>s?s.slice(8,10)+'/'+s.slice(5,7):'—';
const vazio=()=>({versao:1,caderno:'financas',modelo:'financas-vinicius-v1',registros:[],categorias:[]});
let dados=vazio(), plano=null;
try{const t=localStorage.getItem(CH);if(t)dados=F.validar(JSON.parse(t));}catch(e){mensagem('Não consegui ler a cópia deste aparelho. Carregue uma cópia ou abra o caderno no Drive.');}
const configOk=!!(window.CONTROLE_CONFIG?.googleClientId && window.CONTROLE_CONFIG?.googlePickerKey && window.CONTROLE_CONFIG?.googleProjectNumber);
$('preparacao').hidden=configOk;
const caderno=Nuvem.caderno({id:'financas',nome:'Controle Único - finanças.json',rotulo:'seu caderno de finanças',caderno:'financas',
  arquivoObrigatorio:true,arquivoId:window.CONTROLE_CONFIG?.arquivoFinancasId,copiaSemanal:false,criarVazio:false,
  obter:()=>dados,aplicar:d=>{dados=F.validar(d);localStorage.setItem(CH,JSON.stringify(dados));render();},temDados:d=>!!d?.registros?.length});
function mensagem(t){$('mensagem').textContent=t;$('mensagem').hidden=false;}
function registros(){return dados.registros.filter(r=>!r.arquivado);}
function salvar(){F.validar(dados);dados.atualizadoEm=new Date().toISOString();localStorage.setItem(CH,JSON.stringify(dados));caderno.mudou();render();}
function categorias(){return [...new Set([...(dados.categorias||[]),...registros().map(r=>r.categoria).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,'pt-BR'));}
function render(){
  const km=$('mes').value, a=registros(), s=F.resumo(a,km);
  const aberto=dados.registros.length>0 || caderno.conferido();
  $('pago').textContent=aberto?dinheiro(s.pago):'—';$('apagar').textContent=aberto?dinheiro(s.aPagar):'—';$('semvalor').textContent=aberto?s.semValor:'—';
  $('somente-local').hidden=!dados.registros.length || (configOk && Nuvem.conectado() && !caderno.pendente() && caderno.conferido());
  $('opcoes-categorias').innerHTML=categorias().map(c=>'<option value="'+esc(c)+'"></option>').join('');
  const termo=$('busca').value.toLocaleLowerCase('pt-BR'), filtro=$('filtro').value;
  const doMes=a.filter(r=>F.referencia(r)===km);
  const linhas=doMes.filter(r=>(!filtro || (filtro==='semvalor'?r.valor==null:r.situacao===filtro)) && [r.descricao,r.categoria,r.observacoes].join(' ').toLocaleLowerCase('pt-BR').includes(termo))
    .sort((a,b)=>(b.pagoEm||b.vencimento||'').localeCompare(a.pagoEm||a.vencimento||'') || a.descricao.localeCompare(b.descricao,'pt-BR'));
  $('contagem').textContent=linhas.length+' de '+doMes.length+' registros · '+s.conferir+' para completar';
  $('linhas').innerHTML=linhas.map(r=>'<tr><td>'+esc(r.descricao)+(r.tipo==='Fixa'?'<span class="sub">Conta fixa</span>':r.tipo==='Ressarcimento'?'<span class="sub">Ressarcimento</span>':'')+'</td><td>'+esc(r.categoria)+'</td><td>'+data(r.situacao==='Pago'?r.pagoEm:r.vencimento)+'</td><td><span class="selo '+(r.situacao==='A pagar'?'pendente':'')+'">'+esc(r.situacao)+'</span></td><td class="numero">'+(r.valor==null?'Sem valor':dinheiro(r.valor))+'</td><td><button class="editar" data-id="'+esc(r.id)+'" aria-label="Editar '+esc(r.descricao)+'">Editar</button></td></tr>').join('');
  $('vazio').hidden=linhas.length>0;
  $('vazio').textContent=aberto?'Nenhum lançamento neste filtro.':'Abra seu caderno em Dados e cópias para ver os lançamentos.';
  const porCat={};doMes.filter(r=>r.situacao==='Pago').forEach(r=>porCat[r.categoria]=(porCat[r.categoria]||0)+F.cent(r.valor));
  const lista=Object.entries(porCat).sort((a,b)=>b[1]-a[1]), maior=Math.max(1,...lista.map(x=>x[1]));
  $('lista-categorias').innerHTML=lista.length?lista.map(([n,v])=>'<div class="categoria"><span>'+esc(n)+'</span><div class="barra"><i style="width:'+Math.max(0,v/maior*100)+'%"></i></div><strong class="numero">'+dinheiro(v/100)+'</strong></div>').join(''):'<p class="vazio">Nenhum pagamento neste mês.</p>';
  const meses=[...new Set(a.map(F.referencia))].filter(Boolean).sort().reverse();
  $('meses').innerHTML=meses.map(m=>{const s=F.resumo(a,m);return '<tr><td><button data-mes="'+m+'">'+m.slice(5,7)+'/'+m.slice(0,4)+'</button></td><td class="numero">'+dinheiro(s.pago)+'</td><td class="numero">'+dinheiro(s.aPagar)+'</td><td class="numero">'+s.semValor+'</td></tr>';}).join('');
}
function aba(nome){for(const n of ['lancamentos','categorias','historico'])$(n).hidden=n!==nome;document.querySelectorAll('[data-tab]').forEach(b=>{if(b.dataset.tab===nome)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>aba(b.dataset.tab));
$('mes').value=hoje().slice(0,7);['mes','busca','filtro'].forEach(id=>$(id).addEventListener('input',render));
$('meses').onclick=e=>{const b=e.target.closest('[data-mes]');if(b){$('mes').value=b.dataset.mes;aba('lancamentos');render();}};
const form=$('form'), el=n=>form.elements.namedItem(n);
function editar(id){
  const r=id?dados.registros.find(r=>r.id===id):{id:'',descricao:'',categoria:'',valor:null,situacao:'A pagar',tipo:'Avulsa',mesPrevisto:$('mes').value,vencimento:'',pagoEm:'',pagamento:'',observacoes:''};
  if(!r)return;
  form.reset();for(const k of ['id','descricao','categoria','valor','situacao','tipo','mesPrevisto','vencimento','pagoEm','pagamento','observacoes'])el(k).value=r[k]??'';
  el('semValor').checked=r.valor==null;el('valor').disabled=r.valor==null;
  $('titulo-editor').textContent=id?'Editar lançamento':'Novo lançamento';$('arquivar').hidden=!id;
  $('rastro').textContent=r.fitid?'Identificado pelo extrato. O vínculo será preservado.':r.fonte?.linha?'Migrado da linha '+r.fonte.linha+' da planilha.':'';
  $('erro-form').textContent='';$('editor').showModal();
}
$('novo').onclick=()=>editar();$('linhas').onclick=e=>{const b=e.target.closest('[data-id]');if(b)editar(b.dataset.id);};
$('fechar').onclick=$('cancelar').onclick=()=>$('editor').close();
el('semValor').onchange=()=>{el('valor').disabled=el('semValor').checked;if(el('semValor').checked)el('valor').value='';};
el('situacao').onchange=()=>{if(el('situacao').value==='Pago' && !el('pagoEm').value)el('pagoEm').value=hoje();};
form.onsubmit=e=>{
  e.preventDefault();try{
    const id=el('id').value, existente=dados.registros.find(r=>r.id===id), r=existente?{...existente}:{id:crypto.randomUUID(),fitid:'',origemNotion:''};
    for(const n of ['descricao','categoria','situacao','tipo','mesPrevisto','vencimento','pagoEm','pagamento','observacoes'])r[n]=el(n).value.trim();
    r.valor=el('semValor').checked?null:Number(el('valor').value);
    if(!r.descricao||!r.categoria||!r.mesPrevisto)throw new Error('Preencha descrição, categoria e mês.');
    if(!el('semValor').checked && el('valor').value==='')throw new Error('Preencha o valor ou marque “Ainda sem valor”.');
    if(r.situacao==='Pago' && r.valor==null)throw new Error('Informe o valor antes de marcar como pago.');
    if(r.situacao==='Pago' && !r.pagoEm && r.tipo!=='Ressarcimento')throw new Error('Informe quando foi pago.');
    if(r.situacao==='A pagar')r.pagoEm='';
    F.validar({...dados,registros:existente?dados.registros.map(x=>x.id===id?r:x):[...dados.registros,r]});
    if(existente)Object.assign(existente,r);else dados.registros.push(r);
    salvar();$('editor').close();mensagem('Lançamento guardado neste aparelho. Acompanhe o salvamento no Drive pelo aviso do topo.');
  }catch(err){$('erro-form').textContent=err.message;}
};
$('arquivar').onclick=()=>{const r=dados.registros.find(r=>r.id===el('id').value);if(r && confirm('Arquivar este lançamento? Ele sai dos totais e continua preservado na cópia dos dados.')){r.arquivado=true;salvar();$('editor').close();}};
function baixar(){const b=new Blob([JSON.stringify(dados,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='Controle Único - finanças - '+hoje()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('backup').onclick=baixar;$('carregar').onclick=()=>$('arquivo-json').click();
$('arquivo-json').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const c=F.validar(JSON.parse(await f.text()));const mapa=new Map(dados.registros.map(r=>[r.id,r]));let adicionados=0;for(const r of c.registros)if(!mapa.has(r.id)){mapa.set(r.id,r);adicionados++;}const novos=F.validar({...c,registros:[...mapa.values()],categorias:[...new Set([...(dados.categorias||[]),...(c.categorias||[])])]});dados=novos;salvar();mensagem(adicionados+' registros carregados. Registros já presentes neste aparelho foram preservados.');}catch(err){mensagem('Não carreguei o arquivo: '+err.message);}finally{e.target.value='';}};
$('sair').onclick=()=>Nuvem.sair();$('atualizar').onclick=()=>caderno.conectar();$('abrir-drive').onclick=()=>{if(!configOk){mensagem('A conexão com o Google ainda está em preparação.');return;}if(!Nuvem.conectado()){Nuvem.entrar();return;}caderno.escolherArquivo();};
$('ofx').onclick=()=>$('arquivo-ofx').click();
$('arquivo-ofx').onchange=async e=>{
  try{const f=e.target.files[0];if(!f)return;plano=F.prepararOFX(await f.text(),dados);
    $('resumo-ofx').textContent=plano.novos.length+' débitos para conferir · '+plano.duplicados.length+' já cadastrados · '+plano.creditos.length+' créditos ignorados · '+plano.conferir.length+' sem FITID (não importados).';
    $('itens-ofx').innerHTML=plano.novos.map((x,i)=>'<div class="ofx-item" data-ofx="'+i+'"><p><strong>'+esc(x.registro.descricao)+'</strong> · '+dinheiro(x.registro.valor)+' · '+data(x.registro.pagoEm)+'</p><label>Categoria<input data-cat list="opcoes-categorias" maxlength="100"></label><label>Como registrar<select data-acao><option value="ignorar">Não importar este item</option><option value="novo">Novo lançamento</option>'+x.candidatos.map(id=>{const r=dados.registros.find(r=>r.id===id);return '<option value="'+esc(id)+'">Pagar / vincular: '+esc(r.descricao)+'</option>';}).join('')+'</select></label></div>').join('');
    $('erro-ofx').textContent='';$('confirmar-ofx').disabled=!plano.novos.length;$('importador').showModal();
  }catch(err){mensagem('Não importei o extrato: '+err.message);}finally{e.target.value='';}
};
$('fechar-ofx').onclick=()=>$('importador').close();
$('confirmar-ofx').onclick=()=>{try{const escolhas=[];document.querySelectorAll('[data-ofx]').forEach(el=>{const acao=el.querySelector('[data-acao]').value;if(acao==='ignorar')return;const x=plano.novos[Number(el.dataset.ofx)],r={...x.registro,categoria:el.querySelector('[data-cat]').value.trim()};escolhas.push({registro:r,vincular:acao==='novo'?null:acao});});if(!escolhas.length)throw new Error('Escolha ao menos um débito para importar.');dados=F.aplicarOFX(dados,escolhas);salvar();$('importador').close();mensagem(escolhas.length+' débitos confirmados. Confira o salvamento no Drive.');}catch(err){$('erro-ofx').textContent=err.message;}};
Nuvem.iniciar();
if(!configOk){$('nuvem-entrar').disabled=true;$('nuvem-entrar').textContent='Conexão em preparação';$('nuvem-texto').textContent='Seus dados estão no Drive. Falta autorizar a conexão deste aplicativo.';}
new MutationObserver(()=>{ $('somente-local').hidden=!dados.registros.length || (configOk && Nuvem.conectado() && !caderno.pendente() && caderno.conferido()); }).observe($('nuvem-texto'),{childList:true,subtree:true});
render();
