import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function TaskForm({ adaptiveMode, cognitiveLoad, addLog }) {
  const [submitted, setSubmitted] = useState(false);

  const highLoad = adaptiveMode && cognitiveLoad === "high";
  const mediumLoad = adaptiveMode && cognitiveLoad === "medium";
  const lowLoad = adaptiveMode && cognitiveLoad === "low";

  const handleSubmit = () => {
    setSubmitted(true);
    addLog("Task form submitted.");
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Task Form
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Demonstrates form simplification and guidance based on cognitive load.
      </Typography>

      {highLoad && (
        <Alert severity="info" sx={{ mb: 3 }}>
          High load adaptation applied: optional fields are hidden and step-by-step hints are enabled.
        </Alert>
      )}

      {mediumLoad && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Medium load adaptation applied: important fields are highlighted with helpful guidance.
        </Alert>
      )}

      {lowLoad && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Low load adaptation applied: full form with advanced fields is available.
        </Alert>
      )}

      <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
        <CardContent>
          <Typography variant="h6">System Review Form</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Complete this form as part of the evaluation task.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {highLoad && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Step 1: Fill only the required fields first. Optional details are temporarily hidden.
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: highLoad ? "1fr" : "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              required
              label="Task Title"
              helperText={highLoad || mediumLoad ? "Enter a short and clear title." : ""}
              className={mediumLoad ? "highlight-pulse" : ""}
            />

            <TextField
              required
              select
              label="Priority"
              defaultValue=""
              helperText={mediumLoad ? "Choose the importance level." : ""}
              className={mediumLoad ? "highlight-pulse" : ""}
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>

            <TextField
              required
              label="Description"
              multiline
              rows={highLoad ? 3 : 5}
              helperText={
                highLoad
                  ? "Briefly describe the main issue only."
                  : "Provide a complete description of the task."
              }
              sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}
            />

            {!highLoad && (
              <>
                <TextField label="Reference Code" />
                <TextField label="Assigned Team" />
                <TextField label="Additional Notes" multiline rows={3} />
                <TextField label="Follow-up Action" multiline rows={3} />
              </>
            )}

            {lowLoad && (
              <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Advanced Options
                </Typography>

                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <FormControlLabel control={<Checkbox />} label="Send notification" />
                  <FormControlLabel control={<Checkbox />} label="Attach report" />
                  <FormControlLabel control={<Checkbox />} label="Schedule follow-up" />
                </Stack>
              </Box>
            )}
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleSubmit}>
              Submit Review
            </Button>

            {!highLoad && <Button variant="outlined">Save Draft</Button>}
          </Stack>

          {submitted && (
            <Alert severity="success" sx={{ mt: 3 }}>
              Form submitted successfully. This action is logged for demonstration.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}