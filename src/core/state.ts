import { SavedProgramTemplate, TrainingProgram, TrainingState, WorkoutSession } from "../domain/types";

export function createTrainingState(
  program: TrainingProgram,
  history: WorkoutSession[] = [],
  savedPrograms: SavedProgramTemplate[] = []
): TrainingState {
  return {
    program,
    history,
    savedPrograms
  };
}

export function addWorkoutToState(
  state: TrainingState,
  session: WorkoutSession
): TrainingState {
  return {
    ...state,
    history: [...state.history, session]
  };
}

export function updateWorkoutInState(
  state: TrainingState,
  session: WorkoutSession
): TrainingState {
  const index = state.history.findIndex((entry) => entry.id === session.id);

  if (index === -1) {
    throw new Error(`Workout session "${session.id}" does not exist.`);
  }

  const history = [...state.history];
  history[index] = session;

  return {
    ...state,
    history
  };
}

export function removeWorkoutFromState(
  state: TrainingState,
  sessionId: string
): TrainingState {
  const history = state.history.filter((entry) => entry.id !== sessionId);

  if (history.length === state.history.length) {
    throw new Error(`Workout session "${sessionId}" does not exist.`);
  }

  return {
    ...state,
    history
  };
}

export function clearAiState(state: TrainingState): TrainingState {
  if (!state.ai) {
    return state;
  }

  return {
    ...state,
    ai: undefined
  };
}

export function saveProgramTemplate(state: TrainingState, name?: string): TrainingState {
  const templateName = (name?.trim() || state.program.name).trim();
  const templateId = getNextTemplateId(state.savedPrograms ?? []);
  const savedAt = new Date().toISOString();

  return {
    ...state,
    savedPrograms: [
      ...(state.savedPrograms ?? []),
      {
        id: templateId,
        name: templateName,
        savedAt,
        program: state.program
      }
    ]
  };
}

export function removeProgramTemplate(state: TrainingState, templateId: string): TrainingState {
  const savedPrograms = (state.savedPrograms ?? []).filter((template) => template.id !== templateId);

  if (savedPrograms.length === (state.savedPrograms ?? []).length) {
    throw new Error(`Saved program "${templateId}" does not exist.`);
  }

  return {
    ...state,
    savedPrograms
  };
}

export function loadProgramTemplate(
  state: TrainingState,
  templateId: string,
  resetHistory: boolean
): TrainingState {
  const template = (state.savedPrograms ?? []).find((entry) => entry.id === templateId);

  if (!template) {
    throw new Error(`Saved program "${templateId}" does not exist.`);
  }

  return {
    ...state,
    program: template.program,
    history: resetHistory ? [] : state.history,
    ai: undefined
  };
}

function getNextTemplateId(savedPrograms: SavedProgramTemplate[]): string {
  let nextIndex = savedPrograms.length + 1;
  let nextId = `saved-program-${nextIndex}`;

  while (savedPrograms.some((template) => template.id === nextId)) {
    nextIndex += 1;
    nextId = `saved-program-${nextIndex}`;
  }

  return nextId;
}
