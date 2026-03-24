#!/bin/bash
# Invariant: !(adaProposal.disposition === 'modified') || adaProposal.modifiedText !== null
# Entity: AdaProposal
# Description: A modified proposal must carry the modified text — without this, the accepted version cannot be written to the draft
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: !(adaProposal.disposition === 'modified') || adaProposal.modifiedText !== null
exit 0
