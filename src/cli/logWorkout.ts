import { addWorkoutToState, createTrainingState } from "../core/state";
import { getNextSessionId, logWorkout } from "../core/logger";
import { buildNextWorkout } from "../core/planner";
import { createStarterProgram } from "../core/program";
import { ExercisePerformance, LoggedSet } from "../domain/types";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

interface CliOptions {
  dayId: string;
  performedAt: string;
  exercises: ExercisePerformance[];
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseCliOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const session = logWorkout({
    id: getNextSessionId(state.history),
    dayId: options.dayId,
    performedAt: options.performedAt,
    exercises: options.exercises
  });
  const nextState = addWorkoutToState(state, session);

  saveTrainingState(nextState);

  const nextWorkout = buildNextWorkout(nextState.program, options.dayId, nextState.history);

  console.log(`Saved workout ${session.id} for ${options.dayId}.`);
  console.log(`Training history now has ${nextState.history.length} session(s).`);
  console.log("Next targets:");

  for (const target of nextWorkout) {
    console.log(
      `- ${target.exerciseName}: ${target.sets.length} x ${target.sets[0].reps} @ ${target.sets[0].load} lb`
    );
    console.log(`  ${target.rationale}`);
  }
}

export function parseCliOptions(args: string[]): CliOptions {
  const dayId = readFlag(args, "--day");
  const performedAt = readFlag(args, "--performed-at") ?? new Date().toISOString();
  const rawExercises = readRepeatedFlag(args, "--exercise");

  if (!dayId) {
    throw new Error("Missing required --day value.");
  }

  if (rawExercises.length === 0) {
    throw new Error("Provide at least one --exercise entry.");
  }

  return {
    dayId,
    performedAt,
    exercises: rawExercises.map(parseExerciseEntry)
  };
}

export function parseExerciseEntry(entry: string): ExercisePerformance {
  const [exerciseId, rawSets] = entry.split("=");

  if (!exerciseId || !rawSets) {
    throw new Error(`Invalid exercise entry: ${entry}`);
  }

  return {
    exerciseId,
    sets: rawSets.split(",").map(parseSetEntry)
  };
}

export function parseSetEntry(entry: string): LoggedSet {
  const normalizedEntry = entry.trim();
  const completed = !normalizedEntry.endsWith("!");
  const cleanedEntry = completed ? normalizedEntry : normalizedEntry.slice(0, -1);
  const [repsText, loadText] = cleanedEntry.split("x");
  const reps = Number(repsText);
  const load = Number(loadText);

  if (!Number.isFinite(reps) || !Number.isFinite(load)) {
    throw new Error(`Invalid set entry: ${entry}`);
  }

  return {
    reps,
    load,
    completed
  };
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function readRepeatedFlag(args: string[], flag: string): string[] {
  const values: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag) {
      const value = args[index + 1];

      if (!value) {
        throw new Error(`Missing value for ${flag}.`);
      }

      values.push(value);
    }
  }

  return values;
}

function printHelp(): void {
  console.log("Log a workout into the saved training state.");
  console.log("");
  console.log("Usage:");
  console.log(
    "  node dist/cli/logWorkout.js --day upper-a --performed-at 2026-04-10T18:00:00-05:00 --exercise bench-press=8x135,8x135,8x135 --exercise overhead-press=5x65,5x65,4x65!"
  );
  console.log("");
  console.log("Notes:");
  console.log("  Use one --exercise flag per exercise.");
  console.log("  Format sets as reps x load, separated by commas.");
  console.log("  Add ! to mark a set as not completed, for example 4x65!.");
}

if (require.main === module) {
  main();
}
