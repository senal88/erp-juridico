import { useState, useEffect, useRef } from 'react'
import { Download, Trash, Plus, Loader2, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
import { useAuth } from '@/hooks/use-auth'

import {
  getProcessDocuments,
  uploadProcessDocument,
  deleteProcessDocument,
  getFileUrl,
  type ProcessDocument,
  type DocumentKind,
} from '@/services/processes'
import { useRealtime } from '@/hooks/use-realtime'
import { DOCUMENT_KIND_LABELS } from '@/lib/process-labels'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export function DocumentsTab({ processId }: { processId: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<ProcessDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<DocumentKind | ''>('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadDocuments = async () => {
    try {
      const data = await getProcessDocuments(processId)
      setDocuments(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [processId])

  useRealtime('process_documents', (e) => {
    if (e.record.process_id === processId) {
      loadDocuments()
    }
  })

  const openDialog = () => {
    setErrors({})
    setTitle('')
    setKind('')
    setNotes('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setDialogOpen(true)
  }

  const handleUpload = async () => {
    if (!title || !file) {
      setErrors({
        title: !title ? 'Título é obrigatório' : '',
        file: !file ? 'Arquivo é obrigatório' : '',
      })
      return
    }

    setSubmitting(true)
    setErrors({})
    try {
      const formData = new FormData()
      formData.append('title', title)
      if (kind) formData.append('kind', kind)
      formData.append('process_id', processId)
      if (user?.id) formData.append('uploaded_by_id', user.id)
      formData.append('file', file)
      if (notes) formData.append('notes', notes)

      await uploadProcessDocument(formData)
      toast({ title: 'Documento enviado com sucesso' })
      setDialogOpen(false)
    } catch (error) {
      setErrors(extractFieldErrors(error))
      toast({ title: 'Erro ao enviar documento', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este documento?')) return
    try {
      await deleteProcessDocument(id)
      toast({ title: 'Documento excluído com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir documento', variant: 'destructive' })
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
        <Button onClick={openDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Enviar Documento
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg bg-slate-50">
          Nenhum documento anexado a este processo.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4 flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="mt-1 h-10 w-10 bg-slate-100 text-slate-500 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-slate-900 leading-tight">{doc.title}</h4>
                    {doc.kind && (
                      <Badge variant="secondary" className="text-xs">
                        {DOCUMENT_KIND_LABELS[doc.kind] || doc.kind}
                      </Badge>
                    )}
                    <div className="text-xs text-slate-500">
                      Enviado em{' '}
                      {format(new Date(doc.created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      {doc.expand?.uploaded_by_id?.name && ` por ${doc.expand.uploaded_by_id.name}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={getFileUrl(doc)} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 text-slate-500" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
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
            <DialogTitle>Enviar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={(val: any) => setKind(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_KIND_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arquivo * (.pdf, .doc, .docx, .png, .jpg)</Label>
              <Input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {errors.file && <p className="text-xs text-red-500">{errors.file}</p>}
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
            <Button onClick={handleUpload} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
