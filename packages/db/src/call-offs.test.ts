import type { CallOffApproval } from "@staffan/core";
import { describe, expect, it } from "vitest";

import { ApprovalConflictError, findReplayableApproval } from "./call-offs.js";

const fields = { sourceSystem: "e-avrop" } as CallOffApproval;

describe("findReplayableApproval", () => {
  it("allows a new approval when no earlier approval exists", () => {
    expect(findReplayableApproval([], fields, "operator-1")).toBeNull();
  });

  it("returns an identical approval by the same operator", () => {
    const approval = { approvedByOperatorId: "operator-1", fields };

    expect(findReplayableApproval([approval], fields, "operator-1")).toBe(approval);
  });

  it("treats a legacy approval without operator attribution as a conflict", () => {
    expect(() =>
      findReplayableApproval(
        [{ approvedByOperatorId: null, fields }],
        fields,
        "operator-1",
      ),
    ).toThrow(ApprovalConflictError);
  });

  it("treats multiple historical approvals as an ambiguous conflict", () => {
    expect(() =>
      findReplayableApproval(
        [
          { approvedByOperatorId: null, fields },
          { approvedByOperatorId: null, fields },
        ],
        fields,
        "operator-1",
      ),
    ).toThrow(ApprovalConflictError);
  });

  it("rejects a replay with changed fields or a different operator", () => {
    const approval = { approvedByOperatorId: "operator-1", fields };

    expect(() =>
      findReplayableApproval(
        [approval],
        { ...fields, sourceSystem: "manual" },
        "operator-1",
      ),
    ).toThrow(ApprovalConflictError);
    expect(() => findReplayableApproval([approval], fields, "operator-2")).toThrow(
      ApprovalConflictError,
    );
  });
});
