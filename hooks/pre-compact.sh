#!/bin/bash
# Ada pre-compact checkpoint — fires before context compaction.
# stdout text is injected into the compaction context, influencing what the
# compaction summary preserves. Always exits 0.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-${ADA_PROJECT_DIR:-$(pwd)}}"
MANIFEST="$PROJECT_DIR/.ada/manifest.json"
SESSION_LOG="$PROJECT_DIR/.ada/session-log.jsonl"

# Read active blueprint intent from manifest
INTENT=""
RUN_ID=""
if [ -f "$MANIFEST" ]; then
  INTENT=$(jq -r '.intent // ""' "$MANIFEST" 2>/dev/null | cut -c1-120)
  RUN_ID=$(jq -r '.runId // ""' "$MANIFEST" 2>/dev/null)
fi

# Read last session log entry
LAST_TOOL=""
if [ -f "$SESSION_LOG" ]; then
  LAST_TOOL=$(tail -1 "$SESSION_LOG" 2>/dev/null | jq -r '"\(.tool) \(.path)"' 2>/dev/null || echo "")
fi

echo "ADA CHECKPOINT — preserve this across compaction."
echo "Active run: ${RUN_ID:-none}"
echo "Original intent: ${INTENT:-unknown}"
[ -n "$LAST_TOOL" ] && echo "Last tool call: $LAST_TOOL"
echo "After compaction: re-read CLAUDE.md and all .claude/agents/ files."
echo "Ada invariants must survive compaction — they are the governing constraint."

exit 0
