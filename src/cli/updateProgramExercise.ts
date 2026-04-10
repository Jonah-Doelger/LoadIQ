import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { parseMuscleGroups, updateExerciseInDay } from "../core/programEditor";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

interface UpdateProgramExerciseOptions {
  dayId: string;
  id: string;
  name?: string;
  muscleGroups?: ReturnType<typeof parseMuscleGroups>;
  targetSets?: number;
  repMin?: number;
  repMax?: number;
  loadIncrement?: number;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseUpdateProgramExerciseOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const program = updateExerciseInDay(state.program, {
    dayId: options.dayId,
    exerciseId: options.id,
    name: options.name,
    muscleGroups: options.muscleGroups,
    targetSets: options.targetSets,
    repMin: options.repMin,
    repMax: options.repMax,
    loadIncrement: options.loadIncrement
  });

  saveTrainingState({
    ...state,
    program
  });

  console.log(`Updated exercise "${options.id}" in "${options.dayId}".`);
}

export function parseUpdateProgramExerciseOptions(args: string[]): UpdateProgramExerciseOptions {
  const dayId = readFlag(args, "--day");
  const id = readFlag(args, "--id");
  const name = readFlag(args, "--name");
  const rawMuscleGroups = readFlag(args, "--muscle-groups");
  const rawTargetSets = readFlag(args, "--target-sets");
  const rawRepMin = readFlag(args, "--rep-min");
  const rawRepMax = readFlag(args, "--rep-max");
  const rawLoadIncrement = readFlag(args, "--load-increment");

  if (!dayId || !id) {
    throw new Error("Both --day and --id are required.");
  }

  if (!name && !rawMuscleGroups && !rawTargetSets && !rawRepMin && !rawRepMax && !rawLoadIncrement) {
    throw new Error("Provide at least one exercise field to update.");
  }

  const targetSets = rawTargetSets === undefined ? undefined : Number(rawTargetSets);
  const repMin = rawRepMin === undefined ? undefined : Number(rawRepMin);
  const repMax = rawRepMax === undefined ? undefined : Number(rawRepMax);
  const loadIncrement = rawLoadIncrement === undefined ? undefined : Number(rawLoadIncrement);

  if (rawTargetSets !== undefined) {
    if (targetSets === undefined || !Number.isInteger(targetSets) || targetSets <= 0) {
      throw new Error("--target-sets must be a positive integer.");
    }
  }

  if (
    (rawRepMin !== undefined || rawRepMax !== undefined) &&
    (repMin === undefined || repMax === undefined || !Number.isFinite(repMin) || !Number.isFinite(repMax) || repMin <= 0 || repMax < repMin)
  ) {
    throw new Error("When updating rep range, provide both --rep-min and --rep-max with min <= max.");
  }

  if (rawLoadIncrement !== undefined) {
    if (loadIncrement === undefined || !Number.isFinite(loadIncrement) || loadIncrement <= 0) {
      throw new Error("--load-increment must be a positive number.");
    }
  }

  return {
    dayId,
    id,
    name,
    muscleGroups: rawMuscleGroups ? parseMuscleGroups(rawMuscleGroups) : undefined,
    targetSets,
    repMin,
    repMax,
    loadIncrement
  };
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printHelp(): void {
  console.log("Update an exercise in the saved program.");
  console.log("");
  console.log("Usage:");
  console.log(
    "  node dist/cli/updateProgramExercise.js --day upper-a --id bench-press --name \"Paused Bench Press\" --target-sets 4 --rep-min 4 --rep-max 6 --load-increment 5"
  );
}

if (require.main === module) {
  main();
}
