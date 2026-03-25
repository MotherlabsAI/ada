#!/bin/bash
# Ada session-end summary — fires when the session ends.
# Reads the session log, writes a structured summary to .ada/sessions/{id}.json.

INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
END_REASON=$(echo "$INPUT" | jq -r '.end_reason // "unknown"' 2>/dev/null || echo "unknown")

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-${ADA_PROJECT_DIR:-$(pwd)}}"
SESSION_LOG="$PROJECT_DIR/.ada/session-log.jsonl"
SESSIONS_DIR="$PROJECT_DIR/.ada/sessions"

mkdir -p "$SESSIONS_DIR"

# Count tools called in this session
TOOL_COUNT=0
WRITE_COUNT=0
BASH_COUNT=0
DRIFT_COUNT=0

if [ -f "$SESSION_LOG" ]; then
  SESSION_LINES=$(grep "\"session\":\"$SESSION_ID\"" "$SESSION_LOG" 2>/dev/null || echo "")
  if [ -n "$SESSION_LINES" ]; then
    TOOL_COUNT=$(echo "$SESSION_LINES" | wc -l | tr -d ' ')
    WRITE_COUNT=$(echo "$SESSION_LINES" | grep -c '"tool":"Write"\|"tool":"Edit"\|"tool":"MultiEdit"' || echo 0)
    BASH_COUNT=$(echo "$SESSION_LINES" | grep -c '"tool":"Bash"' || echo 0)
  fi
fi

TS=$(date +%s)
SUMMARY_FILE="$SESSIONS_DIR/${SESSION_ID}.json"

cat > "$SUMMARY_FILE" <<EOF
{
  "sessionId": "$SESSION_ID",
  "endReason": "$END_REASON",
  "completedAt": $TS,
  "toolCallCount": $TOOL_COUNT,
  "writeCallCount": $WRITE_COUNT,
  "bashCallCount": $BASH_COUNT,
  "driftLogCount": $DRIFT_COUNT
}
EOF

exit 0
