import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Globe2,
  Building,
} from 'lucide-react'
import {
  PatrimonialAsset,
  toConsolidatedBRL,
  formatCurrencyVal,
} from '@/services/patrimonial_assets'

interface LedgerKpisProps {
  assets: PatrimonialAsset[]
}

export function LedgerKpis({ assets }: LedgerKpisProps) {
  // Totais consolidados em R$ (SSOT)
  const totalAssetsBRL = assets
    .filter((a) => a.asset_type === 'asset')
    .reduce((sum, a) => sum + toConsolidatedBRL(a.valuation_value, a.currency), 0)

  const totalLiabilitiesBRL = assets
    .filter((a) => a.asset_type === 'liability')
    .reduce((sum, a) => sum + toConsolidatedBRL(a.valuation_value, a.currency), 0)

  const netWorthBRL = totalAssetsBRL - totalLiabilitiesBRL

  // Contagem por nível de evidência
  const verifiedAssets = assets.filter(
    (a) => a.evidence_level === 'E2' || a.evidence_level === 'E3' || a.evidence_level === 'E4',
  )
  const unverifiedAssets = assets.filter(
    (a) => a.evidence_level === 'E0' || a.evidence_level === 'E1',
  )

  const unverifiedValueBRL = unverifiedAssets.reduce(
    (sum, a) => sum + toConsolidatedBRL(a.valuation_value, a.currency),
    0,
  )

  const offshoreAssets = assets.filter((a) => a.jurisdiction_type === 'offshore')
  const offshoreValueBRL = offshoreAssets
    .filter((a) => a.asset_type === 'asset')
    .reduce((sum, a) => sum + toConsolidatedBRL(a.valuation_value, a.currency), 0)

  const offshoreRatio = totalAssetsBRL > 0 ? (offshoreValueBRL / totalAssetsBRL) * 100 : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Patrimônio Bruto */}
      <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ativo Bruto Consolidado
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-serif text-foreground tracking-tight">
              {formatCurrencyVal(totalAssetsBRL, 'BRL')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {assets.filter((a) => a.asset_type === 'asset').length} posições ativas registradas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Passivo Total */}
      <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Passivos & Financiamentos
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-serif text-foreground tracking-tight">
              {formatCurrencyVal(totalLiabilitiesBRL, 'BRL')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {assets.filter((a) => a.asset_type === 'liability').length} dívidas ou garantias CCB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Patrimônio Líquido */}
      <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-card via-card to-secondary/5">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-secondary uppercase tracking-wider font-semibold">
              Patrimônio Líquido MFO
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-serif text-foreground tracking-tight">
              {formatCurrencyVal(netWorthBRL, 'BRL')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Globe2 className="w-3.5 h-3.5 text-secondary" />
              <span>{offshoreRatio.toFixed(1)}% alocado no exterior</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Índice de Evidência & Governança */}
      <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Auditabilidade SSOT (E2–E4)
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                unverifiedAssets.length > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {unverifiedAssets.length > 0 ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-serif text-foreground tracking-tight flex items-baseline gap-2">
              <span>
                {verifiedAssets.length} / {assets.length}
              </span>
              <span className="text-xs font-sans text-muted-foreground font-normal">
                ({assets.length > 0 ? Math.round((verifiedAssets.length / assets.length) * 100) : 0}
                %)
              </span>
            </div>
            <p className="text-xs mt-1">
              {unverifiedAssets.length > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {unverifiedAssets.length} ativo(s) abaixo de E2 (
                  {formatCurrencyVal(unverifiedValueBRL, 'BRL')})
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  100% da carteira apta a decisões materiais
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
