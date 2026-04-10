import assert from "node:assert/strict";
import { parseShowAdherenceOptions } from "../cli/showAdherence";

export function runShowAdherenceTests(): void {
  {
    const options = parseShowAdherenceOptions([]);

    assert.equal(options.start, undefined);
    assert.equal(options.end, undefined);
  }

  {
    const options = parseShowAdherenceOptions(["--start", "2026-04-05", "--end", "2026-04-11"]);

    assert.equal(options.start, "2026-04-05");
    assert.equal(options.end, "2026-04-11");
  }
}
