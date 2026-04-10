import assert from "node:assert/strict";
import { parseUpdateProgramOptions } from "../cli/updateProgram";

export function runUpdateProgramTests(): void {
  {
    const options = parseUpdateProgramOptions([
      "--name",
      "LoadIQ Base",
      "--split",
      "Upper / Lower",
      "--sessions-per-week",
      "4"
    ]);

    assert.equal(options.name, "LoadIQ Base");
    assert.equal(options.split, "Upper / Lower");
    assert.equal(options.sessionsPerWeek, 4);
  }

  assert.throws(() => parseUpdateProgramOptions([]), {
    message: "Provide at least one program field to update."
  });

  assert.throws(() => parseUpdateProgramOptions(["--sessions-per-week", "0"]), {
    message: "--sessions-per-week must be a positive integer."
  });
}
