// Clean satisfies every L2C.001 invariant. withDefect plants three failures:
// a duplicate 'Appointment', a primary entity with no definition, and dropped residue.
export const clean = {
  entities: [{"id":"ENTITY.client","canonicalName":"Client","classification":"primary_domain_entity","definition":"A person or organization receiving services from the business."},{"id":"ENTITY.appointment","canonicalName":"Appointment","classification":"primary_workflow_entity","definition":"A scheduled service interaction between a client and a staff member."},{"id":"ENTITY.payment","canonicalName":"Payment","classification":"financial_entity","definition":"A recorded monetary transaction linked to a client, appointment, or service."},{"id":"ENTITY.staff_member","canonicalName":"StaffMember","classification":"actor_entity","definition":"A person who performs services, manages workflow, or has system permissions."},{"id":"ENTITY.content_asset","canonicalName":"ContentAsset","classification":"supporting_content_entity","definition":"A reusable media or text asset used for website, social, campaign, or internal knowledge purposes."},{"id":"ENTITY.review","canonicalName":"Review","classification":"proof_entity","definition":"A third-party or user-provided proof object used to support trust claims."},{"id":"ENTITY.automation","canonicalName":"Automation","classification":"workflow_support_entity","definition":"A triggered or agent-assisted workflow that performs or suggests repeated work."}],
  ambiguous: [{"term":"command center"},{"term":"content"},{"term":"AI automations"}],
  residue: [{"term":"command center"},{"term":"content"},{"term":"AI automations"}],
};
export const withDefect = {
  entities: [
    ...clean.entities,
    { id: 'ENTITY.booking', canonicalName: 'Appointment', classification: 'primary_workflow_entity', definition: '' },
  ],
  ambiguous: clean.ambiguous,
  residue: [{ term: 'command center' }],
};
