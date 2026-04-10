import { ExerciseDefinition, TrainingProgram } from "../domain/types";
import { parseMuscleGroups } from "../core/programEditor";

export function parseProgramText(contents: string): TrainingProgram {
  const lines = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const name = readHeader(lines, "Program");
  const split = readHeader(lines, "Split");
  const sessionsPerWeek = Number(readHeader(lines, "SessionsPerWeek"));

  if (!Number.isInteger(sessionsPerWeek) || sessionsPerWeek <= 0) {
    throw new Error("SessionsPerWeek must be a positive integer.");
  }

  const days = [];
  let currentDay: TrainingProgram["days"][number] | undefined;

  for (const line of lines) {
    if (isHeader(line)) {
      continue;
    }

    if (line.startsWith("Day:")) {
      const payload = line.slice("Day:".length).trim();
      const [id, dayName] = splitParts(payload, 2, 'Day lines must look like "Day: id | Name".');

      currentDay = {
        id,
        name: dayName,
        exercises: []
      };
      days.push(currentDay);
      continue;
    }

    if (line.startsWith("Exercise:")) {
      if (!currentDay) {
        throw new Error("Exercise lines must appear after a Day line.");
      }

      currentDay.exercises.push(parseExerciseLine(line));
      continue;
    }

    throw new Error(`Unrecognized line: ${line}`);
  }

  if (days.length === 0) {
    throw new Error("Imported program must contain at least one workout day.");
  }

  return {
    id: slugify(name),
    name,
    split,
    sessionsPerWeek,
    days
  };
}

function parseExerciseLine(line: string): ExerciseDefinition {
  const payload = line.slice("Exercise:".length).trim();
  const [id, name, rawMuscleGroups, rawTargetSets, rawRepRange, rawLoadIncrement] = splitParts(
    payload,
    6,
    'Exercise lines must look like "Exercise: id | Name | chest,shoulders | 3 | 5-8 | 5".'
  );
  const targetSets = Number(rawTargetSets);
  const repRangeMatch = /^(\d+)-(\d+)$/.exec(rawRepRange);
  const loadIncrement = Number(rawLoadIncrement);

  if (!Number.isInteger(targetSets) || targetSets <= 0) {
    throw new Error(`Invalid target sets for exercise "${id}".`);
  }

  if (!repRangeMatch) {
    throw new Error(`Invalid rep range for exercise "${id}". Expected min-max.`);
  }

  if (!Number.isFinite(loadIncrement) || loadIncrement <= 0) {
    throw new Error(`Invalid load increment for exercise "${id}".`);
  }

  return {
    id,
    name,
    muscleGroups: parseMuscleGroups(rawMuscleGroups),
    targetSets,
    repRange: {
      min: Number(repRangeMatch[1]),
      max: Number(repRangeMatch[2])
    },
    loadIncrement
  };
}

function readHeader(lines: string[], key: string): string {
  const prefix = `${key}:`;
  const line = lines.find((entry) => entry.startsWith(prefix));

  if (!line) {
    throw new Error(`Missing required header "${key}:".`);
  }

  return line.slice(prefix.length).trim();
}

function isHeader(line: string): boolean {
  return line.startsWith("Program:") || line.startsWith("Split:") || line.startsWith("SessionsPerWeek:");
}

function splitParts(value: string, expectedParts: number, errorMessage: string): string[] {
  const parts = value.split("|").map((entry) => entry.trim());

  if (parts.length !== expectedParts || parts.some((entry) => entry.length === 0)) {
    throw new Error(errorMessage);
  }

  return parts;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
