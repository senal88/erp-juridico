import { Briefcase } from 'lucide-react'
import { EntityListPage } from '@/components/EntityListPage'

export default function Fornecedores() {
  return (
    <EntityListPage
      collection="suppliers"
      title="Fornecedores"
      description="Cadastro de fornecedores e prestadores de serviço"
      singular="fornecedor"
      icon={Briefcase}
    />
  )
}
