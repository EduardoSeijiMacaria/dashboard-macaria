export const ptBR = {
  app: {
    title: 'Macaria QA — Consistência de issues'
  },
  nav: {
    label: 'Páginas',
    dashboard: 'Dashboard',
    about: 'Sobre',
    back: '← Voltar ao dashboard'
  },
  language: {
    label: 'Idioma'
  },
  theme: {
    useLight: 'Tema claro',
    useDark: 'Tema escuro'
  },
  connection: {
    checking: '… Conectando',
    connected: '✔ Conectado',
    disconnected: '✖ Desconectado'
  },
  labels: {
    organization: 'Organização',
    repository: 'Repositório',
    project: 'Project'
  },
  settings: {
    open: 'Configurações',
    title: 'Configurações',
    closeLabel: 'Fechar configurações',
    closeText: 'Fechar',
    sectionTitle: 'Conexão com o GitHub',
    token: 'Token do GitHub',
    tokenConfigured: '✔ Configurado',
    tokenMissing: '✖ Ausente',
    organizationUnknown: 'Não identificada',
    repositoryUnknown: 'Não identificado',
    projectUnknown: 'Não identificado',
    projectNotConfigured: 'não configurado',
    projectFailure: '✖ Campos do Project indisponíveis: {reason}',
    hint: 'Organização, repositório, Project e token vêm do arquivo .env. A ferramenta só lê dados do GitHub. Depois de alterar o .env, reinicie o servidor ou gere o build de novo.',
    configure: 'Configurar conexão'
  },
  sourceLabel: 'Fonte dos dados',
  filters: {
    label: 'Filtros',
    search: 'Busca',
    searchPlaceholder: 'Número, URL ou título',
    assignee: 'Responsável',
    all: 'Todos',
    allFeminine: 'Todas',
    noAssignee: 'Sem responsável',
    type: 'Tipo da issue',
    severity: 'Severidade',
    errors: 'Erros',
    warnings: 'Avisos',
    situation: 'Situação',
    withProblems: 'Com problemas',
    notEvaluated: 'Não avaliadas',
    period: 'Período',
    periodDate: 'Data usada no período',
    updatedAt: 'Atualização',
    createdAt: 'Criação',
    closedAt: 'Fechamento',
    collectedAt: 'Coleta',
    dateFrom: 'Data inicial',
    dateTo: 'Data final'
  },
  summary: {
    label: 'Resumo da análise',
    analyzed: 'Issues analisadas',
    withProblems: 'Com problemas',
    findings: 'Inconsistências'
  },
  refresh: {
    button: 'Atualizar análise',
    loading: 'Atualizando…',
    cancel: 'Cancelar',
    lastUpdate: 'Última atualização: {date}',
    never: 'Ainda sem atualização'
  },
  results: {
    label: 'Resultados',
    loading: 'Carregando issues do GitHub…',
    noIssues: 'Este repositório não tem issues.',
    noMatch: 'Nenhuma issue para estes filtros.'
  },
  table: {
    caption: 'Issues analisadas. Use o título para ver as inconsistências de cada issue.',
    number: 'Nº',
    title: 'Título',
    assignee: 'Responsável',
    projectStatus: 'Status do Project',
    problems: 'Problemas',
    statusEmpty: '{statusField} vazio: não é possível saber se é diferente de {optionalStatus}.',
    statusNotEvaluated: 'Não avaliado',
    errorCount: '{count} erro | {count} erros',
    warningCount: '{count} aviso | {count} avisos',
    notEvaluated: 'Não avaliada',
    noProblems: 'Sem problemas'
  },
  severity: {
    error: 'erro',
    warning: 'aviso',
    info: 'info'
  },
  details: {
    aria: 'Detalhes da issue #{number}',
    type: 'Tipo: {value}',
    open: 'Abrir no GitHub',
    update: 'Atualizar esta issue',
    findingsTitle: 'Inconsistências ({count})',
    noFindings: 'Nenhum problema encontrado nas regras avaliadas.',
    field: 'Campo',
    current: 'Valor atual',
    expected: 'Padrão esperado',
    explanation: 'Explicação',
    suggestion: 'Sugestão: {value}',
    cannotEvaluate: 'Não foi possível avaliar',
    unclassifiedNotice:
      'Issue sem classificação Task ou Subtask: as regras de título não foram aplicadas.'
  },
  classification: {
    other: 'Outro',
    unclassified: 'Sem classificação',
    withOrigin: '{name} ({origin})',
    originType: 'tipo',
    originLabel: 'label, alternativa'
  },
  update: {
    done: 'Issue #{number} atualizada.',
    cancelled: 'Atualização da issue cancelada.',
    failed: 'Não foi possível atualizar #{number}: {reason}'
  },
  errors: {
    syncCancelled: 'Sincronização cancelada.',
    unexpected: 'Ocorreu um erro inesperado.',
    unexpectedDetail: 'Ocorreu um erro inesperado: {detail}',
    tokenMissing:
      'O token do GitHub não está configurado. Defina GIT_TOKEN no arquivo .env e reinicie o servidor ou refaça o build.',
    repositoryMissing: 'A variável REPOSITORY_URL não está configurada no arquivo .env.',
    repositoryInvalid:
      'A variável REPOSITORY_URL é inválida. Use https://github.com/dono/repositorio ou dono/repositorio.',
    projectNumberInvalid: 'A variável PROJECT_NUMBER é inválida. Use o número do Project, como 3.',
    github401:
      '401: O token do GitHub é inválido ou expirou. Gere um novo token e atualize GIT_TOKEN no arquivo .env.',
    github403:
      '403: O GitHub negou o acesso. O token pode não ter permissão de leitura de Issues neste repositório, ou o limite de requisições foi atingido.',
    github404:
      '404: Repositório não encontrado, ou o token não tem acesso a ele. Confira REPOSITORY_URL no arquivo .env.',
    githubOther: '{status}: {statusText}',
    project401:
      '401: O token do GitHub é inválido ou expirou. Gere um novo token e atualize GIT_TOKEN no arquivo .env.',
    project403:
      '403: O GitHub negou o acesso ao Project. O token precisa da permissão Projects (somente leitura) da organização.',
    project404:
      '404: Project não encontrado, ou o token não tem acesso a ele. Confira PROJECT_NUMBER no arquivo .env.',
    issueMissing: 'Issue #{number} não encontrada ou removida.',
    pullRequest: '#{number} é um pull request, não uma issue.',
    invalidIssues: 'A resposta de issues do GitHub é inválida.',
    invalidIssue: 'A resposta da issue do GitHub é inválida.',
    notList: 'A resposta do GitHub não é uma lista.',
    waitTooLong:
      'O GitHub pediu uma espera maior que {seconds} segundos. Tente novamente mais tarde.',
    retriesExhausted:
      'O GitHub continuou recusando as requisições após {attempts} tentativas. Tente novamente mais tarde.',
    foreignLink: 'O GitHub indicou uma próxima página em outro endereço. A consulta foi cancelada.',
    invalidProjectFields: 'A resposta de campos do Project do GitHub é inválida.',
    invalidProjectItems: 'A resposta de itens do Project do GitHub é inválida.'
  },
  availability: {
    'not-queried': 'não consultado',
    'no-access': 'sem acesso',
    'not-found': 'não encontrado no Project',
    'outside-project': 'issue fora do Project',
    'query-failed': 'falha na consulta'
  },
  fields: {
    title: 'Título',
    subtasks: 'Subtarefas'
  },
  rules: {
    taskTitleFormat: "Título não segue o formato proposto “Prefixo {'|'} descrição YYYY-MM-DD”.",
    taskTitleFormatExpected: "<prefixo> {'|'} <descrição> YYYY-MM-DD",
    taskDateInvalid: 'A data final está ausente ou não é uma data de calendário válida.',
    taskDateExpected: 'Data YYYY-MM-DD válida',
    requiredChildren: 'Esta categoria foi configurada para exigir subtarefas.',
    requiredChildrenExpected: 'Ao menos uma subtarefa',
    childrenDone: 'Todas as subtarefas estão concluídas, mas a task não está {done}.',
    subMarker: 'O marcador MACARIA está malformado.',
    subSpacing: 'Há espaço inicial/final ou separador sem espaço.',
    subScenarios: 'Use “Scenarios” no plural.',
    subFormat: 'Título fora dos formatos configurados.',
    ffMissing: '{initiative} aplicável sem {featureFlagName}.',
    ffMissingExpected: '{featureFlagName} preenchido ou exceção',
    ffConflict: '{featureFlagName} preenchido conflita com {featureFlagStatus} “{noFlag}”.',
    ffSiblings: 'Subtarefas irmãs têm valores de feature flag divergentes.',
    requiredField: 'Campo obrigatório não preenchido.',
    requiredFieldExpected: 'Campo preenchido',
    tag: 'Informe a tag ou N/A quando não houver.',
    tagExpected: 'Tag ou N/A',
    bugs: 'Informe a quantidade de bugs ou 0 quando não houver.',
    bugsExpected: 'Número (0 quando não houver bugs)',
    startRequired: 'Campo obrigatório quando o {statusField} for diferente de {optionalStatus}.',
    startExpected: '{field} preenchido',
    milestoneMissing: 'Toda issue precisa de uma milestone.',
    milestoneInvalid: 'A milestone deve ser {names}.',
    milestoneExpected: '{names}'
  },
  notEvaluated: {
    requiredFields: 'Campos obrigatórios',
    cannotRead: 'Não foi possível ler: {fields}.',
    fieldWithState: '{name} ({state})',
    statusUnknown:
      '{statusField} {state}: não é possível saber se é diferente de {optionalStatus}.',
    statusEmpty: 'Status vazio: não é possível saber se é diferente de {optionalStatus}.',
    startUnavailable: '{field} {state}.'
  },
  footer: {
    label: 'Links do rodapé',
    text: 'Macaria QA — Dashboard de consistência de issues',
    openRepository: 'Abrir repositório no GitHub'
  },
  about: {
    lead: 'Dashboard de consistência de issues',
    intro:
      'Ajuda o time de QA a identificar informações ausentes ou fora do padrão nas issues e nos campos do GitHub Projects. A ferramenta só lê dados: ela nunca altera nada no GitHub.',
    featuresTitle: 'O que você pode fazer',
    features: {
      queryTitle: 'Consultar issues e Project',
      queryText: 'Lê as issues do repositório e os campos do GitHub Project.',
      findTitle: 'Achar campos fora do padrão',
      findText: 'Aponta campos obrigatórios vazios e títulos fora do formato.',
      filterTitle: 'Filtrar os resultados',
      filterText: 'Por responsável, tipo, severidade, situação e período.',
      fixTitle: 'Ver o que corrigir',
      fixText: 'Mostra o campo, o valor atual e o padrão esperado.'
    },
    usageTitle: 'Como usar',
    steps: {
      connectionTitle: 'Conferir a conexão',
      connectionText:
        'O botão “{settings}” mostra a organização, o repositório e o Project que estão sendo lidos.',
      loadTitle: 'Carregar os dados',
      loadText: 'A página lê o GitHub ao abrir. Para ler de novo, clique em “{refresh}”.',
      filterTitle: 'Filtrar',
      filterText: 'Use {controls}. No {period}, escolha a data usada: {dates}.',
      analyzeTitle: 'Analisar as inconsistências',
      analyzeText:
        'Clique no título da issue. O painel mostra o campo apontado, o valor atual, o padrão esperado e a explicação.',
      correctTitle: 'Corrigir no GitHub',
      correctText: 'Use “{open}” e corrija a informação lá. A ferramenta não altera issues.',
      checkTitle: 'Conferir a correção',
      checkText: 'Clique em “{updateIssue}” (só aquela issue) ou em “{refresh}” (todas).'
    },
    resultsTitle: 'Como interpretar os resultados',
    resultsIntro: 'Cada issue da tabela mostra um destes estados.',
    example: 'Exemplo:',
    stateError: 'Informação fora de uma regra obrigatória.',
    stateWarning: 'Situação que precisa de revisão.',
    stateNotEvaluated:
      'Faltaram dados ou acesso para checar. O painel da issue diz o motivo: campo sem acesso, não encontrado, falha na consulta ou issue fora do Project.',
    stateOk: 'Todas as regras aplicáveis foram avaliadas e nenhuma apontou problema.',
    resultsNote:
      'Títulos, nomes de campos e valores vêm do GitHub e aparecem como texto, exatamente como foram recebidos.',
    privacyTitle: 'Acesso e privacidade',
    privacy: {
      readOnly: 'Somente leitura: a ferramenta não altera issues nem Projects.',
      direct: 'As consultas vão do navegador direto para a API do GitHub, sem servidor no meio.',
      access:
        'Os dados mostrados dependem do acesso de leitura configurado pela equipe. O que esse acesso não alcança aparece como “{notEvaluated}”.',
      storage:
        'Nada é guardado no navegador, exceto a escolha de tema e de idioma. Não há histórico.',
      lastUpdate:
        '“Última atualização” mostra quando os dados foram lidos. Isso não é acompanhamento em tempo real.'
    },
    developerTitle: 'Desenvolvimento e contato',
    developedBy: 'Desenvolvido pelo {name}',
    purpose: 'Finalidade: apoiar o trabalho de QA na identificação de inconsistências das issues.',
    contactInvite: 'Dúvidas, sugestões, relatos de problemas etc.? Escreva para',
    contactMissing: 'Contato ainda não configurado',
    repositoryNote:
      'O repositório analisado é a fonte dos dados. Ele não é o canal de contato do desenvolvedor.'
  }
}
