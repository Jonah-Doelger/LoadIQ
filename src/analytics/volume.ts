import { MuscleGroupVolume, TrainingProgram, WorkoutSession } from "../domain/types";

interface DateRange {
  start: Date;
  end: Date;
}

export function calculateMuscleGroupVolume(
  program: TrainingProgram,
  sessions: WorkoutSession[],
  range?: DateRange
): MuscleGroupVolume[] {
  const volumeByGroup = new Map<string, MuscleGroupVolume>();
  const exerciseById = new Map(
    program.days.flatMap((day) => day.exercises.map((exercise) => [exercise.id, exercise] as const))
  );

  for (const session of sessions) {
    const performedAt = new Date(session.performedAt);

    if (range && (performedAt < range.start || performedAt > range.end)) {
      continue;
    }

    for (const performance of session.exercises) {
      const exercise = exerciseById.get(performance.exerciseId);

      if (!exercise) {
        continue;
      }

      for (const set of performance.sets) {
        if (!set.completed) {
          continue;
        }

        for (const muscleGroup of exercise.muscleGroups) {
          const current = volumeByGroup.get(muscleGroup) ?? {
            muscleGroup,
            completedSets: 0,
            completedReps: 0,
            totalLoad: 0
          };

          current.completedSets += 1;
          current.completedReps += set.reps;
          current.totalLoad += set.reps * set.load;

          volumeByGroup.set(muscleGroup, current);
        }
      }
    }
  }

  return [...volumeByGroup.values()].sort((left, right) => {
    if (right.completedSets !== left.completedSets) {
      return right.completedSets - left.completedSets;
    }

    return left.muscleGroup.localeCompare(right.muscleGroup);
  });
}

export function buildLastSevenDayRange(sessions: WorkoutSession[]): DateRange | undefined {
  if (sessions.length === 0) {
    return undefined;
  }

  const latestPerformedAt = sessions.reduce((latest, session) => {
    const performedAt = new Date(session.performedAt);
    return performedAt > latest ? performedAt : latest;
  }, new Date(sessions[0].performedAt));

  const start = new Date(latestPerformedAt);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const end = new Date(latestPerformedAt);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
