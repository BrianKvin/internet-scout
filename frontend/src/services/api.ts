const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const AUTH_TOKEN_KEY = "startscout_auth_token";
const REQUEST_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// ── Token helpers ────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// ── 401 event bus ────────────────────────────────────────────────────
// AuthProvider listens for this to trigger logout on expired tokens.

const UNAUTHORIZED_EVENT = "startscout:unauthorized";

export function onUnauthorized(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(UNAUTHORIZED_EVENT, callback);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, callback);
}

function _emitUnauthorized(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

// ── Request function ─────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  /** Set to false to skip auth header (e.g. sign-in/sign-up). */
  auth?: boolean;
  /** Override default timeout in milliseconds. */
  timeout?: number;
}

export async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type") && options?.body) {
    headers.set("Content-Type", "application/json");
  }

  const shouldAttachAuth = options?.auth !== false;
  if (shouldAttachAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Abort on timeout
  const controller = new AbortController();
  const timeoutMs = options?.timeout ?? REQUEST_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, `Request timed out after ${timeoutMs / 1000}s`);
    }
    throw new ApiError(0, "Network error — check your connection");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    // Intercept 401 — trigger global logout
    if (res.status === 401 && shouldAttachAuth) {
      _emitUnauthorized();
    }

    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
