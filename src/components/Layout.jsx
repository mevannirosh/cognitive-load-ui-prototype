import React from "react";

import {
  Box,
  Stack,
} from "@mui/material";

import AdaptationLog from "./AdaptationLog";
import Header from "./Header";

import InteractionMetricsPanel from "./InteractionMetricsPanel";

import ModelInferencePanel from "./ModelInferencePanel";

import ResearchTrialBanner from "./ResearchTrialBanner";

import Sidebar from "./Sidebar";

import StatusPanel from "./StatusPanel";


export default function Layout({
  children,

  activePage,
  setActivePage,

  adaptiveMode,
  setAdaptiveMode,

  controlMode,
  setControlMode,

  manualLoad,
  setManualLoad,

  cognitiveLoad,

  logs,
  tracker,
  inference,

  research,
}) {
  const participantMode =
    [
      "running",
      "outcome",
      "nasa",
    ].includes(
      research.phase
    );


  return (
    <Box
      sx={{
        display: "flex",

        minHeight:
          "100vh",

        bgcolor:
          "#f4f7fb",
      }}
    >
      <Sidebar
        activePage={
          activePage
        }

        setActivePage={
          setActivePage
        }
      />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <Header
          adaptiveMode={
            adaptiveMode
          }

          setAdaptiveMode={
            setAdaptiveMode
          }

          controlMode={
            controlMode
          }

          setControlMode={
            setControlMode
          }

          manualLoad={
            manualLoad
          }

          setManualLoad={
            setManualLoad
          }

          cognitiveLoad={
            cognitiveLoad
          }

          inference={
            inference
          }

          controlsLocked={
            participantMode
          }
        />

        <Box sx={{ p: 3 }}>
          {research.phase ===
            "running" &&
            research.currentTrial && (
              <ResearchTrialBanner
                trial={
                  research
                    .currentTrial
                }

                onFinish={
                  research
                    .finishTrial
                }
              />
            )}

          {!participantMode && (
            <StatusPanel
              adaptiveMode={
                adaptiveMode
              }

              cognitiveLoad={
                cognitiveLoad
              }

              controlMode={
                controlMode
              }

              inference={
                inference
              }
            />
          )}

          {participantMode ? (
            <Box sx={{ mt: 3 }}>
              {children}
            </Box>
          ) : (
            <Box
              sx={{
                display:
                  "grid",

                gridTemplateColumns:
                  {
                    xs:
                      "1fr",

                    lg:
                      "minmax(0, 1fr) 370px",
                  },

                gap: 3,
                mt: 3,
              }}
            >
              <Box>
                {children}
              </Box>

              <Stack
                spacing={3}
              >
                <ModelInferencePanel
                  inference={
                    inference
                  }

                  controlMode={
                    controlMode
                  }
                />

                <AdaptationLog
                  logs={
                    logs
                  }
                />

                <InteractionMetricsPanel
                  tracker={
                    tracker
                  }
                />
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}