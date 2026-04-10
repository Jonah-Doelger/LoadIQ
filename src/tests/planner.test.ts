import assert from "node:assert/strict";
import { buildNextWorkout } from "../core/planner";
import { getNextSessionId, logWorkout } from "../core/logger";
import { createStarterProgram } from "../core/program";
import { WorkoutSession } from "../domain/types";

export function runPlannerTests(): void {
  {
    const program = createStarterProgram();
    const history: WorkoutSession[] = [
      logWorkout({
        id: getNextSessionId([]),
        dayId: "upper-a",
        performedAt: "2026-04-09T18:00:00-05:00",
        exercises: [
          {
            exerciseId: "bench-press",
            sets: [
              { reps: 8, load: 135, completed: true },
              { reps: 8, load: 135, completed: true },
              { reps: 8, load: 135, completed: true }
            ]
          },
          {
            exerciseId: "barbell-row",
            sets: [
              { reps: 8, load: 115, completed: true },
              { reps: 8, load: 115, completed: true },
              { reps: 8, load: 115, completed: true }
            ]
          },
          {
            exerciseId: "overhead-press",
            sets: [
              { reps: 5, load: 65, completed: true },
              { reps: 5, load: 65, completed: true },
              { reps: 4, load: 65, completed: false }
            ]
          }
        ]
      })
    ];

    const targets = buildNextWorkout(program, "upper-a", history);

    assert.equal(targets.length, 3);
    assert.deepEqual(targets[0].sets[0], { reps: 5, load: 140 });
    assert.deepEqual(targets[1].sets[0], { reps: 9, load: 115 });
    assert.deepEqual(targets[2].sets[0], { reps: 5, load: 65 });
  }

  {
    const program = createStarterProgram();

    assert.throws(() => buildNextWorkout(program, "missing-day", []), {
      message: "Unknown workout day: missing-day"
    });
  }
}
