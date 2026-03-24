#!/bin/bash
# Invariant: ["critical","major","minor"].includes(semanticDrift.severity)
# Entity: SemanticDrift
# Description: Severity must be a known class — the Governor uses severity to weight rejection decisions
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ["critical","major","minor"].includes(semanticDrift.severity)
exit 0
