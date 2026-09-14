onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const desc = record.getString('description')
  const contractId = record.getString('contract_id')

  const users = $app.findRecordsByFilter('users', 'id != ""', '', 100, 0)
  const col = $app.findCollectionByNameOrId('notifications')

  for (const user of users) {
    const notif = new Record(col)
    notif.set('recipient', user.id)
    notif.set('kind', 'amendment_created')
    notif.set('title', 'Novo Aditivo de Contrato')
    notif.set('body', `Aditivo adicionado: ${desc}`)
    notif.set('contract_id', contractId)
    notif.set('link', '/contratos')
    $app.save(notif)
  }
  return e.next()
}, 'contract_amendments')
