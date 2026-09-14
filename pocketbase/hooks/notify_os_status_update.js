onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = record.original()
  const status = record.getString('status')
  const prevStatus = original.getString('status')
  const assignedTo = record.getString('assigned_to')

  if (status !== prevStatus && assignedTo) {
    const title = record.getString('title')
    const col = $app.findCollectionByNameOrId('notifications')
    const notif = new Record(col)
    notif.set('recipient', assignedTo)
    notif.set('kind', 'os_status_changed')
    notif.set('title', 'Status de OS Alterado')
    notif.set('body', `A OS "${title}" mudou para o status ${status}`)
    notif.set('service_order_id', record.id)
    notif.set('link', '/ordens-de-servico')
    $app.save(notif)
  }
  return e.next()
}, 'service_orders')
