import type { MessageSchema } from '../messageKeys'
import type { ptBR } from './pt-BR'

export const es: MessageSchema<typeof ptBR> = {
  app: {
    title: 'Macaria QA — Consistencia de issues'
  },
  nav: {
    label: 'Páginas',
    dashboard: 'Dashboard',
    about: 'Acerca de',
    back: '← Volver al dashboard'
  },
  language: {
    label: 'Idioma'
  },
  theme: {
    useLight: 'Tema claro',
    useDark: 'Tema oscuro'
  },
  connection: {
    checking: '… Conectando',
    connected: '✔ Conectado',
    disconnected: '✖ Desconectado'
  },
  labels: {
    organization: 'Organización',
    repository: 'Repositorio',
    project: 'Project'
  },
  settings: {
    open: 'Configuración',
    title: 'Configuración',
    closeLabel: 'Cerrar configuración',
    closeText: 'Cerrar',
    sectionTitle: 'Conexión con GitHub',
    token: 'Token de GitHub',
    tokenConfigured: '✔ Configurado',
    tokenMissing: '✖ Ausente',
    organizationUnknown: 'No identificada',
    repositoryUnknown: 'No identificado',
    projectUnknown: 'No identificado',
    projectNotConfigured: 'no configurado',
    projectFailure: '✖ Campos del Project no disponibles: {reason}',
    hint: 'La organización, el repositorio, el Project y el token vienen del archivo .env. La herramienta solo lee datos de GitHub. Después de cambiar el .env, reinicie el servidor o genere el build de nuevo.',
    configure: 'Configurar conexión'
  },
  sourceLabel: 'Fuente de los datos',
  filters: {
    label: 'Filtros',
    search: 'Búsqueda',
    searchPlaceholder: 'Número, URL o título',
    assignee: 'Responsable',
    all: 'Todos',
    allFeminine: 'Todas',
    noAssignee: 'Sin responsable',
    type: 'Tipo de issue',
    severity: 'Severidad',
    errors: 'Errores',
    warnings: 'Avisos',
    situation: 'Situación',
    withProblems: 'Con problemas',
    notEvaluated: 'No evaluadas',
    period: 'Período',
    periodDate: 'Fecha usada en el período',
    updatedAt: 'Actualización',
    createdAt: 'Creación',
    closedAt: 'Cierre',
    collectedAt: 'Recolección',
    dateFrom: 'Fecha inicial',
    dateTo: 'Fecha final'
  },
  summary: {
    label: 'Resumen del análisis',
    analyzed: 'Issues analizadas',
    withProblems: 'Con problemas',
    findings: 'Inconsistencias'
  },
  refresh: {
    button: 'Actualizar análisis',
    loading: 'Actualizando…',
    cancel: 'Cancelar',
    lastUpdate: 'Última actualización: {date}',
    never: 'Aún sin actualización'
  },
  results: {
    label: 'Resultados',
    loading: 'Cargando issues de GitHub…',
    noIssues: 'Este repositorio no tiene issues.',
    noMatch: 'Ninguna issue para estos filtros.'
  },
  table: {
    caption: 'Issues analizadas. Use el título para ver las inconsistencias de cada issue.',
    number: 'N.º',
    title: 'Título',
    assignee: 'Responsable',
    projectStatus: 'Estado del Project',
    problems: 'Problemas',
    statusEmpty: '{statusField} vacío: no es posible saber si es distinto de {optionalStatus}.',
    statusNotEvaluated: 'No evaluado',
    errorCount: '{count} error | {count} errores',
    warningCount: '{count} aviso | {count} avisos',
    notEvaluated: 'No evaluada',
    noProblems: 'Sin problemas'
  },
  severity: {
    error: 'error',
    warning: 'aviso',
    info: 'info'
  },
  details: {
    aria: 'Detalles de la issue #{number}',
    type: 'Tipo: {value}',
    open: 'Abrir en GitHub',
    update: 'Actualizar esta issue',
    findingsTitle: 'Inconsistencias ({count})',
    noFindings: 'No se encontraron problemas en las reglas evaluadas.',
    field: 'Campo',
    current: 'Valor actual',
    expected: 'Patrón esperado',
    explanation: 'Explicación',
    suggestion: 'Sugerencia: {value}',
    cannotEvaluate: 'No fue posible evaluar',
    unclassifiedNotice:
      'Issue sin clasificación Task ni Subtask: las reglas de título no se aplicaron.'
  },
  classification: {
    other: 'Otro',
    unclassified: 'Sin clasificación',
    withOrigin: '{name} ({origin})',
    originType: 'tipo',
    originLabel: 'label, alternativa'
  },
  update: {
    done: 'Issue #{number} actualizada.',
    cancelled: 'Actualización de la issue cancelada.',
    failed: 'No fue posible actualizar #{number}: {reason}'
  },
  errors: {
    syncCancelled: 'Sincronización cancelada.',
    unexpected: 'Ocurrió un error inesperado.',
    unexpectedDetail: 'Ocurrió un error inesperado: {detail}',
    tokenMissing:
      'El token de GitHub no está configurado. Defina GIT_TOKEN en el archivo .env y reinicie el servidor o genere el build de nuevo.',
    repositoryMissing: 'La variable REPOSITORY_URL no está configurada en el archivo .env.',
    repositoryInvalid:
      'La variable REPOSITORY_URL no es válida. Use https://github.com/dueño/repositorio o dueño/repositorio.',
    projectNumberInvalid:
      'La variable PROJECT_NUMBER no es válida. Use el número del Project, como 3.',
    github401:
      '401: El token de GitHub no es válido o expiró. Genere un token nuevo y actualice GIT_TOKEN en el archivo .env.',
    github403:
      '403: GitHub negó el acceso. Es posible que el token no tenga permiso de lectura de Issues en este repositorio, o que se haya alcanzado el límite de solicitudes.',
    github404:
      '404: Repositorio no encontrado, o el token no tiene acceso a él. Revise REPOSITORY_URL en el archivo .env.',
    githubOther: '{status}: {statusText}',
    project401:
      '401: El token de GitHub no es válido o expiró. Genere un token nuevo y actualice GIT_TOKEN en el archivo .env.',
    project403:
      '403: GitHub negó el acceso al Project. El token necesita el permiso Projects (solo lectura) de la organización.',
    project404:
      '404: Project no encontrado, o el token no tiene acceso a él. Revise PROJECT_NUMBER en el archivo .env.',
    issueMissing: 'Issue #{number} no encontrada o eliminada.',
    pullRequest: '#{number} es un pull request, no una issue.',
    invalidIssues: 'La respuesta de issues de GitHub no es válida.',
    invalidIssue: 'La respuesta de la issue de GitHub no es válida.',
    notList: 'La respuesta de GitHub no es una lista.',
    waitTooLong:
      'GitHub pidió una espera mayor que {seconds} segundos. Inténtelo de nuevo más tarde.',
    retriesExhausted:
      'GitHub siguió rechazando las solicitudes después de {attempts} intentos. Inténtelo de nuevo más tarde.',
    foreignLink: 'GitHub indicó una página siguiente en otra dirección. La consulta fue cancelada.',
    invalidProjectFields: 'La respuesta de campos del Project de GitHub no es válida.',
    invalidProjectItems: 'La respuesta de elementos del Project de GitHub no es válida.'
  },
  availability: {
    'not-queried': 'no consultado',
    'no-access': 'sin acceso',
    'not-found': 'no encontrado en el Project',
    'outside-project': 'issue fuera del Project',
    'query-failed': 'falló la consulta'
  },
  fields: {
    title: 'Título',
    subtasks: 'Subtareas'
  },
  rules: {
    taskTitleFormat:
      "El título no sigue el formato propuesto “Prefijo {'|'} descripción YYYY-MM-DD”.",
    taskTitleFormatExpected: "<prefijo> {'|'} <descripción> YYYY-MM-DD",
    taskDateInvalid: 'La fecha final falta o no es una fecha de calendario válida.',
    taskDateExpected: 'Fecha YYYY-MM-DD válida',
    requiredChildren: 'Esta categoría fue configurada para exigir subtareas.',
    requiredChildrenExpected: 'Al menos una subtarea',
    childrenDone: 'Todas las subtareas están concluidas, pero la task no está {done}.',
    subMarker: 'El marcador MACARIA está mal formado.',
    subSpacing: 'Hay un espacio inicial/final o un separador sin espacio.',
    subScenarios: 'Use “Scenarios” en plural.',
    subFormat: 'Título fuera de los formatos configurados.',
    ffMissing: '{initiative} aplicable sin {featureFlagName}.',
    ffMissingExpected: '{featureFlagName} completado o una excepción',
    ffConflict:
      '{featureFlagName} completado entra en conflicto con {featureFlagStatus} “{noFlag}”.',
    ffSiblings: 'Las subtareas hermanas tienen valores de feature flag distintos.',
    requiredField: 'Campo obligatorio sin completar.',
    requiredFieldExpected: 'Campo completado',
    tag: 'Informe la tag o N/A cuando no haya.',
    tagExpected: 'Tag o N/A',
    bugs: 'Informe la cantidad de bugs o 0 cuando no haya.',
    bugsExpected: 'Número (0 cuando no haya bugs)',
    startRequired: 'Campo obligatorio cuando el {statusField} sea distinto de {optionalStatus}.',
    startExpected: '{field} completado',
    milestoneMissing: 'Toda issue necesita una milestone.',
    milestoneInvalid: 'La milestone debe ser {names}.',
    milestoneExpected: '{names}'
  },
  notEvaluated: {
    requiredFields: 'Campos obligatorios',
    cannotRead: 'No fue posible leer: {fields}.',
    fieldWithState: '{name} ({state})',
    statusUnknown: '{statusField} {state}: no es posible saber si es distinto de {optionalStatus}.',
    statusEmpty: 'Status vacío: no es posible saber si es distinto de {optionalStatus}.',
    startUnavailable: '{field} {state}.'
  },
  footer: {
    label: 'Enlaces del pie de página',
    text: 'Macaria QA — Dashboard de consistencia de issues',
    openRepository: 'Abrir repositorio en GitHub'
  },
  about: {
    lead: 'Dashboard de consistencia de issues',
    intro:
      'Ayuda al equipo de QA a identificar información ausente o fuera del estándar en las issues y en los campos de GitHub Projects. La herramienta solo lee datos: nunca cambia nada en GitHub.',
    featuresTitle: 'Qué puede hacer',
    features: {
      queryTitle: 'Consultar issues y Project',
      queryText: 'Lee las issues del repositorio y los campos del GitHub Project.',
      findTitle: 'Encontrar campos fuera del estándar',
      findText: 'Señala campos obligatorios vacíos y títulos fuera del formato.',
      filterTitle: 'Filtrar los resultados',
      filterText: 'Por responsable, tipo, severidad, situación y período.',
      fixTitle: 'Ver qué corregir',
      fixText: 'Muestra el campo, el valor actual y el patrón esperado.'
    },
    usageTitle: 'Cómo usar',
    steps: {
      connectionTitle: 'Revisar la conexión',
      connectionText:
        'El botón “{settings}” muestra la organización, el repositorio y el Project que se están leyendo.',
      loadTitle: 'Cargar los datos',
      loadText: 'La página lee GitHub al abrir. Para leer de nuevo, haga clic en “{refresh}”.',
      filterTitle: 'Filtrar',
      filterText: 'Use {controls}. En {period}, elija la fecha usada: {dates}.',
      analyzeTitle: 'Analizar las inconsistencias',
      analyzeText:
        'Haga clic en el título de la issue. El panel muestra el campo señalado, el valor actual, el patrón esperado y la explicación.',
      correctTitle: 'Corregir en GitHub',
      correctText: 'Use “{open}” y corrija la información allí. La herramienta no cambia issues.',
      checkTitle: 'Verificar la corrección',
      checkText: 'Haga clic en “{updateIssue}” (solo esa issue) o en “{refresh}” (todas).'
    },
    resultsTitle: 'Cómo interpretar los resultados',
    resultsIntro: 'Cada issue de la tabla muestra uno de estos estados.',
    example: 'Ejemplo:',
    stateError: 'Información fuera de una regla obligatoria.',
    stateWarning: 'Situación que necesita revisión.',
    stateNotEvaluated:
      'Faltaron datos o acceso para comprobar. El panel de la issue indica el motivo: campo sin acceso, no encontrado, falló la consulta o issue fuera del Project.',
    stateOk: 'Todas las reglas aplicables fueron evaluadas y ninguna señaló problemas.',
    resultsNote:
      'Los títulos, nombres de campos y valores vienen de GitHub y aparecen como texto, exactamente como se recibieron.',
    privacyTitle: 'Acceso y privacidad',
    privacy: {
      readOnly: 'Solo lectura: la herramienta no cambia issues ni Projects.',
      direct:
        'Las consultas van del navegador directamente a la API de GitHub, sin servidor en medio.',
      access:
        'Los datos mostrados dependen del acceso de lectura configurado por el equipo. Lo que ese acceso no alcanza aparece como “{notEvaluated}”.',
      storage:
        'No se guarda nada en el navegador, excepto la elección de tema e idioma. No hay historial.',
      lastUpdate:
        '“Última actualización” muestra cuándo se leyeron los datos. No es seguimiento en tiempo real.'
    },
    developerTitle: 'Desarrollo y contacto',
    developedBy: 'Desarrollado por {name}',
    purpose:
      'Finalidad: apoyar el trabajo de QA en la identificación de inconsistencias de las issues.',
    contactInvite: '¿Dudas, sugerencias, reportes de problemas, etc.? Escriba a',
    contactMissing: 'Contacto aún no configurado',
    repositoryNote:
      'El repositorio analizado es la fuente de los datos. No es el canal de contacto del desarrollador.'
  }
}
