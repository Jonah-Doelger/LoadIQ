import { findLatestExercisePerformance } from "./logger";
import { evaluateProgression } from "./progression";
import { ProgressionTarget, TrainingProgram, WorkoutSession } from "../domain/types";

export function buildNextWorkout(
  program: TrainingProgram,
  dayId: string,
  sessions: WorkoutSession[]
): ProgressionTarget[] {
  const day = program.days.find((entry) => entry.id === dayId);

  if (!day) {
    throw new Error(`Unknown workout day: ${dayId}`);
  }

  return day.exercises.map((exercise) => {
    const latestPerformance = findLatestExercisePerformance(sessions, exercise.id);
    const decision = evaluateProgression(exercise, latestPerformance);

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: Array.from({ length: exercise.targetSets }, () => ({
        reps: decision.nextReps,
        load: decision.nextLoad
      })),
      rationale: decision.rationale
    };
  });
}
