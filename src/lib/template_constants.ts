export const TEMPLATE_CATEGORIES = {
  peticao_inicial: 'Petição Inicial',
  contestacao: 'Contestação',
  replica: 'Réplica',
  recurso: 'Recurso',
  procuracao: 'Procuração',
  contrato: 'Contrato',
  parecer: 'Parecer',
  notificacao: 'Notificação',
  requerimento: 'Requerimento',
  declaracao: 'Declaração',
  outro: 'Outro',
} as const

export type TemplateCategory = keyof typeof TEMPLATE_CATEGORIES

export const TEMPLATE_CATEGORY_COLORS: Record<TemplateCategory, string> = {
  peticao_inicial:
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
  contestacao:
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
  replica:
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50',
  recurso:
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50',
  procuracao:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
  contrato:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
  parecer:
    'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/50',
  notificacao:
    'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800/50',
  requerimento:
    'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50',
  declaracao:
    'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800/50',
  outro:
    'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
}
