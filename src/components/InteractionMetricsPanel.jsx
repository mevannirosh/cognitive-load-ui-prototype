import React from "react";
import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { FEATURE_COLUMNS, rowsToCsv } from "../ml/featureExtractor";

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function convertEventsToCsv(events) {
  const headers = [
    "timestamp",
    "sessionId",
    "page",
    "adaptiveMode",
    "cognitiveLoad",
    "type",
    "targetName",
    "repeatedClick",
    "scrollY",
    "scrollDistance",
    "direction",
    "x",
    "y",
    "keyType",
  ];

  const rows = events.map((event) =>
    headers
      .map((header) => {
        const value = event[header] ?? "";
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

function convertFeatureSnapshotsToCsv(snapshots) {
  const columns = [
    "sessionId",
    "source",
    "label",
    ...FEATURE_COLUMNS,
  ];

  const rows = snapshots.map((snapshot) => ({
    sessionId: snapshot.sessionId,
    source: "human_or_demo",
    label: snapshot.cognitiveLoad,
    ...snapshot.featureVector,
  }));

  return rowsToCsv(rows, columns);
}

function MetricItem({ label, value }) {
  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 2,
        bgcolor: "#f8fafc",
        border: "1px solid #e5e7eb",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function InteractionMetricsPanel({ tracker }) {
  const metrics = tracker.metrics;

  const handleExportJson = () => {
    const payload = tracker.getExportPayload();

    downloadFile(
      `interaction-session-${payload.sessionId}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  };

  const handleExportEventsCsv = () => {
    const payload = tracker.getExportPayload();
    const csv = convertEventsToCsv(payload.events);

    downloadFile(
      `interaction-events-${payload.sessionId}.csv`,
      csv,
      "text/csv"
    );
  };

  const handleExportFeatureCsv = () => {
    const payload = tracker.getExportPayload();
    const csv = convertFeatureSnapshotsToCsv(payload.featureSnapshots);

    downloadFile(
      `feature-snapshots-${payload.sessionId}.csv`,
      csv,
      "text/csv"
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid #e5e7eb",
        bgcolor: "white",
      }}
    >
      <Typography variant="h6">Interaction Tracking</Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Captures non-intrusive behaviour and converts it into ML-ready features.
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {!metrics ? (
        <Typography variant="body2" color="text.secondary">
          Tracking metrics will appear shortly.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
          }}
        >
          <MetricItem label="Duration" value={`${metrics.durationSec}s`} />
          <MetricItem label="Clicks" value={metrics.clickCount} />
          <MetricItem label="Click Rate" value={`${metrics.clickRatePerMin}/min`} />
          <MetricItem label="Repeated Clicks" value={metrics.repeatedClickCount} />
          <MetricItem label="Scrolls" value={metrics.scrollCount} />
          <MetricItem label="Scroll Changes" value={metrics.scrollDirectionChanges} />
          <MetricItem label="Mouse Moves" value={metrics.mouseMoveCount} />
          <MetricItem label="Pointer Speed" value={metrics.avgPointerSpeed} />
          <MetricItem label="Key Events" value={metrics.keyPressCount} />
          <MetricItem label="Page Changes" value={metrics.navigationCount} />
          <MetricItem label="Avg Hesitation" value={`${metrics.avgHesitationMs}ms`} />
          <MetricItem label="Max Hesitation" value={`${metrics.maxHesitationMs}ms`} />
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Recent Events
      </Typography>

      <Stack spacing={1} sx={{ maxHeight: 180, overflow: "auto" }}>
        {tracker.recentEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No events recorded yet.
          </Typography>
        ) : (
          tracker.recentEvents.slice(0, 6).map((event) => (
            <Box
              key={event.id}
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {new Date(event.timestamp).toLocaleTimeString()} · {event.page}
              </Typography>

              <Typography variant="body2">
                {event.type}
                {event.targetName ? ` → ${event.targetName}` : ""}
              </Typography>
            </Box>
          ))
        )}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button size="small" variant="contained" onClick={handleExportJson}>
          Export JSON
        </Button>

        <Button size="small" variant="outlined" onClick={handleExportEventsCsv}>
          Events CSV
        </Button>

        <Button size="small" variant="outlined" onClick={handleExportFeatureCsv}>
          Features CSV
        </Button>

        <Button size="small" color="error" onClick={tracker.resetTracking}>
          Reset
        </Button>
      </Stack>
    </Paper>
  );
}