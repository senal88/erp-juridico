import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Landmark,
  ShieldCheck,
  ShieldAlert,
  Globe2,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  Building2,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PatrimonialAsset,
  EVIDENCE_LEVELS,
  ASSET_CLASS_LABELS,
  HOLDING_STRUCTURE_LABELS,
  formatCurrencyVal,
  toConsolidatedBRL,
} from '@/services/patrimonial_assets'

export default function PortalPatrimonio() {
  const [assets, setAssets] = useState<PatrimonialAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAssets = async () => {
      try {
        // A regra RLS no PocketBase já filtra automaticamente os ativos do cliente logado:
        // (@request.auth.role = 'cliente' && client_id.user = @request.auth.id)
        const data = await pb.collection('patrimonial_assets').getFullList<PatrimonialAsset>({
          sort: '-valuation_value',
        })
        setAssets(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAssets()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const positiveAssets = assets.filter((a) => a.asset_type === 'asset')
  const totalAssetsBRL = positiveAssets.reduce(
    (sum, a) => sum + toConsolidatedBRL(a.valuation_value, a.currency),
    0,
  )
  const totalLiabilitiesBRL = assets
    .filter((a) => a.asset_type === 'liability')
    .reduce((sum, a) => sum + toConsolidatedBRL(a.valuation_value, a.currency), 0)
  const netWorthBRL = totalAssetsBRL - totalLiabilitiesBRL

  const verifiedCount = assets.filter(
    (a) => a.evidence_level === 'E2' || a.evidence_level === 'E3' || a.evidence_level === 'E4',
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
            Inventário Patrimonial da Família
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Posição consolidada e rastreabilidade de evidência documental mantida pelo Family
            Office.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/portal">Voltar ao Início</Link>
        </Button>
      </div>

      {/* Cards de Totais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Ativo Bruto Consolidado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-slate-900">
              {formatCurrencyVal(totalAssetsBRL, 'BRL')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {positiveAssets.length} posições de bens e direitos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Passivos Vinculados
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-slate-900">
              {formatCurrencyVal(totalLiabilitiesBRL, 'BRL')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {assets.filter((a) => a.asset_type === 'liability').length} financiamentos ou
              garantias
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-slate-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-slate-400">
              Patrimônio Líquido Familiar
            </CardTitle>
            <Layers className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-white">
              {formatCurrencyVal(netWorthBRL, 'BRL')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Auditabilidade: {verifiedCount} de {assets.length} posições em nível ≥ E2
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Ativos */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Posições no Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Landmark className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p>Nenhum ativo vinculado registrado no momento.</p>
              <p className="text-xs mt-1 text-slate-400">
                Seu consultor patrimonial incluirá os ativos conforme a apuração documental.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assets.map((item) => {
                const conf = EVIDENCE_LEVELS[item.evidence_level]
                const isLiability = item.asset_type === 'liability'
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-base">
                            {item.name}
                          </span>
                          {isLiability && (
                            <Badge variant="destructive" className="text-[10px]">
                              Passivo
                            </Badge>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${conf.colorClasses}`}
                          >
                            {conf.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {ASSET_CLASS_LABELS[item.asset_class]} •{' '}
                          {HOLDING_STRUCTURE_LABELS[item.holding_structure]} • {item.country}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-serif font-bold text-base text-slate-900">
                          {isLiability ? '-' : ''}
                          {formatCurrencyVal(item.valuation_value, item.currency)}
                        </div>
                        {item.currency !== 'BRL' && (
                          <div className="text-xs text-slate-400">
                            ≈{' '}
                            {formatCurrencyVal(
                              toConsolidatedBRL(item.valuation_value, item.currency),
                              'BRL',
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 border-t pt-2">{item.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t">
                      <span>
                        <strong>Titular:</strong> {item.direct_owner}
                      </span>
                      {item.encumbrances && (
                        <span>
                          <strong>Ônus:</strong> {item.encumbrances}
                        </span>
                      )}
                      <span>
                        <strong>Evidência:</strong> {conf.shortDesc}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
