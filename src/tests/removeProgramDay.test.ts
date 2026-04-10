import assert from "node:assert/strict";
import { parseRemoveProgramDayOptions } from "../cli/removeProgramDay";

export function runRemoveProgramDayTests(): void {
  {
    const options = parseRemoveProgramDayOptions(["--id", "upper-b"]);

    assert.equal(options.id, "upper-b");
  }

  assert.throws(() => parseRemoveProgramDayOptions([]), {
    message: "--id is required."
  });
}
