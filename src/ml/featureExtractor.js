export const FEATURE_SET_VERSION = "1.0.0";

export const FEATURE_COLUMNS = [
  "clickRatePerMin",
  "repeatedClickCount",
  "scrollCount",
  "scrollDirectionChanges",
  "avgPointerSpeed",
  "keyPressCount",
  "navigationCount",
  "avgHesitationMs",
  "maxHesitationMs",
  "durationSec",
];

export const DATASET_COLUMNS = [
  "sessionId",
  "source",
  "label",
  ...FEATURE_COLUMNS,
];

export function calculateAverage(values) {
  if (!values || values.length === 0) {
    return 0;
  }

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

export function roundNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(decimals));
}

export function extractFeatureVectorFromStats(
  stats,
  startTimeMs
) {
  const durationSec = Math.max(
    (Date.now() - startTimeMs) / 1000,
    1
  );

  const durationMin = durationSec / 60;

  const avgHesitationMs =
    calculateAverage(stats.hesitations);

  const maxHesitationMs =
    stats.hesitations.length > 0
      ? Math.max(...stats.hesitations)
      : 0;

  const avgPointerSpeed =
    stats.pointerDurationMs > 0
      ? stats.pointerDistance /
        (stats.pointerDurationMs / 1000)
      : 0;

  return {
    clickRatePerMin: roundNumber(
      stats.clickCount / durationMin
    ),

    repeatedClickCount:
      stats.repeatedClickCount,

    scrollCount:
      stats.scrollCount,

    scrollDirectionChanges:
      stats.scrollDirectionChanges,

    avgPointerSpeed:
      roundNumber(avgPointerSpeed),

    keyPressCount:
      stats.keyPressCount,

    navigationCount:
      stats.navigationCount,

    avgHesitationMs:
      roundNumber(avgHesitationMs),

    maxHesitationMs:
      roundNumber(maxHesitationMs),

    durationSec:
      roundNumber(durationSec),
  };
}

export function createDatasetRow({
  sessionId,
  source,
  label,
  featureVector,
}) {
  return {
    sessionId,
    source,
    label,
    ...featureVector,
  };
}

export function rowsToCsv(
  rows,
  columns = DATASET_COLUMNS
) {
  const header = columns.join(",");

  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value = row[column] ?? "";

        return `"${String(value).replace(
          /"/g,
          '""'
        )}"`;
      })
      .join(",")
  );

  return [
    header,
    ...body,
  ].join("\n");
}