migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.add(
      new SelectField({ name: 'role', values: ['admin', 'lawyer'], maxSelect: 1, required: false }),
    )
    app.save(col)

    app.db().newQuery("UPDATE users SET role = 'admin'").execute()

    const updatedCol = app.findCollectionByNameOrId('users')
    updatedCol.fields.getByName('role').required = true
    updatedCol.listRule = "@request.auth.role = 'admin' || id = @request.auth.id"
    updatedCol.viewRule = "@request.auth.role = 'admin' || id = @request.auth.id"
    updatedCol.createRule = "@request.auth.role = 'admin'"
    updatedCol.updateRule = "@request.auth.role = 'admin' || id = @request.auth.id"
    updatedCol.deleteRule = "@request.auth.role = 'admin'"
    app.save(updatedCol)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('role')
    col.listRule = 'id = @request.auth.id'
    col.viewRule = 'id = @request.auth.id'
    col.createRule = ''
    col.updateRule = 'id = @request.auth.id'
    col.deleteRule = 'id = @request.auth.id'
    app.save(col)
  },
)
