#!/bin/bash
# Invariant: /* agent may not write outside fileScope */ delegationContract.scope.forbiddenPathGlobs !== null
# Entity: DelegationContract
# Description: forbiddenPathGlobs must be defined — without it file scope enforcement is impossible
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* agent may not write outside fileScope */ delegationContract.scope.forbiddenPathGlobs !== null
exit 0
