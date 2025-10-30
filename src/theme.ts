import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#111827" },
    secondary: { main: "#10b981" },
    background: { default: "#fafafa", paper: "#ffffff" },
  },
  typography: {
    fontFamily: ["var(--font-geist-sans)", "system-ui", "sans-serif"].join(","),
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});


