import assert from "node:assert/strict";
import { buildLastSevenDayRange, calculateMuscleGroupVolume } from "../analytics/volume";
import { formatDate } from "../cli/showVolume";
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
    dayId: "lower-a",
    performedAt: "2026-04-11T18:00:00-05:00",
    exercises: [
      {
        exerciseId: "back-squat",
        sets: [
          { reps: 5, load: 185, completed: true },
          { reps: 5, load: 185, completed: true },
          { reps: 5, load: 185, completed: true }
        ]
      }
    ]
  }
];

export function runVolumeTests(): void {
  {
    const range = buildLastSevenDayRange(sessions);

    assert.ok(range);
    assert.equal(formatDate(range.start), "2026-04-05");
    assert.equal(formatDate(range.end), "2026-04-11");
  }

  {
    const volumes = calculateMuscleGroupVolume(program, sessions, {
      start: new Date("2026-04-05T00:00:00.000Z"),
      end: new Date("2026-04-12T23:59:59.999Z")
    });

    const chest = volumes.find((entry) => entry.muscleGroup === "chest");
    const shoulders = volumes.find((entry) => entry.muscleGroup === "shoulders");
    const core = volumes.find((entry) => entry.muscleGroup === "core");

    assert.ok(chest);
    assert.equal(chest.completedSets, 3);
    assert.equal(chest.completedReps, 24);
    assert.equal(chest.totalLoad, 3240);

    assert.ok(shoulders);
    assert.equal(shoulders.completedSets, 5);

    assert.ok(core);
    assert.equal(core.completedSets, 3);
  }

  {
    const volumes = calculateMuscleGroupVolume(program, sessions, {
      start: new Date("2026-04-11T00:00:00.000Z"),
      end: new Date("2026-04-11T23:59:59.999Z")
    });

    assert.equal(volumes.some((entry) => entry.muscleGroup === "chest"), false);
    assert.equal(volumes.some((entry) => entry.muscleGroup === "quads"), true);
  }
}
