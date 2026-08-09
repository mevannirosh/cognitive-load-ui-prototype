import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const dimensions = [
  {
    key: "mentalDemand",
    label: "Mental Demand",
    description: "How mentally demanding was the task?",
  },
  {
    key: "physicalDemand",
    label: "Physical Demand",
    description: "How physically demanding was the task?",
  },
  {
    key: "temporalDemand",
    label: "Temporal Demand",
    description: "How rushed or time pressured did you feel?",
  },
  {
    key: "performance",
    label: "Performance",
    description: "How successful do you think you were?",
  },
  {
    key: "effort",
    label: "Effort",
    description: "How hard did you have to work?",
  },
  {
    key: "frustration",
    label: "Frustration",
    description: "How stressed or frustrated did you feel?",
  },
];

const initialScores = {
  mentalDemand: 10,
  physicalDemand: 5,
  temporalDemand: 10,
  performance: 10,
  effort: 10,
  frustration: 10,
};

export default function Evaluation({ addLog }) {
  const [condition, setCondition] = useState("non-adaptive");
  const [scores, setScores] = useState(initialScores);
  const [submitted, setSubmitted] = useState(false);

  const averageScore = useMemo(() => {
    const values = Object.values(scores);
    const total = values.reduce((sum, value) => sum + value, 0);
    return (total / values.length).toFixed(1);
  }, [scores]);

  const updateScore = (key, value) => {
    setScores((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    addLog(`NASA-TLX submitted for ${condition} condition. Average workload: ${averageScore}`);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        NASA-TLX Evaluation
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This page demonstrates how perceived workload will be collected after user tasks.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        NASA-TLX is used after participants complete tasks in both non-adaptive and adaptive interfaces.
      </Alert>

      <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
        <CardContent>
          <TextField
            select
            label="Evaluation Condition"
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            sx={{ minWidth: 280, mb: 3 }}
          >
            <MenuItem value="non-adaptive">Non-Adaptive Interface</MenuItem>
            <MenuItem value="adaptive">Adaptive Interface</MenuItem>
          </TextField>

          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            {dimensions.map((dimension) => (
              <Box key={dimension.key}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {dimension.label}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {dimension.description}
                </Typography>

                <Slider
                  value={scores[dimension.key]}
                  onChange={(_, value) => updateScore(dimension.key, value)}
                  min={1}
                  max={20}
                  marks={[
                    { value: 1, label: "Low" },
                    { value: 10, label: "Medium" },
                    { value: 20, label: "High" },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
            ))}
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              mt: 3,
              bgcolor: "#f8fafc",
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography variant="h6">Average Workload Score: {averageScore}</Typography>
            <Typography variant="body2" color="text.secondary">
              This value can later be compared between adaptive and non-adaptive interfaces.
            </Typography>
          </Paper>

          <Button variant="contained" sx={{ mt: 3 }} onClick={handleSubmit}>
            Submit NASA-TLX Result
          </Button>

          {submitted && (
            <Alert severity="success" sx={{ mt: 3 }}>
              NASA-TLX result submitted for demonstration. In the final evaluation, this will be stored for analysis.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}