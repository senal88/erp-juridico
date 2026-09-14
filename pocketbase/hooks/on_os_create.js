onRecordAfterCreateSuccess((e) => {
  const actCol = $app.findCollectionByNameOrId('activities')
  const act = new Record(actCol)
  act.set('description', 'Nova Ordem de Serviço criada: ' + e.record.getString('title'))
  if (e.auth) {
    act.set('user_id', e.auth.id)
  }
  act.set('type', 'os_created')
  $app.save(act)
  e.next()
}, 'service_orders')
