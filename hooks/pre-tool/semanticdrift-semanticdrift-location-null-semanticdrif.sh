#!/bin/bash
# Invariant: semanticDrift.location !== null && semanticDrift.location.length > 0
# Entity: SemanticDrift
# Description: Drift must be locatable — unlocated drift cannot be gated or corrected in the pipeline
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: semanticDrift.location !== null && semanticDrift.location.length > 0
exit 0
