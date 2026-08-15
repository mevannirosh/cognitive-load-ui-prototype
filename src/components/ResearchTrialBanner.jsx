import React, {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";


function formatDuration(
  seconds
) {
  const minutes =
    Math.floor(
      seconds / 60
    );

  const remaining =
    seconds % 60;

  return `${String(
    minutes
  ).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}


export default function ResearchTrialBanner({
  trial,
  onFinish,
}) {
  const [
    elapsed,
    setElapsed,
  ] = useState(0);


  useEffect(() => {
    function update() {
      const seconds =
        Math.floor(
          (
            Date.now() -
            new Date(
              trial.startedAt
            ).getTime()
          ) /
            1000
        );

      setElapsed(seconds);
    }

    update();

    const id =
      window.setInterval(
        update,
        1000
      );

    return () =>
      window.clearInterval(id);
  }, [trial.startedAt]);


  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,

        border:
          "2px solid #1f4e79",

        bgcolor:
          "#eef6ff",

        mb: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box
          sx={{
            flex: 1,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              fontWeight: 800,
            }}
          >
            Research Task Active
          </Typography>

          <Typography
            variant="h6"
            sx={{ mb: 1 }}
          >
            {trial.taskTitle}
          </Typography>

          <Typography>
            {
              trial
                .participantInstruction
            }
          </Typography>

          <Alert
            severity="info"
            sx={{ mt: 2 }}
          >
            Complete the task using
            the application normally.
            Select Finish Task when
            the task is complete.
          </Alert>
        </Box>

        <Box
          sx={{
            textAlign: "right",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Elapsed Time
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              mb: 1,
            }}
          >
            {formatDuration(
              elapsed
            )}
          </Typography>

          <Button
            variant="contained"
            color="error"
            onClick={onFinish}
          >
            Finish Task
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}