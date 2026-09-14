migrate(
  (app) => {
    // Seed clients
    const clients = app.findCollectionByNameOrId('clients')
    let c1, c2
    try {
      c1 = app.findFirstRecordByData('clients', 'email', 'cliente1@exemplo.com')
    } catch (_) {
      c1 = new Record(clients)
      c1.set('name', 'Empresa Alpha Ltda')
      c1.set('email', 'cliente1@exemplo.com')
      c1.set('status', 'active')
      app.save(c1)
    }

    try {
      c2 = app.findFirstRecordByData('clients', 'email', 'cliente2@exemplo.com')
    } catch (_) {
      c2 = new Record(clients)
      c2.set('name', 'Indústrias Beta SA')
      c2.set('email', 'cliente2@exemplo.com')
      c2.set('status', 'active')
      app.save(c2)
    }

    // Seed contracts
    const contracts = app.findCollectionByNameOrId('contracts')
    let ct1, ct2
    try {
      ct1 = app.findFirstRecordByData('contracts', 'title', 'Contrato Mensal - Alpha')
    } catch (_) {
      ct1 = new Record(contracts)
      ct1.set('title', 'Contrato Mensal - Alpha')
      ct1.set('client_id', c1.id)
      ct1.set('value', 5000)
      ct1.set('status', 'active')
      ct1.set('vigencia_inicio', new Date().toISOString())
      const next15 = new Date()
      next15.setDate(next15.getDate() + 15)
      ct1.set('vigencia_fim', next15.toISOString())
      app.save(ct1)
    }

    try {
      ct2 = app.findFirstRecordByData('contracts', 'title', 'Assessoria - Beta')
    } catch (_) {
      ct2 = new Record(contracts)
      ct2.set('title', 'Assessoria - Beta')
      ct2.set('client_id', c2.id)
      ct2.set('value', 8000)
      ct2.set('status', 'active')
      ct2.set('vigencia_inicio', new Date().toISOString())
      const next60 = new Date()
      next60.setDate(next60.getDate() + 60)
      ct2.set('vigencia_fim', next60.toISOString())
      app.save(ct2)
    }

    // Seed service orders
    const orders = app.findCollectionByNameOrId('service_orders')
    try {
      app.findFirstRecordByData('service_orders', 'title', 'Revisão Contratual - Alpha')
    } catch (_) {
      const o1 = new Record(orders)
      o1.set('title', 'Revisão Contratual - Alpha')
      o1.set('client_id', c1.id)
      o1.set('contrato_id', ct1.id)
      o1.set('status', 'open')
      o1.set('priority', 'high')
      app.save(o1)
    }

    try {
      app.findFirstRecordByData('service_orders', 'title', 'Diligência - Beta')
    } catch (_) {
      const o2 = new Record(orders)
      o2.set('title', 'Diligência - Beta')
      o2.set('client_id', c2.id)
      o2.set('contrato_id', ct2.id)
      o2.set('status', 'in_progress')
      o2.set('priority', 'medium')
      app.save(o2)
    }

    try {
      app.findFirstRecordByData('service_orders', 'title', 'Consulta Tributária')
    } catch (_) {
      const o3 = new Record(orders)
      o3.set('title', 'Consulta Tributária')
      o3.set('client_id', c1.id)
      o3.set('status', 'completed')
      o3.set('priority', 'low')
      app.save(o3)
    }

    // Seed activities
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let adminId = null
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@legalcore.erp')
      adminId = admin.id
    } catch (_) {}

    const activities = app.findCollectionByNameOrId('activities')
    try {
      app.findFirstRecordByData(
        'activities',
        'description',
        'Criação do contrato Assessoria - Beta',
      )
    } catch (_) {
      const act = new Record(activities)
      act.set('description', 'Criação do contrato Assessoria - Beta')
      act.set('type', 'contract_created')
      if (adminId) act.set('user_id', adminId)
      app.save(act)
    }
  },
  (app) => {
    // no down logic to avoid breaking other records accidentally
  },
)
