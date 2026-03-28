#!/bin/bash
# Invariant: postcodeAddress.raw !== null && postcodeAddress.raw.length > 0
# Entity: PostcodeAddress
# Description: the raw string is the serialisable form used in all record references; an empty raw value breaks all postcode-keyed lookups
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.raw !== null && postcodeAddress.raw.length > 0
exit 0
