import assert from "node:assert/strict";
import { buildPersonalRecords } from "../analytics/personalRecords";
import { createStarterProgram } from "../core/program";

export function runPersonalRecordTests(): void {
  const records = buildPersonalRecords(createStarterProgram(), [
    {
      id: "session-1",
      dayId: "upper-a",
      performedAt: "2026-04-09T18:00:00-05:00",
      exercises: [
        {
          exerciseId: "bench-press",
          sets: [
            { reps: 8, load: 135, completed: true },
            { reps: 5, load: 140, completed: true }
          ]
        }
      ]
    }
  ]);
  const benchLoad = records.find(
    (record) => record.exerciseId === "bench-press" && record.category === "best-load"
  );
  const benchReps = records.find(
    (record) => record.exerciseId === "bench-press" && record.category === "best-reps"
  );
  const benchE1rm = records.find(
    (record) => record.exerciseId === "bench-press" && record.category === "best-estimated-1rm"
  );

  assert.ok(benchLoad);
  assert.equal(benchLoad.value, 140);
  assert.ok(benchReps);
  assert.equal(benchReps.value, 8);
  assert.ok(benchE1rm);
  assert.equal(benchE1rm.value, 171);
}
