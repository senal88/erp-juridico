import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PatrimonialAsset,
  toConsolidatedBRL,
  formatCurrencyVal,
  ASSET_CLASS_LABELS,
  AssetClass,
  EVIDENCE_LEVELS,
  EvidenceLevel,
} from '@/services/patrimonial_assets'
import { PieChart, Globe2, ShieldCheck } from 'lucide-react'

interface DistributionPanelProps {
  assets: PatrimonialAsset[]
}

export function DistributionPanel({ assets }: DistributionPanelProps) {
  // Apenas ativos positivos para distribuição da riqueza
  const positiveAssets = assets.filter((a) => a.asset_type === 'asset')
  const totalAssetsVal = positiveAssets.reduce(
    (sum, a) => sum + toConsolidatedBRL(a.valuation_value, a.currency),
    0,
  )

  // Distribuição por Classe
  const classTotals: Record<string, number> = {}
  positiveAssets.forEach((a) => {
    const val = toConsolidatedBRL(a.valuation_value, a.currency)
    classTotals[a.asset_class] = (classTotals[a.asset_class] || 0) + val
  })

  const sortedClasses = Object.entries(classTotals)
    .map(([cls, val]) => ({
      key: cls as AssetClass,
      label: ASSET_CLASS_LABELS[cls as AssetClass] || cls,
      value: val,
      percentage: totalAssetsVal > 0 ? (val / totalAssetsVal) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)

  // Distribuição por Jurisdição (Brasil x Offshore)
  let brasilTotal = 0
  let offshoreTotal = 0
  const countryBreakdown: Record<string, number> = {}

  positiveAssets.forEach((a) => {
    const val = toConsolidatedBRL(a.valuation_value, a.currency)
    if (a.jurisdiction_type === 'offshore') {
      offshoreTotal += val
    } else {
      brasilTotal += val
    }
    const c = a.country || 'Brasil'
    countryBreakdown[c] = (countryBreakdown[c] || 0) + val
  })

  const sortedCountries = Object.entries(countryBreakdown)
    .map(([cnt, val]) => ({
      country: cnt,
      value: val,
      percentage: totalAssetsVal > 0 ? (val / totalAssetsVal) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)

  // Distribuição por Nível de Evidência E0 - E4
  const evidenceBreakdown: Record<EvidenceLevel, number> = {
    E0: 0,
    E1: 0,
    E2: 0,
    E3: 0,
    E4: 0,
  }

  positiveAssets.forEach((a) => {
    const val = toConsolidatedBRL(a.valuation_value, a.currency)
    evidenceBreakdown[a.evidence_level] = (evidenceBreakdown[a.evidence_level] || 0) + val
  })

  const classColors = [
    'bg-primary',
    'bg-secondary',
    'bg-emerald-600',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-amber-600',
    'bg-purple-600',
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 1. Alocação por Classe de Ativo */}
      <Card className="border-border/60 shadow-sm flex flex-col">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <PieChart className="w-4 h-4 text-secondary" />
            Alocação por Classe
          </CardTitle>
          <span className="text-xs text-muted-foreground font-normal">Consolidado BRL</span>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          {sortedClasses.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Nenhum ativo cadastrado.
            </p>
          ) : (
            sortedClasses.map((item, idx) => (
              <div key={item.key} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span
                    className="font-medium text-foreground truncate max-w-[200px]"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                  <span className="font-semibold text-muted-foreground">
                    {item.percentage.toFixed(1)}% ({formatCurrencyVal(item.value, 'BRL')})
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${classColors[idx % classColors.length]}`}
                    style={{ width: `${Math.max(item.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 2. Distribuição por Jurisdição (Brasil x Exterior) */}
      <Card className="border-border/60 shadow-sm flex flex-col">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-secondary" />
            Jurisdição & Geografia
          </CardTitle>
          <span className="text-xs text-muted-foreground font-normal">Onshore vs Offshore</span>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          {/* Barra macro: Brasil x Offshore */}
          <div className="space-y-1.5 pb-2 border-b">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Brasil: {totalAssetsVal > 0 ? ((brasilTotal / totalAssetsVal) * 100).toFixed(1) : 0}
                %
              </span>
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Offshore:{' '}
                {totalAssetsVal > 0 ? ((offshoreTotal / totalAssetsVal) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-600 h-full"
                style={{
                  width: `${totalAssetsVal > 0 ? (brasilTotal / totalAssetsVal) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-blue-600 h-full"
                style={{
                  width: `${totalAssetsVal > 0 ? (offshoreTotal / totalAssetsVal) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Breakdown por país */}
          <div className="space-y-3 pt-1">
            {sortedCountries.slice(0, 4).map((c) => (
              <div key={c.country} className="flex justify-between items-center text-xs">
                <span className="text-foreground truncate max-w-[180px]" title={c.country}>
                  {c.country}
                </span>
                <span className="font-medium text-muted-foreground">
                  {c.percentage.toFixed(1)}% ({formatCurrencyVal(c.value, 'BRL')})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. Pirâmide de Evidência Probatória (Manual MFO 2026) */}
      <Card className="border-border/60 shadow-sm flex flex-col">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            Matriz de Evidência SSOT
          </CardTitle>
          <span className="text-xs text-muted-foreground font-normal">E0 a E4</span>
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          {(['E4', 'E3', 'E2', 'E1', 'E0'] as EvidenceLevel[]).map((lvl) => {
            const conf = EVIDENCE_LEVELS[lvl]
            const val = evidenceBreakdown[lvl] || 0
            const pct = totalAssetsVal > 0 ? (val / totalAssetsVal) * 100 : 0
            const count = positiveAssets.filter((a) => a.evidence_level === lvl).length

            return (
              <div
                key={lvl}
                className={`p-2 rounded-md border text-xs flex items-center justify-between ${
                  conf.validForMaterial
                    ? 'border-border/60 bg-muted/20'
                    : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${conf.colorClasses}`}
                  >
                    {lvl}
                  </span>
                  <span className="truncate text-foreground font-medium">{conf.shortDesc}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-semibold text-foreground">{pct.toFixed(0)}%</span>
                  <span className="text-[10px] text-muted-foreground block">
                    {count} {count === 1 ? 'ativo' : 'ativos'}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
