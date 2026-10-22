import { Alert, Snackbar } from "@mui/material";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { MutationResult } from "../lib/types";

const FeedbackContext = createContext<(message: string) => void>(() => {});

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const notify = useCallback((text: string) => setMessage(text), []);
  return (
    <FeedbackContext value={notify}>
      {children}
      <Snackbar
        open={Boolean(message)}
        message={message}
        autoHideDuration={3000}
        onClose={() => setMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: "calc(72px + env(safe-area-inset-bottom)) !important" }}
      />
    </FeedbackContext>
  );
}

export function useMutationFeedback(
  fetcher: { state: string; data?: MutationResult },
  onSuccess?: () => void,
) {
  const notify = useContext(FeedbackContext);
  const handled = useRef<MutationResult | undefined>(undefined);
  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data?.ok &&
      handled.current !== fetcher.data
    ) {
      handled.current = fetcher.data;
      notify(fetcher.data.message);
      onSuccess?.();
    }
  }, [fetcher.state, fetcher.data, notify, onSuccess]);
  return fetcher.state === "idle" && fetcher.data && !fetcher.data.ok
    ? fetcher.data
    : undefined;
}

export function RequestError({ message }: { message?: string }) {
  return message ? (
    <Alert severity="error" role="alert">
      {message}
    </Alert>
  ) : null;
}
