import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1f4e79",
    },
    secondary: {
      main: "#6c63ff",
    },
    background: {
      default: "#f4f7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#1f2937",
      secondary: "#64748b",
    },
  },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
    h4: {
      fontWeight: 800,
    },
    h5: {
      fontWeight: 800,
    },
    h6: {
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 14,
  },
});

export default theme;