#!/bin/bash
# Invariant: adaProposal.rationale !== null && adaProposal.rationale.length > 0
# Entity: AdaProposal
# Description: Rationale must be present — a proposal without justification cannot be evaluated for acceptance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: adaProposal.rationale !== null && adaProposal.rationale.length > 0
exit 0
