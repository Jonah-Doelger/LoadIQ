import assert from "node:assert/strict";
import { parseAddProgramExerciseOptions } from "../cli/addProgramExercise";

export function runAddProgramExerciseTests(): void {
  {
    const options = parseAddProgramExerciseOptions([
      "--day",
      "upper-a",
      "--id",
      "incline-dumbbell-press",
      "--name",
      "Incline Dumbbell Press",
      "--muscle-groups",
      "chest,shoulders,triceps",
      "--target-sets",
      "3",
      "--rep-min",
      "8",
      "--rep-max",
      "12",
      "--load-increment",
      "5"
    ]);

    assert.equal(options.dayId, "upper-a");
    assert.equal(options.id, "incline-dumbbell-press");
    assert.equal(options.muscleGroups.length, 3);
    assert.equal(options.targetSets, 3);
  }

  assert.throws(
    () =>
      parseAddProgramExerciseOptions([
        "--day",
        "upper-a",
        "--id",
        "incline-dumbbell-press"
      ]),
    {
      message: "All exercise flags are required."
    }
  );
}
