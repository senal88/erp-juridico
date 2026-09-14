import { Users } from 'lucide-react'
import { EntityListPage } from '@/components/EntityListPage'

export default function Clientes() {
  return (
    <EntityListPage
      collection="clients"
      title="Clientes"
      description="Cadastro completo de clientes pessoa física e jurídica"
      singular="cliente"
      icon={Users}
    />
  )
}
