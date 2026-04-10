import assert from "node:assert/strict";
import { parseAddProgramDayOptions } from "../cli/addProgramDay";

export function runAddProgramDayTests(): void {
  {
    const options = parseAddProgramDayOptions(["--id", "pull-b", "--name", "Pull B"]);

    assert.equal(options.id, "pull-b");
    assert.equal(options.name, "Pull B");
  }

  assert.throws(() => parseAddProgramDayOptions(["--id", "pull-b"]), {
    message: "Both --id and --name are required."
  });
}
