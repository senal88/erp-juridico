migrate(
  (app) => {
    const collections = ['contracts', 'service_orders']

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      if (!col.fields.getByName('archived')) {
        col.fields.add(new BoolField({ name: 'archived' }))
      }
      if (!col.fields.getByName('archived_at')) {
        col.fields.add(new DateField({ name: 'archived_at' }))
      }
      app.save(col)
    }
  },
  (app) => {
    const collections = ['contracts', 'service_orders']

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.fields.removeByName('archived')
      col.fields.removeByName('archived_at')
      app.save(col)
    }
  },
)
