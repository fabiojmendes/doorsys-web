import { Navigate } from "react-router";

export default function Home() {
  // Wait for root authentication/callback restoration before the default redirect.
  return <Navigate to="/customers" replace />;
}
