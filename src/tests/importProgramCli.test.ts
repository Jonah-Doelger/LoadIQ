import assert from "node:assert/strict";
import { parseImportProgramOptions } from "../cli/importProgram";

export function runImportProgramCliTests(): void {
  {
    const options = parseImportProgramOptions(["--file", ".\\program.txt"]);

    assert.equal(options.file, ".\\program.txt");
    assert.equal(options.resetHistory, false);
  }

  {
    const options = parseImportProgramOptions(["--file", ".\\program.txt", "--reset-history"]);

    assert.equal(options.resetHistory, true);
  }

  assert.throws(() => parseImportProgramOptions([]), {
    message: "--file is required."
  });
}
