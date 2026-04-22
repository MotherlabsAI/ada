import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventEmitter } from "events";

// ─── Mocks ───
// The DialogueEngine (imported transitively via session-manager) reaches for
// the Anthropic SDK and, as a fallback, spawns the `claude` CLI. Neither is
// acceptable in a pure in-memory test. We stub both so LLM calls short-circuit
// to the engine's deterministic default responses.

vi.mock("@anthropic-ai/sdk", () => {
  class FakeAnthropic {
    public readonly messages = {
      stream: () => {
        const stream = new EventEmitter() as EventEmitter & {
          finalMessage: () => Promise<Record<string, unknown>>;
        };
        stream.finalMessage = async () => ({});
        return stream;
      },
    };
  }
  return { default: FakeAnthropic };
});

vi.mock("child_process", () => {
  const spawn = () => {
    const proc = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
      stdin: { write: () => void; end: () => void };
      kill: () => void;
    };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.stdin = { write: () => {}, end: () => {} };
    proc.kill = () => {};
    // Fire error on next tick so callCLIText resolves with "" immediately.
    setImmediate(() => {
      proc.emit("error", new Error("spawn disabled in tests"));
      proc.emit("close", 1);
    });
    return proc;
  };
  return { spawn };
});

import {
  createElicitationSessionManager,
  ElicitationSessionManager,
} from "../src/index.js";

describe("createElicitationSessionManager", () => {
  beforeEach(() => {
    // Ensure the LLM path is the CLI fallback (which we've mocked to fail fast).
    delete process.env["ANTHROPIC_API_KEY"];
  });

  it("returns a live ElicitationSessionManager instance", () => {
    const manager = createElicitationSessionManager();
    expect(manager).toBeInstanceOf(ElicitationSessionManager);
    expect(typeof manager.startSession).toBe("function");
    expect(typeof manager.submitAnswer).toBe("function");
  });

  it("startSession on a well-formed intent returns session, draft, and an open turn", async () => {
    const manager = createElicitationSessionManager();
    const result = await manager.startSession(
      "I want to build a todo app that lets users track daily tasks offline",
    );

    expect(result.session.sessionId).toMatch(/[0-9a-f-]{36}/);
    expect(result.session.status).toBe("active");
    expect(result.draft.sessionId).toBe(result.session.sessionId);
    expect(result.draft.rawIntent).toContain("todo app");
    expect(result.turn.sessionId).toBe(result.session.sessionId);
    expect(result.turn.turnId).toMatch(/[0-9a-f-]{36}/);
    expect(result.turn.turnIndex).toBeGreaterThanOrEqual(0);
    expect(["opened", "awaiting_answer"]).toContain(result.turn.status);
  });

  it("startSession throws on empty intent", async () => {
    const manager = createElicitationSessionManager();
    await expect(manager.startSession("")).rejects.toThrow(/empty|whitespace/i);
  });

  it("startSession throws on whitespace-only intent", async () => {
    const manager = createElicitationSessionManager();
    await expect(manager.startSession("   \n\t  ")).rejects.toThrow(
      /empty|whitespace/i,
    );
  });

  it("startSession result exposes either a ClarificationRequestRecord or null", async () => {
    const manager = createElicitationSessionManager();
    const result = await manager.startSession(
      "Build a blog where authors publish posts and readers comment",
    );

    // By the type contract, clarificationRequest must be either null or a record.
    if (result.clarificationRequest === null) {
      expect(result.clarificationRequest).toBeNull();
    } else {
      const req = result.clarificationRequest;
      expect(typeof req.clarificationRequestId).toBe("string");
      expect(req.clarificationRequestId.length).toBeGreaterThan(0);
      expect(req.gapId).toBe(req.unknownId);
    }
  });

  it("ClarificationRequestRecord (when present) has non-empty question and a valid impact", async () => {
    const manager = createElicitationSessionManager();
    const result = await manager.startSession(
      "I need a scheduling assistant for small dental clinics",
    );

    // A fresh draft has no confirmed goals → GapAnalyzer always emits at least
    // one blocking gap → session-manager always emits a ClarificationRequest
    // on startup (non-ambiguous gap path).
    expect(result.clarificationRequest).not.toBeNull();
    const req = result.clarificationRequest!;

    expect(typeof req.question).toBe("string");
    expect(req.question.trim().length).toBeGreaterThan(0);
    expect(["blocking", "scoping", "implementation"]).toContain(req.impact);
  });

  it("submitAnswer returns a TurnResult containing either a nextTurn or a handoff", async () => {
    const manager = createElicitationSessionManager();
    const start = await manager.startSession(
      "Create a recipe sharing site where cooks post recipes and users save favorites",
    );

    // startSession should have opened a turn we can answer.
    expect(start.turn).toBeDefined();

    const turnResult = await manager.submitAnswer(
      start.session.sessionId,
      start.turn.turnId,
      "The system should let registered users create, edit, and delete recipes.",
    );

    expect(turnResult.session.sessionId).toBe(start.session.sessionId);
    expect(turnResult.closedTurn.turnId).toBe(start.turn.turnId);
    expect(turnResult.closedTurn.status).toBe("closed");

    // Exactly one of nextTurn or handoff should be populated; the other side
    // may be null, but at least one must be non-null for a valid TurnResult.
    const progressed =
      turnResult.nextTurn !== null || turnResult.handoff !== null;
    expect(progressed).toBe(true);

    if (turnResult.nextTurn) {
      expect(turnResult.nextTurn.turnId).not.toBe(start.turn.turnId);
      expect(turnResult.nextTurn.sessionId).toBe(start.session.sessionId);
    }

    if (turnResult.handoff) {
      expect(turnResult.handoff.sessionId).toBe(start.session.sessionId);
      expect(turnResult.handoff.finalIntentGraph).toBeDefined();
    }
  });

  it("submitAnswer throws when given an unknown session id", async () => {
    const manager = createElicitationSessionManager();
    await expect(
      manager.submitAnswer(
        "00000000-0000-0000-0000-000000000000",
        "00000000-0000-0000-0000-000000000000",
        "some answer",
      ),
    ).rejects.toThrow(/Session not found/);
  });

  it("two independently created managers do not share session state", async () => {
    const managerA = createElicitationSessionManager();
    const managerB = createElicitationSessionManager();

    const startA = await managerA.startSession(
      "Build a fitness tracker that logs daily runs",
    );

    // managerB has never seen startA's session.
    await expect(
      managerB.submitAnswer(startA.session.sessionId, startA.turn.turnId, "x"),
    ).rejects.toThrow(/Session not found/);

    // managerA still knows about it.
    const fetched = managerA.getSessionState(startA.session.sessionId);
    expect(fetched.sessionId).toBe(startA.session.sessionId);
  });
});
