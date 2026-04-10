import { buildExerciseTrends } from "../analytics/trends";
import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { loadTrainingState } from "../storage/jsonStore";

export function main(): void {
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const trends = buildExerciseTrends(state.program, state.history);

  if (trends.length === 0) {
    console.log("No trend data available yet.");
    return;
  }

  console.log(`Program: ${state.program.name}`);
  console.log(`Saved sessions: ${state.history.length}`);
  console.log("Exercise trends:");

  for (const trend of trends) {
    const latest = `${trend.latest.bestReps} x ${trend.latest.bestLoad} lb`;

    if (!trend.previous || trend.changeInEstimatedOneRepMax === undefined) {
      console.log(`- ${trend.exerciseName}: ${latest} | e1RM ${trend.latest.estimatedOneRepMax} | not enough history`);
      continue;
    }

    const previous = `${trend.previous.bestReps} x ${trend.previous.bestLoad} lb`;
    const changePrefix = trend.changeInEstimatedOneRepMax >= 0 ? "+" : "";

    console.log(
      `- ${trend.exerciseName}: ${trend.status} | latest ${latest} | previous ${previous} | e1RM ${trend.latest.estimatedOneRepMax} (${changePrefix}${trend.changeInEstimatedOneRepMax})`
    );
  }
}

if (require.main === module) {
  main();
}
