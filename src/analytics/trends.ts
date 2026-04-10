import { ExerciseTrend, ExerciseTrendPoint, TrainingProgram, WorkoutSession } from "../domain/types";

export function buildExerciseTrends(
  program: TrainingProgram,
  sessions: WorkoutSession[]
): ExerciseTrend[] {
  const exerciseById = new Map(
    program.days.flatMap((day) => day.exercises.map((exercise) => [exercise.id, exercise] as const))
  );
  const pointsByExercise = new Map<string, ExerciseTrendPoint[]>();
  const sortedSessions = [...sessions].sort(
    (left, right) => new Date(left.performedAt).getTime() - new Date(right.performedAt).getTime()
  );

  for (const session of sortedSessions) {
    for (const performance of session.exercises) {
      const exercise = exerciseById.get(performance.exerciseId);

      if (!exercise) {
        continue;
      }

      const completedSets = performance.sets.filter((set) => set.completed);

      if (completedSets.length === 0) {
        continue;
      }

      const bestSet = completedSets.reduce((best, current) => {
        const bestEstimated = estimateOneRepMax(best.load, best.reps);
        const currentEstimated = estimateOneRepMax(current.load, current.reps);

        return currentEstimated > bestEstimated ? current : best;
      });
      const point: ExerciseTrendPoint = {
        sessionId: session.id,
        performedAt: session.performedAt,
        estimatedOneRepMax: roundToOneDecimal(estimateOneRepMax(bestSet.load, bestSet.reps)),
        completedSets: completedSets.length,
        completedReps: completedSets.reduce((total, set) => total + set.reps, 0),
        bestLoad: bestSet.load,
        bestReps: bestSet.reps
      };
      const existing = pointsByExercise.get(performance.exerciseId) ?? [];

      existing.push(point);
      pointsByExercise.set(performance.exerciseId, existing);
    }
  }

  const trends: ExerciseTrend[] = [];

  for (const [exerciseId, points] of pointsByExercise.entries()) {
    const exercise = exerciseById.get(exerciseId);

    if (!exercise) {
      continue;
    }

    const latest = points[points.length - 1];
    const previous = points.length > 1 ? points[points.length - 2] : undefined;
    const change =
      previous === undefined
        ? undefined
        : roundToOneDecimal(latest.estimatedOneRepMax - previous.estimatedOneRepMax);
    const trend: ExerciseTrend = {
      exerciseId,
      exerciseName: exercise.name,
      status: getTrendStatus(change),
      latest
    };

    if (previous) {
      trend.previous = previous;
      trend.changeInEstimatedOneRepMax = change;
    }

    trends.push(trend);
  }

  return trends.sort((left, right) => left.exerciseName.localeCompare(right.exerciseName));
}

export function estimateOneRepMax(load: number, reps: number): number {
  return load * (1 + reps / 30);
}

function getTrendStatus(change?: number): ExerciseTrend["status"] {
  if (change === undefined) {
    return "insufficient-data";
  }

  if (change > 0.5) {
    return "up";
  }

  if (change < -0.5) {
    return "down";
  }

  return "flat";
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
