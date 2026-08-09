import React from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  getLoadColor,
  getLoadLabel,
} from "../utils/adaptationUtils";


const LOAD_ORDER = [
  "low",
  "medium",
  "high",
];


function getStatusLabel(status) {
  const labels = {
    disabled: "Disabled",
    "warming-up": "Collecting interaction data",
    "waiting-for-features": "Waiting for features",
    predicting: "Predicting",
    ready: "Prediction ready",
    "low-confidence": "Low-confidence prediction",
    error: "API error",
  };

  return labels[status] || status;
}


export default function ModelInferencePanel({
  inference,
  controlMode,
}) {
  const automaticMode =
    controlMode === "automatic";

  const confidencePercent = Math.round(
    (inference.confidence || 0) * 100
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid #e5e7eb",
        bgcolor: "white",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6">
            ML Inference Engine
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Live cognitive load prediction from
            interaction features.
          </Typography>
        </Box>

        <Chip
          size="small"
          color={
            inference.apiHealth.healthy
              ? "success"
              : "error"
          }
          label={
            inference.apiHealth.healthy
              ? "API Online"
              : "API Offline"
          }
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {!automaticMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Manual demonstration mode is active.
          Select Automatic ML mode from the header
          to apply live predictions.
        </Alert>
      )}

      {inference.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {inference.error}
        </Alert>
      )}

      <Stack spacing={1.5}>
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Inference Status
          </Typography>

          <Typography variant="body2">
            {getStatusLabel(inference.status)}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Stable Cognitive Load
          </Typography>

          <Box sx={{ mt: 0.5 }}>
            {inference.stableLoad ? (
              <Chip
                color={getLoadColor(
                  inference.stableLoad
                )}
                label={getLoadLabel(
                  inference.stableLoad
                )}
              />
            ) : (
              <Chip
                variant="outlined"
                label="Not established"
              />
            )}
          </Box>
        </Box>

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Latest Raw Prediction
          </Typography>

          <Typography
            variant="body2"
            sx={{ fontWeight: 700 }}
          >
            {inference.rawPrediction
              ? getLoadLabel(
                  inference.rawPrediction
                    .predictedLoad
                )
              : "No prediction yet"}
          </Typography>
        </Box>

        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 0.5,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Prediction Confidence
            </Typography>

            <Typography variant="caption">
              {confidencePercent}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={confidencePercent}
          />
        </Box>

        <Divider />

        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800 }}
        >
          Class Probabilities
        </Typography>

        {LOAD_ORDER.map((load) => {
          const probability =
            inference.probabilities[load] || 0;

          return (
            <Box key={load}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">
                  {getLoadLabel(load)}
                </Typography>

                <Typography variant="body2">
                  {Math.round(
                    probability * 100
                  )}
                  %
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={probability * 100}
              />
            </Box>
          );
        })}

        <Divider />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: 1,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Total Predictions
            </Typography>

            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800 }}
            >
              {inference.predictionCount}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Accepted Predictions
            </Typography>

            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800 }}
            >
              {
                inference.acceptedPredictionCount
              }
            </Typography>
          </Box>
        </Box>

        {inference.lastUpdated && (
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Last prediction:{" "}
            {inference.lastUpdated.toLocaleTimeString()}
          </Typography>
        )}

        <Button
          variant="contained"
          disabled={
            inference.status === "predicting"
          }
          onClick={() =>
            inference.predictNow(true)
          }
        >
          Predict Now
        </Button>
      </Stack>
    </Paper>
  );
}