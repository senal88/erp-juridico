migrate(
  (app) => {
    const collection = new Collection({
      name: 'time_entries',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'description', type: 'text', required: true, max: 500 },
        { name: 'duration_minutes', type: 'number', required: true, min: 1 },
        { name: 'date', type: 'date', required: true },
        {
          name: 'category',
          type: 'select',
          values: ['drafting', 'hearing', 'meeting', 'research', 'phone', 'email', 'other'],
          maxSelect: 1,
        },
        { name: 'is_billable', type: 'bool' },
        { name: 'hourly_rate', type: 'number', min: 0 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['registrada', 'cobrada', 'descartada'],
          maxSelect: 1,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'client',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clients').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'process',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('processes').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'fee',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('fees').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_time_entries_user ON time_entries (user)',
        'CREATE INDEX idx_time_entries_process ON time_entries (process)',
        'CREATE INDEX idx_time_entries_client ON time_entries (client)',
        'CREATE INDEX idx_time_entries_date ON time_entries (date)',
        'CREATE INDEX idx_time_entries_status ON time_entries (status)',
        'CREATE INDEX idx_time_entries_billable_status ON time_entries (is_billable, status)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('time_entries')
    app.delete(collection)
  },
)
