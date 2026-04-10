import {
  AiCoachSummaryNote,
  AiNextWorkoutNote,
  AiSessionRecapNote,
  AiTrainingOutlookNote,
  MuscleGroup,
  TrainingProgram,
  TrainingState
} from "../domain/types";
import { buildDashboardData } from "../web/dashboard";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core"
];

interface GeneratedProgramDraft {
  summary: string;
  principles: string[];
  program: TrainingProgram;
}

export async function buildCoachingSummary(state: TrainingState): Promise<AiCoachSummaryNote> {
  const dashboard = buildDashboardData(state);
  const nextWorkout = dashboard.nextWorkouts[0];
  const generatedAt = new Date().toISOString();
  const payload = await createStructuredAiResponse<{
    title: string;
    summary: string;
    actionItems: string[];
  }>(
    "coach_summary",
    {
      type: "object",
      additionalProperties: false,
      required: ["title", "summary", "actionItems"],
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        actionItems: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 3
        }
      }
    },
    [
      "You are LoadIQ, a concise and practical strength coach.",
      "Write a compact coaching summary for the athlete based on deterministic training data.",
      "Keep the summary to 2-3 sentences and the action items short.",
      "Do not invent context that is not present.",
      JSON.stringify({
        program: {
          name: dashboard.program.name,
          split: dashboard.program.split,
          sessionsPerWeek: dashboard.program.sessionsPerWeek
        },
        adherence: dashboard.adherence,
        topRecords: dashboard.records.slice(0, 3),
        trends: dashboard.trends.slice(0, 5),
        nextWorkout: nextWorkout
          ? {
              dayName: nextWorkout.dayName,
              targets: nextWorkout.targets.map((target) => ({
                exerciseName: target.exerciseName,
                target: describeTarget(target.sets),
                rationale: target.rationale
              }))
            }
          : null
      })
    ]
  );

  return {
    generatedAt,
    title: payload.title,
    summary: payload.summary,
    actionItems: payload.actionItems
  };
}

export async function buildTrainingOutlook(state: TrainingState): Promise<AiTrainingOutlookNote> {
  const dashboard = buildDashboardData(state);
  const generatedAt = new Date().toISOString();
  const payload = await createStructuredAiResponse<{
    title: string;
    momentum: string;
    keep: string[];
    change: string[];
    watch: string[];
  }>(
    "training_outlook",
    {
      type: "object",
      additionalProperties: false,
      required: ["title", "momentum", "keep", "change", "watch"],
      properties: {
        title: { type: "string" },
        momentum: { type: "string" },
        keep: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
        change: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
        watch: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 }
      }
    },
    [
      "You are LoadIQ, a concise and practical strength coach.",
      "Create a week-level training outlook from adherence, trends, and records.",
      "Momentum should be one short paragraph. Keep/change/watch should be short actionable bullets.",
      "Do not invent injuries, fatigue, or life context.",
      JSON.stringify({
        adherence: dashboard.adherence,
        trends: dashboard.trends.slice(0, 8),
        recentRecords: dashboard.records.slice(0, 5)
      })
    ]
  );

  return {
    generatedAt,
    title: payload.title,
    momentum: payload.momentum,
    keep: payload.keep,
    change: payload.change,
    watch: payload.watch
  };
}

export async function explainNextWorkout(
  state: TrainingState,
  dayId: string
): Promise<AiNextWorkoutNote> {
  const dashboard = buildDashboardData(state);
  const workout = dashboard.nextWorkouts.find((entry) => entry.dayId === dayId);

  if (!workout) {
    throw new Error(`Unknown workout day: ${dayId}`);
  }

  const payload = await createStructuredAiResponse<{
    title: string;
    overview: string;
    exerciseNotes: Array<{ exerciseName: string; explanation: string }>;
    coachingCue: string;
  }>(
    "next_workout_explanation",
    {
      type: "object",
      additionalProperties: false,
      required: ["title", "overview", "exerciseNotes", "coachingCue"],
      properties: {
        title: { type: "string" },
        overview: { type: "string" },
        exerciseNotes: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["exerciseName", "explanation"],
            properties: {
              exerciseName: { type: "string" },
              explanation: { type: "string" }
            }
          }
        },
        coachingCue: { type: "string" }
      }
    },
    [
      "You are LoadIQ, a concise and practical strength coach.",
      "Explain the next workout plan in plain English.",
      "Overview should be short. Exercise explanations should be one sentence each.",
      "End with one coaching cue for the session.",
      JSON.stringify({
        workoutDay: workout.dayName,
        targets: workout.targets.map((target) => ({
          exerciseName: target.exerciseName,
          target: describeTarget(target.sets),
          rationale: target.rationale
        })),
        recentTrends: dashboard.trends
          .filter((trend) => workout.targets.some((target) => target.exerciseId === trend.exerciseId))
          .map((trend) => ({
            exerciseName: trend.exerciseName,
            status: trend.status,
            latestEstimatedOneRepMax: trend.latest.estimatedOneRepMax
          }))
      })
    ]
  );

  return {
    generatedAt: new Date().toISOString(),
    dayId,
    title: payload.title,
    overview: payload.overview,
    exerciseNotes: payload.exerciseNotes,
    coachingCue: payload.coachingCue
  };
}

