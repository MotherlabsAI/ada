#!/bin/bash
# Invariant: /* governance core is not a valid source */ skill.description.indexOf('governance_core') === -1
# Entity: Skill
# Description: governance core (invariants, contracts, pipeline stages) must not be a skill extraction target
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* governance core is not a valid source */ skill.description.indexOf('governance_core') === -1
exit 0
