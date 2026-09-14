migrate(
  (app) => {
    const col = new Collection({
      name: 'os_schedules',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'service_order_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('service_orders').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'assigned_to',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'starts_at', type: 'date', required: true },
        { name: 'ends_at', type: 'date' },
        { name: 'location', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['scheduled', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled'],
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_os_schedules_service_order ON os_schedules (service_order_id)',
        'CREATE INDEX idx_os_schedules_assigned_to ON os_schedules (assigned_to)',
        'CREATE INDEX idx_os_schedules_starts_at ON os_schedules (starts_at)',
        'CREATE INDEX idx_os_schedules_status ON os_schedules (status)',
      ],
    })
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('os_schedules')
    app.delete(col)
  },
)