export async function buildSessionRecap(
  state: TrainingState,
  sessionId: string
): Promise<AiSessionRecapNote> {
  const session = state.history.find((entry) => entry.id === sessionId);

  if (!session) {
    throw new Error(`Unknown workout session: ${sessionId}`);
  }

  const day = state.program.days.find((entry) => entry.id === session.dayId);
  const exercises = session.exercises.map((performance) => {
    const definition = day?.exercises.find((exercise) => exercise.id === performance.exerciseId);
    const completedSets = performance.sets.filter((set) => set.completed);

    return {
      exerciseName: definition?.name ?? performance.exerciseId,
      completedSets: completedSets.length,
      totalSets: performance.sets.length,
      bestSet:
        completedSets.length === 0
          ? null
          : completedSets.reduce((best, current) =>
              current.load > best.load || (current.load === best.load && current.reps > best.reps)
                ? current
                : best
            )
    };
  });

  const payload = await createStructuredAiResponse<{
    title: string;
    wins: string[];
    watchNext: string[];
    encouragement: string;
  }>(
    "session_recap",
    {
      type: "object",
      additionalProperties: false,
      required: ["title", "wins", "watchNext", "encouragement"],
      properties: {
        title: { type: "string" },
        wins: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
        watchNext: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
        encouragement: { type: "string" }
      }
    },
    [
      "You are LoadIQ, a concise and practical strength coach.",
      "Create a post-workout recap using only deterministic session data.",
      "Wins and watchNext should be short bullet-like statements.",
      "Encouragement should sound steady and practical, not cheesy.",
      JSON.stringify({
        session: {
          id: session.id,
          dayId: session.dayId,
          dayName: day?.name ?? session.dayId,
          performedAt: session.performedAt,
          exercises
        }
      })
    ]
  );

  return {
    generatedAt: new Date().toISOString(),
    sessionId,
    title: payload.title,
    wins: payload.wins,
    watchNext: payload.watchNext,
    encouragement: payload.encouragement
  };
}

