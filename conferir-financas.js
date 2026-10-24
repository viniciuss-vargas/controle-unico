/* Compara os registros atuais com uma cópia escolhida, sem alterar nenhum dos dois. */
(function(){
 const local=()=>{try{return Financas.validar(JSON.parse(localStorage.getItem('controle-unico-financas-cache')));}catch(err){return null;}};
 const caixa=document.createElement('section');caixa.className='painel';caixa.style.marginTop='12px';
 caixa.innerHTML='<h2>Conferir suas finanças</h2><p id="conferencia-fin-atual"></p><p>Compare o caderno deste aparelho com uma cópia JSON dos seus dados. A leitura acontece neste navegador.</p><button type="button" class="b p" id="conferencia-fin-escolher">Escolher cópia JSON para comparar</button><input id="conferencia-fin-arquivo" type="file" accept=".json,application/json" hidden><p id="conferencia-fin-resultado" role="status"></p>';
 document.querySelector('.wrap').prepend(caixa);
 function mostrar(){const d=local();document.getElementById('conferencia-fin-atual').textContent=d?d.registros.filter(r=>!r.arquivado).length+' registros ativos no caderno deste aparelho.':'Abra o módulo Dinheiro para carregar seu caderno neste aparelho.';}
 document.getElementById('conferencia-fin-escolher').onclick=()=>document.getElementById('conferencia-fin-arquivo').click();
 document.getElementById('conferencia-fin-arquivo').onchange=async ev=>{try{
  const f=ev.target.files[0];if(!f)return;const atual=local();if(!atual)throw new Error('Abra seu caderno no módulo Dinheiro primeiro.');
  const entrada=JSON.parse(await f.text()),copia=Financas.validar(entrada.financas||entrada),a=new Map(atual.registros.map(r=>[r.id,r])),b=new Map(copia.registros.map(r=>[r.id,r]));
  const campos=['descricao','categoria','valor','situacao','pagoEm','vencimento','mesPrevisto','tipo','pagamento','observacoes','fitid','origemNotion','arquivado','fonte'];
  let diferentes=0,soAqui=0,soCopia=0;for(const [id,r]of a){if(!b.has(id))soAqui++;else if(campos.some(k=>JSON.stringify(r[k]??null)!==JSON.stringify(b.get(id)[k]??null)))diferentes++;}for(const id of b.keys())if(!a.has(id))soCopia++;
  document.getElementById('conferencia-fin-resultado').textContent=diferentes||soAqui||soCopia?`${diferentes} registros diferentes · ${soAqui} só neste aparelho · ${soCopia} só na cópia. Nenhum dado foi alterado.`:`Conferido: os ${a.size} registros são iguais, incluindo categorias, situações, valores e vínculos do extrato. Nenhum dado foi alterado.`;
 }catch(err){document.getElementById('conferencia-fin-resultado').textContent=err.message;}finally{ev.target.value='';}};
 window.addEventListener('storage',mostrar);mostrar();
})();
