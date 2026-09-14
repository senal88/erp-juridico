import { Lead, getLeadScoreColor, isLeadOverdue } from '@/services/leads'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, ArrowRightLeft, Edit, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const ST_MAP: Record<string, { label: string; variant: any }> = {
  novo: { label: 'Novo', variant: 'default' },
  contatado: { label: 'Contatado', variant: 'secondary' },
  qualificado: { label: 'Qualificado', variant: 'outline' },
  proposta: { label: 'Proposta', variant: 'outline' },
  ganho: { label: 'Ganho', variant: 'default' },
  perdido: { label: 'Perdido', variant: 'destructive' },
}

interface Props {
  leads: Lead[]
  onEdit: (l: Lead) => void
  onDelete: (l: Lead) => void
  onConvert: (l: Lead) => void
}

export function LeadTable({ leads, onEdit, onDelete, onConvert }: Props) {
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome / Empresa</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Área de Interesse</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor Estimado</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Próximo Contato</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => (
            <TableRow
              key={l.id}
              className="cursor-pointer"
              onClick={(e) => {
                if (
                  (e.target as HTMLElement).closest('button') ||
                  (e.target as HTMLElement).closest('[role="menu"]')
                )
                  return
                onEdit(l)
              }}
            >
              <TableCell>
                <div className="font-medium">{l.name}</div>
                <div className="text-sm text-slate-500">{l.company || '-'}</div>
              </TableCell>
              <TableCell className="capitalize text-sm">{l.source || '-'}</TableCell>
              <TableCell className="capitalize text-sm">{l.interest_area || '-'}</TableCell>
              <TableCell>
                <Badge variant={ST_MAP[l.status]?.variant}>{ST_MAP[l.status]?.label}</Badge>
              </TableCell>
              <TableCell>{l.estimated_value ? formatBRL(l.estimated_value) : '-'}</TableCell>
              <TableCell>
                {l.score !== undefined ? (
                  <Badge className={`shadow-none border-0 ${getLeadScoreColor(l.score)}`}>
                    {l.score}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {l.next_followup_at ? (
                  <div
                    className={`flex items-center gap-2 text-sm ${isLeadOverdue(l) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                  >
                    <Calendar className="h-4 w-4" />
                    {format(new Date(l.next_followup_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(l)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    {l.status !== 'ganho' && (
                      <DropdownMenuItem onClick={() => onConvert(l)}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Converter em Cliente
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10"
                      onClick={() => onDelete(l)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum lead encontrado com os filtros atuais.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