export async function generateProgramDraft(input: {
  goal: string;
  experienceLevel: string;
  sessionsPerWeek: number;
  equipment: string;
  notes?: string;
}): Promise<GeneratedProgramDraft> {
  const payload = await createStructuredAiResponse<{
    summary: string;
    principles: string[];
    program: {
      name: string;
      split: string;
      sessionsPerWeek: number;
      days: Array<{
        name: string;
        exercises: Array<{
          name: string;
          muscleGroups: MuscleGroup[];
          targetSets: number;
          repMin: number;
          repMax: number;
          loadIncrement: number;
        }>;
      }>;
    };
  }>(
    "generated_program",
    {
      type: "object",
      additionalProperties: false,
      required: ["summary", "principles", "program"],
      properties: {
        summary: { type: "string" },
        principles: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
        program: {
          type: "object",
          additionalProperties: false,
          required: ["name", "split", "sessionsPerWeek", "days"],
          properties: {
            name: { type: "string" },
            split: { type: "string" },
            sessionsPerWeek: { type: "integer", minimum: 1, maximum: 7 },
            days: {
              type: "array",
              minItems: 1,
              maxItems: 7,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "exercises"],
                properties: {
                  name: { type: "string" },
                  exercises: {
                    type: "array",
                    minItems: 2,
                    maxItems: 8,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: [
                        "name",
                        "muscleGroups",
                        "targetSets",
                        "repMin",
                        "repMax",
                        "loadIncrement"
                      ],
                      properties: {
                        name: { type: "string" },
                        muscleGroups: {
                          type: "array",
                          minItems: 1,
                          items: {
                            type: "string",
                            enum: MUSCLE_GROUPS
                          }
                        },
                        targetSets: { type: "integer", minimum: 1, maximum: 6 },
                        repMin: { type: "integer", minimum: 1, maximum: 20 },
                        repMax: { type: "integer", minimum: 1, maximum: 25 },
                        loadIncrement: { type: "number", minimum: 0.5, maximum: 20 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    [
      "You are LoadIQ, a practical strength coach building a deterministic beginner-friendly training plan.",
      "Design a realistic workout plan for the user input below.",
      "Keep exercise selection conventional and safe for general strength and hypertrophy training.",
      "Prefer 2-6 training days based on the requested frequency. Use clear day names and conservative progression increments.",
      "Do not include warmups, supersets, RPE, percentages, deloads, or free-text exercise prescriptions. Only the structured program.",
      JSON.stringify(input)
    ]
  );

  return {
    summary: payload.summary,
    principles: payload.principles,
    program: sanitizeTrainingProgram(payload.program)
  };
}

async function createStructuredAiResponse<T>(
  schemaName: string,
  schema: Record<string, unknown>,
  promptParts: string[]
): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Set OPENAI_API_KEY to enable AI coaching in the web app.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: promptParts.join("\n\n"),
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as {
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    output_text?: string;
  };
  const text = extractResponseText(payload);

  return JSON.parse(text) as T;
}

function extractResponseText(payload: {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  output_text?: string;
}): string {
  if (payload.output_text) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if ((content.type === "output_text" || content.type === "text") && content.text) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include structured output text.");
}

function sanitizeTrainingProgram(rawProgram: {
  name: string;
  split: string;
  sessionsPerWeek: number;
  days: Array<{
    name: string;
    exercises: Array<{
      name: string;
      muscleGroups: MuscleGroup[];
      targetSets: number;
      repMin: number;
      repMax: number;
      loadIncrement: number;
    }>;
  }>;
}): TrainingProgram {
  const usedDayIds = new Set<string>();
  const usedExerciseIds = new Set<string>();

  return {
    id: uniqueSlug(rawProgram.name, new Set<string>(["program"])).value,
    name: rawProgram.name.trim() || "AI Generated Program",
    split: rawProgram.split.trim() || "Custom Split",
    sessionsPerWeek: Math.max(1, Math.min(7, Math.round(rawProgram.sessionsPerWeek))),
    days: rawProgram.days.map((day, dayIndex) => {
      const dayId = uniqueSlug(day.name || `Day ${dayIndex + 1}`, usedDayIds, `day-${dayIndex + 1}`).value;

      return {
        id: dayId,
        name: day.name.trim() || `Day ${dayIndex + 1}`,
        exercises: day.exercises.map((exercise, exerciseIndex) => {
          const exerciseId = uniqueSlug(
            exercise.name || `exercise-${exerciseIndex + 1}`,
            usedExerciseIds,
            `exercise-${dayIndex + 1}-${exerciseIndex + 1}`
          ).value;
          const repMin = Math.max(1, Math.round(exercise.repMin));
          const repMax = Math.max(repMin, Math.round(exercise.repMax));

          return {
            id: exerciseId,
            name: exercise.name.trim() || `Exercise ${exerciseIndex + 1}`,
            muscleGroups: exercise.muscleGroups.length > 0 ? exercise.muscleGroups : ["core"],
            targetSets: Math.max(1, Math.round(exercise.targetSets)),
            repRange: {
              min: repMin,
              max: repMax
            },
            loadIncrement: Math.max(0.5, Number(exercise.loadIncrement))
          };
        })
      };
    })
  };
}

function uniqueSlug(input: string, used: Set<string>, fallback = "item"): { value: string } {
  const base = slugify(input) || fallback;
  let value = base;
  let suffix = 2;

  while (used.has(value)) {
    value = `${base}-${suffix}`;
    suffix += 1;
  }

  used.add(value);
  return { value };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function describeTarget(sets: Array<{ reps: number; load: number }>): string {
  const firstSet = sets[0];

  if (!firstSet) {
    return "No target";
  }

  return `${sets.length} x ${firstSet.reps} @ ${firstSet.load}`;
}
