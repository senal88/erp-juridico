import pb from '@/lib/pocketbase/client'

export const getContracts = () =>
  pb.collection('contracts').getFullList({ sort: '-created', expand: 'client_id' })

export const getContractsCount = async (filter: string) => {
  const res = await pb.collection('contracts').getList(1, 1, { filter })
  return res.totalItems
}

export const getContractsTotalValue = async () => {
  const res = await pb.collection('contracts').getFullList({ filter: "status='active'" })
  return res.reduce((acc, curr) => acc + (curr.value || 0), 0)
}

export const getExpiringContracts = () => {
  const next30 = new Date(Date.now() + 30 * 86400000).toISOString().replace('T', ' ')
  return pb.collection('contracts').getList(1, 5, {
    filter: `expiry_date >= @now && expiry_date <= '${next30}'`,
    sort: 'expiry_date',
    expand: 'client_id',
  })
}

export const updateContract = (id: string, data: FormData | any) =>
  pb.collection('contracts').update(id, data)

export const getContractAmendments = (contractId: string) =>
  pb.collection('contract_amendments').getFullList({
    filter: `contract_id = '${contractId}'`,
    sort: '-date',
  })
