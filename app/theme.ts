import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#315bd1" },
    background: { default: "#f7f8fc", paper: "#ffffff" },
    divider: "#e5e9f1",
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontSize: "1.65rem", fontWeight: 750, letterSpacing: "-0.035em" },
    h2: { fontSize: "1.05rem", fontWeight: 650, letterSpacing: "-0.015em" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 12, flexShrink: 0 },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 12, backgroundColor: "#ffffff" },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { borderRadius: 12, padding: 3, backgroundColor: "#eef1f8" },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 0,
          borderRadius: "9px !important",
          minHeight: 40,
          paddingInline: 12,
          textTransform: "none",
          fontSize: 13,
          fontWeight: 600,
          "&.Mui-selected": {
            backgroundColor: "#ffffff",
            color: "#315bd1",
            boxShadow: "0 1px 3px #172b4d14",
          },
          "&.Mui-selected:hover": { backgroundColor: "#ffffff" },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", minHeight: 44, fontWeight: 600 },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } } },
    MuiListItemButton: { styleOverrides: { root: { minHeight: 64 } } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiAlert: { styleOverrides: { root: { overflowWrap: "anywhere" } } },
  },
});
