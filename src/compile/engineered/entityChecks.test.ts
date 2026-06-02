import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findDuplicateCanonicalNames,
  findUndefinedPrimaryEntities,
  findLostAmbiguousNouns,
} from "./entityChecks.js";

test("no_duplicate_entity_names: unique names pass", () => {
  assert.deepEqual(
    findDuplicateCanonicalNames([
      {
        id: "ENTITY.client",
        canonicalName: "Client",
        classification: "primary_domain_entity",
      },
      {
        id: "ENTITY.appointment",
        canonicalName: "Appointment",
        classification: "primary_workflow_entity",
      },
    ]),
    [],
  );
});

test("no_duplicate_entity_names: duplicates are caught (Booking & CalendarEvent both 'Appointment')", () => {
  assert.deepEqual(
    findDuplicateCanonicalNames([
      {
        id: "ENTITY.booking",
        canonicalName: "Appointment",
        classification: "primary_workflow_entity",
      },
      {
        id: "ENTITY.calendar_event",
        canonicalName: "Appointment",
        classification: "primary_workflow_entity",
      },
    ]),
    ["Appointment"],
  );
});

test("primary_entities_have_definitions: missing definition on a primary entity fails", () => {
  assert.deepEqual(
    findUndefinedPrimaryEntities([
      {
        id: "ENTITY.client",
        canonicalName: "Client",
        classification: "primary_domain_entity",
        definition: "A person receiving services.",
      },
      {
        id: "ENTITY.payment",
        canonicalName: "Payment",
        classification: "financial_entity",
        definition: "  ",
      },
    ]),
    ["Payment"],
  );
});

test("ambiguous_nouns_preserved: all ambiguous nouns present in residue pass", () => {
  assert.deepEqual(
    findLostAmbiguousNouns(
      [{ term: "AI automations" }, { term: "command center" }],
      [{ term: "AI automations" }, { term: "command center" }],
    ),
    [],
  );
});

test("ambiguous_nouns_preserved: a dropped ambiguous noun is caught", () => {
  assert.deepEqual(findLostAmbiguousNouns([{ term: "AI automations" }], []), [
    "AI automations",
  ]);
});
