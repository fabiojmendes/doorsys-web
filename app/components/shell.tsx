import type { User } from "@auth0/auth0-spa-js";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Alert,
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { createContext, type ReactNode, useState } from "react";
import { Link, useLocation, useNavigation } from "react-router";
import { errorMessage } from "../lib/api";
import { signOut } from "../lib/auth";
import { FeedbackProvider } from "./feedback";

export const AuthContext = createContext<User | undefined>(undefined);

export function Shell({
  user,
  children,
}: {
  user: User | undefined;
  children: ReactNode;
}) {
  const location = useLocation();
  const navigation = useNavigation();
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  return (
    <AuthContext value={user}>
      <FeedbackProvider>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar
            variant="dense"
            sx={{
              minHeight: 56,
              width: "100%",
              maxWidth: "56rem",
              mx: "auto",
              gap: 1,
            }}
          >
            <Typography
              component={Link}
              to="/customers"
              variant="h2"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                flexGrow: 1,
              }}
            >
              Doorsys
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: "none", md: "flex" }, mr: 2 }}
            >
              <Button
                component={Link}
                to="/customers"
                variant={
                  location.pathname.startsWith("/logs") ? "text" : "contained"
                }
                startIcon={<GroupsOutlinedIcon />}
              >
                Customers
              </Button>
              <Button
                component={Link}
                to="/logs"
                variant={
                  location.pathname.startsWith("/logs") ? "contained" : "text"
                }
                startIcon={<HistoryOutlinedIcon />}
              >
                Activity
              </Button>
            </Stack>
            <Tooltip title={user?.name || user?.email || "Account"}>
              <Avatar
                src={user?.picture}
                alt={user?.name || "Account"}
                sx={{ width: 30, height: 30 }}
              >
                {user?.name?.slice(0, 1)}
              </Avatar>
            </Tooltip>
            <Tooltip title="Log out">
              <IconButton
                aria-label="Log out"
                disabled={loggingOut}
                onClick={() => {
                  setError("");
                  setLoggingOut(true);
                  signOut().catch((failure: unknown) => {
                    setError(errorMessage(failure));
                    setLoggingOut(false);
                  });
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Toolbar>
          <Box sx={{ height: 2 }}>
            {navigation.state !== "idle" && (
              <LinearProgress aria-label="Loading page" sx={{ height: 2 }} />
            )}
          </Box>
        </AppBar>
        <Container
          component="main"
          id="main-content"
          sx={{
            maxWidth: "52rem !important",
            px: { xs: 2, sm: 3 },
            pt: 2,
            pb: { xs: "calc(88px + env(safe-area-inset-bottom))", md: 4 },
          }}
        >
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {children}
          </Stack>
        </Container>
        <Paper
          component="nav"
          aria-label="Main navigation"
          square
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            borderTop: 1,
            borderColor: "divider",
            pb: "env(safe-area-inset-bottom)",
            display: { xs: "block", md: "none" },
          }}
        >
          <BottomNavigation
            showLabels
            value={location.pathname.startsWith("/logs") ? "logs" : "customers"}
          >
            <BottomNavigationAction
              component={Link}
              to="/customers"
              value="customers"
              label="Customers"
              icon={<GroupsOutlinedIcon />}
            />
            <BottomNavigationAction
              component={Link}
              to="/logs"
              value="logs"
              label="Activity"
              icon={<HistoryOutlinedIcon />}
            />
          </BottomNavigation>
        </Paper>
      </FeedbackProvider>
    </AuthContext>
  );
}
