import pb from '@/lib/pocketbase/client'

export type AssetType = 'asset' | 'liability'

export type AssetClass =
  | 'real_estate'
  | 'corporate_stake'
  | 'financial_investments'
  | 'vehicles_tangible'
  | 'intellectual_property'
  | 'crypto_digital'
  | 'other'

export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'CHF'

export type HoldingStructure =
  | 'individual'
  | 'holding_familiar'
  | 'holding_operacional'
  | 'offshore_pic'
  | 'trust'
  | 'fund_exclusive'
  | 'condominio_patrimonial'
  | 'outro'

export type JurisdictionType = 'brasil' | 'offshore'

export type LiquidityLevel = 'alta' | 'media' | 'baixa' | 'iliquido'

export type EvidenceLevel = 'E0' | 'E1' | 'E2' | 'E3' | 'E4'

export interface PatrimonialAsset {
  id: string
  name: string
  description?: string
  asset_type: AssetType
  asset_class: AssetClass
  valuation_value: number
  valuation_date: string
  currency: CurrencyCode
  direct_owner: string
  shared_ownership?: string
  holding_structure: HoldingStructure
  jurisdiction_type: JurisdictionType
  country: string
  encumbrances?: string
  liquidity: LiquidityLevel
  evidence_level: EvidenceLevel
  valid_for_material_decision?: boolean
  evidence_document_file?: string[]
  evidence_notes?: string
  notes?: string
  client_id: string
  expand?: {
    client_id?: {
      id: string
      name: string
      email?: string
      cpf_cnpj?: string
    }
  }
  created: string
  updated: string
}

export const EVIDENCE_LEVELS: Record<
  EvidenceLevel,
  {
    code: EvidenceLevel
    label: string
    description: string
    validForMaterial: boolean
    badgeVariant: 'outline' | 'default' | 'secondary' | 'destructive'
    colorClasses: string
    shortDesc: string
  }
> = {
  E0: {
    code: 'E0',
    label: 'E0 — Declarado sem Prova',
    shortDesc: 'Apenas informado verbalmente ou em anotação informal',
    description:
      'Ativo ou passivo informado pelo cliente sem qualquer respaldo documental ou extrato. Não pode fundamentar recomendações jurídicas ou sucessórias materiais.',
    validForMaterial: false,
    badgeVariant: 'destructive',
    colorClasses:
      'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
  },
  E1: {
    code: 'E1',
    label: 'E1 — Evidência Preliminar',
    shortDesc: 'Minutas, rascunhos ou capturas parciais',
    description:
      'Rascunhos de contratos, minutas não assinadas ou e-mails exploratórios. Indicativo de existência, mas frágil para apuração de legítima ou planejamento societário.',
    validForMaterial: false,
    badgeVariant: 'secondary',
    colorClasses:
      'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
  },
  E2: {
    code: 'E2',
    label: 'E2 — Evidência Secundária Suficiente',
    shortDesc: 'Declarações fiscais (IRPF/CBE), extratos não oficiais',
    description:
      'Declaração de IRPF, CBE BACEN preliminar ou balancete gerencial. Ponto de corte mínimo regulatório: apto para iniciar recomendações materiais sob salvaguardas.',
    validForMaterial: true,
    badgeVariant: 'default',
    colorClasses:
      'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
  },
  E3: {
    code: 'E3',
    label: 'E3 — Evidência Formal Qualificada',
    shortDesc: 'Certidões de cartório, contratos sociais registrados',
    description:
      'Matrícula imobiliária atualizada, estatuto social arquivado na Junta Comercial ou extrato bancário oficial assinado. Robusto para decisões de alocação.',
    validForMaterial: true,
    badgeVariant: 'default',
    colorClasses:
      'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800',
  },
  E4: {
    code: 'E4',
    label: 'E4 — Evidência Primária Auditada',
    shortDesc: 'Laudo pericial independente, auditoria Big 4, custódia direta',
    description:
      'Avaliação pericial de avaliador independente (NBR 14653/CVM), trust deeds originais legalizados por apostila de Haia, extrato de custódia direta auditado.',
    validForMaterial: true,
    badgeVariant: 'default',
    colorClasses:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 font-medium',
  },
}

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  real_estate: 'Imóveis (Urbanos e Rurais)',
  corporate_stake: 'Participações Societárias & Empresas',
  financial_investments: 'Aplicações & Valores Mobiliários',
  vehicles_tangible: 'Veículos, Aeronaves e Ativos Físicos',
  intellectual_property: 'Propriedade Intelectual & Marcas',
  crypto_digital: 'Ativos Digitais & Cripto',
  other: 'Outros Bens e Direitos',
}

