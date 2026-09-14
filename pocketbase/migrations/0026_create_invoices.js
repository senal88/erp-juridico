migrate(
  (app) => {
    const collection = new Collection({
      name: 'invoices',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'number', type: 'text', required: true, max: 30 },
        {
          name: 'client',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: app.findCollectionByNameOrId('clients').id,
        },
        {
          name: 'process',
          type: 'relation',
          maxSelect: 1,
          collectionId: app.findCollectionByNameOrId('processes').id,
        },
        { name: 'issue_date', type: 'date', required: true },
        { name: 'due_date', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['rascunho', 'enviada', 'paga', 'vencida', 'cancelada'],
        },
        { name: 'subtotal', type: 'number', min: 0 },
        { name: 'discount', type: 'number', min: 0 },
        { name: 'total', type: 'number', min: 0 },
        { name: 'paid_at', type: 'date' },
        {
          name: 'payment_method',
          type: 'select',
          maxSelect: 1,
          values: ['pix', 'boleto', 'transferencia', 'cartao', 'cheque', 'dinheiro', 'outro'],
        },
        { name: 'notes', type: 'text' },
        { name: 'items_json', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_invoices_number ON invoices (number)',
        'CREATE INDEX idx_invoices_client ON invoices (client)',
        'CREATE INDEX idx_invoices_process ON invoices (process)',
        'CREATE INDEX idx_invoices_status ON invoices (status)',
        'CREATE INDEX idx_invoices_due_date ON invoices (due_date)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('invoices')
    app.delete(collection)
  },
)
