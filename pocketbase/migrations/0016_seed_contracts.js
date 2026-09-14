migrate(
  (app) => {
    let client
    try {
      client = app.findFirstRecordByData('clients', 'name', 'Acme Corp')
    } catch (_) {
      const clientsCol = app.findCollectionByNameOrId('clients')
      client = new Record(clientsCol)
      client.set('name', 'Acme Corp')
      client.set('status', 'active')
      app.save(client)
    }

    const contractsCol = app.findCollectionByNameOrId('contracts')
    const createContract = (title, status, daysToAdd) => {
      try {
        return app.findFirstRecordByData('contracts', 'title', title)
      } catch (_) {
        const date = new Date()
        date.setDate(date.getDate() + daysToAdd)
        const c = new Record(contractsCol)
        c.set('title', title)
        c.set('client_id', client.id)
        c.set('value', daysToAdd > 0 ? 1500 : 2000)
        c.set('status', status)
        c.set('vigencia_inicio', new Date().toISOString())
        c.set('vigencia_fim', date.toISOString())
        app.save(c)
        return c
      }
    }

    const c1 = createContract('Contrato Padrão - Ativo', 'active', 60)
    const c2 = createContract('Contrato Suporte - Vencendo', 'active', 15)
    const c3 = createContract('Contrato Antigo - Encerrado', 'expired', -5)

    const amendCol = app.findCollectionByNameOrId('contract_amendments')
    try {
      app.findFirstRecordByData('contract_amendments', 'description', 'Ajuste de valor anual')
    } catch (_) {
      const a1 = new Record(amendCol)
      a1.set('contract_id', c1.id)
      a1.set('description', 'Ajuste de valor anual')
      a1.set('date', new Date().toISOString())
      a1.set('value_change', 200)
      app.save(a1)

      const a2 = new Record(amendCol)
      a2.set('contract_id', c1.id)
      a2.set('description', 'Renovação de escopo')
      a2.set('date', new Date().toISOString())
      app.save(a2)
    }
  },
  (app) => {},
)
