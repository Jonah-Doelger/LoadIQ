export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core";

export interface SetPrescription {
  reps: number;
  load: number;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  targetSets: number;
  repRange: {
    min: number;
    max: number;
  };
  loadIncrement: number;
}

export interface WorkoutDay {
  id: string;
  name: string;
  exercises: ExerciseDefinition[];
}

export interface TrainingProgram {
  id: string;
  name: string;
  split: string;
  sessionsPerWeek: number;
  days: WorkoutDay[];
}

export interface LoggedSet {
  reps: number;
  load: number;
  completed: boolean;
}

export interface ExercisePerformance {
  exerciseId: string;
  sets: LoggedSet[];
}

export interface WorkoutSession {
  id: string;
  dayId: string;
  performedAt: string;
  exercises: ExercisePerformance[];
}

export interface AiCoachSummaryNote {
  generatedAt: string;
  lastSource?: "cache" | "fresh";
  title: string;
  summary: string;
  actionItems: string[];
}

export interface AiTrainingOutlookNote {
  generatedAt: string;
  lastSource?: "cache" | "fresh";
  title: string;
  momentum: string;
  keep: string[];
  change: string[];
  watch: string[];
}

export interface AiExerciseExplanation {
  exerciseName: string;
  explanation: string;
}

export interface AiNextWorkoutNote {
  generatedAt: string;
  dayId: string;
  lastSource?: "cache" | "fresh";
  title: string;
  overview: string;
  exerciseNotes: AiExerciseExplanation[];
  coachingCue: string;
}

export interface AiSessionRecapNote {
  generatedAt: string;
  sessionId: string;
  lastSource?: "cache" | "fresh";
  title: string;
  wins: string[];
  watchNext: string[];
  encouragement: string;
}

export interface AiNoteStore {
  coachSummary?: AiCoachSummaryNote;
  trainingOutlook?: AiTrainingOutlookNote;
  nextWorkoutExplanations?: Record<string, AiNextWorkoutNote>;
  sessionRecaps?: Record<string, AiSessionRecapNote>;
}

export interface SavedProgramTemplate {
  id: string;
  name: string;
  savedAt: string;
  program: TrainingProgram;
}

export interface TrainingState {
  program: TrainingProgram;
  history: WorkoutSession[];
  ai?: AiNoteStore;
  savedPrograms?: SavedProgramTemplate[];
}

export interface ProgressionTarget {
  exerciseId: string;
  exerciseName: string;
  sets: SetPrescription[];
  rationale: string;
}

export interface ProgressionDecision {
  exerciseId: string;
  nextLoad: number;
  nextReps: number;
  rationale: string;
}

export interface MuscleGroupVolume {
  muscleGroup: MuscleGroup;
  completedSets: number;
  completedReps: number;
  totalLoad: number;
}

export interface ExerciseTrendPoint {
  sessionId: string;
  performedAt: string;
  estimatedOneRepMax: number;
  completedSets: number;
  completedReps: number;
  bestLoad: number;
  bestReps: number;
}

export interface ExerciseTrend {
  exerciseId: string;
  exerciseName: string;
  status: "up" | "flat" | "down" | "insufficient-data";
  latest: ExerciseTrendPoint;
  previous?: ExerciseTrendPoint;
  changeInEstimatedOneRepMax?: number;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  category: "best-load" | "best-reps" | "best-estimated-1rm";
  value: number;
  sessionId: string;
  performedAt: string;
}

export interface AdherenceSummary {
  windowStart: string;
  windowEnd: string;
  completedSessions: number;
  targetSessions: number;
  adherenceRate: number;
  completedWorkoutDays: number;
  availableWorkoutDays: number;
  missedSessions: number;
}
