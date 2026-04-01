#!/bin/bash
# Invariant: /* immutable after write — no mutation operations permitted */true
# Entity: ProvenanceRecord
# Description: ProvenanceRecords are append-only; any update operation is a provenance violation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
if echo "$CONTENT" | grep -qiE "/ immutable after write  mutation operations /true"; then
  echo "Invariant violated [ProvenanceRecord]: /* immutable after write — no mutation operations permitted */true" >&2
  exit 2
fi
exit 0
