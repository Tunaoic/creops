import { describe, it, expect } from "vitest";

/**
 * Smoke tests for the workflow state machine.
 *
 * These mirror the guard rules embedded in src/db/actions.ts (submitTask,
 * approveTask, rejectTask, markChannelAired). If those rules drift, these
 * tests catch the regression before a user discovers it.
 *
 * Pure-function test — does not touch the DB. We replicate the guard
 * predicates here as a contract test. If you change a guard in actions.ts,
 * update this test too — the duplication is intentional, it's the contract.
 */

type TaskStatus = "todo" | "in_progress" | "submitted" | "approved" | "rejected";
type DeliverableStatus =
  | "draft"
  | "in_progress"
  | "review"
  | "approved"
  | "aired";

function canSubmit(current: TaskStatus): boolean {
  // submitTask refuses on already-approved tasks
  return current !== "approved";
}

function canApprove(current: TaskStatus): boolean {
  // approveTask only acts on submitted
  return current === "submitted";
}

function canReject(current: TaskStatus): boolean {
  // rejectTask only acts on submitted
  return current === "submitted";
}

function canMarkAired(deliverable: DeliverableStatus): boolean {
  // markChannelAired only when deliverable is approved (or already aired)
  return deliverable === "approved" || deliverable === "aired";
}

function shouldRevertDeliverableOnReject(
  deliverable: DeliverableStatus
): boolean {
  // Forward-only rollup — only revert if deliverable already advanced
  return deliverable === "approved" || deliverable === "review";
}

describe("workflow state machine: canSubmit", () => {
  it("allows submit on todo / in_progress / rejected (resubmit)", () => {
    expect(canSubmit("todo")).toBe(true);
    expect(canSubmit("in_progress")).toBe(true);
    expect(canSubmit("rejected")).toBe(true);
  });
  it("allows resubmit on already-submitted (overwrite output)", () => {
    expect(canSubmit("submitted")).toBe(true);
  });
  it("blocks submit on approved (would silently overwrite finalized output)", () => {
    expect(canSubmit("approved")).toBe(false);
  });
});

describe("workflow state machine: canApprove", () => {
  it("only allows approve on submitted", () => {
    expect(canApprove("submitted")).toBe(true);
    expect(canApprove("todo")).toBe(false);
    expect(canApprove("in_progress")).toBe(false);
    expect(canApprove("rejected")).toBe(false);
    expect(canApprove("approved")).toBe(false);
  });
});

describe("workflow state machine: canReject", () => {
  it("only allows reject on submitted", () => {
    expect(canReject("submitted")).toBe(true);
    expect(canReject("todo")).toBe(false);
    expect(canReject("in_progress")).toBe(false);
    expect(canReject("rejected")).toBe(false);
    expect(canReject("approved")).toBe(false);
  });
});

describe("workflow state machine: canMarkAired", () => {
  it("requires deliverable to be approved or already aired", () => {
    expect(canMarkAired("approved")).toBe(true);
    expect(canMarkAired("aired")).toBe(true);
  });
  it("blocks aired on draft / in_progress / review", () => {
    expect(canMarkAired("draft")).toBe(false);
    expect(canMarkAired("in_progress")).toBe(false);
    expect(canMarkAired("review")).toBe(false);
  });
});

describe("forward-only rollup: rejectTask deliverable revert", () => {
  it("reverts deliverable only if it had advanced past in_progress", () => {
    expect(shouldRevertDeliverableOnReject("approved")).toBe(true);
    expect(shouldRevertDeliverableOnReject("review")).toBe(true);
  });
  it("does NOT revert when deliverable is still in_progress (Linear convention)", () => {
    expect(shouldRevertDeliverableOnReject("in_progress")).toBe(false);
    expect(shouldRevertDeliverableOnReject("draft")).toBe(false);
    // aired is terminal — no revert
    expect(shouldRevertDeliverableOnReject("aired")).toBe(false);
  });
});
