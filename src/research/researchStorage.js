const STORAGE_KEY =
  "cognitive-load-research-trials-v1";


function escapeCsv(value) {
  const normalized =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  return `"${normalized.replace(
    /"/g,
    '""'
  )}"`;
}


export function getStoredTrials() {
  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}


export function saveTrialLocally(
  trial
) {
  const existing =
    getStoredTrials();

  const index =
    existing.findIndex(
      (item) =>
        item.trialId ===
        trial.trialId
    );

  if (index >= 0) {
    existing[index] = trial;
  } else {
    existing.push(trial);
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(existing)
  );

  return existing;
}


export function clearStoredTrials() {
  window.localStorage.removeItem(
    STORAGE_KEY
  );
}


function downloadFile(
  filename,
  content,
  contentType
) {
  const blob =
    new Blob(
      [content],
      {
        type: contentType,
      }
    );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);
}


export function exportTrialsJson() {
  const trials =
    getStoredTrials();

  downloadFile(
    `research-trials-${Date.now()}.json`,

    JSON.stringify(
      trials,
      null,
      2
    ),

    "application/json"
  );
}


function flattenTrial(trial) {
  const features =
    trial.interaction
      ?.finalFeatureVector || {};

  const prediction =
    trial.predictions
      ?.summary || {};

  const nasa =
    trial.nasaTlx || {};

  return {
    trialId:
      trial.trialId,

    participantId:
      trial.participantId,

    taskSet:
      trial.taskSet,

    taskId:
      trial.taskId,

    expectedDifficulty:
      trial.expectedDifficulty,

    condition:
      trial.condition,

    prototypeVersion:
      trial.prototypeVersion,

    modelName:
      trial.model?.name || "",

    modelVersion:
      trial.model?.version || "",

    startedAt:
      trial.startedAt,

    endedAt:
      trial.endedAt,

    durationSec:
      trial.durationSec,

    taskSuccess:
      trial.outcome
        ?.taskSuccess || "",

    errorCount:
      trial.outcome
        ?.errorCount ?? "",

    clickRatePerMin:
      features.clickRatePerMin ?? "",

    repeatedClickCount:
      features.repeatedClickCount ??
      "",

    scrollCount:
      features.scrollCount ?? "",

    scrollDirectionChanges:
      features.scrollDirectionChanges ??
      "",

    avgPointerSpeed:
      features.avgPointerSpeed ?? "",

    keyPressCount:
      features.keyPressCount ?? "",

    navigationCount:
      features.navigationCount ?? "",

    avgHesitationMs:
      features.avgHesitationMs ?? "",

    maxHesitationMs:
      features.maxHesitationMs ?? "",

    predictionLowCount:
      prediction.lowCount ?? 0,

    predictionMediumCount:
      prediction.mediumCount ?? 0,

    predictionHighCount:
      prediction.highCount ?? 0,

    taskLevelPrediction:
      prediction.majorityPrediction ||
      "",

    averagePredictionConfidence:
      prediction.averageConfidence ??
      "",

    mentalDemand:
      nasa.mentalDemand ?? "",

    physicalDemand:
      nasa.physicalDemand ?? "",

    temporalDemand:
      nasa.temporalDemand ?? "",

    performance:
      nasa.performance ?? "",

    effort:
      nasa.effort ?? "",

    frustration:
      nasa.frustration ?? "",

    rawNasaTlx:
      nasa.rawScore ?? "",
  };
}


export function exportTrialsCsv() {
  const trials =
    getStoredTrials();

  if (!trials.length) {
    return false;
  }

  const rows =
    trials.map(flattenTrial);

  const columns =
    Object.keys(rows[0]);

  const csvRows = [
    columns
      .map(escapeCsv)
      .join(","),

    ...rows.map((row) =>
      columns
        .map((column) =>
          escapeCsv(
            row[column]
          )
        )
        .join(",")
    ),
  ];

  downloadFile(
    `research-trials-${Date.now()}.csv`,

    csvRows.join("\n"),

    "text/csv"
  );

  return true;
}