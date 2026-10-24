# Controle Único

Aplicativo pessoal de finanças em HTML, CSS e JavaScript, preparado para GitHub Pages.

O repositório contém somente código e imagens. Os registros financeiros ficam em um arquivo JSON privado no Google Drive de quem usa; não devem ser enviados a este repositório.

## Hospedagem

Em Settings → Pages, selecionar Deploy from a branch, branch master e pasta raiz. O arquivo `.nojekyll` permite servir os arquivos estáticos diretamente. Cada atualização enviada à branch publica o código novamente. Registros financeiros são atualizados no Drive e não exigem uma publicação do site.

## Conexão com Google Drive

O login solicita a permissão `drive.file` e usa Google Picker para escolher o caderno existente. Não precisa de login do ChatGPT.

No Google Cloud, ativar Drive API e Picker API, configurar o consentimento e criar um cliente OAuth Web. Autorizar a origem exata do GitHub Pages e a URI de retorno completa, com a pasta do repositório e `/` no final. A chave do Picker precisa das restrições recomendadas pelo Google.

Preencher apenas os identificadores públicos de navegador em `config.js`. Nunca incluir senha, segredo OAuth, token de acesso ou conteúdo financeiro nos arquivos do site. A configuração ainda não preenchida bloqueia o login com uma mensagem clara.

## Uso

Abrir o site, entrar com o Google e escolher o caderno financeiro no Drive. Para começar por uma cópia local, usar Dados e cópias → Carregar cópia JSON. Até a conexão com Drive estar autorizada, alterações ficam somente no navegador. Usar Baixar cópia dos dados para preservar alterações locais.

O aplicativo permite cadastrar e editar gastos, registrar pagamentos nas contas já previstas, consultar categorias e histórico mensal, e revisar débitos de extratos Cora. Importação usa FITID para evitar duplicatas e exige confirmação de categorias e de vínculos a contas existentes. Créditos não são tratados automaticamente como renda.