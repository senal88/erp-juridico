import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface TemplateContext {
  cliente?: {
    name?: string
    email?: string
    phone?: string
    documento?: string // cpf_cnpj
  }
  processo?: {
    title?: string
    cnj?: string
    area?: string
    vara?: string
    comarca?: string
    valor_causa?: number
    instance?: string
  }
  advogado?: {
    name?: string
    email?: string
  }
  cidade?: string
}

export const AVAILABLE_VARIABLES = [
  { group: 'Cliente', key: 'cliente_nome', description: 'Nome do cliente' },
  { group: 'Cliente', key: 'cliente_email', description: 'E-mail do cliente' },
  { group: 'Cliente', key: 'cliente_telefone', description: 'Telefone do cliente' },
  { group: 'Cliente', key: 'cliente_documento', description: 'CPF/CNPJ do cliente' },

  { group: 'Processo', key: 'processo_titulo', description: 'Título do processo' },
  { group: 'Processo', key: 'processo_cnj', description: 'Número CNJ do processo' },
  { group: 'Processo', key: 'processo_area', description: 'Área do direito' },
  { group: 'Processo', key: 'processo_vara', description: 'Vara' },
  { group: 'Processo', key: 'processo_comarca', description: 'Comarca' },
  { group: 'Processo', key: 'processo_valor_causa', description: 'Valor da causa' },
  { group: 'Processo', key: 'processo_instancia', description: 'Instância' },

  { group: 'Advogado', key: 'advogado_nome', description: 'Nome do advogado' },
  { group: 'Advogado', key: 'advogado_email', description: 'E-mail do advogado' },

  { group: 'Data', key: 'data_hoje', description: 'Data atual (DD/MM/YYYY)' },
  { group: 'Data', key: 'data_hoje_extenso', description: 'Data atual por extenso' },
  { group: 'Data', key: 'cidade_data_hoje', description: 'Cidade e data atual' },
]

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const resolveVariable = (key: string, context: TemplateContext): string | undefined => {
  const today = new Date()

  switch (key) {
    case 'cliente_nome':
      return context.cliente?.name
    case 'cliente_email':
      return context.cliente?.email
    case 'cliente_telefone':
      return context.cliente?.phone
    case 'cliente_documento':
      return context.cliente?.documento

    case 'processo_titulo':
      return context.processo?.title
    case 'processo_cnj':
      return context.processo?.cnj
    case 'processo_area':
      return context.processo?.area
    case 'processo_vara':
      return context.processo?.vara
    case 'processo_comarca':
      return context.processo?.comarca
    case 'processo_valor_causa':
      return context.processo?.valor_causa
        ? formatCurrency(context.processo.valor_causa)
        : undefined
    case 'processo_instancia':
      return context.processo?.instance

    case 'advogado_nome':
      return context.advogado?.name
    case 'advogado_email':
      return context.advogado?.email

    case 'data_hoje':
      return format(today, 'dd/MM/yyyy')
    case 'data_hoje_extenso':
      return format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    case 'cidade_data_hoje': {
      const city = context.cidade || 'Cidade'
      const dateExtenso = format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      return `${city}, ${dateExtenso}`
    }

    default:
      return undefined
  }
}

export const renderTemplate = (content: string, context: TemplateContext): string => {
  if (!content) return ''

  const variableRegex = /\{\{([^{}]+)\}\}/g

  return content.replace(variableRegex, (match, key) => {
    const trimmedKey = key.trim()
    const resolvedValue = resolveVariable(trimmedKey, context)

    if (resolvedValue === undefined || resolvedValue === null) {
      return match
    }

    return String(resolvedValue)
  })
}

export const detectVariables = (content: string) => {
  if (!content) return { recognized: [], unrecognized: [] }

  const variableRegex = /\{\{([^{}]+)\}\}/g
  const matches = [...content.matchAll(variableRegex)]

  const allKeys = matches.map((match) => match[1].trim())
  const uniqueKeys = [...new Set(allKeys)]

  const knownKeys = new Set(AVAILABLE_VARIABLES.map((v) => v.key))

  const recognized = uniqueKeys.filter((key) => knownKeys.has(key))
  const unrecognized = uniqueKeys.filter((key) => !knownKeys.has(key))

  return { recognized, unrecognized }
}
