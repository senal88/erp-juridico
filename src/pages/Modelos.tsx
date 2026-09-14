import { useState, useEffect } from 'react'
import { Plus, Search, FileEdit, Copy, Trash2, FileOutput, FileSignature } from 'lucide-react'
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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { TEMPLATE_CATEGORIES, TEMPLATE_CATEGORY_COLORS } from '@/lib/template_constants'
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type DocumentTemplate,
} from '@/services/document_templates'
import { TemplateSheet } from '@/components/TemplateSheet'
import { GenerateDocumentDialog } from '@/components/GenerateDocumentDialog'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'

export default function Modelos() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null)

  const [generateOpen, setGenerateOpen] = useState(false)
  const [generatingTemplate, setGeneratingTemplate] = useState<DocumentTemplate | null>(null)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, filterCategory])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const filters = []
      if (filterCategory && filterCategory !== 'all') {
        filters.push(`category = '${filterCategory}'`)
      }
      if (search) {
        filters.push(`(name ~ '${search}' || description ~ '${search}')`)
      }
      const filterStr = filters.join(' && ')
      const res = await getAllTemplates(filterStr)
      setTemplates(res)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os modelos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const openSheet = (t?: DocumentTemplate) => {
    setEditingTemplate(t || null)
    setSheetOpen(true)
  }

  const openGenerate = (t: DocumentTemplate) => {
    setGeneratingTemplate(t)
    setGenerateOpen(true)
  }

  const handleSaveSheet = async (data: Partial<DocumentTemplate>) => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data)
        toast({ title: 'Sucesso', description: 'Modelo atualizado.' })
      } else {
        await createTemplate(data)
        toast({ title: 'Sucesso', description: 'Modelo criado.' })
      }
      fetchTemplates()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao salvar modelo.', variant: 'destructive' })
      throw e
    }
  }

  const handleDuplicate = async (template: DocumentTemplate) => {
    try {
      await createTemplate({
        name: `${template.name} (Cópia)`,
        category: template.category,
        description: template.description,
        content: template.content,
        is_active: template.is_active,
      })
      toast({ title: 'Sucesso', description: 'Modelo duplicado.' })
      fetchTemplates()
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível duplicar.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id)
      toast({ title: 'Sucesso', description: 'Modelo apagado.' })
      setDeleteId(null)
      fetchTemplates()
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível apagar.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Modelos"
        description="Templates de petições, procurações, contratos e outros documentos com mail-merge"
        action={
          <Button onClick={() => openSheet()}>
            <Plus className="w-4 h-4 mr-2" /> Novo modelo
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[220px] bg-background">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(TEMPLATE_CATEGORIES).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </CardHeader>
                <CardContent className="flex-1">
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-lg bg-background border-dashed">
            <FileSignature className="w-12 h-12 mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum modelo encontrado</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Você ainda não tem modelos para esta busca. Crie um novo modelo para começar a
              automatizar a geração de documentos.
            </p>
            <Button onClick={() => openSheet()} className="mt-6" variant="secondary">
              <Plus className="w-4 h-4 mr-2" /> Criar primeiro modelo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map((t) => (
              <Card
                key={t.id}
                className="flex flex-col relative group transition-all hover:shadow-md border-border/60"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-semibold',
                        TEMPLATE_CATEGORY_COLORS[t.category as keyof typeof TEMPLATE_CATEGORIES],
                      )}
                    >
                      {TEMPLATE_CATEGORIES[t.category as keyof typeof TEMPLATE_CATEGORIES] ||
                        t.category}
                    </Badge>
                    {!t.is_active && (
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base line-clamp-2 leading-tight">{t.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px] text-xs mt-1">
                    {t.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <div className="text-xs text-muted-foreground flex justify-between items-center bg-muted/40 p-2 rounded-md">
                    <span className="flex items-center" title="Vezes utilizado">
                      <FileOutput className="w-3 h-3 mr-1" /> {t.usage_count || 0}
                    </span>
                    <span>Modificado: {format(new Date(t.updated), 'dd/MM/yyyy')}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10"
                    onClick={() => openGenerate(t)}
                    title="Gerar Documento"
                  >
                    <FileOutput className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10"
                    onClick={() => openSheet(t)}
                    title="Editar"
                  >
                    <FileEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10"
                    onClick={() => handleDuplicate(t)}
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(t.id)}
                    title="Apagar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TemplateSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        template={editingTemplate}
        onSave={handleSaveSheet}
      />

      <GenerateDocumentDialog
        isOpen={generateOpen}
        onClose={() => {
          setGenerateOpen(false)
          fetchTemplates() // Update usage count if it changed
        }}
        template={generatingTemplate}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo será excluído permanentemente da sua base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Sim, apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
