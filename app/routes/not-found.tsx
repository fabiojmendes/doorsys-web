import { Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <Stack spacing={2}>
      <Typography variant="h1">Page not found</Typography>
      <Typography>This address does not match a Doorsys page.</Typography>
      <Button component={Link} to="/customers">
        Go to customers
      </Button>
    </Stack>
  );
}
