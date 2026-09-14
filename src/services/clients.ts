import pb from '@/lib/pocketbase/client'

export const getClients = () => pb.collection('clients').getFullList({ sort: '-created' })
export const getClient = (id: string) => pb.collection('clients').getOne(id)
export const getClientsCount = async (filter: string) => {
  const res = await pb.collection('clients').getList(1, 1, { filter })
  return res.totalItems
}
export const createClient = (data: any) => pb.collection('clients').create(data)
export const updateClient = (id: string, data: any) => pb.collection('clients').update(id, data)
export const deleteClient = (id: string) => pb.collection('clients').delete(id)
