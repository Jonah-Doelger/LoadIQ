let dashboard = null;
let editingDayId = null;
let editingExerciseKey = null;
let editingSessionId = null;
const expandedSessions = new Set();
let coachSummaryNote = null;
let nextWorkoutAiNote = null;
let trainingOutlookNote = null;
let sessionRecapNote = null;
let aiProgramDraft = null;
let selectedVolumeGroup = "";
let selectedTrendExercise = "";
let selectedRecordKey = "";
const aiUsage = {
  fresh: 0,
  cached: 0
};

async function loadDashboard() {
  const response = await fetch("/api/dashboard");
  dashboard = await response.json();
  coachSummaryNote = dashboard.ai?.coachSummary ?? null;
  trainingOutlookNote = dashboard.ai?.trainingOutlook ?? null;
  nextWorkoutAiNote = dashboard.ai?.nextWorkoutExplanations?.[dashboard.nextWorkouts[0]?.dayId] ?? null;
  sessionRecapNote = dashboard.ai?.sessionRecaps?.[dashboard.history[0]?.id] ?? null;
  aiProgramDraft = null;
  renderDashboard();
}

function renderDashboard() {
  renderSummaryStrip();
  renderProgram();
  renderAdherence();
  renderAiUsage();
  renderDayOptions();
  renderProgramStudio();
  renderProgramEditor();
  renderNextWorkout();
  renderVolume();
  renderTrends();
  renderRecords();
  renderHistory();
  renderAiPanels();
}

function renderSummaryStrip() {
  const firstWorkout = dashboard.nextWorkouts[0];
  const firstTarget = firstWorkout?.targets?.[0];
  const adherence = dashboard.adherence;

  document.getElementById("summary-program-name").textContent = dashboard.program.name;
  document.getElementById("summary-program-meta").textContent =
    `${dashboard.program.days.length} day(s) • ${dashboard.program.sessionsPerWeek} sessions/week`;

  document.getElementById("summary-next-focus").textContent =
    firstTarget ? firstTarget.exerciseName : "No target yet";
  document.getElementById("summary-next-meta").textContent =
    firstTarget ? `${firstTarget.sets.length} x ${firstTarget.sets[0].reps} @ ${firstTarget.sets[0].load}` : "Log a workout to generate targets";

  document.getElementById("summary-adherence-rate").textContent =
    adherence ? `${adherence.adherenceRate}%` : "No data";
  document.getElementById("summary-adherence-meta").textContent =
    adherence ? `${adherence.completedSessions}/${adherence.targetSessions} sessions in window` : "Need saved sessions";
}

function renderProgram() {
  const el = document.getElementById("program-summary");
  const daysMarkup =
    dashboard.program.days.length === 0
      ? `<p class="empty-state">No workout days yet. Add one in Program Studio.</p>`
      : dashboard.program.days
          .map(
            (day) => `
              <div class="list-card">
                <strong>${day.name}</strong>
                <div class="muted">${day.id}</div>
                <div>${day.exercises.length} exercise(s)</div>
              </div>
            `
          )
          .join("");
  el.innerHTML = `
    <div class="stack">
      <div><span class="pill">${dashboard.program.split}</span><span class="pill">${dashboard.program.sessionsPerWeek} sessions / week</span></div>
      <div class="muted">${dashboard.program.days.length} workout day(s)</div>
      ${daysMarkup}
    </div>
  `;
}

function renderAdherence() {
  const el = document.getElementById("adherence-summary");
  const adherence = dashboard.adherence;

  if (!adherence) {
    el.innerHTML = `<p class="empty-state">No adherence data yet. Log some sessions to establish a weekly pattern.</p>`;
    return;
  }

  el.innerHTML = `
    <div class="stack">
      <div><strong>${adherence.adherenceRate}%</strong> adherence</div>
      <div class="muted">${adherence.completedSessions} of ${adherence.targetSessions} sessions in ${adherence.windowStart} to ${adherence.windowEnd}</div>
      <div class="muted">${adherence.completedWorkoutDays} of ${adherence.availableWorkoutDays} workout days covered</div>
    </div>
  `;
}

function renderAiUsage() {
  const el = document.getElementById("ai-usage-summary");
  const total = aiUsage.fresh + aiUsage.cached;

  el.innerHTML = `
    <div class="grid usage-grid">
      <div class="list-card">
        <strong>${aiUsage.fresh}</strong>
        <div>Fresh generations</div>
        <div class="muted">New API-backed outputs this session</div>
      </div>
      <div class="list-card">
        <strong>${aiUsage.cached}</strong>
        <div>Cached reuses</div>
        <div class="muted">Saved notes reused instead of regenerating</div>
      </div>
      <div class="list-card">
        <strong>${total}</strong>
        <div>Total AI interactions</div>
        <div class="muted">Current browser session only</div>
      </div>
    </div>
  `;
}

function renderDayOptions() {
  const select = document.getElementById("day-select");
  const exerciseDaySelect = document.getElementById("exercise-day");
  const options = dashboard.nextWorkouts
    .map((entry) => `<option value="${entry.dayId}">${entry.dayName}</option>`)
    .join("");

  select.innerHTML = options;
  exerciseDaySelect.innerHTML = options;

  if (!document.getElementById("performed-at").value) {
    document.getElementById("performed-at").value = new Date().toISOString().slice(0, 16);
  }

  select.onchange = () => renderNextWorkout();
  renderExerciseEditor();
}

function renderProgramStudio() {
  document.getElementById("program-name").value = dashboard.program.name;
  document.getElementById("program-split").value = dashboard.program.split;
  document.getElementById("program-frequency").value = dashboard.program.sessionsPerWeek;
  document.getElementById("import-text").value = buildImportTemplate();

  if (!document.getElementById("ai-goal").value) {
    document.getElementById("ai-goal").value = "Build muscle and strength";
  }

  if (!document.getElementById("ai-equipment").value) {
    document.getElementById("ai-equipment").value = "Full gym";
  }

  renderAiProgramDraft();
  renderSavedPlans();
  document.getElementById("import-file-status").textContent = "Supported now: text and CSV. PDF and Excel uploads will prompt you to convert or paste extracted text.";
}

