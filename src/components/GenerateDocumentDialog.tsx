import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Copy, Download, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { renderTemplate, type TemplateContext } from '@/lib/template_variables'
import pb from '@/lib/pocketbase/client'
import { incrementUsage } from '@/services/document_templates'
import type { DocumentTemplate } from '@/services/document_templates'

interface Process {
  id: string
  title: string
  cnj: string
  area: string
  vara: string
  comarca: string
  valor_causa: number
  instance: string
  expand?: {
    client_id?: {
      name: string
      email: string
      phone: string
      cpf_cnpj: string
    }
    responsible_lawyer_id?: {
      name: string
      email: string
    }
  }
}

interface GenerateDocumentDialogProps {
  isOpen: boolean
  onClose: () => void
  template: DocumentTemplate | null
}

export function GenerateDocumentDialog({ isOpen, onClose, template }: GenerateDocumentDialogProps) {
  const { toast } = useToast()
  const [processes, setProcesses] = useState<Process[]>([])
  const [selectedProcessId, setSelectedProcessId] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('select')

  useEffect(() => {
    if (isOpen) {
      loadProcesses()
      setActiveTab('select')
      setSelectedProcessId('')
      setGeneratedContent('')
    }
  }, [isOpen])

  const loadProcesses = async () => {
    try {
      const data = await pb.collection('processes').getFullList<Process>({
        sort: '-created',
        expand: 'client_id,responsible_lawyer_id',
      })
      setProcesses(data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os processos.',
        variant: 'destructive',
      })
    }
  }

  const handleGenerate = async () => {
    if (!selectedProcessId || !template) {
      toast({
        title: 'Atenção',
        description: 'Selecione um processo primeiro.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const proc = processes.find((p) => p.id === selectedProcessId)
      if (!proc) return

      const context: TemplateContext = {
        cliente: {
          name: proc.expand?.client_id?.name,
          email: proc.expand?.client_id?.email,
          phone: proc.expand?.client_id?.phone,
          documento: proc.expand?.client_id?.cpf_cnpj,
        },
        processo: {
          title: proc.title,
          cnj: proc.cnj,
          area: proc.area,
          vara: proc.vara,
          comarca: proc.comarca,
          valor_causa: proc.valor_causa,
          instance: proc.instance,
        },
        advogado: {
          name: proc.expand?.responsible_lawyer_id?.name,
          email: proc.expand?.responsible_lawyer_id?.email,
        },
        cidade: 'São Paulo', // Hardcoded as a fallback
      }

      const rendered = renderTemplate(template.content, context)
      setGeneratedContent(rendered)

      await incrementUsage(template.id)

      setActiveTab('preview')
      toast({ title: 'Sucesso', description: 'Documento gerado com sucesso.' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao gerar o documento.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    toast({ title: 'Copiado', description: 'Conteúdo copiado para a área de transferência.' })
  }

  const downloadMarkdown = () => {
    if (!template) return
    const blob = new Blob([generatedContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/\s+/g, '_')}_${selectedProcessId}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!template) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[700px] h-[80vh] flex flex-col"
        aria-describedby="generate-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Gerar Documento: {template.name}</DialogTitle>
          <DialogDescription id="generate-dialog-description">
            Crie um novo documento mesclando o modelo com os dados de um processo.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden mt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">1. Selecionar processo</TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedContent}>
              2. Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="flex-1 flex flex-col gap-4 pt-4 overflow-y-auto">
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                As variáveis deste modelo (como dados do cliente e detalhes do processo) serão
                preenchidas automaticamente de acordo com o processo selecionado.
              </p>

              <div className="space-y-2">
                <Label>Processo Alvo</Label>
                <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um processo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {processes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.cnj || p.title}{' '}
                        {p.expand?.client_id?.name ? `(${p.expand.client_id.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-auto pt-6 flex justify-end">
              <Button onClick={handleGenerate} disabled={!selectedProcessId || isGenerating}>
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Processar documento
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 flex flex-col gap-4 pt-4 overflow-hidden">
            <Textarea
              className="flex-1 font-mono text-sm resize-none p-4 bg-muted/30"
              readOnly
              value={generatedContent}
            />
            <div className="flex justify-between items-center mt-2">
              <Button variant="outline" onClick={() => setActiveTab('select')}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" /> Copiar
                </Button>
                <Button onClick={downloadMarkdown}>
                  <Download className="w-4 h-4 mr-2" /> Salvar .md
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
