import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

export default function MetricCard({ label, value, description, highlighted }) {
  return (
    <Card
      className={highlighted ? "highlight-pulse" : ""}
      elevation={0}
      sx={{
        height: "100%",
        border: highlighted ? "2px solid #1f4e79" : "1px solid #e5e7eb",
        bgcolor: highlighted ? "#eef6ff" : "white",
      }}
    >
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>

        <Typography variant="h4" sx={{ my: 1 }}>
          {value}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}