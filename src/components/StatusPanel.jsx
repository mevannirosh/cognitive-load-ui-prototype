import React from "react";

import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  getAdaptationSummary,
  getLoadColor,
  getLoadLabel,
  getLoadReason,
} from "../utils/adaptationUtils";


export default function StatusPanel({
  adaptiveMode,
  cognitiveLoad,
  controlMode,
  inference,
}) {
  const automaticMode =
    controlMode === "automatic";

  const confidencePercent = Math.round(
    (inference.confidence || 0) * 100
  );

  const sourceLabel = automaticMode
    ? "Machine Learning Inference"
    : "Manual Demonstration Control";

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
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6">
            Cognitive Load Status
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Prediction source: {sourceLabel}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          {automaticMode &&
            inference.rawPrediction && (
              <Chip
                variant="outlined"
                label={`Confidence: ${confidencePercent}%`}
              />
            )}

          <Chip
            label={getLoadLabel(
              cognitiveLoad
            )}
            color={getLoadColor(
              cognitiveLoad
            )}
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          mt: 2,
          display: "grid",
          gap: 1,
        }}
      >
        {automaticMode &&
          !inference.stableLoad && (
            <Alert severity="info">
              The framework is collecting
              interaction behaviour before
              establishing a stable cognitive
              load prediction.
            </Alert>
          )}

        <Alert
          severity={
            adaptiveMode
              ? "info"
              : "warning"
          }
        >
          {getAdaptationSummary(
            cognitiveLoad,
            adaptiveMode
          )}
        </Alert>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          <strong>Interpretation:</strong>{" "}
          {getLoadReason(cognitiveLoad)}
        </Typography>

        {automaticMode &&
          inference.adaptation && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              <strong>
                Model recommendation:
              </strong>{" "}
              {
                inference.adaptation
                  .summary
              }
            </Typography>
          )}
      </Box>
    </Paper>
  );
}