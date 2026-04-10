import { estimateOneRepMax } from "./trends";
import { PersonalRecord, TrainingProgram, WorkoutSession } from "../domain/types";

export function buildPersonalRecords(
  program: TrainingProgram,
  sessions: WorkoutSession[]
): PersonalRecord[] {
  const exerciseById = new Map(
    program.days.flatMap((day) => day.exercises.map((exercise) => [exercise.id, exercise] as const))
  );
  const bestRecords = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    for (const performance of session.exercises) {
      const exercise = exerciseById.get(performance.exerciseId);

      if (!exercise) {
        continue;
      }

      for (const set of performance.sets) {
        if (!set.completed) {
          continue;
        }

        upsertRecord(bestRecords, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          category: "best-load",
          value: set.load,
          sessionId: session.id,
          performedAt: session.performedAt
        });
        upsertRecord(bestRecords, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          category: "best-reps",
          value: set.reps,
          sessionId: session.id,
          performedAt: session.performedAt
        });
        upsertRecord(bestRecords, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          category: "best-estimated-1rm",
          value: roundToOneDecimal(estimateOneRepMax(set.load, set.reps)),
          sessionId: session.id,
          performedAt: session.performedAt
        });
      }
    }
  }

  return [...bestRecords.values()].sort((left, right) => {
    if (left.exerciseName !== right.exerciseName) {
      return left.exerciseName.localeCompare(right.exerciseName);
    }

    return left.category.localeCompare(right.category);
  });
}

function upsertRecord(records: Map<string, PersonalRecord>, candidate: PersonalRecord): void {
  const key = `${candidate.exerciseId}:${candidate.category}`;
  const existing = records.get(key);

  if (!existing || candidate.value > existing.value) {
    records.set(key, candidate);
  }
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
