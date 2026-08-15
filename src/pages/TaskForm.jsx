import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  dashboardRows,
  infoArticles,
} from "../data/demoData";


const INITIAL_FORM = {
  selectedItem: "",
  priority: "",
  reason: "",
  supportingInformation: "",
  additionalNotes: "",
};


export default function TaskForm({
  adaptiveMode,
  cognitiveLoad,
  addLog,
  researchMode = false,
  recordInteractionEvent,
}) {
  const [formData, setFormData] =
    useState(INITIAL_FORM);

  const [submitted, setSubmitted] =
    useState(false);

  const [validationError, setValidationError] =
    useState("");


  const highLoad =
    adaptiveMode &&
    cognitiveLoad === "high";

  const mediumLoad =
    adaptiveMode &&
    cognitiveLoad === "medium";

  const lowLoad =
    adaptiveMode &&
    cognitiveLoad === "low";


  const handleChange = (field) => (event) => {
    setFormData((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));

    setSubmitted(false);
    setValidationError("");
  };


  const validateForm = () => {
    if (!formData.selectedItem) {
      return "Please select an item.";
    }

    if (!formData.priority) {
      return "Please select a priority.";
    }

    if (!formData.reason.trim()) {
      return "Please provide a reason for your selection.";
    }

    return "";
  };


  const handleSubmit = () => {
    const error = validateForm();

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    setSubmitted(true);

    addLog?.(
      `Review submitted for ${formData.selectedItem}.`
    );

    recordInteractionEvent?.(
      "task_form_submitted",
      {
        selectedItem:
          formData.selectedItem,

        priority:
          formData.priority,

        supportingInformation:
          formData.supportingInformation,

        reason:
          formData.reason.trim(),

        additionalNotes:
          formData.additionalNotes.trim(),
      }
    );
  };


  const handleClear = () => {
    setFormData(INITIAL_FORM);
    setSubmitted(false);
    setValidationError("");
  };


  return (
    <Box>
      <Typography
        variant="h5"
        sx={{ mb: 1 }}
      >
        Task Form
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Record the item you selected and
        explain the reason for your decision.
      </Typography>


      {!researchMode && highLoad && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
        >
          The interface has been simplified
          and non-essential options have been reduced.
        </Alert>
      )}


      {!researchMode && mediumLoad && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
        >
          Important fields are highlighted
          and additional guidance is available.
        </Alert>
      )}


      {!researchMode && lowLoad && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
        >
          Full form functionality is available.
        </Alert>
      )}


      <Card
        elevation={0}
        sx={{
          border:
            "1px solid #e5e7eb",
        }}
      >
        <CardContent>
          <Typography variant="h6">
            Review Submission
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Fields marked with * are required.
          </Typography>

          <Divider sx={{ my: 3 }} />


          {validationError && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
            >
              {validationError}
            </Alert>
          )}


          {highLoad && adaptiveMode && (
            <Typography
              variant="body2"
              sx={{ mb: 2 }}
            >
              Complete the required fields first.
            </Typography>
          )}


          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                md: highLoad
                  ? "1fr"
                  : "1fr 1fr",
              },

              gap: 2,
            }}
          >
            <TextField
              required
              select

              label="Selected Item"

              value={
                formData.selectedItem
              }

              onChange={
                handleChange(
                  "selectedItem"
                )
              }

              helperText={
                mediumLoad
                  ? "Choose the item you decided should be reviewed."
                  : ""
              }
            >
              {dashboardRows
                .filter(
                  (item) =>
                    item.status !==
                    "Completed"
                )
                .map((item) => (
                  <MenuItem
                    key={item.id}
                    value={item.module}
                  >
                    {item.module}
                  </MenuItem>
                ))}
            </TextField>


            <TextField
              required
              select

              label="Priority"

              value={
                formData.priority
              }

              onChange={
                handleChange(
                  "priority"
                )
              }

              helperText={
                mediumLoad
                  ? "Select the priority shown for the item."
                  : ""
              }
            >
              <MenuItem value="High">
                High
              </MenuItem>

              <MenuItem value="Medium">
                Medium
              </MenuItem>

              <MenuItem value="Low">
                Low
              </MenuItem>
            </TextField>


            <TextField
              required
              multiline

              rows={
                highLoad ? 3 : 4
              }

              label="Reason for Selection"

              value={
                formData.reason
              }

              onChange={
                handleChange(
                  "reason"
                )
              }

              helperText={
                highLoad
                  ? "Briefly explain why this item should be handled first."
                  : "Explain why you selected this item."
              }

              sx={{
                gridColumn: {
                  xs: "1",
                  md: "1 / -1",
                },
              }}
            />


            <TextField
              select

              label="Supporting Information"

              value={
                formData.supportingInformation
              }

              onChange={
                handleChange(
                  "supportingInformation"
                )
              }

              helperText="Select the guide or policy you used, when relevant."
            >
              <MenuItem value="">
                None
              </MenuItem>

              {infoArticles.map(
                (article) => (
                  <MenuItem
                    key={
                      article.title
                    }
                    value={
                      article.title
                    }
                  >
                    {article.title}
                  </MenuItem>
                )
              )}
            </TextField>


            {!highLoad && (
              <TextField
                multiline

                rows={3}

                label="Additional Notes"

                value={
                  formData.additionalNotes
                }

                onChange={
                  handleChange(
                    "additionalNotes"
                  )
                }

                helperText="Optional"
              />
            )}
          </Box>


          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}

            spacing={2}

            sx={{ mt: 3 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={
                handleSubmit
              }
            >
              Submit Review
            </Button>

            {!highLoad && (
              <Button
                variant="outlined"
                onClick={
                  handleClear
                }
              >
                Clear Form
              </Button>
            )}
          </Stack>


          {submitted && (
            <Alert
              severity="success"
              sx={{ mt: 3 }}
            >
              Review submitted successfully.
              Select Finish Task when you have
              completed the research task.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}