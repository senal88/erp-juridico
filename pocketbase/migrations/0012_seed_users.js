migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUser = (email, name) => {
      try {
        return app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        const r = new Record(users)
        r.setEmail(email)
        r.setPassword('Skip@Pass')
        r.setVerified(true)
        r.set('name', name)
        app.save(r)
        return r
      }
    }

    seedUser('admin@legalcore.erp', 'Administrador')
    seedUser('advogado@legalcore.erp', 'Advogado Demo')
  },
  (app) => {
    for (const email of ['admin@legalcore.erp', 'advogado@legalcore.erp']) {
      try {
        const r = app.findAuthRecordByEmail('_pb_users_auth_', email)
        app.delete(r)
      } catch (_) {}
    }
  },
)
