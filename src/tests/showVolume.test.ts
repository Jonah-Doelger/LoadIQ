import assert from "node:assert/strict";
import { buildRangeFromOptions, formatDate, parseShowVolumeOptions } from "../cli/showVolume";

export function runShowVolumeTests(): void {
  {
    const options = parseShowVolumeOptions(["--start", "2026-04-05", "--end", "2026-04-11"]);

    assert.equal(options.start, "2026-04-05");
    assert.equal(options.end, "2026-04-11");
  }

  {
    const range = buildRangeFromOptions("2026-04-05", "2026-04-11");

    assert.ok(range);
    assert.equal(formatDate(range.start), "2026-04-05");
    assert.equal(formatDate(range.end), "2026-04-11");
  }

  assert.throws(() => buildRangeFromOptions("2026-04-05", undefined), {
    message: "Provide both --start and --end, or omit both."
  });

  assert.throws(() => buildRangeFromOptions("2026-04-12", "2026-04-11"), {
    message: "--start must be before or equal to --end."
  });
}
