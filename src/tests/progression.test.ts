import assert from "node:assert/strict";
import { evaluateProgression } from "../core/progression";
import { ExerciseDefinition, ExercisePerformance } from "../domain/types";

const benchPress: ExerciseDefinition = {
  id: "bench-press",
  name: "Bench Press",
  muscleGroups: ["chest", "shoulders", "triceps"],
  targetSets: 3,
  repRange: {
    min: 5,
    max: 8
  },
  loadIncrement: 5
};

export function runProgressionTests(): void {
  {
    const decision = evaluateProgression(benchPress);

    assert.equal(decision.nextLoad, 0);
    assert.equal(decision.nextReps, 5);
  }

  {
    const latestPerformance: ExercisePerformance = {
      exerciseId: "bench-press",
      sets: [
        { reps: 8, load: 135, completed: true },
        { reps: 8, load: 135, completed: true },
        { reps: 8, load: 135, completed: true }
      ]
    };

    const decision = evaluateProgression(benchPress, latestPerformance);

    assert.equal(decision.nextLoad, 140);
    assert.equal(decision.nextReps, 5);
  }

  {
    const latestPerformance: ExercisePerformance = {
      exerciseId: "bench-press",
      sets: [
        { reps: 6, load: 135, completed: true },
        { reps: 6, load: 135, completed: true },
        { reps: 6, load: 135, completed: true }
      ]
    };

    const decision = evaluateProgression(benchPress, latestPerformance);

    assert.equal(decision.nextLoad, 135);
    assert.equal(decision.nextReps, 7);
  }

  {
    const latestPerformance: ExercisePerformance = {
      exerciseId: "bench-press",
      sets: [
        { reps: 6, load: 135, completed: true },
        { reps: 6, load: 135, completed: true },
        { reps: 4, load: 135, completed: false }
      ]
    };

    const decision = evaluateProgression(benchPress, latestPerformance);

    assert.equal(decision.nextLoad, 135);
    assert.equal(decision.nextReps, 6);
  }

  {
    const latestPerformance: ExercisePerformance = {
      exerciseId: "bench-press",
      sets: [
        { reps: 4, load: 135, completed: false },
        { reps: 3, load: 135, completed: false },
        { reps: 2, load: 135, completed: false }
      ]
    };

    const decision = evaluateProgression(benchPress, latestPerformance);

    assert.equal(decision.nextLoad, 135);
    assert.equal(decision.nextReps, 5);
  }
}
