import assert from "node:assert/strict";
import { parseCliOptions, parseExerciseEntry, parseSetEntry } from "../cli/logWorkout";

export function runCliTests(): void {
  {
    const set = parseSetEntry("8x135");

    assert.deepEqual(set, {
      reps: 8,
      load: 135,
      completed: true
    });
  }

  {
    const set = parseSetEntry("4x65!");

    assert.deepEqual(set, {
      reps: 4,
      load: 65,
      completed: false
    });
  }

  {
    const exercise = parseExerciseEntry("bench-press=8x135,8x135,7x135!");

    assert.equal(exercise.exerciseId, "bench-press");
    assert.equal(exercise.sets.length, 3);
    assert.equal(exercise.sets[2].completed, false);
  }

  {
    const options = parseCliOptions([
      "--day",
      "upper-a",
      "--performed-at",
      "2026-04-10T18:00:00-05:00",
      "--exercise",
      "bench-press=8x135,8x135,8x135",
      "--exercise",
      "overhead-press=5x65,5x65,4x65!"
    ]);

    assert.equal(options.dayId, "upper-a");
    assert.equal(options.exercises.length, 2);
    assert.equal(options.exercises[1].sets[2].completed, false);
  }

  assert.throws(() => parseCliOptions(["--exercise", "bench-press=8x135"]), {
    message: "Missing required --day value."
  });
}
