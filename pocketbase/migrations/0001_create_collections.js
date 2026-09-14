/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const clients = new Collection({
      name: 'clients',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['active', 'inactive'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(clients)

    const suppliers = new Collection({
      name: 'suppliers',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'service_type', type: 'text' },
        { name: 'contact', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(suppliers)

    const contracts = new Collection({
      name: 'contracts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'client_id',
          type: 'relation',
          collectionId: clients.id,
          maxSelect: 1,
          required: true,
        },
        { name: 'value', type: 'number' },
        { name: 'expiry_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['active', 'expired', 'cancelled'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(contracts)

    const service_orders = new Collection({
      name: 'service_orders',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'client_id',
          type: 'relation',
          collectionId: clients.id,
          maxSelect: 1,
          required: true,
        },
        { name: 'description', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['open', 'in_progress', 'completed'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'priority',
          type: 'select',
          values: ['low', 'medium', 'high'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(service_orders)

    const activities = new Collection({
      name: 'activities',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'description', type: 'text', required: true },
        { name: 'user_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'type', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(activities)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('activities'))
    app.delete(app.findCollectionByNameOrId('service_orders'))
    app.delete(app.findCollectionByNameOrId('contracts'))
    app.delete(app.findCollectionByNameOrId('suppliers'))
    app.delete(app.findCollectionByNameOrId('clients'))
  },
)
