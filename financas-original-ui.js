/* Adaptação do módulo Dinheiro original ao caderno de Vinícius. Os outros módulos permanecem independentes. */
(function(){
 'use strict';
 if(PERFIL==='ana')return;
 const F=Financas,A=FinancasOriginal,$=id=>document.getElementById(id),e=escH;
 const consulta={categoria:'',situacao:'',busca:'',todosMeses:false};
 const caderno=()=>A.paraCaderno(livro.dono), registros=()=>caderno().registros.filter(r=>!r.arquivado);
 const valor=v=>v==null?'Sem valor':dinheiro(v);
 const data=r=>r?r.length===10?r.slice(8,10)+'/'+r.slice(5,7)+'/'+r.slice(0,4):'Sem dia informado':'—';
 const categorias=()=>[...new Set([...registros().map(A.categoriaDe),...(livro.dono.categoriasExtras||[]).filter(c=>!c.oculta).map(c=>c.nome)])].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 const filtrados=()=>A.filtrar(registros(),{...consulta,mes:chaveMes(ref),tipo:vistaDin==='fixos'?'Fixa':''});
 let plano=null;
 function gravar(c){F.validar(c);livro.dono=A.paraOriginal(c);salvar('dono');}
 function irDinheiro(v){vistaDin=v;aba='carteira';try{window.parent.mostrar('carteira');}catch(err){}desenhar();window.scrollTo(0,0);}
 VISTAS_DIN.splice(1,0,['cats','Categorias']);

 // O original considera fixos pelo dia. Aqui prevalece a situação explicitamente registrada.
 fixosQueFaltam=km=>F.resumo(registros(),km).aPagar;
 const mesOriginal=mesDinheiro;
 mesDinheiro=function(k,pags=pagamentosClinica()){
  const base=mesOriginal(k,pags),s=F.resumo(registros(),k),receitas=livro.dono.lancamentos.filter(l=>l.tipo==='Receita'&&(l.data||'').slice(0,7)===k);
  base.saiu=s.pago+(contasCasa(k).pagou[livro.casa.pessoas[0]]||0);base.aPagar=s.aPagar;base.semValor=s.semValor;
  base.receitasInformadas=receitas.length>0||pags.some(p=>(p.data||'').slice(0,7)===k);
  base.sobra=Math.round((base.entrou-base.saiu-base.aportes+base.resgates)*100)/100;return base;
 };
 contasDinheiro=function(){
  const km=chaveMes(ref),m=mesDinheiro(km),cl=contasClinica(),fixos=registros().filter(r=>r.tipo==='Fixa'&&F.referencia(r)===km&&r.situacao==='Pago');
  const r=livro.dono.reserva,desde=r.dataBase||'0000-00-00',mov=livro.dono.lancamentos.filter(l=>(l.data||'')>=desde);
  const reserva=(Number(r.saldoBase)||0)+soma(mov.filter(l=>l.tipo==='Aporte'),l=>l.valor)-soma(mov.filter(l=>l.tipo==='Resgate'),l=>l.valor);
  return {entrou:m.entrou,receitaSolta:m.entrou-cl.recebido,recebidoClinica:cl.recebido,dePacientes:cl.pacientes,saiu:m.saiu,minhaCasa:contasCasa(km).pagou[livro.casa.pessoas[0]]||0,fixosMes:A.totais(fixos).pago,faltaSair:m.aPagar,semValor:m.semValor,semDia:0,reserva,aportesMes:m.aportes,resgatesMes:m.resgates,sobra:m.sobra,falta:cl.falta,clinicaOk:cl.ok,fimDoMes:m.sobra+(cl.falta||0)-m.aPagar,passado:km<chaveMes(new Date()),receitasInformadas:m.receitasInformadas};
 };
 porCategoria=function(km=chaveMes(ref)){
  const a=A.porCategoria(A.filtrar(registros(),{mes:km,situacao:'Pago'})).map(x=>[x.nome,x.pago]);
  const casa=contasCasa(km).pagou[livro.casa.pessoas[0]]||0;if(casa)a.push(['Casa (sua parte)',casa]);return a.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
 };
 roscaCategorias=function(){const itens=porCategoria();return (itens.length?rosca(itens.slice(0,7).map(([n,v],i)=>[n,v,`var(--c${i+1})`]).concat(itens.length>7?[['Demais categorias',soma(itens.slice(7),x=>x[1]),'var(--c8)']]:[]),'pago no mês','Valores pagos por categoria'):'<p class="vazio">Nenhum pagamento registrado neste mês.</p>')+'<button class="b" data-fin-ver="cats">Ver categorias e filtrar gastos</button>';};
 cardSituacao=function(d){
  const conhecido=registros().length>0||livro.casa.lancamentos.length>0||d.receitasInformadas,nota=d.receitasInformadas?'Saldo considera as receitas e os pagamentos registrados.':'Suas receitas ainda não foram informadas neste mês. O saldo disponível aparece depois de cadastrá-las.';
  return `<section class="painel fin-situacao"><h2>Situação do mês</h2><div class="stats tres-col"><div class="stat"><span>Pago no mês</span><b>${conhecido?dinheiro(d.saiu):'—'}</b><small>Inclui os ressarcimentos.</small></div><div class="stat"><span>Ainda a pagar</span><b>${conhecido?dinheiro(d.faltaSair):'—'}</b><small>Somente valores informados.</small></div><div class="stat"><span>Falta completar</span><b>${conhecido?d.semValor:'—'}</b><small>Contas sem valor.</small></div><div class="stat"><span>Recebi</span><b>${d.receitasInformadas?dinheiro(d.entrou):'—'}</b></div><div class="stat"><span>Saldo registrado</span><b>${d.receitasInformadas?dinheiro(d.sobra):'—'}</b></div><div class="stat"><span>Depois das contas previstas</span><b>${d.receitasInformadas?dinheiro(d.fimDoMes):'—'}</b></div></div><p class="nota">${nota}</p></section>`;
 };
 const avisosOriginais=avisosPrecisa;
 avisosPrecisa=function(){
  const itens=avisosOriginais(),km=chaveMes(ref),hoje=hojeISO(),contas=registros().filter(r=>F.referencia(r)===km&&r.situacao==='A pagar');
  const sem=contas.filter(r=>r.valor==null).length;if(sem)itens.push({nivel:'atencao',area:'Dinheiro',titulo:`${sem} conta${sem===1?'':'s'} sem valor`,detalhe:'Complete os valores para saber o total a pagar.',ir:{din:'fixos'}});
  const vencidas=contas.filter(r=>r.vencimento&&r.vencimento<hoje);if(vencidas.length)itens.push({nivel:'atencao',area:'Dinheiro',titulo:`${vencidas.length} conta${vencidas.length===1?'':'s'} com vencimento passado`,detalhe:'Confira o pagamento. O app não marca como pago pela data.',ir:{din:'mes'}});
  return itens.sort((a,b)=>(NIVEL_PRECISA[a.nivel]||0)-(NIVEL_PRECISA[b.nivel]||0));
 };

 function filtros(){return `<form id="fin-filtros" class="fin-filtros" onsubmit="return false"><label>Buscar<input id="fin-busca" type="search" placeholder="Descrição ou observação" value="${e(consulta.busca)}"></label><label>Categoria<select id="fin-categoria"><option value="">Todas as categorias</option>${categorias().map(c=>`<option${consulta.categoria===c?' selected':''}>${e(c)}</option>`).join('')}</select></label><label>Situação<select id="fin-situacao">${[['','Todas'],['Pago','Pago'],['A pagar','A pagar'],['semvalor','Sem valor']].map(([v,n])=>`<option value="${v}"${v===consulta.situacao?' selected':''}>${n}</option>`).join('')}</select></label><label>Período<select id="fin-periodo"><option value="mes">Mês selecionado</option><option value="todos"${consulta.todosMeses?' selected':''}>Todos os meses</option></select></label><button class="b" type="button" data-fin-limpar>Limpar filtros</button></form>`;}
 function tabela(lista){return lista.length?`<div class="fin-tabela"><table class="t"><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Situação</th><th class="dir">Valor</th><th>Ações</th></tr></thead><tbody>${lista.slice().sort((a,b)=>A.dataDe(b).localeCompare(A.dataDe(a))).map(r=>`<tr><td><b>${e(r.descricao)}</b><small class="fin-sub">${e(r.tipo)}</small></td><td>${e(A.categoriaDe(r))}</td><td>${data(r.situacao==='Pago'?r.pagoEm:r.vencimento)}</td><td><span class="fin-selo${r.situacao==='A pagar'?' fin-pendente':''}">${e(r.situacao)}</span></td><td class="dir">${valor(r.valor)}</td><td><button type="button" class="b s" data-fin-editar="${e(r.id)}" aria-label="Editar ${e(r.descricao)}">Editar</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="vazio">Nenhum lançamento neste filtro. Tente outro mês ou limpe os filtros.</p>';}
 function listaCategorias(lista){
  const grupos=A.porCategoria(lista),max=Math.max(1,...grupos.map(x=>Math.abs(x.pago)));
  return grupos.length?`<p class="nota">Toque em uma categoria para abrir seus lançamentos. Os ressarcimentos reduzem o total pago.</p><div class="fin-categorias">${grupos.map(g=>`<button type="button" class="fin-categoria" data-fin-cat="${e(g.nome)}" aria-label="Ver lançamentos de ${e(g.nome)}"><span class="fin-cat-nome">${e(g.nome)}<small>${g.quantidade} registro${g.quantidade===1?'':'s'}</small></span><span class="fin-barra"><i style="width:${Math.abs(g.pago)/max*100}%"></i></span><span class="fin-cat-valor"><b>${dinheiro(g.pago)}</b><small>pago${g.aPagar?' · '+dinheiro(g.aPagar)+' a pagar':''}${g.semValor?' · '+g.semValor+' sem valor':''}</small></span></button>`).join('')}</div>`:'<p class="vazio">Nenhuma categoria neste filtro. Tente outro mês ou limpe os filtros.</p>';
 }
 function resumoConsulta(lista){const s=A.totais(lista);return `<b>${s.quantidade} registro${s.quantidade===1?'':'s'}</b> · Pago: <b>${dinheiro(s.pago)}</b> · A pagar: <b>${dinheiro(s.aPagar)}</b>${s.semValor?' · '+s.semValor+' sem valor':''}`;}
 function resultados(){const lista=filtrados();$('fin-resumo').innerHTML=resumoConsulta(lista);$('fin-resultados').innerHTML=vistaDin==='cats'?listaCategorias(lista):tabela(lista);}
 function reserva(){const r=livro.dono.reserva;return `<section class="painel"><h2>Reserva de emergência</h2><p>Saldo: <b>${r.dataBase?dinheiro(contasDinheiro().reserva):'Não informado'}</b> · Meta: ${r.meta?dinheiro(r.meta):'Não informada'}</p><details class="novo"><summary>Ajustar a reserva de emergência</summary><form class="linha" id="fReserva"><div><label>Saldo conferido</label><input name="saldoBase" type="text" inputmode="numeric" data-dinheiro value="${valorCampo(r.saldoBase)}" required></div><div><label>Conferido em</label><input name="dataBase" type="date" value="${e(r.dataBase||'')}" required></div><div><label>Meta</label><input name="meta" type="text" inputmode="numeric" data-dinheiro value="${valorCampo(r.meta)}"></div><button class="b p">Guardar</button></form></details></section>`;}
 const telaDinheiroOriginal=telaDinheiro;
 const fechamentoOriginal=vistaFechamento;
 vistaFechamento=function(){
  const k=chaveMes(ref),m=mesDinheiro(k);if(m.receitasInformadas)return fechamentoOriginal();
  if(k>=chaveMes(new Date()))return '<section class="painel"><h2>Fechamento</h2><p class="vazio">O fechamento resume um mês encerrado. Escolha um mês anterior.</p></section>';
  const lista=A.filtrar(registros(),{mes:k}),anterior=somaMes(k,-1),antes=F.resumo(registros(),anterior);
  return `<section class="painel"><h2>Fechamento de ${e(nomeMes(k))}</h2><p>Pago: <b>${dinheiro(m.saiu)}</b> · Ainda a pagar: <b>${dinheiro(m.aPagar)}</b> · Sem valor: <b>${m.semValor}</b></p><p class="nota">As receitas deste mês não foram informadas; não há saldo confirmado. No mês anterior, os pagamentos somaram ${dinheiro(antes.pago)}.</p></section><section class="painel"><h2>Gastos por categoria</h2>${listaCategorias(lista)}</section>`;
 };
 telaDinheiro=function(){
  if(['pend','fech'].includes(vistaDin))return telaDinheiroOriginal();
  if(vistaDin==='hist')return subabasDinheiro()+vistaHistorico();
  const titulo=vistaDin==='cats'?'Onde o dinheiro foi':vistaDin==='fixos'?'Gastos fixos':'Seus lançamentos';
  return subabasDinheiro()+barraMes()+`<section class="painel"><div class="fin-topo"><h2>${titulo}</h2><button class="b p" data-fin-novo="${vistaDin==='fixos'?'Fixa':'Avulsa'}">+ Novo gasto</button></div>${filtros()}<p id="fin-resumo" class="fin-resumo" role="status">${resumoConsulta(filtrados())}</p><div id="fin-resultados">${vistaDin==='cats'?listaCategorias(filtrados()):tabela(filtrados())}</div></section>`+(vistaDin==='mes'?`<details class="painel"><summary>Receitas e movimentos da reserva</summary>${formLancamento('pessoal')}</details><div class="duas igual">${reserva()}<div>${painelLimites()}${painelCategorias()}</div></div><section class="painel"><h2>Dados e cópias</h2><p class="nota">O aviso do Google Drive no topo indica onde os dados foram guardados.</p><div class="fin-acoes"><button class="b" data-fin-drive>Escolher caderno no Drive</button><button class="b" data-fin-baixar>Baixar cópia JSON</button><button class="b" data-fin-carregar>Carregar cópia JSON</button><button class="b" data-fin-ofx>Importar extrato Cora</button></div></section>`:'');
 };
 vistaHistorico=function(){
  const meses=[...new Set(registros().map(F.referencia).concat(livro.dono.lancamentos.filter(l=>!l._financeiro).map(l=>(l.data||'').slice(0,7))))].filter(Boolean).sort().reverse();
  return `<section class="painel"><h2>Mês a mês</h2><p class="nota">Pagamentos pela data efetiva; contas em aberto pelo mês previsto. Valores em branco ficam separados.</p><div class="fin-tabela"><table class="t"><thead><tr><th>Mês</th><th>Pago</th><th>A pagar</th><th>Sem valor</th><th>Receitas</th></tr></thead><tbody>${meses.map(k=>{const m=mesDinheiro(k);return `<tr><td><button class="b s" data-fin-mes="${k}">${k.slice(5,7)}/${k.slice(0,4)}</button></td><td>${dinheiro(m.saiu)}</td><td>${dinheiro(m.aPagar)}</td><td>${m.semValor}</td><td>${m.receitasInformadas?dinheiro(m.entrou):'—'}</td></tr>`;}).join('')}</tbody></table></div></section>`;
 };
 painelMeusLancamentos=function(){return `<section class="painel"><h2>Meus lançamentos</h2><p class="nota">${registros().length} registros no caderno financeiro. Categorias, busca e situação estão no módulo Dinheiro.</p><button class="b" data-fin-ver="mes">Consultar e filtrar lançamentos</button></section>`;};

 // Editor mantém os campos da fonte, inclusive a data ausente de um ressarcimento e o FITID.
 const editor=document.createElement('dialog');editor.id='fin-editor';editor.innerHTML=`<form id="fin-form"><div class="fin-topo"><h2 id="fin-editor-titulo">Lançamento</h2><button class="b" type="button" data-fin-fechar aria-label="Fechar editor">×</button></div><input name="id" type="hidden"><label>Descrição<input name="descricao" required maxlength="500"></label><label>Categoria<input name="categoria" list="fin-opcoes-categorias" required maxlength="100"></label><div class="fin-dupla"><label>Valor (R$)<input name="valor" type="number" step="0.01" inputmode="decimal"></label><label class="fin-check"><input name="semValor" type="checkbox">Ainda sem valor</label></div><div class="fin-dupla"><label>Situação<select name="situacao"><option>A pagar</option><option>Pago</option></select></label><label>Tipo<select name="tipo"><option>Avulsa</option><option>Fixa</option><option>Ressarcimento</option></select></label></div><div class="fin-dupla"><label>Mês previsto<input name="mesPrevisto" type="month" required></label><label>Vencimento<input name="vencimento" type="date"></label></div><div class="fin-dupla"><label>Pago em<input name="pagoEm" type="date"></label><label>Pagamento<input name="pagamento" maxlength="100"></label></div><label>Observações<textarea name="observacoes" rows="3" maxlength="20000"></textarea></label><p id="fin-rastro" class="nota"></p><p id="fin-erro" role="alert"></p><div class="fin-acoes"><button class="b p">Salvar lançamento</button><button class="b" type="button" data-fin-fechar>Cancelar</button><button class="b" type="button" id="fin-arquivar">Arquivar</button></div></form><datalist id="fin-opcoes-categorias"></datalist>`;document.body.append(editor);
 const form=$('fin-form'),el=n=>form.elements.namedItem(n);
 function editar(id,tipo='Avulsa'){
  const r=id?registros().find(r=>r.id===id):{id:'',descricao:'',categoria:'',valor:null,situacao:'A pagar',tipo,mesPrevisto:chaveMes(ref),vencimento:'',pagoEm:'',pagamento:'',observacoes:''};if(!r)return;
  form.reset();for(const n of ['id','descricao','categoria','valor','situacao','tipo','mesPrevisto','vencimento','pagoEm','pagamento','observacoes'])el(n).value=r[n]??'';
  el('semValor').checked=r.valor==null;el('valor').disabled=r.valor==null;$('fin-erro').textContent='';$('fin-editor-titulo').textContent=id?'Editar lançamento':'Novo gasto';$('fin-arquivar').hidden=!id;
  $('fin-rastro').textContent=r.fitid?'Vínculo com o extrato preservado.':r.fonte?.linha?'Migrado da linha '+r.fonte.linha+' da planilha.':'';$('fin-opcoes-categorias').innerHTML=categorias().map(c=>`<option value="${e(c)}"></option>`).join('');editor.showModal();
 }
 window.abrirGastoFinanceiro=editar;
 el('semValor').onchange=()=>{el('valor').disabled=el('semValor').checked;if(el('semValor').checked)el('valor').value='';};
 el('situacao').onchange=()=>{if(el('situacao').value==='Pago'&&!el('pagoEm').value)el('pagoEm').value=hojeISO();};
 form.onsubmit=ev=>{ev.preventDefault();try{
  const c=caderno(),id=el('id').value,r=c.registros.find(r=>r.id===id)||{id:novoId(),fitid:'',origemNotion:''};
  for(const n of ['descricao','categoria','situacao','tipo','mesPrevisto','vencimento','pagoEm','pagamento','observacoes'])r[n]=el(n).value.trim();r.valor=el('semValor').checked?null:Number(el('valor').value);
  if(!r.descricao||!r.categoria)throw new Error('Preencha a descrição e a categoria.');
  if(!el('semValor').checked&&el('valor').value==='')throw new Error('Informe o valor ou marque Ainda sem valor.');
  if(r.situacao==='Pago'&&(r.valor==null||(!r.pagoEm&&r.tipo!=='Ressarcimento')))throw new Error('Informe o valor e a data do pagamento.');
  if(r.situacao==='A pagar')r.pagoEm='';if(!id)c.registros.push(r);gravar(c);editor.close();recado('Lançamento guardado neste aparelho. Confira o salvamento no Drive no topo.');
 }catch(err){$('fin-erro').textContent=err.message;}};
 $('fin-arquivar').onclick=()=>{const c=caderno(),r=c.registros.find(r=>r.id===el('id').value);if(r&&confirm('Arquivar este lançamento? Ele sai dos totais e continua na cópia dos dados.')){r.arquivado=true;gravar(c);editor.close();}};
 editor.querySelectorAll('[data-fin-fechar]').forEach(b=>b.onclick=()=>editor.close());
 function baixarCopia(){const url=URL.createObjectURL(new Blob([JSON.stringify(caderno(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Controle Único - finanças - '+hojeISO()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);}
 const arq=document.createElement('input');arq.type='file';arq.accept='.json,application/json';arq.hidden=true;document.body.append(arq);
 arq.onchange=async()=>{try{const f=arq.files[0];if(!f)return;const novo=F.validar(JSON.parse(await f.text())),atual=caderno(),m=new Map(atual.registros.map(r=>[r.id,r]));for(const r of novo.registros)if(!m.has(r.id))m.set(r.id,r);gravar({...novo,...atual,registros:[...m.values()],categorias:[...new Set([...(novo.categorias||[]),...(atual.categorias||[])])]});recado('Cópia carregada. Os registros já existentes foram preservados.');}catch(err){recado(err.message,true);}finally{arq.value='';}};
 const ofx=document.createElement('input');ofx.type='file';ofx.accept='.ofx';ofx.hidden=true;document.body.append(ofx);
 const modal=document.createElement('dialog');modal.id='fin-ofx';modal.innerHTML='<h2>Conferir extrato Cora</h2><p id="fin-ofx-resumo"></p><div id="fin-ofx-itens"></div><p id="fin-ofx-erro" role="alert"></p><div class="fin-acoes"><button class="b p" id="fin-ofx-confirmar">Confirmar importação</button><button class="b" id="fin-ofx-cancelar">Cancelar</button></div>';document.body.append(modal);
 ofx.onchange=async()=>{try{const f=ofx.files[0];if(!f)return;plano=F.prepararOFX(await f.text(),caderno());$('fin-ofx-resumo').textContent=`${plano.novos.length} débitos para conferir · ${plano.duplicados.length} já cadastrados · ${plano.creditos.length} créditos ignorados. Nada é gravado antes de confirmar.`;$('fin-ofx-itens').innerHTML=plano.novos.map((x,i)=>`<section class="fin-ofx-item" data-ofx="${i}"><b>${e(x.registro.descricao)}</b> · ${dinheiro(x.registro.valor)}<label>Categoria<input data-cat list="fin-opcoes-categorias"></label><label>Como registrar<select data-acao><option value="ignorar">Não importar</option><option value="novo">Novo lançamento</option>${x.candidatos.map(id=>`<option value="${e(id)}">Vincular a ${e(registros().find(r=>r.id===id).descricao)}</option>`).join('')}</select></label></section>`).join('');$('fin-opcoes-categorias').innerHTML=categorias().map(c=>`<option value="${e(c)}"></option>`).join('');$('fin-ofx-erro').textContent='';modal.showModal();}catch(err){recado(err.message,true);}finally{ofx.value='';}};
 $('fin-ofx-cancelar').onclick=()=>modal.close();$('fin-ofx-confirmar').onclick=()=>{try{const escolhas=[];modal.querySelectorAll('[data-ofx]').forEach(div=>{const acao=div.querySelector('[data-acao]').value;if(acao==='ignorar')return;escolhas.push({registro:{...plano.novos[Number(div.dataset.ofx)].registro,categoria:div.querySelector('[data-cat]').value.trim()},vincular:acao==='novo'?null:acao});});if(!escolhas.length)throw new Error('Escolha ao menos um débito.');gravar(F.aplicarOFX(caderno(),escolhas));modal.close();recado('Extrato importado. Confira o salvamento no Drive.');}catch(err){$('fin-ofx-erro').textContent=err.message;}};

 const ligarOriginal=ligar;
 ligar=function(){ligarOriginal();
  ['fin-busca','fin-categoria','fin-situacao','fin-periodo'].forEach(id=>{const campo=$(id);if(campo)campo.addEventListener(id==='fin-busca'?'input':'change',()=>{consulta.busca=$('fin-busca').value;consulta.categoria=$('fin-categoria').value;consulta.situacao=$('fin-situacao').value;consulta.todosMeses=$('fin-periodo').value==='todos';resultados();});});
  const origem=document.querySelector('.origem');if(origem)origem.innerHTML='<summary>De onde vem cada número</summary>Pago: registros marcados como pagos, no mês do pagamento; ressarcimentos reduzem esse total. A pagar: registros ainda em aberto no mês previsto. Sem valor: separado de zero. A Casa soma somente o que você pagou nela. Receitas, reserva e Clínica usam seus próprios registros.';
 };
 document.addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-fin-editar'))editar(b.dataset.finEditar);
  if(b.hasAttribute('data-fin-novo'))editar(null,b.dataset.finNovo);
  if(b.hasAttribute('data-fin-ver')){consulta.todosMeses=false;irDinheiro(b.dataset.finVer);}
  if(b.hasAttribute('data-fin-cat')){consulta.categoria=b.dataset.finCat;irDinheiro('mes');}
  if(b.hasAttribute('data-fin-limpar')){Object.assign(consulta,{categoria:'',situacao:'',busca:'',todosMeses:false});desenhar();}
  if(b.hasAttribute('data-fin-mes')){const k=b.dataset.finMes;ref=new Date(Number(k.slice(0,4)),Number(k.slice(5,7))-1,1);consulta.todosMeses=false;irDinheiro('mes');}
  if(b.hasAttribute('data-fin-drive')){if(Nuvem.conectado())nuvem.dono.escolherArquivo();else Nuvem.entrar();}
  if(b.hasAttribute('data-fin-baixar'))baixarCopia();if(b.hasAttribute('data-fin-carregar'))arq.click();if(b.hasAttribute('data-fin-ofx'))ofx.click();
 });
 const abrirOriginal=abrirLancamento;
 abrirLancamento=function(){if(aba==='casa')abrirOriginal();else editar();};window.abrirLancamento=abrirLancamento;
 window.addEventListener('storage',ev=>{if(ev.key==='controle-unico-financas-cache'&&ev.newValue){try{livro.dono=A.paraOriginal(F.validar(JSON.parse(ev.newValue)));desenhar();}catch(err){recado('A cópia atualizada não pôde ser lida.',true);}}});
 desenhar();
})();
