migrate(
  (app) => {
    // clients
    const clients = app.findCollectionByNameOrId('clients')
    if (!clients.fields.getByName('cpf_cnpj'))
      clients.fields.add(new TextField({ name: 'cpf_cnpj' }))
    if (!clients.fields.getByName('address')) clients.fields.add(new TextField({ name: 'address' }))
    if (!clients.fields.getByName('emails')) clients.fields.add(new TextField({ name: 'emails' }))
    app.save(clients)

    // suppliers
    const suppliers = app.findCollectionByNameOrId('suppliers')
    if (!suppliers.fields.getByName('cnpj')) suppliers.fields.add(new TextField({ name: 'cnpj' }))
    if (!suppliers.fields.getByName('sla')) suppliers.fields.add(new TextField({ name: 'sla' }))
    if (!suppliers.fields.getByName('status'))
      suppliers.fields.add(
        new SelectField({ name: 'status', values: ['active', 'inactive'], maxSelect: 1 }),
      )
    app.save(suppliers)

    // contracts
    const contracts = app.findCollectionByNameOrId('contracts')
    if (!contracts.fields.getByName('vigencia_inicio'))
      contracts.fields.add(new DateField({ name: 'vigencia_inicio' }))
    if (!contracts.fields.getByName('vigencia_fim'))
      contracts.fields.add(new DateField({ name: 'vigencia_fim' }))
    if (!contracts.fields.getByName('documentos_url'))
      contracts.fields.add(
        new FileField({ name: 'documentos_url', maxSelect: 10, maxSize: 52428800 }),
      )
    contracts.addIndex('idx_contracts_status', false, 'status', '')
    contracts.addIndex('idx_contracts_vigencia_fim', false, 'vigencia_fim', '')
    app.save(contracts)

    // service_orders
    const serviceOrders = app.findCollectionByNameOrId('service_orders')
    if (!serviceOrders.fields.getByName('contrato_id'))
      serviceOrders.fields.add(
        new RelationField({ name: 'contrato_id', collectionId: contracts.id, maxSelect: 1 }),
      )
    if (!serviceOrders.fields.getByName('checklist'))
      serviceOrders.fields.add(new JSONField({ name: 'checklist' }))
    if (!serviceOrders.fields.getByName('fotos_urls'))
      serviceOrders.fields.add(
        new FileField({ name: 'fotos_urls', maxSelect: 10, maxSize: 52428800 }),
      )
    if (!serviceOrders.fields.getByName('assinatura_url'))
      serviceOrders.fields.add(
        new FileField({ name: 'assinatura_url', maxSelect: 1, maxSize: 52428800 }),
      )
    serviceOrders.addIndex('idx_service_orders_status', false, 'status', '')
    app.save(serviceOrders)
  },
  (app) => {
    // Avoid data loss by not explicitly removing fields in down migration
  },
)
