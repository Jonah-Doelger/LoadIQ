import assert from "node:assert/strict";
import { getNextSessionId, logWorkout } from "../core/logger";

export function runLoggerTests(): void {
  {
    const nextId = getNextSessionId([]);

    assert.equal(nextId, "session-1");
  }

  {
    const nextId = getNextSessionId([
      logWorkout({
        id: "session-1",
        dayId: "upper-a",
        performedAt: "2026-04-09T18:00:00-05:00",
        exercises: []
      }),
      logWorkout({
        id: "session-2",
        dayId: "lower-a",
        performedAt: "2026-04-10T18:00:00-05:00",
        exercises: []
      })
    ]);

    assert.equal(nextId, "session-3");
  }
}
