import { accessToken } from "./auth";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

type Query = Record<string, string | number | boolean | null | undefined>;

export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Query;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const token = await accessToken();
  options.signal?.throwIfAborted();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== null && value !== undefined && value !== "")
      query.set(key, String(value));
  }
  const response = await fetch(`/api${path}${query.size ? `?${query}` : ""}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
  const text = await response.text();
  let body: unknown = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      /* The API may return a plain text error. */
    }
  }
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "msg" in body &&
      typeof body.msg === "string"
        ? body.msg
        : typeof body === "string" &&
            body.trim() &&
            !body.trim().startsWith("<")
          ? body
          : "";
    throw new ApiError(
      message ||
        (response.status === 401
          ? "Your session has expired. Sign in again to continue."
          : response.status === 403
            ? "You do not have permission to perform this action."
            : response.status === 404
              ? "This record could not be found."
              : "The request failed. Please try again."),
      response.status,
    );
  }
  return (text ? body : undefined) as T;
}
