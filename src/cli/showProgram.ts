import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { loadTrainingState } from "../storage/jsonStore";

export function main(): void {
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const { program } = state;

  console.log(`Program: ${program.name}`);
  console.log(`Split: ${program.split}`);
  console.log(`Sessions per week: ${program.sessionsPerWeek}`);
  console.log(`Workout days: ${program.days.length}`);

  for (const day of program.days) {
    console.log(`- ${day.id} | ${day.name}`);

    for (const exercise of day.exercises) {
      console.log(
        `  ${exercise.name}: ${exercise.targetSets} sets, ${exercise.repRange.min}-${exercise.repRange.max} reps, +${exercise.loadIncrement} load`
      );
    }
  }
}

if (require.main === module) {
  main();
}
