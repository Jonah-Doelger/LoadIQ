import { buildPersonalRecords } from "../analytics/personalRecords";
import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { loadTrainingState } from "../storage/jsonStore";

export function main(): void {
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const records = buildPersonalRecords(state.program, state.history);

  if (records.length === 0) {
    console.log("No personal records available yet.");
    return;
  }

  console.log("Personal records:");

  for (const record of records) {
    console.log(
      `- ${record.exerciseName} | ${record.category}: ${record.value} | ${record.sessionId} | ${record.performedAt}`
    );
  }
}

if (require.main === module) {
  main();
}
