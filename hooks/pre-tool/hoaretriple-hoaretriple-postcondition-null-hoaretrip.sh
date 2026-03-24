#!/bin/bash
# Invariant: hoareTriple.postcondition !== null && hoareTriple.postcondition.length > 0
# Entity: HoareTriple
# Description: Postcondition must be stated — without it transformation correctness has no verifiable end state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hoareTriple.postcondition !== null && hoareTriple.postcondition.length > 0
exit 0
