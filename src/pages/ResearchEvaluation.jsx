import React, {
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NasaTlxForm from "../components/NasaTlxForm";

import {
  getStoredTrials,
  exportTrialsCsv,
  exportTrialsJson,
} from "../research/researchStorage";

import {
  getTasksForSet,
} from "../research/researchTasks";


export default function ResearchEvaluation({
  research,
}) {
  const [
    participantId,
    setParticipantId,
  ] = useState("");

  const [
    taskSet,
    setTaskSet,
  ] = useState("A");

  const [
    taskId,
    setTaskId,
  ] = useState("A1");

  const [
    condition,
    setCondition,
  ] = useState(
    "non_adaptive"
  );

  const [
    setupError,
    setSetupError,
  ] = useState(null);


  const [
    taskSuccess,
    setTaskSuccess,
  ] = useState("completed");

  const [
    errorCount,
    setErrorCount,
  ] = useState(0);

  const [
    researcherNotes,
    setResearcherNotes,
  ] = useState("");


  const tasks =
    useMemo(
      () =>
        getTasksForSet(
          taskSet
        ),
      [taskSet]
    );


  const storedTrialCount =
    getStoredTrials().length;


  const handleTaskSetChange =
    (newSet) => {
      setTaskSet(newSet);

      const firstTask =
        getTasksForSet(
          newSet
        )[0];

      setTaskId(
        firstTask?.id || ""
      );
    };


  const handleStart =
    () => {
      setSetupError(null);

      try {
        research.startTrial({
          participantId,
          taskId,
          condition,
        });
      } catch (error) {
        setSetupError(
          error.message
        );
      }
    };


  if (
    research.phase ===
    "outcome"
  ) {
    return (
      <Box>
        <Typography
          variant="h5"
          sx={{ mb: 1 }}
        >
          Task Outcome
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Researcher entry only.
          Record the objective task
          result before continuing to
          NASA-TLX.
        </Typography>

        <Card
          elevation={0}
          sx={{
            border:
              "1px solid #e5e7eb",
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <TextField
                select
                label="Task Outcome"
                value={taskSuccess}

                onChange={(
                  event
                ) =>
                  setTaskSuccess(
                    event.target.value
                  )
                }
              >
                <MenuItem
                  value="completed"
                >
                  Completed
                </MenuItem>

                <MenuItem
                  value="partial"
                >
                  Partially Completed
                </MenuItem>

                <MenuItem
                  value="failed"
                >
                  Failed
                </MenuItem>
              </TextField>

              <Alert
                severity="info"
                sx={{ mb: 3 }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700 }}
                >
                  Correct Outcome
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mt: 0.5 }}
                >
                  {
                    research.pendingTrial
                      ?.correctOutcome
                  }
                </Typography>
              </Alert>


              <Card
                elevation={0}
                sx={{
                  border:
                    "1px solid #e5e7eb",
                  mb: 3,
                }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700 }}
                  >
                    Error Scoring Guide
                  </Typography>

                  <Box
                    component="ul"
                    sx={{ mb: 0 }}
                  >
                    {research.pendingTrial
                      ?.errorCriteria
                      ?.map(
                        (criterion) => (
                          <li key={criterion}>
                            <Typography variant="body2">
                              {criterion}
                            </Typography>
                          </li>
                        )
                      )}
                  </Box>
                </CardContent>
              </Card>

              <TextField
                type="number"

                label="Error Count"

                value={errorCount}

                inputProps={{
                  min: 0,
                }}

                onChange={(
                  event
                ) =>
                  setErrorCount(
                    Math.max(
                      0,
                      Number(
                        event.target
                          .value
                      )
                    )
                  )
                }
              />

              <TextField
                multiline
                rows={4}

                label="Researcher Notes"

                value={
                  researcherNotes
                }

                onChange={(
                  event
                ) =>
                  setResearcherNotes(
                    event.target.value
                  )
                }
              />

              <Button
                variant="contained"
                size="large"

                onClick={() =>
                  research.submitOutcome({
                    taskSuccess,
                    errorCount,
                    researcherNotes,
                  })
                }
              >
                Continue to NASA-TLX
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }


  if (
    research.phase ===
    "nasa"
  ) {
    return (
      <NasaTlxForm
        onSubmit={
          research
            .submitNasaTlx
        }
      />
    );
  }


  if (
    research.phase ===
    "complete"
  ) {
    const trial =
      research
        .lastCompletedTrial;

    return (
      <Box>
        <Typography
          variant="h5"
          sx={{ mb: 1 }}
        >
          Trial Completed
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          The complete research
          trial has been recorded.
        </Typography>

        {research.saveStatus ===
          "saved" && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
            >
              Research data was saved
              locally and to the
              backend research store.
            </Alert>
          )}

        {research.saveStatus ===
          "local-only" && (
            <Alert
              severity="warning"
              sx={{ mb: 3 }}
            >
              The trial is safely
              stored in this browser,
              but backend saving
              failed.

              {research.saveError
                ? ` ${research.saveError}`
                : ""}
            </Alert>
          )}

        <Card
          elevation={0}
          sx={{
            border:
              "1px solid #e5e7eb",

            mb: 3,
          }}
        >
          <CardContent>
            <Stack spacing={1}>
              <Typography
                variant="h6"
              >
                Trial Summary
              </Typography>

              <Divider />

              <Typography>
                Participant:{" "}
                <strong>
                  {
                    trial
                      ?.participantId
                  }
                </strong>
              </Typography>

              <Typography>
                Task:{" "}
                <strong>
                  {trial?.taskId}
                </strong>
              </Typography>

              <Typography>
                Condition:{" "}
                <strong>
                  {trial?.condition}
                </strong>
              </Typography>

              <Typography>
                Task Duration:{" "}
                <strong>
                  {trial?.durationSec}s
                </strong>
              </Typography>

              <Typography>
                Task-Level ML
                Prediction:{" "}
                <strong>
                  {trial
                    ?.predictions
                    ?.summary
                    ?.majorityPrediction ||
                    "No prediction"}
                </strong>
              </Typography>

              <Typography>
                Raw NASA-TLX:{" "}
                <strong>
                  {trial
                    ?.nasaTlx
                    ?.rawScore}
                </strong>
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
        >
          <Button
            variant="contained"

            onClick={
              research
                .startNextTrial
            }
          >
            Start Next Trial
          </Button>

          <Button
            variant="outlined"
            onClick={
              exportTrialsCsv
            }
          >
            Export Dataset CSV
          </Button>

          <Button
            variant="outlined"
            onClick={
              exportTrialsJson
            }
          >
            Export Full JSON
          </Button>

          {research.saveStatus ===
            "local-only" && (
              <Button
                color="warning"
                onClick={
                  research
                    .retryRemoteSave
                }
              >
                Retry Server Save
              </Button>
            )}
        </Stack>
      </Box>
    );
  }


  return (
    <Box>
      <Typography
        variant="h5"
        sx={{ mb: 1 }}
      >
        Research Evaluation Mode
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Configure and start a
        controlled participant trial.
      </Typography>

      <Alert
        severity="info"
        sx={{ mb: 3 }}
      >
        This setup screen is intended
        for the researcher. Do not
        explain the expected
        difficulty classification to
        the participant.
      </Alert>

      {setupError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {setupError}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            lg: "2fr 1fr",
          },

          gap: 3,
        }}
      >
        <Card
          elevation={0}
          sx={{
            border:
              "1px solid #e5e7eb",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 3 }}
            >
              Trial Setup
            </Typography>

            <Stack spacing={3}>
              <TextField
                required

                label="Participant ID"

                placeholder="P001"

                value={
                  participantId
                }

                onChange={(
                  event
                ) =>
                  setParticipantId(
                    event.target.value
                  )
                }

                helperText="Use anonymous IDs only. Do not enter participant names."
              />

              <TextField
                select

                label="Task Set"

                value={taskSet}

                onChange={(
                  event
                ) =>
                  handleTaskSetChange(
                    event.target.value
                  )
                }
              >
                <MenuItem
                  value="A"
                >
                  Task Set A
                </MenuItem>

                <MenuItem
                  value="B"
                >
                  Task Set B
                </MenuItem>
              </TextField>

              <TextField
                select
                label="Task"

                value={taskId}

                onChange={(
                  event
                ) =>
                  setTaskId(
                    event.target.value
                  )
                }
              >
                {tasks.map(
                  (task) => (
                    <MenuItem
                      key={
                        task.id
                      }
                      value={
                        task.id
                      }
                    >
                      {task.id} —{" "}
                      {task.title}
                    </MenuItem>
                  )
                )}
              </TextField>

              <TextField
                select

                label="Study Condition"

                value={condition}

                onChange={(
                  event
                ) =>
                  setCondition(
                    event.target.value
                  )
                }
              >
                <MenuItem
                  value=
                  "non_adaptive"
                >
                  Non-Adaptive
                </MenuItem>

                <MenuItem
                  value="adaptive"
                >
                  Adaptive
                </MenuItem>
              </TextField>

              <Button
                size="large"
                variant="contained"

                onClick={
                  handleStart
                }
              >
                Start Research Trial
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            border:
              "1px solid #e5e7eb",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 2 }}
            >
              Dataset Status
            </Typography>

            <Chip
              label={`${storedTrialCount} locally stored trials`}

              color="primary"

              variant="outlined"
            />

            <Divider
              sx={{ my: 2 }}
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Export regularly during
              participant testing as
              an additional backup.
            </Typography>

            <Stack spacing={1}>
              <Button
                variant="outlined"
                onClick={
                  exportTrialsCsv
                }
              >
                Export CSV
              </Button>

              <Button
                variant="outlined"
                onClick={
                  exportTrialsJson
                }
              >
                Export JSON
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}