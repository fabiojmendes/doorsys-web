import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#2459a9" },
    background: { default: "#f5f7fa", paper: "#ffffff" },
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontSize: "1.5rem", fontWeight: 700 },
    h2: { fontSize: "1.15rem", fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiListItemButton: { styleOverrides: { root: { minHeight: 64 } } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiAlert: { styleOverrides: { root: { overflowWrap: "anywhere" } } },
  },
});
