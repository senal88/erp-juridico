import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Globe2,
  Building2,
  ArrowUpDown,
  FileText,
} from 'lucide-react'
import {
  PatrimonialAsset,
  EVIDENCE_LEVELS,
  ASSET_CLASS_LABELS,
  HOLDING_STRUCTURE_LABELS,
  LIQUIDITY_LABELS,
  formatCurrencyVal,
  toConsolidatedBRL,
  EvidenceLevel,
  AssetClass,
} from '@/services/patrimonial_assets'

interface AssetTableProps {
  assets: PatrimonialAsset[]
  onEdit: (asset: PatrimonialAsset) => void
  onDelete: (asset: PatrimonialAsset) => void
}

export function AssetTable({ assets, onEdit, onDelete }: AssetTableProps) {
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>('all')
  const [filterEvidence, setFilterEvidence] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'evidence'>('value')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Busca textual
      const matchesSearch =
        search === '' ||
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.direct_owner.toLowerCase().includes(search.toLowerCase()) ||
        (asset.country && asset.country.toLowerCase().includes(search.toLowerCase())) ||
        (asset.shared_ownership &&
          asset.shared_ownership.toLowerCase().includes(search.toLowerCase())) ||
        (asset.expand?.client_id?.name &&
          asset.expand.client_id.name.toLowerCase().includes(search.toLowerCase()))

      // Filtro por Classe
      const matchesClass = filterClass === 'all' || asset.asset_class === filterClass

      // Filtro por Jurisdição
      const matchesJurisdiction =
        filterJurisdiction === 'all' || asset.jurisdiction_type === filterJurisdiction

      // Filtro por Nível de Evidência
      const matchesEvidence = filterEvidence === 'all' || asset.evidence_level === filterEvidence

      // Filtro por Natureza (Ativo / Passivo)
      const matchesType = filterType === 'all' || asset.asset_type === filterType

      return matchesSearch && matchesClass && matchesJurisdiction && matchesEvidence && matchesType
    })
  }, [assets, search, filterClass, filterJurisdiction, filterEvidence, filterType])

  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      if (sortBy === 'value') {
        const valA = toConsolidatedBRL(a.valuation_value, a.currency)
        const valB = toConsolidatedBRL(b.valuation_value, b.currency)
        return sortOrder === 'desc' ? valB - valA : valA - valB
      }
      if (sortBy === 'name') {
        return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
      }
      if (sortBy === 'evidence') {
        return sortOrder === 'desc'
          ? b.evidence_level.localeCompare(a.evidence_level)
          : a.evidence_level.localeCompare(b.evidence_level)
      }
      return 0
    })
  }, [filteredAssets, sortBy, sortOrder])

  const toggleSort = (col: 'value' | 'name' | 'evidence') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ativo, titular, país, gravame..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Natureza */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[125px] h-9 text-xs">
              <SelectValue placeholder="Natureza" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Contas</SelectItem>
              <SelectItem value="asset">Apenas Ativos</SelectItem>
              <SelectItem value="liability">Apenas Passivos</SelectItem>
            </SelectContent>
          </Select>

          {/* Classe */}
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Classes</SelectItem>
              {Object.entries(ASSET_CLASS_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Jurisdição */}
          <Select value={filterJurisdiction} onValueChange={setFilterJurisdiction}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Jurisdição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Jurisdições</SelectItem>
              <SelectItem value="brasil">Brasil (Onshore)</SelectItem>
              <SelectItem value="offshore">Offshore (Exterior)</SelectItem>
            </SelectContent>
          </Select>

          {/* Nível de Evidência E0 - E4 */}
          <Select value={filterEvidence} onValueChange={setFilterEvidence}>
            <SelectTrigger className="w-[135px] h-9 text-xs">
              <SelectValue placeholder="Evidência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Níveis (E0-E4)</SelectItem>
              {Object.entries(EVIDENCE_LEVELS).map(([k, item]) => (
                <SelectItem key={k} value={k}>
                  [{k}] {item.shortDesc.slice(0, 22)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search ||
            filterClass !== 'all' ||
            filterJurisdiction !== 'all' ||
            filterEvidence !== 'all' ||
            filterType !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setFilterClass('all')
                setFilterJurisdiction('all')
                setFilterEvidence('all')
                setFilterType('all')
              }}
              className="text-xs text-muted-foreground h-9"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Tabela de Ativos SSOT */}
      <div className="rounded-lg border border-border/70 overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[30%]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('name')}
                  className="p-0 font-semibold text-xs flex items-center gap-1 hover:bg-transparent"
                >
                  Ativo / Denominação
                  <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />
                </Button>
              </TableHead>
              <TableHead className="w-[15%]">Classe & Estrutura</TableHead>
              <TableHead className="w-[16%]">Titularidade & Ônus</TableHead>
              <TableHead className="w-[12%] text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('evidence')}
                  className="p-0 font-semibold text-xs flex items-center gap-1 hover:bg-transparent mx-auto"
                >
                  Evidência SSOT
                  <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />
                </Button>
              </TableHead>
              <TableHead className="w-[17%] text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort('value')}
                  className="p-0 font-semibold text-xs flex items-center gap-1 hover:bg-transparent ml-auto"
                >
                  Valuation
                  <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />
                </Button>
              </TableHead>
              <TableHead className="w-[60px] text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum registro patrimonial encontrado com os critérios selecionados.
                </TableCell>
              </TableRow>
            ) : (
              sortedAssets.map((asset) => {
                const evConfig = EVIDENCE_LEVELS[asset.evidence_level]
                const isBelowE2 = asset.evidence_level === 'E0' || asset.evidence_level === 'E1'
                const isLiability = asset.asset_type === 'liability'
                const consolidatedBRL = toConsolidatedBRL(asset.valuation_value, asset.currency)

                return (
                  <TableRow
                    key={asset.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => onEdit(asset)}
                  >
                    {/* Ativo / Denominação */}
                    <TableCell className="align-top py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                            {asset.name}
                          </span>
                          {isLiability && (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-900"
                            >
                              Passivo
                            </Badge>
                          )}
                        </div>
                        {asset.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {asset.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                          {asset.expand?.client_id && (
                            <span className="font-medium text-foreground/80">
                              Família: {asset.expand.client_id.name}
                            </span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {asset.jurisdiction_type === 'offshore' ? (
                              <Globe2 className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Building2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {asset.country}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Classe & Estrutura */}
                    <TableCell className="align-top py-3.5">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-foreground">
                          {ASSET_CLASS_LABELS[asset.asset_class] || asset.asset_class}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {HOLDING_STRUCTURE_LABELS[asset.holding_structure] ||
                            asset.holding_structure}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Liquidez:{' '}
                          <span
                            className={
                              LIQUIDITY_LABELS[asset.liquidity]?.color || 'text-foreground'
                            }
                          >
                            {LIQUIDITY_LABELS[asset.liquidity]?.label || asset.liquidity}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Titularidade & Ônus */}
                    <TableCell className="align-top py-3.5">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-foreground">
                          {asset.direct_owner}
                        </div>
                        {asset.shared_ownership && (
                          <div className="text-[11px] text-muted-foreground line-clamp-2">
                            {asset.shared_ownership}
                          </div>
                        )}
                        {asset.encumbrances && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800 line-clamp-1 inline-block">
                            Ônus: {asset.encumbrances}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Nível de Evidência Probatória */}
                    <TableCell className="align-top py-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-transform hover:scale-105 cursor-pointer ${evConfig.colorClasses}`}
                            >
                              {isBelowE2 ? (
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                              )}
                              <span>{asset.evidence_level}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            <p className="font-semibold">{evConfig.label}</p>
                            <p className="text-muted-foreground mt-1">{evConfig.description}</p>
                            {isBelowE2 && (
                              <p className="text-rose-600 font-medium mt-1">
                                ⚠ Bloqueado para decisões e recomendações materiais.
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>

                        {isBelowE2 && (
                          <span className="text-[9px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                            Insuficiente
                          </span>
                        )}
                        {!isBelowE2 && (
                          <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
                            Apto MFO
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Valuation Value */}
                    <TableCell className="align-top py-3.5 text-right">
                      <div className="space-y-0.5">
                        <div
                          className={`font-serif font-bold text-sm ${
                            isLiability ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                          }`}
                        >
                          {isLiability ? '-' : ''}
                          {formatCurrencyVal(asset.valuation_value, asset.currency)}
                        </div>
                        {asset.currency !== 'BRL' && (
                          <div className="text-[11px] text-muted-foreground">
                            ≈ {formatCurrencyVal(consolidatedBRL, 'BRL')}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          Base:{' '}
                          {asset.valuation_date
                            ? new Date(asset.valuation_date).toLocaleDateString('pt-BR')
                            : '-'}
                        </div>
                      </div>
                    </TableCell>

                    {/* Menu de Ações */}
                    <TableCell
                      className="align-middle py-3.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(asset)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar Ativo
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => onDelete(asset)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
