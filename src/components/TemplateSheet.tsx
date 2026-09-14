import { useState, useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2 } from 'lucide-react'
import { TEMPLATE_CATEGORIES } from '@/lib/template_constants'
import { AVAILABLE_VARIABLES, detectVariables } from '@/lib/template_variables'
import { useToast } from '@/hooks/use-toast'
import type { DocumentTemplate } from '@/services/document_templates'

interface TemplateSheetProps {
  isOpen: boolean
  onClose: () => void
  template?: DocumentTemplate | null
  onSave: (data: Partial<DocumentTemplate>) => Promise<void>
}

export function TemplateSheet({ isOpen, onClose, template, onSave }: TemplateSheetProps) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setName(template.name || '')
        setCategory(template.category || '')
        setDescription(template.description || '')
        setContent(template.content || '')
        setIsActive(template.is_active ?? true)
      } else {
        setName('')
        setCategory('')
        setDescription('')
        setContent('')
        setIsActive(true)
      }
    }
  }, [isOpen, template])

  const { unrecognized } = detectVariables(content)

  const handleInsertVariable = (variable: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newText = content.substring(0, start) + `{{${variable}}}` + content.substring(end)
      setContent(newText)

      const newCursorPos = start + variable.length + 4
      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    } else {
      setContent(content + `{{${variable}}}`)
    }
  }

  const handleSubmit = async () => {
    if (!name || !category || !content) {
      toast({
        title: 'Atenção',
        description: 'Preencha os campos obrigatórios (Nome, Categoria e Conteúdo).',
        variant: 'destructive',
      })
      return
    }
    setIsSaving(true)
    try {
      await onSave({
        name,
        category,
        description,
        content,
        is_active: isActive,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const groupedVariables = AVAILABLE_VARIABLES.reduce(
    (acc, curr) => {
      if (!acc[curr.group]) acc[curr.group] = []
      acc[curr.group].push(curr)
      return acc
    },
    {} as Record<string, typeof AVAILABLE_VARIABLES>,
  )

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="sm:max-w-4xl w-full flex flex-col p-4 sm:p-6"
        aria-describedby="template-sheet-description"
      >
        <SheetHeader>
          <SheetTitle>{template ? 'Editar Modelo' : 'Novo Modelo'}</SheetTitle>
          <SheetDescription id="template-sheet-description">
            Crie ou edite um modelo de documento com suporte a variáveis automáticas.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col sm:flex-row gap-6 overflow-hidden mt-4">
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
            <div className="space-y-2">
              <Label>Nome do modelo *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Procuração Ad Judicia"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_CATEGORIES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex flex-col sm:justify-center">
                <Label className="mb-2">Status</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm">{isActive ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do modelo"
              />
            </div>
            <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <Label>Conteúdo do documento *</Label>
                {unrecognized.length > 0 && (
                  <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Variáveis não reconhecidas: {unrecognized.join(', ')}
                  </div>
                )}
              </div>
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 font-mono text-sm resize-none p-4"
                placeholder="Escreva o conteúdo do documento aqui..."
              />
            </div>
          </div>

          <div className="w-full sm:w-64 flex flex-col gap-4 sm:border-l sm:pl-4 overflow-y-auto pb-2 border-t sm:border-t-0 pt-4 sm:pt-0">
            <div>
              <h4 className="font-semibold text-sm mb-1">Variáveis</h4>
              <p className="text-xs text-muted-foreground mb-4">Clique para inserir no texto.</p>

              <div className="space-y-4">
                {Object.entries(groupedVariables).map(([group, vars]) => (
                  <div key={group}>
                    <h5 className="text-xs font-medium text-slate-500 mb-2 uppercase">{group}</h5>
                    <div className="flex flex-col gap-1.5 items-start">
                      {vars.map((v) => (
                        <Badge
                          key={v.key}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/20 text-[10px] font-mono w-full justify-start text-left truncate block"
                          onClick={() => handleInsertVariable(v.key)}
                          title={v.description}
                        >
                          {`{{${v.key}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
