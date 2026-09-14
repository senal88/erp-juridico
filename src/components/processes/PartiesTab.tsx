import { useState, useEffect } from 'react'
import { Edit, Trash, Plus, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

import {
  getProcessParties,
  createProcessParty,
  updateProcessParty,
  deleteProcessParty,
  type ProcessParty,
  type ProcessPartyRole,
} from '@/services/processes'
import { useRealtime } from '@/hooks/use-realtime'
import { PARTY_ROLE_LABELS } from '@/lib/process-labels'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export function PartiesTab({ processId }: { processId: string }) {
  const [parties, setParties] = useState<ProcessParty[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingParty, setEditingParty] = useState<ProcessParty | null>(null)

  const [name, setName] = useState('')
  const [role, setRole] = useState<ProcessPartyRole | ''>('')
  const [document, setDocument] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()

  const loadParties = async () => {
    try {
      const data = await getProcessParties(processId)
      setParties(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParties()
  }, [processId])

  useRealtime('process_parties', (e) => {
    if (e.record.process_id === processId) {
      loadParties()
    }
  })

  const openDialog = (party?: ProcessParty) => {
    setErrors({})
    if (party) {
      setEditingParty(party)
      setName(party.name)
      setRole(party.role)
      setDocument(party.document || '')
      setEmail(party.contact_email || '')
      setPhone(party.contact_phone || '')
      setNotes(party.notes || '')
    } else {
      setEditingParty(null)
      setName('')
      setRole('')
      setDocument('')
      setEmail('')
      setPhone('')
      setNotes('')
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name || !role) {
      setErrors({
        name: !name ? 'Nome é obrigatório' : '',
        role: !role ? 'Papel é obrigatório' : '',
      })
      return
    }

    setSubmitting(true)
    setErrors({})
    try {
      const data = {
        name,
        role: role as ProcessPartyRole,
        document,
        contact_email: email,
        contact_phone: phone,
        notes,
        process_id: processId,
      }

      if (editingParty) {
        await updateProcessParty(editingParty.id, data)
        toast({ title: 'Parte atualizada com sucesso' })
      } else {
        await createProcessParty(data)
        toast({ title: 'Parte adicionada com sucesso' })
      }
      setDialogOpen(false)
    } catch (error) {
      setErrors(extractFieldErrors(error))
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta parte?')) return
    try {
      await deleteProcessParty(id)
      toast({ title: 'Parte excluída com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir parte', variant: 'destructive' })
    }
  }

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Parte
        </Button>
      </div>

      {parties.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg bg-slate-50">
          Nenhuma parte cadastrada para este processo.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {parties.map((party) => (
            <Card key={party.id}>
              <CardContent className="p-4 flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{party.name}</h4>
                    <Badge variant="outline">{PARTY_ROLE_LABELS[party.role] || party.role}</Badge>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    {party.document && <div>Doc: {party.document}</div>}
                    {party.contact_email && <div>Email: {party.contact_email}</div>}
                    {party.contact_phone && <div>Tel: {party.contact_phone}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(party)}>
                    <Edit className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(party.id)}>
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingParty ? 'Editar Parte' : 'Adicionar Parte'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Papel *</Label>
              <Select value={role} onValueChange={(val: any) => setRole(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTY_ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
            </div>
            <div className="space-y-2">
              <Label>CPF / CNPJ</Label>
              <Input value={document} onChange={(e) => setDocument(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
