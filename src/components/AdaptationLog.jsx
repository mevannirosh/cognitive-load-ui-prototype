import React from "react";
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { getLoadColor } from "../utils/adaptationUtils";

export default function AdaptationLog({ logs }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid #e5e7eb",
        bgcolor: "white",
        height: "fit-content",
      }}
    >
      <Typography variant="h6">Adaptation Log</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Shows the adaptation decisions applied by the framework.
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {logs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No adaptation events yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {logs.map((log) => (
            <Box
              key={log.id}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {log.time}
                </Typography>
                <Chip
                  size="small"
                  color={getLoadColor(log.load)}
                  label={log.load.toUpperCase()}
                />
              </Box>

              <Typography variant="body2">{log.message}</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}