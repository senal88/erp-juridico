migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    col.fields.add(
      new RelationField({
        name: 'assigned_to',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
      }),
    )
    col.fields.add(
      new DateField({
        name: 'scheduled_at',
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('service_orders')
    col.fields.removeByName('assigned_to')
    col.fields.removeByName('scheduled_at')
    app.save(col)
  },
)
