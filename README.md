# Controle Único

Aplicativo pessoal em HTML, CSS e JavaScript, hospedado no GitHub Pages. A estrutura original reúne Tudo, Carteira (Dinheiro, Casa e Cripto), Clínica, Conferência, Guia, Formulação de Caso, Rede PBT e controle compartilhado.

O repositório contém somente código e imagens. Os dados ficam em cadernos privados no Google Drive e em uma cópia no navegador. Nenhum registro pessoal deve ser enviado ao repositório.

## Finanças adaptadas

O módulo Dinheiro usa o caderno `financas`, modelo `financas-vinicius-v1`, com `registros[]`. Preserva categorias, situações, datas reais ou ausentes, mês previsto, valores desconhecidos, ressarcimentos, FITIDs e origem da migração.

`financas-original-core.js` adapta os registros ao original, sem duplicar despesas nem renomear categorias. Reserva, receitas, movimentos da reserva, pendências e limites ficam na extensão `organizacao` do mesmo caderno. Casa e Clínica têm cadernos separados.

`financas-original-ui.js` oferece filtros de categoria, busca, situação e período, categorias que abrem os lançamentos, editor com pagamento explícito e importação revisada de OFX Cora. Uma conta não se torna paga pela chegada do vencimento. Sem receitas informadas, o app não presume saldo disponível.

## Google e publicação

O login usa a mesma aba e o escopo `drive.file`. Selecionar o caderno existente no Google Picker. Identificadores públicos ficam em `config.js`; nunca incluir senha, segredo OAuth, token ou dados dos cadernos. A chave do Picker é restrita por site e API.

GitHub Pages publica a branch `master`, pasta raiz. `versao.json` e a versão dos recursos evitam código antigo no navegador. Atualizar dados no Drive não exige republicar o site.

A origem recebida permanece preservada fora da pasta pública. O script privado `preparar-original-vinicius.cjs` reaplica as adaptações sem copiar dados para o código. O app não cria cadernos vazios no Drive automaticamente. Há exportações JSON e Excel.
