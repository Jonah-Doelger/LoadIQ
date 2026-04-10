import assert from "node:assert/strict";
import { parseRemoveProgramExerciseOptions } from "../cli/removeProgramExercise";

export function runRemoveProgramExerciseTests(): void {
  {
    const options = parseRemoveProgramExerciseOptions(["--day", "upper-b", "--id", "incline-dumbbell-press"]);

    assert.equal(options.dayId, "upper-b");
    assert.equal(options.id, "incline-dumbbell-press");
  }

  assert.throws(() => parseRemoveProgramExerciseOptions(["--day", "upper-b"]), {
    message: "Both --day and --id are required."
  });
}
