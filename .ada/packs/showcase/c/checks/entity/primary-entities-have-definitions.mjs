export const name = "schema.primary_entities_have_definitions";
const PRIMARY = ['primary_domain_entity', 'primary_workflow_entity', 'financial_entity', 'actor_entity'];
export function run(data) {
  const violations = (data.entities || [])
    .filter((e) => PRIMARY.includes(e.classification) && !(e.definition && String(e.definition).trim()))
    .map((e) => ({ kind: 'undefined_primary_entity', canonicalName: e.canonicalName }));
  return { name, pass: violations.length === 0, violations };
}
