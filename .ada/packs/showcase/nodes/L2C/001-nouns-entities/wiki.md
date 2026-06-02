# ◇ L2C.001 — Nouns → Entities

## ⟡ Primitive
Nouns in user language are often the first visible signs of software entities. A durable object may become a table, model, type, API resource, UI screen, wiki section, agent task, or C check target.

## ∴ Meaning
User language contains nouns that may represent durable objects in the working world. This node extracts and classifies those nouns so later agents build stable schemas, routes, UI screens, wiki sections, and checks.

## Why it matters
Claude Code often builds weak systems when nouns stay vague — duplicate models, inconsistent names, missing relationships, UI that does not match the domain. This node stops raw nouns from drifting.
Example: the user says “booking” and a naive agent invents Booking, Appointment, CalendarEvent, ScheduleSlot, Reservation — duplicated concepts, weak relationships, broken checks. This node forces noun normalization early.

## ! Failure if missing
- Duplicate entities appear under different names.
- Important business objects are treated as loose text.
- Database schema does not match the user's domain.
- UI navigation is organized around generic pages instead of domain objects.
- Claude Code invents entities that were never intended.
- C checks cannot bind to stable objects.

## Input example
Extracted nouns → candidate entities:
```
Client
Appointment
Payment
StaffMember
ContentAsset
Review
Automation
```
Ambiguous (held as residue): command center, content, AI automations

## ⊢ Compiles to
canonical entity registry · data schema · model + route names · UI screens · permissions · Claude tasks · C candidates · wiki entity dictionary

## κ Checkability
Class C3_C4_candidate. Deterministic: graph schema, entity registry, route map, database schema, UI map, Claude export, C registry. Not deterministic: perfect entity judgment, domain-expert naming taste, business-priority selection, which entities belong in MVP.

## Ω Residue
- command center — Needs UI/product scope decision.
- content — Needs content-type scope (social vs website vs portfolio vs internal).
- AI automations — Needs workflow and agent scope decision.

## ↔ Links
Parents: ROOT.007, SEED.003, INTAKE.001
Children: DATA.001, DATA.002, BLUEPRINT.006, UI.010, CLAUDE.002, C.001
Siblings: L2C.002, L2C.003, L2C.004, L2C.015
