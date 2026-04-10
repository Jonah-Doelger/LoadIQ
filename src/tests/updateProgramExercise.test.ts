import assert from "node:assert/strict";
import { parseUpdateProgramExerciseOptions } from "../cli/updateProgramExercise";

export function runUpdateProgramExerciseTests(): void {
  {
    const options = parseUpdateProgramExerciseOptions([
      "--day",
      "upper-a",
      "--id",
      "bench-press",
      "--name",
      "Paused Bench Press",
      "--target-sets",
      "4",
      "--rep-min",
      "4",
      "--rep-max",
      "6",
      "--load-increment",
      "5"
    ]);

    assert.equal(options.dayId, "upper-a");
    assert.equal(options.id, "bench-press");
    assert.equal(options.targetSets, 4);
    assert.equal(options.repMin, 4);
    assert.equal(options.repMax, 6);
  }

  assert.throws(() => parseUpdateProgramExerciseOptions(["--day", "upper-a", "--id", "bench-press"]), {
    message: "Provide at least one exercise field to update."
  });
}
