import assert from "node:assert/strict";
import { parseUpdateProgramDayOptions } from "../cli/updateProgramDay";

export function runUpdateProgramDayTests(): void {
  {
    const options = parseUpdateProgramDayOptions(["--id", "upper-a", "--name", "Upper Strength"]);

    assert.equal(options.id, "upper-a");
    assert.equal(options.name, "Upper Strength");
  }

  assert.throws(() => parseUpdateProgramDayOptions(["--id", "upper-a"]), {
    message: "Both --id and --name are required."
  });
}
