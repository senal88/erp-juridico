import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTimeEntry, updateTimeEntry, type TimeEntry } from '@/services/time_entries'
import { parseDuration, formatMinutes, calculateBillableAmount } from '@/lib/time_utils'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function TimeEntrySheet({ open, onOpenChange, entry, onSave, presetProcessId }: any) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [durInput, setDurInput] = useState('')
  const [cat, setCat] = useState('other')
  const [isBillable, setIsBillable] = useState(false)
  const [rate, setRate] = useState(0)
  const [status, setStatus] = useState('registrada')
  const [client, setClient] = useState('_none_')
  const [process, setProcess] = useState('_none_')

  const [clients, setClients] = useState<any[]>([])
  const [processes, setProcesses] = useState<any[]>([])

  useEffect(() => {
    pb.collection('clients').getFullList().then(setClients)
    pb.collection('processes').getFullList().then(setProcesses)
  }, [])

  useEffect(() => {
    if (open) {
      setDesc(entry?.description || '')
      setDate(entry?.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0])
      setDurInput(entry?.duration_minutes ? formatMinutes(entry.duration_minutes) : '')
      setCat(entry?.category || 'other')
      setIsBillable(entry?.is_billable || false)
      setRate(entry?.hourly_rate || 0)
      setStatus(entry?.status || 'registrada')
      setClient(entry?.client || '_none_')
      setProcess(entry ? entry.process || '_none_' : presetProcessId || '_none_')
    }
  }, [open, entry, presetProcessId])

  const parsedMin = parseDuration(durInput)
  const estValue = isBillable ? calculateBillableAmount(parsedMin, rate) : 0

  const handleSave = async () => {
    if (!desc.trim())
      return toast({
        title: 'Erro',
        description: 'A descrição é obrigatória',
        variant: 'destructive',
      })
    if (parsedMin <= 0)
      return toast({ title: 'Erro', description: 'A duração deve ser > 0', variant: 'destructive' })

    const data = {
      description: desc,
      date: new Date(date).toISOString(),
      duration_minutes: parsedMin,
      category: cat,
      is_billable: isBillable,
      hourly_rate: isBillable ? rate : 0,
      status,
      user: user?.id,
      client: client === '_none_' ? '' : client,
      process: process === '_none_' ? '' : process,
    }

    try {
      if (entry) {
        await updateTimeEntry(entry.id, data)
      } else {
        await createTimeEntry(data)
      }
      toast({ title: 'Sucesso', description: 'Registro salvo.' })
      onSave()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{entry ? 'Editar Registro' : 'Nova Entrada de Horas'}</SheetTitle>
          <SheetDescription>Preencha os detalhes da sua atividade.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Descrição *</Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex: Reunião de alinhamento com cliente..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Duração *</Label>
              <Input
                value={durInput}
                onChange={(e) => setDurInput(e.target.value)}
                onBlur={() => setDurInput(formatMinutes(parsedMin))}
                placeholder="1h 30m, 90, 1:30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Categoria</Label>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drafting">Redação</SelectItem>
                  <SelectItem value="hearing">Audiência</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="research">Pesquisa</SelectItem>
                  <SelectItem value="phone">Ligação</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registrada">Registrada</SelectItem>
                  <SelectItem value="cobrada">Cobrada</SelectItem>
                  <SelectItem value="descartada">Descartada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Cliente</Label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">Nenhum</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Processo</Label>
            <Select value={process} onValueChange={setProcess}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um processo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">Nenhum</SelectItem>
                {processes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Switch checked={isBillable} onCheckedChange={setIsBillable} id="billable" />
            <Label htmlFor="billable">Horas cobráveis</Label>
          </div>
          {isBillable && (
            <div className="flex flex-col gap-2 mt-2 p-4 bg-muted rounded-md border">
              <Label>Taxa horária (R$)</Label>
              <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
              <div className="text-sm font-medium mt-2 text-primary">
                Valor estimado:{' '}
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  estValue,
                )}
              </div>
            </div>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
