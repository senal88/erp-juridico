migrate(
  (app) => {
    const contractsId = app.findCollectionByNameOrId('contracts').id
    const serviceOrdersId = app.findCollectionByNameOrId('service_orders').id
    const schedulesId = app.findCollectionByNameOrId('os_schedules').id

    const collection = new Collection({
      name: 'notifications',
      type: 'base',
      listRule: "@request.auth.id != '' && recipient = @request.auth.id",
      viewRule: "@request.auth.id != '' && recipient = @request.auth.id",
      createRule: "@request.auth.id != '' && recipient = @request.auth.id",
      updateRule: "@request.auth.id != '' && recipient = @request.auth.id",
      deleteRule: "@request.auth.id != '' && recipient = @request.auth.id",
      fields: [
        {
          name: 'recipient',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'kind',
          type: 'select',
          required: true,
          values: [
            'os_assigned',
            'os_status_changed',
            'schedule_today',
            'schedule_confirm',
            'no_show',
            'contract_expiring',
            'contract_expired',
            'amendment_created',
            'mention',
            'system',
          ],
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'text' },
        {
          name: 'contract_id',
          type: 'relation',
          collectionId: contractsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'service_order_id',
          type: 'relation',
          collectionId: serviceOrdersId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'schedule_id',
          type: 'relation',
          collectionId: schedulesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'link', type: 'text' },
        { name: 'read_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notifications_recipient_read_at ON notifications (recipient, read_at)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('notifications')
    app.delete(collection)
  },
)
