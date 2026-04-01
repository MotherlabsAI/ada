#!/bin/bash
# Invariant: /* immutable after write */ Object.isFrozen(provenanceRecord)
# Entity: ProvenanceRecord
# Description: ProvenanceRecord is immutable once written — mutation would corrupt the provenance audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* immutable after write */ Object.isFrozen(provenanceRecord)
exit 0
