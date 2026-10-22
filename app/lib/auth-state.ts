import type { User } from "@auth0/auth0-spa-js";
import { useSyncExternalStore } from "react";

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated"; message?: string };

const initialState: AuthState = { status: "loading" };
let state: AuthState = initialState;
const listeners = new Set<() => void>();

export function getAuthState(): AuthState {
  return state;
}

export function setAuthState(next: AuthState) {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAuthState() {
  return useSyncExternalStore(subscribe, getAuthState, () => initialState);
}

export class AuthenticationRequiredError extends Error {
  constructor(message = "You are not signed in.") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}
