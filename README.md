# Dashboard de consistência de issues

SPA Vue 3 para auditar regras de qualidade de issues. Roda inteiramente no navegador: não há backend nem proxy. Os dados vêm somente da API do GitHub.

## Configuração (.env)

Copie `.env.example` para `.env` e preencha as variáveis:

- `GIT_TOKEN`: token fine-grained do GitHub, somente leitura, com o resource owner da organização, acesso ao repositório e as permissões Issues (repositório) e Projects (organização).
- `REPOSITORY_URL`: `https://github.com/dono/repositorio` (com ou sem `.git` ou barra final) ou `dono/repositorio`.
- `PROJECT_NUMBER`: número do Project da organização, o mesmo da URL (`.../orgs/dono/projects/3` usa `3`). A organização é o dono do repositório. Vazio desativa a consulta ao Project.

O Vite lê só esses três nomes no `vite.config.ts` e os grava no código gerado. Depois de mudar o `.env`, reinicie o `npm run dev` ou refaça o build.

> **Atenção:** o token fica embutido no build. Qualquer pessoa que abrir os arquivos de `dist/` consegue lê-lo. Nunca publique `dist/` em hospedagem pública (inclusive GitHub Pages) e nunca versione o `.env`. Use um token de leitura mínima e troque-o se `dist/` vazar.

## Executar

```bash
npm install
npm run dev
npm test
npm run build
npm run format
```

`npm run format` aplica o Prettier (2 espaços, 100 colunas). `npm run format:check` só verifica.

## Deploy no GitHub Pages

O workflow `.github/workflows/deploy.yml` roda a cada push na `main` (e manualmente, em Actions → Deploy to GitHub Pages → Run workflow). Ele instala com `npm ci`, roda os testes, gera o build com `GITHUB_PAGES=true` (base `/dashboard-macaria/`) e publica `dist/` pelo fluxo oficial de artifacts. Não existe branch `gh-pages`.

Configuração manual, uma vez: Settings → Pages → Build and deployment → Source → **GitHub Actions**. Opcionalmente, defina a variável `PROJECT_NUMBER` em Settings → Secrets and variables → Actions → Variables.

URL: https://eduardoseijimacaria.github.io/dashboard-macaria/

O workflow não recebe `GIT_TOKEN`, de propósito: o token entraria no JavaScript público. Sem ele, o site publicado abre e mostra "token não configurado". A navegação usa hash (`#/sobre`), então recarregar Dashboard ou Sobre funciona sem rota de servidor.

## Fonte de dados

A página sincroniza sozinha ao abrir. O botão "Atualizar análise" repete a sincronização e "Cancelar" interrompe a chamada. O horário da última atualização aparece ao lado do botão. A tela mostra o repositório lido (`dono/repositorio`), nunca o token. O token é enviado direto a `api.github.com`. O adaptador pagina REST Issues e exclui pull requests. Com `PROJECT_NUMBER`, a aplicação também lê os campos do Project (`GET /orgs/{org}/projectsV2/{n}/fields` e `/items`, paginados, pedindo só os campos necessários) e relaciona cada item à issue pelo `content.id`. Sem `PROJECT_NUMBER`, a auditoria indica campos não avaliados.

Se `GIT_TOKEN` estiver vazio, a página avisa e não chama a API. Se `REPOSITORY_URL` faltar ou for inválida, a página avisa. Os erros 401, 403 e 404 do GitHub têm mensagens próprias.

Se a consulta ao Project falhar (por exemplo, token sem a permissão Projects), as issues continuam na tela. Os campos do Project ficam "sem acesso" ou "falha na consulta", as regras que dependem deles ficam não avaliadas, e o painel "Conexão" mostra o motivo. A consulta foi verificada contra o Project de teste (`EduardoSeijiMacaria`, Project 3). Os formatos de número e data ainda não foram vistos com valor preenchido.

## Idiomas

A interface existe em português do Brasil, inglês e espanhol. O seletor no cabeçalho troca na hora, sem recarregar e sem nova consulta ao GitHub, e os apontamentos já exibidos mudam de idioma junto. A escolha fica no `localStorage` (`qa-dashboard-locale`), separada do tema. Sem escolha salva, vale o idioma do navegador (`pt`, `en` ou `es`); caso contrário, `pt-BR`.

