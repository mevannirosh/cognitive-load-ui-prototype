import React from "react";

import {
  AppBar,
  Box,
  Chip,
  FormControlLabel,
  MenuItem,
  Select,
  Switch,
  Toolbar,
  Typography,
} from "@mui/material";

import {
  getLoadColor,
  getLoadLabel,
} from "../utils/adaptationUtils";


export default function Header({
  adaptiveMode,
  setAdaptiveMode,

  controlMode,
  setControlMode,

  manualLoad,
  setManualLoad,

  cognitiveLoad,
  inference,

  controlsLocked = false,
}) {
  const automaticMode =
    controlMode === "automatic";


  return (
    <AppBar
      position="static"
      elevation={0}

      sx={{
        bgcolor: "white",
        color: "#1f2937",

        borderBottom:
          "1px solid #e5e7eb",
      }}
    >
      <Toolbar
        sx={{
          minHeight: 82,

          display: "flex",

          justifyContent:
            "space-between",

          flexWrap: "wrap",

          gap: 2,

          py: 1,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
            }}
          >
            Cognitive Load–Aware
            Adaptive UI
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            ML-driven research
            prototype
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",

            alignItems:
              "center",

            flexWrap: "wrap",

            gap: 1.5,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={
                  adaptiveMode
                }

                disabled={
                  controlsLocked
                }

                onChange={(
                  event
                ) =>
                  setAdaptiveMode(
                    event.target
                      .checked
                  )
                }
              />
            }

            label="Adaptive UI"
          />

          <Select
            size="small"

            value={
              controlMode
            }

            disabled={
              controlsLocked
            }

            onChange={(
              event
            ) =>
              setControlMode(
                event.target
                  .value
              )
            }

            sx={{
              minWidth: 170,
            }}
          >
            <MenuItem
              value="automatic"
            >
              Automatic ML
            </MenuItem>

            <MenuItem
              value="manual"
            >
              Manual Demonstration
            </MenuItem>
          </Select>

          <Select
            size="small"

            value={
              manualLoad
            }

            disabled={
              automaticMode ||
              controlsLocked
            }

            onChange={(
              event
            ) =>
              setManualLoad(
                event.target
                  .value
              )
            }

            sx={{
              minWidth: 150,
            }}
          >
            <MenuItem
              value="low"
            >
              Low Load
            </MenuItem>

            <MenuItem
              value="medium"
            >
              Medium Load
            </MenuItem>

            <MenuItem
              value="high"
            >
              High Load
            </MenuItem>
          </Select>

          {!controlsLocked && (
            <>
              <Chip
                color={
                  getLoadColor(
                    cognitiveLoad
                  )
                }

                label={
                  getLoadLabel(
                    cognitiveLoad
                  )
                }

                sx={{
                  fontWeight: 700,
                }}
              />

              {automaticMode && (
                <Chip
                  size="small"

                  variant="outlined"

                  color={
                    inference
                      .apiHealth
                      .healthy
                      ? "success"
                      : "error"
                  }

                  label={
                    inference
                      .apiHealth
                      .healthy
                      ? "Model Connected"
                      : "Model Disconnected"
                  }
                />
              )}
            </>
          )}

          {controlsLocked && (
            <Chip
              color="info"
              label="Research Mode"
            />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}