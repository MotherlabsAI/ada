#!/bin/bash
# Block stale model strings and non-Anthropic model imports
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""')
if echo "$CONTENT" | grep -qE \
  "from ['\"]ollama|from ['\"]openai|from ['\"]@huggingface|\
localhost:11434|\
claude-opus-4-5|claude-sonnet-4-5|claude-haiku-4-5"; then
  echo "Ada invariant violated: use claude-sonnet-4-6 or claude-opus-4-6 only. No stale model strings, no non-Anthropic clients." >&2
  exit 2
fi
exit 0