Só os textos da aplicação são traduzidos. Títulos, responsáveis, labels, milestones, nomes e valores dos campos do Project e nomes de repositórios vêm do GitHub e aparecem como foram recebidos. As traduções ficam em `src/i18n/messages/` (um arquivo por idioma, com as mesmas chaves). Para acrescentar um texto, escreva a chave nos três arquivos; o TypeScript e os testes recusam um idioma com chave faltando.

## Cabeçalho e configurações

O cabeçalho mostra "Macaria QA", os links "Dashboard" e "Sobre", o estado da conexão e os botões de tema e "Configurações". O botão abre um painel lateral com organização, repositório, Project e o estado do token (nunca o valor). O painel fecha com Escape, com o botão "Fechar" ou com um clique fora dele, e o foco volta ao botão que o abriu. Abrir ou fechar o painel não faz consultas. Como esses valores vêm do arquivo `.env`, o painel não tem ação de conectar, trocar ou desconectar. Se a conexão falhar, a área de resultados mostra o erro e o botão "Configurar conexão".

## Página Sobre

O link "Sobre" no cabeçalho e no rodapé abre `#/sobre`, com o propósito da ferramenta, o passo a passo, a leitura dos resultados, a privacidade e o contato do desenvolvedor. A navegação usa o hash da URL, então funciona em qualquer hospedagem estática e não apaga filtros nem dados carregados.

A página é para quem abre o dashboard: não traz detalhes de `.env`, token ou permissões. O crédito ("QA Macaria") e o contato (e-mail, com link `mailto:`) ficam em `src/services/developerInfo.ts`. Para trocar o contato, altere `contact` (`name`, `url` e, opcionalmente, `display`; aceita `https:` e `mailto:`). Sem `contact`, a página mostra "Contato ainda não configurado".

## Classificação em Task e Subtask

A categoria vem primeiro do tipo nativo da issue (`type.name` na API REST). Os nomes de tipo (padrão "Task" e "Subtask") ficam em `defaultConfig.classification`, em `src/services/config.ts`. A comparação ignora maiúsculas e espaços nas pontas. Um tipo que não corresponde a nenhum nome vira "Outro (tipo)".

Em repositórios sem tipos, a alternativa é o label (padrão "task" e "subtask"). A tela marca esse caso como "label, alternativa". Se a issue tem os dois labels, ou nenhum, ela fica "Sem classificação": o código não adivinha. A classificação ainda não foi testada contra a API real do GitHub.

## O que está implementado

- filtros por responsável, tipo da issue, severidade, situação, busca e período (finais inclusivos em `America/Sao_Paulo`);
- motor puro, versionado e configurável de regras TASK, SUB, FF, de milestone obrigatória (`Quality Assistance 2026` ou `Quality Engineering 2026`, configurável em `allowedMilestoneNames`) e de campos obrigatórios do Project (Status, Start, Tag, QA Apply, QA Early, Test Mode, Dev Docs, Initiative, Team, FF Name, FF Status, Bugs Sbx, Bugs Stg, Bugs Prod); os apontamentos aparecem pelo nome real do campo, sem códigos de regra;
- tabela com detalhe expansível: campo ou regra, valor atual, padrão esperado, explicação, link para a issue e atualização só daquela issue;
- resumo e estado por linha que separam "sem problemas" de "não avaliada";
- atualizações manuais, cancelamento de chamada e paginação REST;
- dados não confiáveis renderizados como texto, sem `v-html`.

## Decisões pendentes

TASK-004 e FF-001 começam desabilitadas por serem convenções provisórias. Também precisam de confirmação o mapeamento real de tipo Task/Subtask, o formato dos campos de número e data do Project com valor preenchido, a obrigatoriedade de End e Release date, a proibição de Start preenchido em `Todo`, critério de subtarefa concluída e exceções justificadas de FF entre irmãos.
A aplicação não guarda histórico: cada sincronização avalia de novo os dados atuais do GitHub. A aplicação não promete coleta com a página fechada e não realiza nenhuma escrita no GitHub.
