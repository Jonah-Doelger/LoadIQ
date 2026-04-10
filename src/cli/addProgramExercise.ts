import { createStarterProgram } from "../core/program";
import { addExerciseToDay, parseMuscleGroups } from "../core/programEditor";
import { createTrainingState } from "../core/state";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

interface AddProgramExerciseOptions {
  dayId: string;
  id: string;
  name: string;
  muscleGroups: ReturnType<typeof parseMuscleGroups>;
  targetSets: number;
  repMin: number;
  repMax: number;
  loadIncrement: number;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseAddProgramExerciseOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const program = addExerciseToDay(state.program, {
    dayId: options.dayId,
    exercise: {
      id: options.id,
      name: options.name,
      muscleGroups: options.muscleGroups,
      targetSets: options.targetSets,
      repRange: {
        min: options.repMin,
        max: options.repMax
      },
      loadIncrement: options.loadIncrement
    }
  });

  saveTrainingState({
    ...state,
    program
  });

  console.log(`Added exercise "${options.id}" to "${options.dayId}".`);
}

export function parseAddProgramExerciseOptions(args: string[]): AddProgramExerciseOptions {
  const dayId = readFlag(args, "--day");
  const id = readFlag(args, "--id");
  const name = readFlag(args, "--name");
  const rawMuscleGroups = readFlag(args, "--muscle-groups");
  const rawTargetSets = readFlag(args, "--target-sets");
  const rawRepMin = readFlag(args, "--rep-min");
  const rawRepMax = readFlag(args, "--rep-max");
  const rawLoadIncrement = readFlag(args, "--load-increment");

  if (
    !dayId ||
    !id ||
    !name ||
    !rawMuscleGroups ||
    !rawTargetSets ||
    !rawRepMin ||
    !rawRepMax ||
    !rawLoadIncrement
  ) {
    throw new Error("All exercise flags are required.");
  }

  const targetSets = Number(rawTargetSets);
  const repMin = Number(rawRepMin);
  const repMax = Number(rawRepMax);
  const loadIncrement = Number(rawLoadIncrement);

  if (!Number.isInteger(targetSets) || targetSets <= 0) {
    throw new Error("--target-sets must be a positive integer.");
  }

  if (!Number.isFinite(repMin) || !Number.isFinite(repMax) || repMin <= 0 || repMax < repMin) {
    throw new Error("Rep range must be positive and ordered min <= max.");
  }

  if (!Number.isFinite(loadIncrement) || loadIncrement <= 0) {
    throw new Error("--load-increment must be a positive number.");
  }

  return {
    dayId,
    id,
    name,
    muscleGroups: parseMuscleGroups(rawMuscleGroups),
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
  console.log("Add an exercise to a saved workout day.");
  console.log("");
  console.log("Usage:");
  console.log(
    "  node dist/cli/addProgramExercise.js --day upper-a --id incline-dumbbell-press --name \"Incline Dumbbell Press\" --muscle-groups chest,shoulders,triceps --target-sets 3 --rep-min 8 --rep-max 12 --load-increment 5"
  );
}

if (require.main === module) {
  main();
}
