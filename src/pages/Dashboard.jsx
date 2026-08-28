import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import MetricCard from "../components/MetricCard";
import {
  chartData,
  dashboardMetrics,
  dashboardRows,
} from "../data/demoData";

export default function Dashboard({
  adaptiveMode,
  cognitiveLoad,
  addLog,
  researchMode = false,
}) {
  // ---------------------------------------------------------
  // Cognitive-load adaptation states
  // ---------------------------------------------------------
  const highLoad =
    adaptiveMode && cognitiveLoad === "high";

  const mediumLoad =
    adaptiveMode && cognitiveLoad === "medium";

  const lowLoad =
    adaptiveMode && cognitiveLoad === "low";

  // ---------------------------------------------------------
  // Dashboard adaptations
  // ---------------------------------------------------------

  
  const visibleMetrics = highLoad
    ? dashboardMetrics.filter(
        (metric) => metric.priority !== "low"
      )
    : dashboardMetrics;

  /**
   * IMPORTANT:
   *
   * All task rows must remain visible regardless of
   * cognitive-load state.
   *
   * Experimental tasks such as B3 require participants
   * to compare Medium-priority items. Filtering the table
   * to High-priority rows would therefore make the task
   * impossible and invalidate the trial.
   */
  const visibleRows = dashboardRows;

  // ---------------------------------------------------------
  // Interaction handlers
  // ---------------------------------------------------------
  const handleReview = (row) => {
    addLog?.(
      `User reviewed dashboard item: ${row.module}.`
    );
  };

  return (
    <Box>
      {/* -----------------------------------------------------
          PAGE HEADER
      ----------------------------------------------------- */}
      <Typography
        variant="h5"
        sx={{ mb: 1 }}
      >
        Dashboard
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Review task status, priority, and due-date
        information.
      </Typography>

      {/* -----------------------------------------------------
          ADAPTATION INFORMATION

          Hidden during research trials so participants are
          not informed about their predicted cognitive load.
      ----------------------------------------------------- */}
      {!researchMode && highLoad && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
        >
          High load adaptation applied: secondary metrics,
          advanced analytics, optional controls, and
          non-essential information have been reduced.
        </Alert>
      )}

      {!researchMode && mediumLoad && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
        >
          Medium load adaptation applied: important task
          information and actions are emphasised.
        </Alert>
      )}

      {!researchMode && lowLoad && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
        >
          Low load adaptation applied: the full dashboard
          and advanced analytics are available.
        </Alert>
      )}

      {/* -----------------------------------------------------
          METRIC CARDS
      ----------------------------------------------------- */}
      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            md: highLoad
              ? "repeat(3, 1fr)"
              : "repeat(4, 1fr)",
          },

          gap: 2,
          mb: 3,
        }}
      >
        {visibleMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            highlighted={
              mediumLoad &&
              metric.priority === "high"
            }
          />
        ))}
      </Box>

      {/* -----------------------------------------------------
          ADVANCED ANALYTICS

          Hidden under high cognitive load because the chart
          is secondary to the experimental task.
      ----------------------------------------------------- */}
      {!highLoad && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: "1px solid #e5e7eb",
            bgcolor: "white",
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2 }}
          >
            Advanced Analytics
          </Typography>

          <Box
            sx={{
              width: "100%",
              height: 260,
            }}
          >
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="tasks"
                  fill="#1f4e79"
                />

                <Bar
                  dataKey="errors"
                  fill="#ef4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      {/* -----------------------------------------------------
          HIGH-LOAD SIMPLIFIED GUIDANCE

          Provides general guidance without hiding any
          information needed to solve the research task.
      ----------------------------------------------------- */}
      {highLoad && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: "1px solid #e5e7eb",
            bgcolor: "#fff7ed",
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 0.5 }}
          >
            Simplified Summary
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Focus on the essential task information.
            Compare each item's status, priority, and due
            date before deciding which item requires
            attention first.
          </Typography>
        </Paper>
      )}

      {/* -----------------------------------------------------
          TASK OVERVIEW TABLE
      ----------------------------------------------------- */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
        }}
      >
        <CardContent>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            spacing={2}
          >
            <Box>
              <Typography variant="h6">
                Task Overview
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Review the status, priority, and due date
                of available tasks.
              </Typography>
            </Box>

            {/* Optional controls disappear under high load */}
            {!highLoad && (
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
              >
                <Chip
                  label="Advanced Filters"
                  size="small"
                />

                <Chip
                  label="Export"
                  size="small"
                />

                <Chip
                  label="Detailed View"
                  size="small"
                />
              </Stack>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  {/* Essential task information */}
                  <TableCell>
                    <strong>Module</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Priority</strong>
                  </TableCell>

                  {/* Owner is secondary information and can
                      therefore be hidden during high load */}
                  {!highLoad && (
                    <TableCell>
                      <strong>Owner</strong>
                    </TableCell>
                  )}

                  {/* Due MUST always remain visible because
                      B3 requires comparison by due date */}
                  <TableCell>
                    <strong>Due</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Action</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {visibleRows.map((row) => {
                  const isHighPriority =
                    row.priority === "High";

                  const isAttentionNeeded =
                    row.status ===
                    "Attention Needed";

                  /**
                   * Medium-load adaptation subtly highlights
                   * important rows without removing other
                   * task-relevant information.
                   */
                  const shouldHighlight =
                    mediumLoad &&
                    (isHighPriority ||
                      isAttentionNeeded);

                  return (
                    <TableRow
                      key={row.id}
                      sx={{
                        bgcolor: shouldHighlight
                          ? "#fff7ed"
                          : "inherit",

                        "&:last-child td, &:last-child th":
                          {
                            border: 0,
                          },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight:
                              shouldHighlight
                                ? 700
                                : 500,
                          }}
                        >
                          {row.module}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={row.status}
                          color={
                            row.status ===
                            "Attention Needed"
                              ? "warning"
                              : row.status ===
                                  "Completed"
                                ? "success"
                                : "default"
                          }
                          variant={
                            row.status ===
                            "Attention Needed"
                              ? "filled"
                              : "outlined"
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={row.priority}
                          color={
                            row.priority === "High"
                              ? "error"
                              : row.priority ===
                                  "Medium"
                                ? "warning"
                                : "default"
                          }
                          variant={
                            row.priority === "High"
                              ? "filled"
                              : "outlined"
                          }
                        />
                      </TableCell>

                      {!highLoad && (
                        <TableCell>
                          {row.owner}
                        </TableCell>
                      )}

                      {/* Always visible */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight:
                              row.due === "Today"
                                ? 700
                                : 400,

                            color:
                              row.due === "Today"
                                ? "error.main"
                                : "text.primary",
                          }}
                        >
                          {row.due}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Button
                          size="small"
                          variant={
                            mediumLoad || highLoad
                              ? "contained"
                              : "outlined"
                          }
                          onClick={() =>
                            handleReview(row)
                          }
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}