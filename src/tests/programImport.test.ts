import assert from "node:assert/strict";
import { parseProgramText } from "../importers/programText";

export function runProgramImportTests(): void {
  {
    const program = parseProgramText(`
Program: LoadIQ Import
Split: Push / Pull / Legs
SessionsPerWeek: 5

Day: push-a | Push A
Exercise: bench-press | Bench Press | chest,shoulders,triceps | 3 | 5-8 | 5
Exercise: incline-press | Incline Press | chest,shoulders,triceps | 3 | 8-12 | 5
`);

    assert.equal(program.name, "LoadIQ Import");
    assert.equal(program.sessionsPerWeek, 5);
    assert.equal(program.days.length, 1);
    assert.equal(program.days[0].exercises.length, 2);
    assert.equal(program.days[0].exercises[1].repRange.max, 12);
  }

  assert.throws(
    () =>
      parseProgramText(`
Program: Broken Import
Split: Upper / Lower

Day: upper-a | Upper A
Exercise: bench-press | Bench Press | chest,shoulders,triceps | 3 | 5-8 | 5
`),
    {
      message: 'Missing required header "SessionsPerWeek:".'
    }
  );
}
