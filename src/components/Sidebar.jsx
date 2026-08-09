import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";

const menuItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "form", label: "Task Form" },
  { key: "info", label: "Information Search" },
  { key: "evaluation", label: "NASA-TLX Evaluation" },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <Box
      sx={{
        width: 260,
        bgcolor: "#0f172a",
        color: "white",
        minHeight: "100vh",
        p: 2,
        display: { xs: "none", md: "block" },
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
        Cognitive Adaptive UI
      </Typography>

      <Typography variant="body2" sx={{ color: "#cbd5e1", mb: 2 }}>
        Final Research Prototype
      </Typography>

      <Divider sx={{ borderColor: "#334155", mb: 2 }} />

      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.key}
            selected={activePage === item.key}
            onClick={() => setActivePage(item.key)}
            sx={{
              borderRadius: 2,
              mb: 1,
              color: "white",
              "&.Mui-selected": {
                bgcolor: "#1f4e79",
              },
              "&.Mui-selected:hover": {
                bgcolor: "#1f4e79",
              },
              "&:hover": {
                bgcolor: "#1e293b",
              },
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}