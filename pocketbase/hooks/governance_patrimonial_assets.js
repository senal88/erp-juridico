onRecordCreate((e) => {
  const level = e.record.getString('evidence_level') || 'E0'
  const isMaterialValid = level === 'E2' || level === 'E3' || level === 'E4'
  e.record.set('valid_for_material_decision', isMaterialValid)

  // Governança MFO 2026: Para níveis E3 e E4, é mandatória nota de evidência documental ou anexo
  const notes = e.record.getString('evidence_notes') || ''
  const files = e.record.getStringSlice('evidence_document_file') || []
  if ((level === 'E3' || level === 'E4') && notes.trim().length === 0 && files.length === 0) {
    throw new BadRequestError(
      'Para os níveis de evidência E3 ou E4, é obrigatório registrar a fonte/referência documental nas notas de evidência ou anexar os documentos comprobatórios.',
    )
  }

  e.next()
}, 'patrimonial_assets')

onRecordUpdate((e) => {
  const level = e.record.getString('evidence_level') || 'E0'
  const isMaterialValid = level === 'E2' || level === 'E3' || level === 'E4'
  e.record.set('valid_for_material_decision', isMaterialValid)

  // Governança MFO 2026: Para níveis E3 e E4, é mandatória nota de evidência documental ou anexo
  const notes = e.record.getString('evidence_notes') || ''
  const files = e.record.getStringSlice('evidence_document_file') || []
  if ((level === 'E3' || level === 'E4') && notes.trim().length === 0 && files.length === 0) {
    throw new BadRequestError(
      'Para os níveis de evidência E3 ou E4, é obrigatório registrar a fonte/referência documental nas notas de evidência ou anexar os documentos comprobatórios.',
    )
  }

  e.next()
}, 'patrimonial_assets')
