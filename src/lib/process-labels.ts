export const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  em_andamento: 'Em andamento',
  audiencia_marcada: 'Audiência marcada',
  com_sentenca: 'Com sentença',
  em_recurso: 'Em recurso',
  arquivado: 'Arquivado',
  encerrado: 'Encerrado',
}

export const STATUS_VARIANT: Record<string, string> = {
  novo: 'bg-slate-800 text-slate-100',
  em_andamento: 'bg-blue-100 text-blue-800',
  audiencia_marcada: 'bg-amber-100 text-amber-800',
  com_sentenca: 'bg-purple-100 text-purple-800',
  em_recurso: 'bg-orange-100 text-orange-800',
  arquivado: 'bg-slate-100 text-slate-800',
  encerrado: 'bg-emerald-100 text-emerald-800',
}

export const AREA_LABELS: Record<string, string> = {
  civil: 'Cível',
  trabalhista: 'Trabalhista',
  tributario: 'Tributário',
  empresarial: 'Empresarial',
  criminal: 'Criminal',
  familia: 'Família',
  previdenciario: 'Previdenciário',
  consumidor: 'Consumidor',
  outro: 'Outro',
}

export const PARTY_ROLE_LABELS: Record<string, string> = {
  autor: 'Autor',
  reu: 'Réu',
  terceiro_interessado: 'Terceiro Interessado',
  perito: 'Perito',
  testemunha: 'Testemunha',
  advogado_contrario: 'Advogado Contrário',
  outro: 'Outro',
}

export const DOCUMENT_KIND_LABELS: Record<string, string> = {
  peticao_inicial: 'Petição Inicial',
  contestacao: 'Contestação',
  replica: 'Réplica',
  recurso: 'Recurso',
  decisao: 'Decisão',
  sentenca: 'Sentença',
  procuracao: 'Procuração',
  contrato: 'Contrato',
  parecer: 'Parecer',
  comprovante: 'Comprovante',
  outro: 'Outro',
}
