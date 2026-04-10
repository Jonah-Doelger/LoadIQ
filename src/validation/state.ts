import {
  ExercisePerformance,
  LoggedSet,
  TrainingState,
  ValidationIssue,
  ValidationResult,
  WorkoutSession
} from "../domain/types";

export function validateTrainingState(state: TrainingState): ValidationResult {
  const issues: ValidationIssue[] = [];

  const { dayIds, exerciseIds } = validateProgram(state.program, "program", issues);

  const sessionIds = new Set<string>();

  for (const [sessionIndex, session] of state.history.entries()) {
    validateSession(session, sessionIndex, dayIds, exerciseIds, sessionIds, issues);
  }

  validateAiState(state, dayIds, sessionIds, issues);
  validateSavedPrograms(state, issues);

  return {
    isValid: issues.length === 0,
    issues
  };
}

function validateProgram(
  program: TrainingState["program"],
  pathPrefix: string,
  issues: ValidationIssue[]
): { dayIds: Set<string>; exerciseIds: Set<string> } {
  if (!program || !program.id || program.days.length === 0) {
    issues.push({
      path: pathPrefix,
      message: "Program must exist and include at least one training day."
    });
  }

  if (!Number.isInteger(program.sessionsPerWeek) || program.sessionsPerWeek <= 0) {
    issues.push({
      path: `${pathPrefix}.sessionsPerWeek`,
      message: "Program sessionsPerWeek must be a positive integer."
    });
  }

  const dayIds = new Set<string>();
  const exerciseIds = new Set<string>();

  for (const [dayIndex, day] of program.days.entries()) {
    if (!day.id) {
      issues.push({
        path: `${pathPrefix}.days[${dayIndex}].id`,
        message: "Workout day id is required."
      });
    }

    if (dayIds.has(day.id)) {
      issues.push({
        path: `${pathPrefix}.days[${dayIndex}].id`,
        message: `Duplicate workout day id "${day.id}".`
      });
    }

    dayIds.add(day.id);

    for (const [exerciseIndex, exercise] of day.exercises.entries()) {
      if (exerciseIds.has(exercise.id)) {
        issues.push({
          path: `${pathPrefix}.days[${dayIndex}].exercises[${exerciseIndex}].id`,
          message: `Duplicate exercise id "${exercise.id}".`
        });
      }

      exerciseIds.add(exercise.id);

      if (exercise.targetSets <= 0) {
        issues.push({
          path: `${pathPrefix}.days[${dayIndex}].exercises[${exerciseIndex}].targetSets`,
          message: "Exercise targetSets must be greater than 0."
        });
      }

      if (exercise.repRange.min <= 0 || exercise.repRange.max < exercise.repRange.min) {
        issues.push({
          path: `${pathPrefix}.days[${dayIndex}].exercises[${exerciseIndex}].repRange`,
          message: "Exercise rep range must be positive and ordered min <= max."
        });
      }
    }
  }

  return { dayIds, exerciseIds };
}

function validateSavedPrograms(state: TrainingState, issues: ValidationIssue[]): void {
  const savedIds = new Set<string>();

  for (const [index, template] of (state.savedPrograms ?? []).entries()) {
    if (savedIds.has(template.id)) {
      issues.push({
        path: `savedPrograms[${index}].id`,
        message: `Duplicate saved program id "${template.id}".`
      });
    }

    savedIds.add(template.id);

    if (Number.isNaN(new Date(template.savedAt).getTime())) {
      issues.push({
        path: `savedPrograms[${index}].savedAt`,
        message: "Saved program savedAt must be a valid date."
      });
    }

    validateProgram(template.program, `savedPrograms[${index}].program`, issues);
  }
}

