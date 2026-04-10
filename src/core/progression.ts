import { ExerciseDefinition, ExercisePerformance, ProgressionDecision } from "../domain/types";

export function evaluateProgression(
  exercise: ExerciseDefinition,
  latestPerformance?: ExercisePerformance
): ProgressionDecision {
  if (!latestPerformance) {
    return {
      exerciseId: exercise.id,
      nextLoad: 0,
      nextReps: exercise.repRange.min,
      rationale: "No history yet. Start at the user's chosen baseline load."
    };
  }

  const attemptedSets = latestPerformance.sets;
  const completedSets = latestPerformance.sets.filter((set) => set.completed);
  const attemptedAverageLoad =
    attemptedSets.reduce((total, set) => total + set.load, 0) / Math.max(attemptedSets.length, 1);
  const allSetsCompleted = completedSets.length === exercise.targetSets;
  const topReps =
    completedSets.length > 0 ? Math.max(...completedSets.map((set) => set.reps)) : exercise.repRange.min;
  const averageLoad =
    completedSets.reduce((total, set) => total + set.load, 0) / Math.max(completedSets.length, 1);

  if (!allSetsCompleted) {
    return {
      exerciseId: exercise.id,
      nextLoad: completedSets.length > 0 ? averageLoad : attemptedAverageLoad,
      nextReps: Math.max(exercise.repRange.min, topReps),
      rationale: "Missed target work. Keep the load stable and try to complete all prescribed sets."
    };
  }

  if (topReps >= exercise.repRange.max) {
    return {
      exerciseId: exercise.id,
      nextLoad: averageLoad + exercise.loadIncrement,
      nextReps: exercise.repRange.min,
      rationale: "Rep ceiling reached. Increase load and reset reps to the bottom of the range."
    };
  }

  return {
    exerciseId: exercise.id,
    nextLoad: averageLoad,
    nextReps: topReps + 1,
    rationale: "Progress is on track. Keep load the same and add reps next session."
  };
}
