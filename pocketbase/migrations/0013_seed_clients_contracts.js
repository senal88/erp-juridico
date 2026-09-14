/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let adminId
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@legalcore.erp')
      adminId = admin.id
    } catch (_) {
      const record = new Record(users)
      record.setEmail('admin@legalcore.erp')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      app.save(record)
      adminId = record.id
    }

    try {
      app.findFirstRecordByData('clients', 'name', 'Construtora Alfa')
      return // Already seeded
    } catch (_) {}

    const clientsCol = app.findCollectionByNameOrId('clients')
    const c1 = new Record(clientsCol)
    c1.set('name', 'Construtora Alfa')
    c1.set('email', 'contato@alfa.com')
    c1.set('phone', '(11) 99999-1111')
    c1.set('status', 'active')
    app.save(c1)
    const c2 = new Record(clientsCol)
    c2.set('name', 'Tech Solutions Ltda')
    c2.set('email', 'oi@techsol.com')
    c2.set('status', 'active')
    app.save(c2)
    const c3 = new Record(clientsCol)
    c3.set('name', 'Varejo XYZ')
    c3.set('status', 'inactive')
    app.save(c3)

    const suppCol = app.findCollectionByNameOrId('suppliers')
    const s1 = new Record(suppCol)
    s1.set('name', 'Cartório Silva')
    s1.set('service_type', 'Registros Notariais')
    app.save(s1)
    const s2 = new Record(suppCol)
    s2.set('name', 'Escritório Associado Mendes')
    s2.set('service_type', 'Consultoria Externa')
    app.save(s2)

    const conCol = app.findCollectionByNameOrId('contracts')
    const ct1 = new Record(conCol)
    ct1.set('title', 'Assessoria Jurídica Mensal')
    ct1.set('client_id', c1.id)
    ct1.set('value', 5000)
    ct1.set('status', 'active')
    ct1.set('expiry_date', new Date(Date.now() + 15 * 86400000).toISOString())
    app.save(ct1)

    const ct2 = new Record(conCol)
    ct2.set('title', 'Representação Cível')
    ct2.set('client_id', c2.id)
    ct2.set('value', 12000)
    ct2.set('status', 'active')
    ct2.set('expiry_date', new Date(Date.now() + 365 * 86400000).toISOString())
    app.save(ct2)

    const osCol = app.findCollectionByNameOrId('service_orders')
    const o1 = new Record(osCol)
    o1.set('title', 'Revisão de Contrato de Locação')
    o1.set('client_id', c2.id)
    o1.set('description', 'Revisar cláusulas de rescisão.')
    o1.set('status', 'open')
    o1.set('priority', 'high')
    app.save(o1)
    const o2 = new Record(osCol)
    o2.set('title', 'Acompanhamento de Processo Trabalhista')
    o2.set('client_id', c1.id)
    o2.set('status', 'in_progress')
    o2.set('priority', 'medium')
    app.save(o2)

    const actCol = app.findCollectionByNameOrId('activities')
    const a1 = new Record(actCol)
    a1.set('description', 'Contrato assinado por Construtora Alfa')
    a1.set('user_id', adminId)
    a1.set('type', 'contract_created')
    app.save(a1)
    const a2 = new Record(actCol)
    a2.set('description', 'Nova OS criada: Revisão de Contrato')
    a2.set('user_id', adminId)
    a2.set('type', 'os_created')
    app.save(a2)
  },
  (app) => {},
)
