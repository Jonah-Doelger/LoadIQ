import assert from "node:assert/strict";
import { buildAdherenceRange, buildAdherenceSummary } from "../analytics/adherence";
import { createStarterProgram } from "../core/program";
import { WorkoutSession } from "../domain/types";

const program = createStarterProgram();

const sessions: WorkoutSession[] = [
  {
    id: "session-1",
    dayId: "upper-a",
    performedAt: "2026-04-09T18:00:00-05:00",
    exercises: []
  },
  {
    id: "session-2",
    dayId: "upper-a",
    performedAt: "2026-04-10T18:00:00-05:00",
    exercises: []
  },
  {
    id: "session-3",
    dayId: "lower-a",
    performedAt: "2026-04-11T18:00:00-05:00",
    exercises: []
  }
];

export function runAdherenceTests(): void {
  {
    const summary = buildAdherenceSummary(program, sessions);

    assert.ok(summary);
    assert.equal(summary.completedSessions, 3);
    assert.equal(summary.targetSessions, 4);
    assert.equal(summary.adherenceRate, 75);
    assert.equal(summary.completedWorkoutDays, 2);
    assert.equal(summary.missedSessions, 1);
  }

  {
    const range = buildAdherenceRange("2026-04-10", "2026-04-11");

    assert.ok(range);

    const summary = buildAdherenceSummary(program, sessions, range);

    assert.ok(summary);
    assert.equal(summary.completedSessions, 2);
    assert.equal(summary.adherenceRate, 50);
  }

  assert.throws(() => buildAdherenceRange("2026-04-10", undefined), {
    message: "Provide both --start and --end, or omit both."
  });
}
