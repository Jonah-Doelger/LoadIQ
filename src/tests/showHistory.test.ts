import assert from "node:assert/strict";
import { parseShowHistoryOptions } from "../cli/showHistory";

export function runShowHistoryTests(): void {
  {
    const options = parseShowHistoryOptions([]);

    assert.equal(options.limit, 10);
  }

  {
    const options = parseShowHistoryOptions(["--limit", "3"]);

    assert.equal(options.limit, 3);
  }

  assert.throws(() => parseShowHistoryOptions(["--limit", "0"]), {
    message: "--limit must be a positive integer."
  });
}
