import { Avatar } from "@mui/material";
import { alpha } from "@mui/material/styles";

export function RecordAvatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <Avatar
      aria-hidden="true"
      sx={{
        width: large ? 56 : 40,
        height: large ? 56 : 40,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
        color: "primary.main",
        fontSize: large ? 20 : 14,
        fontWeight: 700,
        borderRadius: large ? 3 : 2.5,
      }}
    >
      {initials || "?"}
    </Avatar>
  );
}
