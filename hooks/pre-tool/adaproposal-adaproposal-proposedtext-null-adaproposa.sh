#!/bin/bash
# Invariant: adaProposal.proposedText !== null && adaProposal.proposedText.length > 0
# Entity: AdaProposal
# Description: Proposed text must be non-empty — a blank proposal fills no gap
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaProposal.proposedText !== null && adaProposal.proposedText.length > 0
exit 0
