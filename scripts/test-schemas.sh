#!/bin/bash
# Test each agent schema with a targeted prompt.
# Each agent gets a prompt that matches its real format but with simple content.
# ~30s per agent, ~3min total.

set -e
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "◈ Ada schema validation test"
echo ""

PASS=0
FAIL=0

test_agent() {
  local CODE="$1"
  local NAME="$2"
  local PROMPT="$3"

  echo -n "  ❯ ${CODE}  "

  TMPFILE=$(mktemp)
  echo "$PROMPT" > "$TMPFILE"
  RESPONSE=$(cat "$TMPFILE" | claude --print --output-format text --model claude-sonnet-4-6 --dangerously-skip-permissions 2>/dev/null || echo "")
  rm -f "$TMPFILE"

  if [ -z "$RESPONSE" ]; then
    echo "✗  no response"
    FAIL=$((FAIL + 1))
    return
  fi

  RESULT=$(echo "$RESPONSE" | node -e "
    const fs = require('fs');
    const s = require('${PROJECT_DIR}/packages/compiler/dist/schemas.js');
    const map = { INT:s.intentGraphSchema, PER:s.domainContextSchema, ENT:s.entityMapSchema, PRO:s.processFlowSchema, SYN:s.blueprintSchema, VER:s.auditReportSchema, GOV:s.governorDecisionSchema };
    const raw = fs.readFileSync('/dev/stdin','utf8');
    const m = raw.match(/\`\`\`(?:json|JSON)?\s*\n?([\s\S]*?)\`\`\`/);
    const b = raw.indexOf('{'), e = raw.lastIndexOf('}');
    const j = m?.[1]?.trim() || (b!==-1 ? raw.slice(b,e+1) : '');
    if (!j) { console.log('NO_JSON'); process.exit(0); }
    try {
      const p = JSON.parse(j);
      delete p.postcode; delete p.rawIntent;
      function n(o){if(Array.isArray(o))return o.map(n);if(o&&typeof o==='object'){const r={};for(const[k,v]of Object.entries(o))r[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase())]=n(v);return r}return o}
      map['${CODE}'].parse(n(p));
      console.log('PASS');
    } catch(e) {
      console.log('FAIL:' + (e.issues?.map(i=>i.path.join('.')+':'+i.message).join('; ')||e.message).slice(0,200));
    }
  " 2>/dev/null || echo "ERROR")

  if [ "$RESULT" = "PASS" ]; then
    echo "✓  schema validates"
    PASS=$((PASS + 1))
  else
    echo "✗  ${RESULT}"
    FAIL=$((FAIL + 1))
  fi
}

# INT
test_agent "INT" "intent" 'Analyze this intent and return ONLY a JSON object in a ```json code fence.

Intent: "build a todo app with tasks and categories"

Return this exact structure with REAL values (not placeholders):
```json
{
  "goals": [{"id": "G1", "description": "allow users to create tasks", "type": "stated"}],
  "constraints": [{"id": "C1", "description": "must have categories", "source": "explicit"}],
  "unknowns": [{"id": "U1", "description": "what database to use?", "impact": "implementation"}],
  "challenges": [{"id": "CH1", "description": "scope unclear", "severity": "minor", "resolved": false}]
}
```
Produce 3+ goals, 2+ constraints, 2+ unknowns. Return ONLY the JSON.'

# PER
test_agent "PER" "persona" 'Analyze the domain for a todo app and return ONLY a JSON object in a ```json code fence.

Return this exact structure with REAL values:
```json
{
  "domain": "task management",
  "stakeholders": [{"role": "end user", "knowledgeBase": ["basic computer use"], "blindSpots": ["data persistence"], "vocabulary": {"task": "a unit of work"}, "fearSet": ["losing data"]}],
  "ubiquitousLanguage": {"task": "a unit of work to complete", "category": "a grouping of tasks"},
  "excludedConcerns": ["real-time collaboration", "payment processing"],
  "challenges": []
}
```
Return ONLY the JSON.'

# ENT
test_agent "ENT" "entity" 'Extract entities for a todo app and return ONLY a JSON object in a ```json code fence.

Return this exact structure with REAL values:
```json
{
  "entities": [
    {"name": "Task", "category": "substance", "properties": [{"name": "title", "type": "string", "required": true}], "invariants": [{"predicate": "task.title.length > 0", "description": "title cannot be empty"}]},
    {"name": "Category", "category": "substance", "properties": [{"name": "name", "type": "string", "required": true}], "invariants": [{"predicate": "category.name.length > 0", "description": "name cannot be empty"}]}
  ],
  "boundedContexts": [{"name": "task-management", "rootEntity": "Task", "entities": ["Task", "Category"], "invariants": []}],
  "challenges": []
}
```
Return ONLY the JSON.'

# PRO
test_agent "PRO" "process" 'Define workflows for a todo app and return ONLY a JSON object in a ```json code fence.

Return this exact structure with REAL values:
```json
{
  "workflows": [
    {
      "name": "create-task",
      "trigger": "user submits new task form",
      "steps": [
        {
          "name": "validate-input",
          "hoareTriple": {"precondition": "title !== null", "action": "validate(title)", "postcondition": "title.length > 0"},
          "failureModes": [{"class": "precondition", "description": "null title", "handler": "return error"}],
          "temporalRelation": "enables"
        }
      ]
    }
  ],
  "stateMachines": [
    {"entity": "Task", "states": ["pending", "done"], "transitions": [{"from": "pending", "to": "done", "trigger": "complete", "guard": "true"}]}
  ],
  "challenges": []
}
```
Return ONLY the JSON.'

# SYN
test_agent "SYN" "synthesis" 'Synthesize an architecture for a todo app and return ONLY a JSON object in a ```json code fence.

Return this exact structure with REAL values:
```json
{
  "summary": "A task management application allowing users to create, organize, and complete tasks within categories.",
  "architecture": {
    "pattern": "layered",
    "rationale": "Simple CRUD app benefits from clear separation of concerns",
    "components": [
      {"name": "TaskService", "responsibility": "CRUD operations for tasks", "interfaces": ["createTask()", "completeTask()"], "dependencies": [], "boundedContext": "task-management"},
      {"name": "CategoryService", "responsibility": "manage task categories", "interfaces": ["createCategory()"], "dependencies": [], "boundedContext": "task-management"}
    ]
  },
  "nonFunctional": ["Response time under 200ms"],
  "openQuestions": ["Should tasks support due dates?"],
  "resolvedConflicts": [],
  "challenges": []
}
```
Return ONLY the JSON.'

# VER
test_agent "VER" "verify" 'Verify a todo app blueprint and return ONLY a JSON object in a ```json code fence.

Return this exact structure with REAL values:
```json
{
  "coverageScore": 0.85,
  "coherenceScore": 0.90,
  "drifts": [],
  "gaps": ["no explicit error handling strategy"],
  "passed": true,
  "challenges": []
}
```
Return ONLY the JSON.'

# GOV
test_agent "GOV" "governor" 'Evaluate a pipeline and return ONLY a JSON object in a ```json code fence.

Return this exact structure with REAL values:
```json
{
  "decision": "ACCEPT",
  "confidence": 0.88,
  "coverageScore": 0.85,
  "coherenceScore": 0.90,
  "gatePassRate": 0.83,
  "provenanceIntact": true,
  "rejectionReasons": [],
  "nextAction": null,
  "challenges": []
}
```
Return ONLY the JSON.'

echo ""
echo "  ${PASS}/7 passed, ${FAIL}/7 failed"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "  ◈ all schemas validate — ready for self-compile"
else
  echo "  ✗ fix failing schemas before full run"
fi
