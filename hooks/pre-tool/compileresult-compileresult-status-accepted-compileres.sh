#!/bin/bash
# Invariant: compileResult.status === 'accepted' ? compileResult.governorDecision.decision === 'ACCEPT' : true
# Entity: CompileResult
# Description: status 'accepted' may only be set when GovernorDecision is ACCEPT
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.status === 'accepted' ? compileResult.governorDecision.decision === 'ACCEPT' : true
exit 0
