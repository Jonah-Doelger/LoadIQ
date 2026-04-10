import assert from "node:assert/strict";
import { parseShowNextWorkoutOptions } from "../cli/showNextWorkout";

export function runShowNextWorkoutTests(): void {
  {
    const options = parseShowNextWorkoutOptions(["--day", "upper-a"]);

    assert.equal(options.dayId, "upper-a");
  }

  assert.throws(() => parseShowNextWorkoutOptions([]), {
    message: "Missing required --day value."
  });
}
