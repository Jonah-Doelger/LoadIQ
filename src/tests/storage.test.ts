import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { addWorkoutToState, createTrainingState } from "../core/state";
import { getNextSessionId, logWorkout } from "../core/logger";
import { createStarterProgram } from "../core/program";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

const TEST_DATA_PATH = "data/test-training-state.json";

export function runStorageTests(): void {
  rmSync(TEST_DATA_PATH, { force: true });

  const initialState = createTrainingState(createStarterProgram());
  const session = logWorkout({
    id: getNextSessionId(initialState.history),
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
      }
    ]
  });

  const savedState = addWorkoutToState(initialState, session);
  saveTrainingState(savedState, TEST_DATA_PATH);

  assert.equal(existsSync(TEST_DATA_PATH), true);

  const loadedState = loadTrainingState(TEST_DATA_PATH);

  assert.ok(loadedState);
  assert.equal(loadedState.program.name, initialState.program.name);
  assert.equal(loadedState.history.length, 1);
  assert.equal(loadedState.history[0].id, session.id);

  rmSync(TEST_DATA_PATH, { force: true });
}
