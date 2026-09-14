export const getScheduleColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    case 'confirmed':
      return 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    case 'in_progress':
      return 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    case 'completed':
      return 'bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700'
    case 'no_show':
      return 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
    case 'cancelled':
      return 'bg-slate-100 border-slate-300 text-slate-500 line-through opacity-70 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    default:
      return 'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  }
}