export const ASSET_CLASS_ICONS_MAP: Record<AssetClass, string> = {
  real_estate: 'Building2',
  corporate_stake: 'Briefcase',
  financial_investments: 'TrendingUp',
  vehicles_tangible: 'Plane',
  intellectual_property: 'Copyright',
  crypto_digital: 'Coins',
  other: 'Layers',
}

export const HOLDING_STRUCTURE_LABELS: Record<HoldingStructure, string> = {
  individual: 'Pessoa Física Direta',
  holding_familiar: 'Holding Familiar (Pura / Mista)',
  holding_operacional: 'Holding Operacional',
  offshore_pic: 'PIC Offshore (BVI, Cayman, Delaware)',
  trust: 'Trust Irrevogável / Revogável',
  fund_exclusive: 'Fundo Exclusivo (FIP / FIA / Multimercado)',
  condominio_patrimonial: 'Condomínio Patrimonial',
  outro: 'Outra Estrutura',
}

export const LIQUIDITY_LABELS: Record<LiquidityLevel, { label: string; color: string }> = {
  alta: { label: 'Alta (D+0 a D+5)', color: 'text-emerald-600 dark:text-emerald-400' },
  media: { label: 'Média (D+6 a D+60)', color: 'text-blue-600 dark:text-blue-400' },
  baixa: { label: 'Baixa (D+61 a D+360)', color: 'text-amber-600 dark:text-amber-400' },
  iliquido: { label: 'Ilíquido (> 1 ano / ilíquido)', color: 'text-slate-500' },
}

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  BRL: 'R$',
  USD: 'US$',
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
}

// Cotações de referência simplificadas para consolidação global SSOT em BRL
export const CURRENCY_FX_RATES_TO_BRL: Record<CurrencyCode, number> = {
  BRL: 1.0,
  USD: 5.65,
  EUR: 6.15,
  GBP: 7.2,
  CHF: 6.4,
}

export const formatCurrencyVal = (value: number, currency: CurrencyCode = 'BRL'): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || 'R$'
  const formattedNumber = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
  return `${symbol} ${formattedNumber}`
}

export const toConsolidatedBRL = (value: number, currency: CurrencyCode = 'BRL'): number => {
  const rate = CURRENCY_FX_RATES_TO_BRL[currency] || 1.0
  return value * rate
}

export const getPatrimonialAssets = async (
  filter?: string,
  sort: string = '-created',
): Promise<PatrimonialAsset[]> => {
  return (await pb.collection('patrimonial_assets').getFullList({
    filter,
    sort,
    expand: 'client_id',
  })) as unknown as PatrimonialAsset[]
}

export const getPatrimonialAsset = async (id: string): Promise<PatrimonialAsset> => {
  return (await pb.collection('patrimonial_assets').getOne(id, {
    expand: 'client_id',
  })) as unknown as PatrimonialAsset
}

export const createPatrimonialAsset = async (data: any): Promise<PatrimonialAsset> => {
  return (await pb.collection('patrimonial_assets').create(data)) as unknown as PatrimonialAsset
}

export const updatePatrimonialAsset = async (id: string, data: any): Promise<PatrimonialAsset> => {
  return (await pb.collection('patrimonial_assets').update(id, data)) as unknown as PatrimonialAsset
}

export const deletePatrimonialAsset = async (id: string): Promise<boolean> => {
  return await pb.collection('patrimonial_assets').delete(id)
}
