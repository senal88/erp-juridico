migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'cliente.teste@exemplo.com')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('cliente.teste@exemplo.com')
    record.setPassword('123456789')
    record.setVerified(true)
    record.set('name', 'Cliente Teste')
    record.set('role', 'cliente')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'cliente.teste@exemplo.com')
      app.delete(record)
    } catch (_) {}
  },
)