function renderProgramEditor() {
  const el = document.getElementById("program-editor-list");
  el.innerHTML = `
    <div class="editor-stack">
      ${dashboard.program.days
        .map(
          (day) => `
            <div class="list-card">
              <strong>${day.name}</strong>
              <div class="muted">${day.id}</div>
              <div class="row-actions">
                <button class="secondary" onclick="startDayEdit('${day.id}', '${escapeValue(day.name)}')">Rename Day</button>
                <button class="danger" onclick="removeDay('${day.id}')">Remove Day</button>
              </div>
              <div class="editor-stack">
                ${day.exercises
                  .map(
                    (exercise) => `
                      <div class="list-card">
                        <strong>${exercise.name}</strong>
                        <div class="muted">${exercise.id}</div>
                        <div>${exercise.targetSets} sets, ${exercise.repRange.min}-${exercise.repRange.max} reps, +${exercise.loadIncrement}</div>
                        <div class="row-actions">
                          <button class="secondary" onclick="startExerciseEdit('${day.id}', '${exercise.id}', '${escapeValue(exercise.name)}', '${exercise.muscleGroups.join(",")}', ${exercise.targetSets}, ${exercise.repRange.min}, ${exercise.repRange.max}, ${exercise.loadIncrement})">Edit Exercise</button>
                          <button class="danger" onclick="removeExercise('${day.id}', '${exercise.id}')">Remove Exercise</button>
                        </div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;

  document.getElementById("edit-day-form").classList.toggle("hidden", editingDayId === null);
  document.getElementById("edit-exercise-form").classList.toggle("hidden", editingExerciseKey === null);
}

function ensureDashboardAiStore() {
  if (!dashboard.ai) {
    dashboard.ai = {};
  }

  return dashboard.ai;
}

function renderAiPanels() {
  const coachSummary = document.getElementById("coach-summary");
  const nextWorkoutAi = document.getElementById("next-workout-ai");
  const trainingOutlook = document.getElementById("training-outlook");
  const sessionRecap = document.getElementById("session-recap");
  const coachSummaryButton = document.getElementById("coach-summary-button");
  const trainingOutlookButton = document.getElementById("training-outlook-button");
  const nextWorkoutButton = document.getElementById("next-workout-ai-button");
  const sessionRecapButton = document.getElementById("session-recap-button");

  coachSummary.innerHTML = coachSummaryNote
    ? `
        <div class="stack">
          <strong>${coachSummaryNote.title}</strong>
          <div class="muted ai-meta">
            <span class="ai-badge ${coachSummaryNote.lastSource === "fresh" ? "fresh" : "cache"}">
              ${coachSummaryNote.lastSource === "fresh" ? "Fresh" : "Cached"}
            </span>
            Generated ${formatGeneratedAt(coachSummaryNote.generatedAt)}
          </div>
          <p>${coachSummaryNote.summary}</p>
          ${renderAiList("Action", coachSummaryNote.actionItems)}
        </div>
      `
    : `<p class="muted">Generate a summary when you want a quick read on momentum, focus, and consistency.</p>`;

  trainingOutlook.innerHTML = trainingOutlookNote
    ? `
        <div class="stack">
          <strong>${trainingOutlookNote.title}</strong>
          <div class="muted ai-meta">
            <span class="ai-badge ${trainingOutlookNote.lastSource === "fresh" ? "fresh" : "cache"}">
              ${trainingOutlookNote.lastSource === "fresh" ? "Fresh" : "Cached"}
            </span>
            Generated ${formatGeneratedAt(trainingOutlookNote.generatedAt)}
          </div>
          <p>${trainingOutlookNote.momentum}</p>
          ${renderAiList("Keep", trainingOutlookNote.keep)}
          ${renderAiList("Change", trainingOutlookNote.change)}
          ${renderAiList("Watch", trainingOutlookNote.watch)}
        </div>
      `
    : `<p class="muted">Generate an outlook when you want a week-level coaching read instead of a single-session note.</p>`;

  nextWorkoutAi.innerHTML = nextWorkoutAiNote
    ? `
        <div class="stack">
          <strong>${nextWorkoutAiNote.title}</strong>
          <div class="muted ai-meta">
            <span class="ai-badge ${nextWorkoutAiNote.lastSource === "fresh" ? "fresh" : "cache"}">
              ${nextWorkoutAiNote.lastSource === "fresh" ? "Fresh" : "Cached"}
            </span>
            Generated ${formatGeneratedAt(nextWorkoutAiNote.generatedAt)}
          </div>
          <p>${nextWorkoutAiNote.overview}</p>
          <div class="stack">
            ${nextWorkoutAiNote.exerciseNotes
              .map(
                (note) => `
                  <div class="list-card">
                    <strong>${note.exerciseName}</strong>
                    <div>${note.explanation}</div>
                  </div>
                `
              )
              .join("")}
          </div>
          <div class="muted"><strong>Cue:</strong> ${nextWorkoutAiNote.coachingCue}</div>
        </div>
      `
    : `<p class="muted">Choose a day in Workout Log, then generate a coaching explanation here.</p>`;

  sessionRecap.innerHTML = sessionRecapNote
    ? `
        <div class="stack">
          <strong>${sessionRecapNote.title}</strong>
          <div class="muted ai-meta">
            <span class="ai-badge ${sessionRecapNote.lastSource === "fresh" ? "fresh" : "cache"}">
              ${sessionRecapNote.lastSource === "fresh" ? "Fresh" : "Cached"}
            </span>
            Generated ${formatGeneratedAt(sessionRecapNote.generatedAt)}
          </div>
          ${renderAiList("Wins", sessionRecapNote.wins)}
          ${renderAiList("Watch Next", sessionRecapNote.watchNext)}
          <p class="muted">${sessionRecapNote.encouragement}</p>
        </div>
      `
    : `<p class="muted">Save a workout, then generate a recap for the latest session.</p>`;

  if (coachSummaryButton) {
    coachSummaryButton.textContent = coachSummaryNote ? "Regenerate Summary" : "Generate Summary";
  }

  if (trainingOutlookButton) {
    trainingOutlookButton.textContent = trainingOutlookNote ? "Regenerate Outlook" : "Generate Outlook";
  }

  if (nextWorkoutButton) {
    nextWorkoutButton.textContent = nextWorkoutAiNote ? "Regenerate Explanation" : "Explain Next Workout";
  }

  if (sessionRecapButton) {
    sessionRecapButton.textContent = sessionRecapNote ? "Regenerate Session Recap" : "Generate Latest Session Recap";
  }
}

function renderAiProgramDraft() {
  const preview = document.getElementById("ai-program-preview");
  const applyButton = document.getElementById("apply-ai-program-button");

  if (!aiProgramDraft) {
    preview.innerHTML = `<p class="muted">Generate a plan to preview it here.</p>`;
    applyButton.disabled = true;
    return;
  }

  preview.innerHTML = `
    <div class="stack">
      <strong>${aiProgramDraft.program.name}</strong>
      <div class="muted">${aiProgramDraft.program.split} • ${aiProgramDraft.program.sessionsPerWeek} sessions/week</div>
      <p>${aiProgramDraft.summary}</p>
      ${renderAiList("Principles", aiProgramDraft.principles)}
      <div class="stack">
        ${aiProgramDraft.program.days
          .map(
            (day) => `
              <div class="list-card">
                <strong>${day.name}</strong>
                <div class="muted">${day.exercises.length} exercise(s)</div>
                <div class="stack compact-stack">
                  ${day.exercises
                    .map(
                      (exercise) => `
                        <div>
                          ${exercise.name}: ${exercise.targetSets} sets, ${exercise.repRange.min}-${exercise.repRange.max} reps
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
  applyButton.disabled = false;
}

function renderSavedPlans() {
  const el = document.getElementById("saved-plan-list");
  const templates = dashboard.savedPrograms ?? [];

  el.innerHTML = templates.length === 0
    ? `<p class="empty-state">No saved plans yet. Save the current plan when you want to keep a reusable template.</p>`
    : `
        <div class="stack">
          ${templates
            .map(
              (template) => `
                <div class="list-card">
                  <strong>${template.name}</strong>
                  <div class="muted">Saved ${formatGeneratedAt(template.savedAt)}</div>
                  <div>${template.program.split} • ${template.program.sessionsPerWeek} sessions/week • ${template.program.days.length} day(s)</div>
                  <div class="row-actions">
                    <button class="secondary" onclick="loadSavedPlan('${template.id}')">Load Plan</button>
                    <button class="danger" onclick="removeSavedPlan('${template.id}')">Remove</button>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      `;
}

function renderAiList(label, items) {
  if (!items || items.length === 0) {
    return "";
  }

  return `
    <div class="stack">
      <strong>${label}</strong>
      <ul class="ai-list">
        ${items.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;
}

function setButtonLoading(buttonId, isLoading, idleLabel, loadingLabel) {
  const button = document.getElementById(buttonId);

  if (!button) {
    return;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? loadingLabel : idleLabel;
}

function trackAiUsage(note) {
  if (!note?.lastSource) {
    return;
  }

  if (note.lastSource === "fresh") {
    aiUsage.fresh += 1;
  } else if (note.lastSource === "cache") {
    aiUsage.cached += 1;
  }

  renderAiUsage();
}

function renderLoadingState(message) {
  return `
    <div class="ai-loading">
      <span class="ai-spinner" aria-hidden="true"></span>
      <span class="muted">${message}</span>
    </div>
  `;
}

function formatGeneratedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "just now";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function currentWorkout() {
  const dayId = document.getElementById("day-select").value;
  return dashboard.nextWorkouts.find((entry) => entry.dayId === dayId);
}

function renderNextWorkout() {
  const workout = currentWorkout();
  const el = document.getElementById("next-workout");

  if (!workout) {
    el.innerHTML = `<p class="empty-state">Select a day to inspect the next workout.</p>`;
    return;
  }

  el.innerHTML = `
    <div class="exercise-stack">
      ${workout.targets
        .map(
          (target) => `
            <div class="list-card">
              <strong>${target.exerciseName}</strong>
              <div>${target.sets.length} x ${target.sets[0].reps} @ ${target.sets[0].load}</div>
              <div class="muted">${target.rationale}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;

  renderExerciseEditor();
  nextWorkoutAiNote = dashboard.ai?.nextWorkoutExplanations?.[workout.dayId] ?? null;
  renderAiPanels();
}

function renderExerciseEditor() {
  const workout = currentWorkout();
  const el = document.getElementById("exercise-editor");

  if (!workout) {
    el.innerHTML = `<p class="empty-state">Choose a day to populate the workout editor.</p>`;
    return;
  }

  el.innerHTML = workout.targets
    .map(
      (target) => `
        <div class="exercise-card" data-exercise-id="${target.exerciseId}">
          <strong>${target.exerciseName}</strong>
          <div class="muted">${target.rationale}</div>
          <div class="set-grid">
            ${target.sets
              .map(
                (set, index) => `
                  <div class="set-row">
                    <label>Set ${index + 1} Reps <input type="number" min="1" class="set-reps" value="${set.reps}" /></label>
                    <label>Load <input type="number" min="0" step="0.5" class="set-load" value="${set.load}" /></label>
                    <label>Completed
                      <select class="set-completed">
                        <option value="true" selected>Yes</option>
                        <option value="false">No</option>
                      </select>
                    </label>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");
}

function renderVolume() {
  const sessions = getFilteredHistorySessions();
  const volume = buildVolumeFromSessions(sessions);
  const select = document.getElementById("volume-select");
  const el = document.getElementById("volume-list");

  if (volume.length === 0) {
    select.innerHTML = "";
    selectedVolumeGroup = "";
    el.innerHTML = `<p class="empty-state">No completed volume yet.</p>`;
    return;
  }

  if (!volume.some((item) => item.muscleGroup === selectedVolumeGroup)) {
    selectedVolumeGroup = volume[0].muscleGroup;
  }

  select.innerHTML = volume
    .map((item) => `<option value="${item.muscleGroup}">${capitalize(item.muscleGroup)}</option>`)
    .join("");
  select.value = selectedVolumeGroup;

  const item = volume.find((entry) => entry.muscleGroup === selectedVolumeGroup);

  el.innerHTML = !item
    ? `<p class="empty-state">No completed volume yet.</p>`
    : `
        <div class="volume-stack">
          <div class="list-card">
            <strong>${capitalize(item.muscleGroup)}</strong>
            <div>${item.completedSets} total sets</div>
            <div>${item.completedReps} total reps</div>
            <div class="muted">${item.totalLoad} lb total load</div>
          </div>
        </div>
      `;
}

function renderTrends() {
  const sessions = getFilteredHistorySessions();
  const trends = buildTrendsFromSessions(sessions);
  const select = document.getElementById("trend-select");
  const el = document.getElementById("trend-list");

  if (trends.length === 0) {
    select.innerHTML = "";
    selectedTrendExercise = "";
    el.innerHTML = `<p class="empty-state">No trend data yet.</p>`;
    return;
  }

  if (!trends.some((trend) => trend.exerciseName === selectedTrendExercise)) {
    selectedTrendExercise = trends[0].exerciseName;
  }

  select.innerHTML = trends
    .map((trend) => `<option value="${escapeAttribute(trend.exerciseName)}">${trend.exerciseName}</option>`)
    .join("");
  select.value = selectedTrendExercise;

  const trend = trends.find((entry) => entry.exerciseName === selectedTrendExercise);

  el.innerHTML = !trend
    ? `<p class="empty-state">No trend data yet.</p>`
    : `
        <div class="trend-stack">
          <div class="list-card">
            <strong>${trend.exerciseName}</strong>
            <div>${trend.status}</div>
            <div class="muted">Latest e1RM ${trend.latest.estimatedOneRepMax}</div>
          </div>
        </div>
      `;
}

function renderRecords() {
  const sessions = getFilteredHistorySessions();
  const records = buildRecordsFromSessions(sessions);
  const select = document.getElementById("record-select");
  const el = document.getElementById("record-list");

  if (records.length === 0) {
    select.innerHTML = "";
    selectedRecordKey = "";
    el.innerHTML = `<p class="empty-state">No records yet.</p>`;
    return;
  }

  if (!records.some((record) => `${record.exerciseName}:${record.category}` === selectedRecordKey)) {
    selectedRecordKey = `${records[0].exerciseName}:${records[0].category}`;
  }

  select.innerHTML = records
    .map(
      (record) => `
        <option value="${escapeAttribute(`${record.exerciseName}:${record.category}`)}">
          ${record.exerciseName} - ${record.category}
        </option>
      `
    )
    .join("");
  select.value = selectedRecordKey;

  const record = records.find((entry) => `${entry.exerciseName}:${entry.category}` === selectedRecordKey);

  el.innerHTML = !record
    ? `<p class="empty-state">No records yet.</p>`
    : `
        <div class="record-stack">
          <div class="list-card">
            <strong>${record.exerciseName}</strong>
            <div>${record.category}: ${record.value}</div>
          </div>
        </div>
      `;
}

function renderHistory() {
  const el = document.getElementById("history-list");
  const sessions = getFilteredHistorySessions();
  const completedSetCount = sessions.reduce(
    (total, session) =>
      total +
      session.exercises.reduce(
        (exerciseTotal, exercise) =>
          exerciseTotal + exercise.sets.filter((set) => set.completed).length,
        0
      ),
    0
  );

  document.getElementById("history-summary").textContent =
    sessions.length === 0
      ? "No saved sessions yet."
      : `${sessions.length} session(s), ${completedSetCount} completed set(s) shown`;
  document.getElementById("edit-session-form").classList.toggle("hidden", editingSessionId === null);

  el.innerHTML = `
    <div class="history-stack">
      ${sessions.length === 0
        ? `<p class="empty-state">No sessions saved yet.</p>`
        : sessions
        .map(
          (session) => `
            <div class="list-card history-session">
              <div class="history-header">
                <div>
                  <strong>${session.dayId}</strong>
                  <div class="muted">${session.performedAt}</div>
                  <div>${session.exercises.length} exercise(s)</div>
                </div>
                <div class="row-actions">
                  <button class="history-toggle" onclick="toggleSessionDetails('${session.id}')">
                    ${expandedSessions.has(session.id) ? "Hide sets" : "Show sets"}
                  </button>
                  <button class="secondary" onclick="startSessionEdit('${session.id}')">Edit</button>
                  <button class="danger" onclick="removeSession('${session.id}')">Delete</button>
                </div>
              </div>
              <div class="history-details ${expandedSessions.has(session.id) ? "open" : ""}">
                ${session.exercises
                  .map(
                    (exercise) => `
                      <div class="history-exercise">
                        <strong>${resolveExerciseName(exercise.exerciseId)}</strong>
                        <div class="set-badges">
                          ${exercise.sets
                            .map(
                              (set, index) => `
                                <span class="set-badge ${set.completed ? "" : "missed"}">
                                  Set ${index + 1}: ${set.reps} x ${set.load}${set.completed ? "" : " missed"}
                                </span>
                              `
                            )
                            .join("")}
                        </div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function getFilteredHistorySessions() {
  const limit = Number(document.getElementById("history-limit").value || 6);
  return dashboard.history.slice(0, limit);
}

function buildVolumeFromSessions(sessions) {
  const volumeByMuscleGroup = new Map();

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const definition = getExerciseDefinition(exercise.exerciseId);

      if (!definition) {
        continue;
      }

      const completedSets = exercise.sets.filter((set) => set.completed);

      for (const muscleGroup of definition.muscleGroups) {
        const current = volumeByMuscleGroup.get(muscleGroup) ?? {
          muscleGroup,
          completedSets: 0,
          completedReps: 0,
          totalLoad: 0
        };

        current.completedSets += completedSets.length;
        current.completedReps += completedSets.reduce((sum, set) => sum + set.reps, 0);
        current.totalLoad += completedSets.reduce((sum, set) => sum + set.reps * set.load, 0);
        volumeByMuscleGroup.set(muscleGroup, current);
      }
    }
  }

  return [...volumeByMuscleGroup.values()].sort((left, right) => left.muscleGroup.localeCompare(right.muscleGroup));
}

function buildTrendsFromSessions(sessions) {
  const pointsByExercise = new Map();

  for (const session of [...sessions].sort((left, right) => new Date(left.performedAt) - new Date(right.performedAt))) {
    for (const exercise of session.exercises) {
      const completedSets = exercise.sets.filter((set) => set.completed);

      if (completedSets.length === 0) {
        continue;
      }

      const bestSet = completedSets.reduce((best, current) => {
        const bestEstimated = estimateOneRepMax(best.load, best.reps);
        const currentEstimated = estimateOneRepMax(current.load, current.reps);
        return currentEstimated > bestEstimated ? current : best;
      });
      const points = pointsByExercise.get(exercise.exerciseId) ?? [];
      points.push({
        exerciseId: exercise.exerciseId,
        exerciseName: resolveExerciseName(exercise.exerciseId),
        estimatedOneRepMax: roundToOneDecimal(estimateOneRepMax(bestSet.load, bestSet.reps))
      });
      pointsByExercise.set(exercise.exerciseId, points);
    }
  }

  return [...pointsByExercise.values()]
    .map((points) => {
      const latest = points[points.length - 1];
      const previous = points.length > 1 ? points[points.length - 2] : undefined;
      const change = previous ? latest.estimatedOneRepMax - previous.estimatedOneRepMax : undefined;

      return {
        exerciseName: latest.exerciseName,
        latest: {
          estimatedOneRepMax: latest.estimatedOneRepMax
        },
        status:
          change === undefined ? "insufficient-data" :
          change > 0.5 ? "up" :
          change < -0.5 ? "down" :
          "flat"
      };
    })
    .sort((left, right) => left.exerciseName.localeCompare(right.exerciseName));
}

function buildRecordsFromSessions(sessions) {
  const records = [];

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const completedSets = exercise.sets.filter((set) => set.completed);

      if (completedSets.length === 0) {
        continue;
      }

      const exerciseName = resolveExerciseName(exercise.exerciseId);
      const bestLoad = Math.max(...completedSets.map((set) => set.load));
      const bestReps = Math.max(...completedSets.map((set) => set.reps));
      const bestEstimatedOneRepMax = roundToOneDecimal(
        Math.max(...completedSets.map((set) => estimateOneRepMax(set.load, set.reps)))
      );

      records.push({ exerciseName, category: "best-load", value: bestLoad });
      records.push({ exerciseName, category: "best-reps", value: bestReps });
      records.push({ exerciseName, category: "best-estimated-1rm", value: bestEstimatedOneRepMax });
    }
  }

  const byExerciseAndCategory = new Map();

  for (const record of records) {
    const key = `${record.exerciseName}:${record.category}`;
    const current = byExerciseAndCategory.get(key);

    if (!current || record.value > current.value) {
      byExerciseAndCategory.set(key, record);
    }
  }

  return [...byExerciseAndCategory.values()].sort((left, right) => left.exerciseName.localeCompare(right.exerciseName));
}

function getExerciseDefinition(exerciseId) {
  for (const day of dashboard.program.days) {
    const match = day.exercises.find((exercise) => exercise.id === exerciseId);

    if (match) {
      return match;
    }
  }

  return null;
}

function resolveExerciseName(exerciseId) {
  return getExerciseDefinition(exerciseId)?.name ?? exerciseId;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function estimateOneRepMax(load, reps) {
  return load * (1 + reps / 30);
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

document.getElementById("log-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const workout = currentWorkout();
  const status = document.getElementById("form-status");

  if (!workout) {
    status.textContent = "Select a workout day first.";
    status.className = "status error";
    return;
  }

  const cards = [...document.querySelectorAll(".exercise-card")];
  const exercises = cards.map((card) => {
    const reps = [...card.querySelectorAll(".set-reps")];
    const loads = [...card.querySelectorAll(".set-load")];
    const completed = [...card.querySelectorAll(".set-completed")];

    return {
      exerciseId: card.dataset.exerciseId,
      sets: reps.map((input, index) => ({
        reps: Number(input.value),
        load: Number(loads[index].value),
        completed: completed[index].value === "true"
      }))
    };
  });

  const response = await fetch("/api/workouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dayId: workout.dayId,
      performedAt: new Date(document.getElementById("performed-at").value).toISOString(),
      exercises
    })
  });
  const payload = await response.json();

  if (!response.ok) {
    status.textContent = payload.error ?? "Failed to save workout.";
    status.className = "status error";
    showBanner(payload.error ?? "Failed to save workout.", "error");
    return;
  }

  status.textContent = "Workout saved.";
  status.className = "status ok";
  showBanner("Workout saved.", "ok");
  await loadDashboard();
  sessionRecapNote = null;
  renderAiPanels();

  if (payload.sessionId) {
    await generateLatestSessionRecap(payload.sessionId);
  }
});

document.getElementById("program-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitJson("/api/program", {
    name: document.getElementById("program-name").value,
    split: document.getElementById("program-split").value,
    sessionsPerWeek: Number(document.getElementById("program-frequency").value)
  }, "studio-status", "Program updated.");
});

document.getElementById("day-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitJson("/api/program/day", {
    id: document.getElementById("day-id").value,
    name: document.getElementById("day-name").value
  }, "studio-status", "Workout day added.");
});

document.getElementById("exercise-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitJson("/api/program/exercise", {
    dayId: document.getElementById("exercise-day").value,
    id: document.getElementById("exercise-id").value,
    name: document.getElementById("exercise-name").value,
    muscleGroups: document.getElementById("exercise-groups").value,
    targetSets: Number(document.getElementById("exercise-sets").value),
    repMin: Number(document.getElementById("exercise-rep-min").value),
    repMax: Number(document.getElementById("exercise-rep-max").value),
    loadIncrement: Number(document.getElementById("exercise-increment").value)
  }, "studio-status", "Exercise added.");
});

document.getElementById("import-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitJson("/api/program/import", {
    contents: document.getElementById("import-text").value,
    resetHistory: document.getElementById("import-reset-history").checked
  }, "import-status", "Program imported.");
});

document.getElementById("import-file").addEventListener("change", async (event) => {
  const input = event.target;
  const file = input.files?.[0];
  const status = document.getElementById("import-file-status");

  if (!file) {
    status.textContent = "Supported now: text and CSV. PDF and Excel uploads will prompt you to convert or paste extracted text.";
    return;
  }

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".txt") || fileName.endsWith(".csv") || fileName.endsWith(".json")) {
    const contents = await file.text();
    document.getElementById("import-text").value = contents;
    status.textContent = `Loaded ${file.name} into the import text area. Review it, then import.`;
    return;
  }

  if (fileName.endsWith(".pdf") || fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
    status.textContent = `${file.name} was selected, but PDF and Excel parsing are not wired yet. Save as CSV or paste extracted text for now.`;
    return;
  }

  status.textContent = `${file.name} is not a supported import file type yet. Use text, CSV, PDF, or Excel.`;
});

document.getElementById("ai-program-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.getElementById("ai-program-status");
  const preview = document.getElementById("ai-program-preview");

  preview.innerHTML = renderLoadingState("Generating program draft. This can take 10-30 seconds.");
  setButtonLoading("apply-ai-program-button", true, "Apply Generated Program", "Apply Generated Program");
  const generateButton = document.querySelector("#ai-program-form button[type='submit']");
  if (generateButton) {
    generateButton.disabled = true;
    generateButton.textContent = "Generating Draft...";
  }

  try {
    const response = await fetch("/api/ai/generate-program", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: document.getElementById("ai-goal").value,
        experienceLevel: document.getElementById("ai-experience").value,
        sessionsPerWeek: Number(document.getElementById("ai-sessions-per-week").value),
        equipment: document.getElementById("ai-equipment").value,
        notes: document.getElementById("ai-notes").value
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to generate AI program.");
    }

    aiProgramDraft = payload;
    renderAiProgramDraft();
    status.textContent = "AI program draft ready.";
    status.className = "status ok";
    showBanner("AI program draft ready.", "ok");
  } catch (error) {
    aiProgramDraft = null;
    renderAiProgramDraft();
    status.textContent = error instanceof Error ? error.message : "Failed to generate AI program.";
    status.className = "status error";
    showBanner(status.textContent, "error");
  } finally {
    if (generateButton) {
      generateButton.disabled = false;
      generateButton.textContent = "Generate AI Program";
    }
  }
});

document.getElementById("history-limit").addEventListener("change", renderHistory);
document.getElementById("volume-select").addEventListener("change", (event) => {
  selectedVolumeGroup = event.target.value;
  renderVolume();
});
document.getElementById("trend-select").addEventListener("change", (event) => {
  selectedTrendExercise = event.target.value;
  renderTrends();
});
document.getElementById("record-select").addEventListener("change", (event) => {
  selectedRecordKey = event.target.value;
  renderRecords();
});
document.getElementById("day-select").addEventListener("change", () => {
  const dayId = document.getElementById("day-select").value;
  nextWorkoutAiNote = dashboard.ai?.nextWorkoutExplanations?.[dayId] ?? null;
  renderAiPanels();
});
document.getElementById("cancel-session-edit").addEventListener("click", () => {
  editingSessionId = null;
  renderHistory();
});
document.getElementById("cancel-day-edit").addEventListener("click", () => {
  editingDayId = null;
  renderProgramEditor();
});
document.getElementById("cancel-exercise-edit").addEventListener("click", () => {
  editingExerciseKey = null;
  renderProgramEditor();
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});
document.querySelectorAll(".subtab").forEach((button) => {
  button.addEventListener("click", () => activateSubtab(button.dataset.subtab));
});
document.getElementById("apply-ai-program-button").addEventListener("click", applyAiProgramDraft);
document.getElementById("clear-ai-cache-button").addEventListener("click", clearAiCache);
document.getElementById("save-current-plan-button").addEventListener("click", saveCurrentPlan);
document.getElementById("coach-summary-button").addEventListener("click", generateCoachSummary);
document.getElementById("training-outlook-button").addEventListener("click", generateTrainingOutlook);
document.getElementById("next-workout-ai-button").addEventListener("click", generateNextWorkoutExplanation);
document.getElementById("session-recap-button").addEventListener("click", () => generateLatestSessionRecap());

async function submitJson(url, payload, statusId, successMessage, method = "POST") {
  const status = document.getElementById(statusId);
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await response.json();
    status.textContent = errorPayload.error ?? "Request failed.";
    status.className = "status error";
    showBanner(errorPayload.error ?? "Request failed.", "error");
    return;
  }

  status.textContent = successMessage;
  status.className = "status ok";
  showBanner(successMessage, "ok");
  await loadDashboard();
}

async function applyAiProgramDraft() {
  if (!aiProgramDraft) {
    showBanner("Generate a program draft before applying it.", "error");
    return;
  }

  const resetHistory = document.getElementById("ai-apply-reset-history").checked;
  await submitJson(
    "/api/program/replace",
    { program: aiProgramDraft.program, resetHistory },
    "ai-program-status",
    "AI program applied."
  );
  aiProgramDraft = null;
  renderAiProgramDraft();
}

async function clearAiCache() {
  await submitJson("/api/ai/cache", {}, "ai-program-status", "AI notes cleared.", "DELETE");
  coachSummaryNote = null;
  trainingOutlookNote = null;
  nextWorkoutAiNote = null;
  sessionRecapNote = null;
  renderAiPanels();
}

async function saveCurrentPlan() {
  await submitJson(
    "/api/program/save-template",
    { name: dashboard.program.name },
    "saved-plan-status",
    "Current plan saved."
  );
}

async function loadSavedPlan(templateId) {
  await submitJson(
    "/api/program/load-template",
    {
      id: templateId,
      resetHistory: document.getElementById("load-template-reset-history").checked
    },
    "saved-plan-status",
    "Saved plan loaded."
  );
}

async function removeSavedPlan(templateId) {
  if (!window.confirm("Remove this saved plan?")) {
    return;
  }

  await submitJson(
    "/api/program/template",
    { id: templateId },
    "saved-plan-status",
    "Saved plan removed.",
    "DELETE"
  );
}

async function generateCoachSummary() {
  const target = document.getElementById("coach-summary");

  target.innerHTML = renderLoadingState("Generating summary. This can take a few seconds.");
  setButtonLoading(
    "coach-summary-button",
    true,
    coachSummaryNote ? "Regenerate Summary" : "Generate Summary",
    "Generating Summary..."
  );

  try {
    const response = await fetch("/api/ai/coach-summary?force=1");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to generate summary.");
    }

    coachSummaryNote = payload.summary;
    ensureDashboardAiStore().coachSummary = payload.summary;
    trackAiUsage(payload.summary);
    renderAiPanels();
  } catch (error) {
    coachSummaryNote = null;
    renderAiPanels();
    showBanner(error instanceof Error ? error.message : "Failed to generate summary.", "error");
  } finally {
    setButtonLoading(
      "coach-summary-button",
      false,
      coachSummaryNote ? "Regenerate Summary" : "Generate Summary",
      "Generating Summary..."
    );
  }
}

async function generateTrainingOutlook() {
  const target = document.getElementById("training-outlook");

  target.innerHTML = renderLoadingState("Generating outlook. This can take a few seconds.");
  setButtonLoading(
    "training-outlook-button",
    true,
    trainingOutlookNote ? "Regenerate Outlook" : "Generate Outlook",
    "Generating Outlook..."
  );

  try {
    const response = await fetch("/api/ai/training-outlook?force=1");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to generate outlook.");
    }

    trainingOutlookNote = payload.outlook;
    ensureDashboardAiStore().trainingOutlook = payload.outlook;
    trackAiUsage(payload.outlook);
    renderAiPanels();
  } catch (error) {
    trainingOutlookNote = null;
    renderAiPanels();
    showBanner(error instanceof Error ? error.message : "Failed to generate outlook.", "error");
  } finally {
    setButtonLoading(
      "training-outlook-button",
      false,
      trainingOutlookNote ? "Regenerate Outlook" : "Generate Outlook",
      "Generating Outlook..."
    );
  }
}

async function generateNextWorkoutExplanation() {
  const target = document.getElementById("next-workout-ai");
  const dayId = document.getElementById("day-select").value;

  if (!dayId) {
    showBanner("Select a workout day before generating an explanation.", "error");
    return;
  }

  target.innerHTML = renderLoadingState("Generating explanation. This can take a few seconds.");
  setButtonLoading(
    "next-workout-ai-button",
    true,
    nextWorkoutAiNote ? "Regenerate Explanation" : "Explain Next Workout",
    "Generating Explanation..."
  );

  try {
    const response = await fetch(`/api/ai/next-workout?dayId=${encodeURIComponent(dayId)}&force=1`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to explain next workout.");
    }

    nextWorkoutAiNote = payload.explanation;
    const ai = ensureDashboardAiStore();
    ai.nextWorkoutExplanations = {
      ...(ai.nextWorkoutExplanations ?? {}),
      [dayId]: payload.explanation
    };
    trackAiUsage(payload.explanation);
    renderAiPanels();
  } catch (error) {
    nextWorkoutAiNote = null;
    renderAiPanels();
    showBanner(error instanceof Error ? error.message : "Failed to explain next workout.", "error");
  } finally {
    setButtonLoading(
      "next-workout-ai-button",
      false,
      nextWorkoutAiNote ? "Regenerate Explanation" : "Explain Next Workout",
      "Generating Explanation..."
    );
  }
}

async function generateLatestSessionRecap(explicitSessionId) {
  const target = document.getElementById("session-recap");
  const sessionId = explicitSessionId ?? dashboard?.history?.[0]?.id;

  if (!sessionId) {
    showBanner("Save a workout before generating a session recap.", "error");
    return;
  }

  target.innerHTML = renderLoadingState("Generating session recap. This can take a few seconds.");
  setButtonLoading(
    "session-recap-button",
    true,
    sessionRecapNote ? "Regenerate Session Recap" : "Generate Latest Session Recap",
    "Generating Recap..."
  );

  try {
    const response = await fetch(`/api/ai/session-recap?sessionId=${encodeURIComponent(sessionId)}&force=1`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to generate session recap.");
    }

    sessionRecapNote = payload.recap;
    const ai = ensureDashboardAiStore();
    ai.sessionRecaps = {
      ...(ai.sessionRecaps ?? {}),
      [sessionId]: payload.recap
    };
    trackAiUsage(payload.recap);
    renderAiPanels();
  } catch (error) {
    sessionRecapNote = null;
    renderAiPanels();
    showBanner(error instanceof Error ? error.message : "Failed to generate session recap.", "error");
  } finally {
    setButtonLoading(
      "session-recap-button",
      false,
      sessionRecapNote ? "Regenerate Session Recap" : "Generate Latest Session Recap",
      "Generating Recap..."
    );
  }
}

function startDayEdit(dayId, currentName) {
  editingDayId = dayId;
  document.getElementById("edit-day-id").value = dayId;
  document.getElementById("edit-day-name").value = currentName;
  renderProgramEditor();
}

async function removeDay(dayId) {
  if (!window.confirm(`Remove ${dayId}?`)) {
    return;
  }

  await submitJson("/api/program/day", { id: dayId }, "editor-status", "Workout day removed.", "DELETE");
}

function startExerciseEdit(dayId, exerciseId, name, muscleGroups, targetSets, repMin, repMax, loadIncrement) {
  editingExerciseKey = `${dayId}:${exerciseId}`;
  document.getElementById("edit-exercise-day-id").value = dayId;
  document.getElementById("edit-exercise-id").value = exerciseId;
  document.getElementById("edit-exercise-name").value = name;
  document.getElementById("edit-exercise-groups").value = muscleGroups;
  document.getElementById("edit-exercise-sets").value = targetSets;
  document.getElementById("edit-exercise-rep-min").value = repMin;
  document.getElementById("edit-exercise-rep-max").value = repMax;
  document.getElementById("edit-exercise-increment").value = loadIncrement;
  renderProgramEditor();
}

async function removeExercise(dayId, exerciseId) {
  if (!window.confirm(`Remove ${exerciseId}?`)) {
    return;
  }

  await submitJson(
    "/api/program/exercise",
    { dayId, id: exerciseId },
    "editor-status",
    "Exercise removed.",
    "DELETE"
  );
}

function startSessionEdit(sessionId) {
  const session = dashboard.history.find((entry) => entry.id === sessionId);

  if (!session) {
    return;
  }

  editingSessionId = sessionId;
  document.getElementById("edit-session-id").value = session.id;
  document.getElementById("edit-session-day-id").value = session.dayId;
  document.getElementById("edit-session-performed-at").value = new Date(session.performedAt).toISOString().slice(0, 16);
  document.getElementById("edit-session-exercises").innerHTML = session.exercises
    .map(
      (exercise) => `
        <div class="history-exercise" data-session-exercise-id="${exercise.exerciseId}">
          <strong>${exercise.exerciseId}</strong>
          <div class="set-grid">
            ${exercise.sets
              .map(
                (set, index) => `
                  <div class="set-row">
                    <label>Set ${index + 1} Reps <input type="number" min="1" class="edit-set-reps" value="${set.reps}" /></label>
                    <label>Load <input type="number" min="0" step="0.5" class="edit-set-load" value="${set.load}" /></label>
                    <label>Completed
                      <select class="edit-set-completed">
                        <option value="true" ${set.completed ? "selected" : ""}>Yes</option>
                        <option value="false" ${set.completed ? "" : "selected"}>No</option>
                      </select>
                    </label>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");
  renderHistory();
}

async function removeSession(sessionId) {
  if (!window.confirm(`Delete session ${sessionId}?`)) {
    return;
  }

  await submitJson("/api/workouts", { id: sessionId }, "history-status", "Session deleted.", "DELETE");
}

function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
}

function activateSubtab(subtabName) {
  document.querySelectorAll(".subtab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.subtab === subtabName);
  });

  document.querySelectorAll(".subtab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.subpanel === subtabName);
  });
}

function escapeValue(value) {
  return String(value).replaceAll("'", "\\'");
}

function showBanner(message, tone) {
  const banner = document.getElementById("app-banner");
  banner.textContent = message;
  banner.className = `banner ${tone}`;

  window.clearTimeout(showBanner.timeoutId);
  showBanner.timeoutId = window.setTimeout(() => {
    banner.className = "banner hidden";
    banner.textContent = "";
  }, 2800);
}

function toggleSessionDetails(sessionId) {
  if (expandedSessions.has(sessionId)) {
    expandedSessions.delete(sessionId);
  } else {
    expandedSessions.add(sessionId);
  }

  renderHistory();
}

document.getElementById("edit-session-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const exerciseCards = [...document.querySelectorAll("#edit-session-exercises .history-exercise")];
  const exercises = exerciseCards.map((card) => {
    const reps = [...card.querySelectorAll(".edit-set-reps")];
    const loads = [...card.querySelectorAll(".edit-set-load")];
    const completed = [...card.querySelectorAll(".edit-set-completed")];

    return {
      exerciseId: card.dataset.sessionExerciseId,
      sets: reps.map((input, index) => ({
        reps: Number(input.value),
        load: Number(loads[index].value),
        completed: completed[index].value === "true"
      }))
    };
  });

  await submitJson(
    "/api/workouts",
    {
      id: document.getElementById("edit-session-id").value,
      dayId: document.getElementById("edit-session-day-id").value,
      performedAt: new Date(document.getElementById("edit-session-performed-at").value).toISOString(),
      exercises
    },
    "history-status",
    "Session updated.",
    "PATCH"
  );
  editingSessionId = null;
  renderHistory();
});

document.getElementById("edit-day-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitJson(
    "/api/program/day",
    {
      id: document.getElementById("edit-day-id").value,
      name: document.getElementById("edit-day-name").value
    },
    "editor-status",
    "Workout day updated.",
    "PATCH"
  );
  editingDayId = null;
  renderProgramEditor();
});

document.getElementById("edit-exercise-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitJson(
    "/api/program/exercise",
    {
      dayId: document.getElementById("edit-exercise-day-id").value,
      id: document.getElementById("edit-exercise-id").value,
      name: document.getElementById("edit-exercise-name").value,
      muscleGroups: document.getElementById("edit-exercise-groups").value,
      targetSets: Number(document.getElementById("edit-exercise-sets").value),
      repMin: Number(document.getElementById("edit-exercise-rep-min").value),
      repMax: Number(document.getElementById("edit-exercise-rep-max").value),
      loadIncrement: Number(document.getElementById("edit-exercise-increment").value)
    },
    "editor-status",
    "Exercise updated.",
    "PATCH"
  );
  editingExerciseKey = null;
  renderProgramEditor();
});

function buildImportTemplate() {
  const lines = [
    `Program: ${dashboard.program.name}`,
    `Split: ${dashboard.program.split}`,
    `SessionsPerWeek: ${dashboard.program.sessionsPerWeek}`,
    ""
  ];

  for (const day of dashboard.program.days) {
    lines.push(`Day: ${day.id} | ${day.name}`);

    for (const exercise of day.exercises) {
      lines.push(
        `Exercise: ${exercise.id} | ${exercise.name} | ${exercise.muscleGroups.join(",")} | ${exercise.targetSets} | ${exercise.repRange.min}-${exercise.repRange.max} | ${exercise.loadIncrement}`
      );
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

window.startDayEdit = startDayEdit;
window.loadSavedPlan = loadSavedPlan;
window.removeDay = removeDay;
window.removeSavedPlan = removeSavedPlan;
window.startExerciseEdit = startExerciseEdit;
window.removeExercise = removeExercise;
window.startSessionEdit = startSessionEdit;
window.removeSession = removeSession;
window.toggleSessionDetails = toggleSessionDetails;

loadDashboard().catch((error) => {
  document.body.innerHTML = `<pre>${error instanceof Error ? error.message : String(error)}</pre>`;
});
