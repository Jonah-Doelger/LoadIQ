import assert from "node:assert/strict";
import { buildExerciseTrends, estimateOneRepMax } from "../analytics/trends";
import { createStarterProgram } from "../core/program";
import { TrainingProgram, WorkoutSession } from "../domain/types";

const program: TrainingProgram = createStarterProgram();

const sessions: WorkoutSession[] = [
  {
    id: "session-1",
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
        exerciseId: "overhead-press",
        sets: [
          { reps: 5, load: 65, completed: true },
          { reps: 5, load: 65, completed: true },
          { reps: 4, load: 65, completed: false }
        ]
      }
    ]
  },
  {
    id: "session-2",
    dayId: "upper-a",
    performedAt: "2026-04-10T18:00:00-05:00",
    exercises: [
      {
        exerciseId: "bench-press",
        sets: [
          { reps: 5, load: 140, completed: true },
          { reps: 5, load: 140, completed: true },
          { reps: 5, load: 140, completed: true }
        ]
      },
      {
        exerciseId: "overhead-press",
        sets: [
          { reps: 5, load: 65, completed: true },
          { reps: 5, load: 65, completed: true },
          { reps: 5, load: 65, completed: true }
        ]
      }
    ]
  }
];

export function runTrendTests(): void {
  {
    assert.equal(estimateOneRepMax(140, 5), 163.33333333333334);
  }

  {
    const trends = buildExerciseTrends(program, sessions);
    const bench = trends.find((trend) => trend.exerciseId === "bench-press");
    const overhead = trends.find((trend) => trend.exerciseId === "overhead-press");

    assert.ok(bench);
    assert.equal(bench.status, "down");
    assert.equal(bench.latest.estimatedOneRepMax, 163.3);
    assert.equal(bench.changeInEstimatedOneRepMax, -7.7);

    assert.ok(overhead);
    assert.equal(overhead.status, "flat");
  }

  {
    const trends = buildExerciseTrends(program, [
      {
        id: "session-1",
        dayId: "lower-a",
        performedAt: "2026-04-11T18:00:00-05:00",
        exercises: [
          {
            exerciseId: "back-squat",
            sets: [{ reps: 5, load: 185, completed: true }]
          }
        ]
      }
    ]);
    const squat = trends.find((trend) => trend.exerciseId === "back-squat");

    assert.ok(squat);
    assert.equal(squat.status, "insufficient-data");
  }
}