function validateAiState(
  state: TrainingState,
  dayIds: Set<string>,
  sessionIds: Set<string>,
  issues: ValidationIssue[]
): void {
  if (!state.ai) {
    return;
  }

  if (state.ai.nextWorkoutExplanations) {
    for (const [dayId, note] of Object.entries(state.ai.nextWorkoutExplanations)) {
      if (!dayIds.has(dayId)) {
        issues.push({
          path: `ai.nextWorkoutExplanations.${dayId}`,
          message: `Unknown workout day "${dayId}" in AI cache.`
        });
      }

      if (note.dayId !== dayId) {
        issues.push({
          path: `ai.nextWorkoutExplanations.${dayId}.dayId`,
          message: "Cached next-workout explanation dayId must match its key."
        });
      }
    }
  }

  if (state.ai.sessionRecaps) {
    for (const [sessionId, note] of Object.entries(state.ai.sessionRecaps)) {
      if (!sessionIds.has(sessionId)) {
        issues.push({
          path: `ai.sessionRecaps.${sessionId}`,
          message: `Unknown workout session "${sessionId}" in AI cache.`
        });
      }

      if (note.sessionId !== sessionId) {
        issues.push({
          path: `ai.sessionRecaps.${sessionId}.sessionId`,
          message: "Cached session recap sessionId must match its key."
        });
      }
    }
  }
}

function validateSession(
  session: WorkoutSession,
  sessionIndex: number,
  dayIds: Set<string>,
  exerciseIds: Set<string>,
  sessionIds: Set<string>,
  issues: ValidationIssue[]
): void {
  if (sessionIds.has(session.id)) {
    issues.push({
      path: `history[${sessionIndex}].id`,
      message: `Duplicate session id "${session.id}".`
    });
  }

  sessionIds.add(session.id);

  if (!dayIds.has(session.dayId)) {
    issues.push({
      path: `history[${sessionIndex}].dayId`,
      message: `Unknown workout day "${session.dayId}".`
    });
  }

  if (Number.isNaN(new Date(session.performedAt).getTime())) {
    issues.push({
      path: `history[${sessionIndex}].performedAt`,
      message: "Session performedAt must be a valid date."
    });
  }

  const seenExercises = new Set<string>();

  for (const [exerciseIndex, performance] of session.exercises.entries()) {
    validateExercisePerformance(
      performance,
      sessionIndex,
      exerciseIndex,
      exerciseIds,
      seenExercises,
      issues
    );
  }
}

function validateExercisePerformance(
  performance: ExercisePerformance,
  sessionIndex: number,
  exerciseIndex: number,
  exerciseIds: Set<string>,
  seenExercises: Set<string>,
  issues: ValidationIssue[]
): void {
  if (!exerciseIds.has(performance.exerciseId)) {
    issues.push({
      path: `history[${sessionIndex}].exercises[${exerciseIndex}].exerciseId`,
      message: `Unknown exercise "${performance.exerciseId}".`
    });
  }

  if (seenExercises.has(performance.exerciseId)) {
    issues.push({
      path: `history[${sessionIndex}].exercises[${exerciseIndex}].exerciseId`,
      message: `Exercise "${performance.exerciseId}" is logged more than once in the same session.`
    });
  }

  seenExercises.add(performance.exerciseId);

  if (performance.sets.length === 0) {
    issues.push({
      path: `history[${sessionIndex}].exercises[${exerciseIndex}].sets`,
      message: "Each logged exercise must contain at least one set."
    });
  }

  for (const [setIndex, set] of performance.sets.entries()) {
    validateSet(set, sessionIndex, exerciseIndex, setIndex, issues);
  }
}

function validateSet(
  set: LoggedSet,
  sessionIndex: number,
  exerciseIndex: number,
  setIndex: number,
  issues: ValidationIssue[]
): void {
  if (!Number.isFinite(set.reps) || set.reps <= 0) {
    issues.push({
      path: `history[${sessionIndex}].exercises[${exerciseIndex}].sets[${setIndex}].reps`,
      message: "Set reps must be a positive number."
    });
  }

  if (!Number.isFinite(set.load) || set.load < 0) {
    issues.push({
      path: `history[${sessionIndex}].exercises[${exerciseIndex}].sets[${setIndex}].load`,
      message: "Set load must be a non-negative number."
    });
  }
}
