onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const assignedTo = record.getString('assigned_to')

  if (assignedTo) {
    const title = record.getString('title')
    const col = $app.findCollectionByNameOrId('notifications')
    const notif = new Record(col)
    notif.set('recipient', assignedTo)
    notif.set('kind', 'os_assigned')
    notif.set('title', 'Nova OS Atribuída')
    notif.set('body', `Você foi atribuído à OS: ${title}`)
    notif.set('service_order_id', record.id)
    notif.set('link', '/ordens-de-servico')
    $app.save(notif)
  }
  return e.next()
}, 'service_orders')
