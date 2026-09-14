migrate(
  (app) => {
    // Update users role field to include 'cliente' and 'consultor'
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      const newValues = new Set([...(roleField.values || []), 'cliente', 'consultor'])
      roleField.values = Array.from(newValues)
      app.save(usersCol)
    }

    // Add user relation to clients
    const clientsCol = app.findCollectionByNameOrId('clients')
    if (!clientsCol.fields.getByName('user')) {
      clientsCol.fields.add(
        new RelationField({
          name: 'user',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }
    clientsCol.addIndex('idx_clients_user', false, 'user', '')
    app.save(clientsCol)
  },
  (app) => {
    const clientsCol = app.findCollectionByNameOrId('clients')
    if (clientsCol.fields.getByName('user')) {
      clientsCol.fields.removeByName('user')
    }
    clientsCol.removeIndex('idx_clients_user')
    app.save(clientsCol)
  },
)
