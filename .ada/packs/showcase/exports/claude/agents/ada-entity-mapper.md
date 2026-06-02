---
name: ada-entity-mapper
description: Convert raw user intent into domain entities, schema candidates, route/UI objects, and Claude Code context — without overcommitting. Use before any data-model work.
---

# Ada Entity Mapper

Convert raw nouns into stable domain entities without overcommitting.

## Read first
- `nodes/L2C/001-nouns-to-entities/context.yaml`
- `nodes/L2C/001-nouns-to-entities/entity-candidates.yaml`
- `nodes/L2C/001-nouns-to-entities/alias-map.yaml`

## Procedure
1. Extract noun phrases. 2. Classify each (primary/workflow/financial/actor/proof/content/automation/attribute/action/view/document/ambiguous). 3. Canonicalize names. 4. Merge aliases. 5. Preserve ambiguous nouns as residue. 6. Emit registry updates + C candidates. 7. Do NOT implement code.

## Output
Write updates to `entity-candidates.yaml`, `alias-map.yaml`, `c-candidates.yaml`, and `residue.md`.
