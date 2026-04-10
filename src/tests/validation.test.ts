import assert from "node:assert/strict";
import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { validateTrainingState } from "../validation/state";

export function runValidationTests(): void {
  {
    const state = createTrainingState(createStarterProgram(), []);
    const result = validateTrainingState(state);

    assert.equal(result.isValid, true);
    assert.equal(result.issues.length, 0);
  }

  {
    const state = createTrainingState(createStarterProgram(), [
      {
        id: "session-1",
        dayId: "made-up-day",
        performedAt: "not-a-date",
        exercises: [
          {
            exerciseId: "unknown-exercise",
            sets: [{ reps: 0, load: -5, completed: true }]
          }
        ]
      }
    ]);
    const result = validateTrainingState(state);

    assert.equal(result.isValid, false);
    assert.equal(result.issues.some((issue) => issue.path.endsWith(".dayId")), true);
    assert.equal(result.issues.some((issue) => issue.path.endsWith(".performedAt")), true);
    assert.equal(result.issues.some((issue) => issue.path.endsWith(".exerciseId")), true);
    assert.equal(result.issues.some((issue) => issue.path.endsWith(".reps")), true);
    assert.equal(result.issues.some((issue) => issue.path.endsWith(".load")), true);
  }

  {
    const program = createStarterProgram();
    program.sessionsPerWeek = 0;
    const result = validateTrainingState(createTrainingState(program, []));

    assert.equal(result.isValid, false);
    assert.equal(result.issues.some((issue) => issue.path === "program.sessionsPerWeek"), true);
  }

  {
    const program = createStarterProgram();
    delete (program as { sessionsPerWeek?: number }).sessionsPerWeek;
    const result = validateTrainingState(createTrainingState(program, []));

    assert.equal(result.isValid, false);
    assert.equal(result.issues.some((issue) => issue.path === "program.sessionsPerWeek"), true);
  }

  {
    const state = createTrainingState(createStarterProgram(), []);
    state.ai = {
      nextWorkoutExplanations: {
        "made-up-day": {
          generatedAt: "2026-04-09T12:00:00.000Z",
          dayId: "made-up-day",
          title: "Bad cache",
          overview: "Bad cache",
          exerciseNotes: [],
          coachingCue: "Cue"
        }
      }
    };
    const result = validateTrainingState(state);

    assert.equal(result.isValid, false);
    assert.equal(result.issues.some((issue) => issue.path === "ai.nextWorkoutExplanations.made-up-day"), true);
  }

  {
    const state = createTrainingState(createStarterProgram(), [
      {
        id: "session-1",
        dayId: "upper-a",
        performedAt: "2026-04-09T18:00:00-05:00",
        exercises: [
          {
            exerciseId: "bench-press",
            sets: [{ reps: 5, load: 135, completed: true }]
          }
        ]
      }
    ]);
    state.ai = {
      sessionRecaps: {
        "session-2": {
          generatedAt: "2026-04-09T12:00:00.000Z",
          sessionId: "session-2",
          title: "Bad recap",
          wins: ["Win"],
          watchNext: ["Watch"],
          encouragement: "Keep going"
        }
      }
    };
    const result = validateTrainingState(state);

    assert.equal(result.isValid, false);
    assert.equal(result.issues.some((issue) => issue.path === "ai.sessionRecaps.session-2"), true);
  }
}
