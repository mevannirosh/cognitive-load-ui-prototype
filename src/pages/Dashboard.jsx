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
import { chartData, dashboardMetrics, dashboardRows } from "../data/demoData";

export default function Dashboard({ adaptiveMode, cognitiveLoad, addLog }) {
  const highLoad = adaptiveMode && cognitiveLoad === "high";
  const mediumLoad = adaptiveMode && cognitiveLoad === "medium";
  const lowLoad = adaptiveMode && cognitiveLoad === "low";

  const visibleMetrics = highLoad
    ? dashboardMetrics.filter((metric) => metric.priority !== "low")
    : dashboardMetrics;

  const visibleRows = highLoad
    ? dashboardRows.filter((row) => row.priority === "High")
    : dashboardRows;

  const handleReview = () => {
    addLog("User reviewed a dashboard item.");
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Dashboard
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Demonstrates how the dashboard changes based on cognitive load.
      </Typography>

      {highLoad && (
        <Alert severity="info" sx={{ mb: 3 }}>
          High load adaptation applied: secondary metrics, advanced filters, and non-critical rows are hidden.
        </Alert>
      )}

      {mediumLoad && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Medium load adaptation applied: high priority areas are highlighted.
        </Alert>
      )}

      {lowLoad && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Low load adaptation applied: full dashboard and advanced analytics are visible.
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: highLoad ? "repeat(3, 1fr)" : "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {visibleMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            highlighted={mediumLoad && metric.priority === "high"}
          />
        ))}
      </Box>

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
          <Typography variant="h6" sx={{ mb: 2 }}>
            Advanced Analytics
          </Typography>

          <Box sx={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#1f4e79" />
                <Bar dataKey="errors" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

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
          <Typography variant="h6">Simplified Summary</Typography>
          <Typography variant="body2" color="text.secondary">
            Focus on 5 critical alerts and 3 high-priority review tasks first.
          </Typography>
        </Paper>
      )}

      <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Task Overview</Typography>

            {!highLoad && (
              <Stack direction="row" spacing={1}>
                <Chip label="Advanced Filters" />
                <Chip label="Export" />
                <Chip label="Detailed View" />
              </Stack>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Module</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                {!highLoad && <TableCell>Owner</TableCell>}
                {!highLoad && <TableCell>Due</TableCell>}
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.module}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.priority}
                      color={row.priority === "High" ? "error" : "default"}
                    />
                  </TableCell>
                  {!highLoad && <TableCell>{row.owner}</TableCell>}
                  {!highLoad && <TableCell>{row.due}</TableCell>}
                  <TableCell>
                    <Button
                      size="small"
                      variant={mediumLoad || highLoad ? "contained" : "outlined"}
                      onClick={handleReview}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}