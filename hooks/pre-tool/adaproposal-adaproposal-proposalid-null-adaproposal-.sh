#!/bin/bash
# Invariant: adaProposal.proposalId !== null && adaProposal.proposalId.length > 0
# Entity: AdaProposal
# Description: Proposal must have identity — anonymous proposals cannot be disposed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaProposal.proposalId !== null && adaProposal.proposalId.length > 0
exit 0
