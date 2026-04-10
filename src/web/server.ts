import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import {
  buildCoachingSummary,
  buildSessionRecap,
  buildTrainingOutlook,
  explainNextWorkout,
  generateProgramDraft
} from "../ai/openai";
import { buildDashboardData } from "./dashboard";
import { createStarterProgram } from "../core/program";
import {
  addExerciseToDay,
  addWorkoutDay,
  parseMuscleGroups,
  removeExerciseFromDay,
  removeWorkoutDay,
  updateExerciseInDay,
  updateProgram,
  updateWorkoutDay
} from "../core/programEditor";
import {
  addWorkoutToState,
  clearAiState,
  createTrainingState,
  loadProgramTemplate,
  removeWorkoutFromState,
  removeProgramTemplate,
  saveProgramTemplate,
  updateWorkoutInState
} from "../core/state";
import { getNextSessionId, logWorkout } from "../core/logger";
import { ExercisePerformance, LoggedSet, TrainingState } from "../domain/types";
import { parseProgramText } from "../importers/programText";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";
import { validateTrainingState } from "../validation/state";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3000);
const WEB_ROOT = join(process.cwd(), "web");

export function main(): void {
  const server = createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }));
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`LoadIQ web app running at http://${HOST}:${PORT}`);
  });
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);

  if (request.method === "GET" && url.pathname === "/api/dashboard") {
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const dashboard = buildDashboardData(state);

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(dashboard));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/ai/coach-summary") {
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const force = url.searchParams.get("force") === "1";
    const summary =
      !force && state.ai?.coachSummary
        ? {
            ...state.ai.coachSummary,
            lastSource: "cache" as const
          }
        : {
            ...(await buildCoachingSummary(state)),
            lastSource: "fresh" as const
          };
    persistValidatedState({
      ...state,
      ai: {
        ...state.ai,
        coachSummary: summary
      }
    });

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ summary }));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/ai/training-outlook") {
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const force = url.searchParams.get("force") === "1";
    const outlook =
      !force && state.ai?.trainingOutlook
        ? {
            ...state.ai.trainingOutlook,
            lastSource: "cache" as const
          }
        : {
            ...(await buildTrainingOutlook(state)),
            lastSource: "fresh" as const
          };
    persistValidatedState({
      ...state,
      ai: {
        ...state.ai,
        trainingOutlook: outlook
      }
    });

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ outlook }));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/ai/next-workout") {
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const dayId = url.searchParams.get("dayId");
    const force = url.searchParams.get("force") === "1";

    if (!dayId) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "dayId is required." }));
      return;
    }

    const explanation =
      !force && state.ai?.nextWorkoutExplanations?.[dayId]
        ? {
            ...state.ai.nextWorkoutExplanations[dayId],
            lastSource: "cache" as const
          }
        : {
            ...(await explainNextWorkout(state, dayId)),
            lastSource: "fresh" as const
          };
    persistValidatedState({
      ...state,
      ai: {
        ...state.ai,
        nextWorkoutExplanations: {
          ...(state.ai?.nextWorkoutExplanations ?? {}),
          [dayId]: explanation
        }
      }
    });

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ explanation }));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/ai/session-recap") {
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const sessionId = url.searchParams.get("sessionId");
    const force = url.searchParams.get("force") === "1";

    if (!sessionId) {
      response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "sessionId is required." }));
      return;
    }

    const recap =
      !force && state.ai?.sessionRecaps?.[sessionId]
        ? {
            ...state.ai.sessionRecaps[sessionId],
            lastSource: "cache" as const
          }
        : {
            ...(await buildSessionRecap(state, sessionId)),
            lastSource: "fresh" as const
          };
    persistValidatedState({
      ...state,
      ai: {
        ...state.ai,
        sessionRecaps: {
          ...(state.ai?.sessionRecaps ?? {}),
          [sessionId]: recap
        }
      }
    });

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ recap }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ai/generate-program") {
    const body = await readJsonBody(request);
    const draft = await generateProgramDraft({
      goal: String(body.goal ?? ""),
      experienceLevel: String(body.experienceLevel ?? ""),
      sessionsPerWeek: Number(body.sessionsPerWeek ?? 3),
      equipment: String(body.equipment ?? ""),
      notes: body.notes ? String(body.notes) : undefined
    });

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(draft));
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/api/ai/cache") {
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = clearAiState(state);

    persistValidatedState(nextState);

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/workouts") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const session = logWorkout({
      id: getNextSessionId(state.history),
      dayId: String(body.dayId),
      performedAt: body.performedAt ? String(body.performedAt) : new Date().toISOString(),
      exercises: normalizeExercises((body.exercises as ExercisePerformance[]) ?? [])
    });
    const nextState = clearAiState(addWorkoutToState(state, session));

    persistValidatedState(nextState);

    response.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, sessionId: session.id }));
    return;
  }

  if (request.method === "PATCH" && url.pathname === "/api/workouts") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = updateWorkoutInState(state, {
      id: String(body.id),
      dayId: String(body.dayId),
      performedAt: body.performedAt ? String(body.performedAt) : new Date().toISOString(),
      exercises: normalizeExercises((body.exercises as ExercisePerformance[]) ?? [])
    });

    persistValidatedState(clearAiState(nextState));

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/api/workouts") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = removeWorkoutFromState(state, String(body.id));

    persistValidatedState(clearAiState(nextState));

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/program") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = {
      ...state,
      program: updateProgram(state.program, {
        name: body.name ? String(body.name) : undefined,
        split: body.split ? String(body.split) : undefined,
        sessionsPerWeek: body.sessionsPerWeek === undefined ? undefined : Number(body.sessionsPerWeek)
      })
    };

    persistValidatedState(clearAiState(nextState));

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/program/save-template") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = saveProgramTemplate(state, body.name ? String(body.name) : undefined);

    persistValidatedState(nextState);

    response.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/program/load-template") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = loadProgramTemplate(
      state,
      String(body.id),
      body.resetHistory === undefined ? true : Boolean(body.resetHistory)
    );

    persistValidatedState(nextState);

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/api/program/template") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = removeProgramTemplate(state, String(body.id));

    persistValidatedState(nextState);

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/program/day") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = {
      ...state,
      program: addWorkoutDay(state.program, {
        id: String(body.id),
        name: String(body.name)
      })
    };

    persistValidatedState(clearAiState(nextState));

    response.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "PATCH" && url.pathname === "/api/program/day") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = {
      ...state,
      program: updateWorkoutDay(state.program, {
        dayId: String(body.id),
        name: body.name ? String(body.name) : undefined
      })
    };

    persistValidatedState(clearAiState(nextState));

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/api/program/day") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = {
      ...state,
      program: removeWorkoutDay(state, String(body.id))
    };

    persistValidatedState(clearAiState(nextState));

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/program/exercise") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = {
      ...state,
      program: addExerciseToDay(state.program, {
        dayId: String(body.dayId),
        exercise: {
          id: String(body.id),
          name: String(body.name),
          muscleGroups: parseMuscleGroups(String(body.muscleGroups)),
          targetSets: Number(body.targetSets),
          repRange: {
            min: Number(body.repMin),
            max: Number(body.repMax)
          },
          loadIncrement: Number(body.loadIncrement)
        }
      })
    };

    persistValidatedState(clearAiState(nextState));

    response.writeHead(201, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "PATCH" && url.pathname === "/api/program/exercise") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = {
      ...state,
      program: updateExerciseInDay(state.program, {
        dayId: String(body.dayId),
        exerciseId: String(body.id),
        name: body.name ? String(body.name) : undefined,
        muscleGroups: body.muscleGroups ? parseMuscleGroups(String(body.muscleGroups)) : undefined,
        targetSets: body.targetSets === undefined ? undefined : Number(body.targetSets),
        repMin: body.repMin === undefined ? undefined : Number(body.repMin),
        repMax: body.repMax === undefined ? undefined : Number(body.repMax),
        loadIncrement: body.loadIncrement === undefined ? undefined : Number(body.loadIncrement)
      })
    };

    persistValidatedState(clearAiState(nextState));

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/api/program/exercise") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState = {
      ...state,
      program: removeExerciseFromDay(state, String(body.dayId), String(body.id))
    };

    persistValidatedState(clearAiState(nextState));

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/program/replace") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const nextState: TrainingState = clearAiState(
      createTrainingState(
        body.program as TrainingState["program"],
        body.resetHistory ? [] : state.history,
        state.savedPrograms ?? []
      )
    );

    persistValidatedState(nextState);

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/program/import") {
    const body = await readJsonBody(request);
    const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
    const importedProgram = parseProgramText(String(body.contents));
    const nextState = createTrainingState(
      importedProgram,
      body.resetHistory ? [] : state.history,
      state.savedPrograms ?? []
    );

    persistValidatedState(nextState);

    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/app.js" || url.pathname === "/styles.css")) {
    serveStaticFile(url.pathname, response);
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function persistValidatedState(
  state: ReturnType<typeof createTrainingState>,
  save: boolean = true
): void {
  const validation = validateTrainingState(state);

  if (!validation.isValid) {
    const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");

    throw new Error(details);
  }

  if (save) {
    saveTrainingState(state);
  }
}

function normalizeExercises(exercises: ExercisePerformance[]): ExercisePerformance[] {
  return exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    sets: exercise.sets.map(normalizeSet)
  }));
}

function normalizeSet(set: LoggedSet): LoggedSet {
  return {
    reps: Number(set.reps),
    load: Number(set.load),
    completed: Boolean(set.completed)
  };
}

function serveStaticFile(pathname: string, response: ServerResponse): void {
  const fileName = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = join(WEB_ROOT, fileName);

  if (!existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const contentType = getContentType(filePath);
  const contents = readFileSync(filePath);

  response.writeHead(200, { "Content-Type": contentType });
  response.end(contents);
}

function getContentType(filePath: string): string {
  switch (extname(filePath)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    default:
      return "text/html; charset=utf-8";
  }
}

if (require.main === module) {
  main();
}
