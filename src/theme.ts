import { createTheme } from "@mui/material/styles";

// Cyberpunk theme: dark background + neon yellow primary
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#E6FB04" },
    secondary: { main: "#00FFF0" },
    background: { default: "#0a0a0b", paper: "#111216" },
    text: { primary: "#E5E7EB", secondary: "#A1A1AA" },
  },
  typography: {
    fontFamily: ["var(--font-geist-sans)", "system-ui", "sans-serif"].join(","),
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        containedPrimary: {
          backgroundColor: "#E6FB04",
          color: "#000",
          "&:hover": { backgroundColor: "#d6eb00" },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundColor: "transparent", backdropFilter: "saturate(180%) blur(6px)" } },
    },
  },
});


