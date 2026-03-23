#!/bin/bash
# Invariant: verificationReport.passed === true ? verificationReport.findings.filter(f => f.severity === 'critical').length === 0 : true
# Entity: VerificationReport
# Description: a passing verification report must have no critical findings
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationReport.passed === true ? verificationReport.findings.filter(f => f.severity === 'critical').length === 0 : true
exit 0
