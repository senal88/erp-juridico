export const TIME_CATEGORIES = {
  drafting: { label: 'Redação', color: 'bg-primary/10 text-primary hover:bg-primary/20' },
  hearing: {
    label: 'Audiência',
    color: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  },
  meeting: { label: 'Reunião', color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
  research: {
    label: 'Pesquisa',
    color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
  },
  phone: { label: 'Telefone', color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
  email: { label: 'E-mail', color: 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20' },
  other: { label: 'Outro', color: 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20' },
} as const

export type TimeCategory = keyof typeof TIME_CATEGORIES

export const TIME_STATUSES = {
  registrada: { label: 'Registrada', color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  cobrada: { label: 'Cobrada', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  descartada: { label: 'Descartada', color: 'bg-red-50 text-red-700 border border-red-200' },
} as const

export type TimeStatus = keyof typeof TIME_STATUSES
