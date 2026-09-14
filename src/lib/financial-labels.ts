export const FEE_KIND_LABELS: Record<string, string> = {
  fixo: 'Fixo',
  exito: 'Êxito',
  recorrente: 'Recorrente',
  sucumbencial: 'Sucumbencial',
  consulta: 'Consulta',
}

export const FEE_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  cobrado: 'Cobrado',
  recebido: 'Recebido',
  cancelado: 'Cancelado',
}

export const FEE_BILLING_BASIS_LABELS: Record<string, string> = {
  valor_causa: 'Valor da Causa',
  acordo: 'Acordo',
  condenacao: 'Condenação',
  valor_contratado: 'Valor Contratado',
  outra: 'Outra',
}

export const FEE_RECURRENCE_LABELS: Record<string, string> = {
  unica: 'Única',
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
}

export const EXPENSE_KIND_LABELS: Record<string, string> = {
  custas: 'Custas Processuais',
  cartorio: 'Cartório',
  pericia: 'Perícia',
  copias: 'Cópias',
  transporte: 'Transporte',
  estacionamento: 'Estacionamento',
  correios: 'Correios',
  outras: 'Outras',
}

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  paga: 'Paga',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
}

export const INVOICE_PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  cartao: 'Cartão',
  cheque: 'Cheque',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
}

export const FEE_STATUS_VARIANT: Record<string, string> = {
  pendente: 'bg-muted text-muted-foreground border-border',
  cobrado: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
  recebido: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  cancelado: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20',
}

export const INVOICE_STATUS_VARIANT: Record<string, string> = {
  rascunho: 'bg-muted text-muted-foreground border-border',
  enviada: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
  paga: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  vencida: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20',
  cancelada: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20',
}

export const formatBRL = (value: number | undefined | null): string => {
  if (value == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export const formatPercent = (value: number | undefined | null): string => {
  if (value == null) return '0%'
  return (
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
      value,
    ) + '%'
  )
}
