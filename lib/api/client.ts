export type Audience = "customer" | "vendor" | "admin";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  /** For Zod validation failures the backend sends `details` as a field-name -> messages[] map. */
  describe(): string {
    if (this.details && typeof this.details === "object") {
      const fieldErrors = Object.entries(this.details as Record<string, unknown>)
        .map(([field, messages]) => (Array.isArray(messages) ? `${field}: ${messages.join(", ")}` : null))
        .filter((line): line is string => !!line);
      if (fieldErrors.length > 0) return fieldErrors.join(" · ");
    }
    return this.message;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
}

interface ApiErrorBody {
  success: false;
  message: string;
  details?: unknown;
}

/** In-memory access tokens, one per audience. Never persisted to storage — reacquired via the httpOnly refresh cookie on load. */
const tokens: Record<Audience, string | null> = {
  customer: null,
  vendor: null,
  admin: null,
};

export function getAccessToken(audience: Audience): string | null {
  return tokens[audience];
}

export function setAccessToken(audience: Audience, token: string | null) {
  tokens[audience] = token;
}

/** De-dupes concurrent refresh attempts for the same audience. */
const refreshInFlight: Partial<Record<Audience, Promise<string | null>>> = {};

async function refreshAccessToken(audience: Audience): Promise<string | null> {
  const existing = refreshInFlight[audience];
  if (existing) return existing;

  const attempt = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/${audience}/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setAccessToken(audience, null);
        return null;
      }
      const body = (await res.json()) as ApiSuccessBody<{ accessToken: string }>;
      setAccessToken(audience, body.data.accessToken);
      return body.data.accessToken;
    } catch {
      setAccessToken(audience, null);
      return null;
    } finally {
      delete refreshInFlight[audience];
    }
  })();

  refreshInFlight[audience] = attempt;
  return attempt;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Any plain object of primitive filters/pagination params; undefined/null/empty values are omitted. */
  query?: object;
  /** Attach the given audience's access token as a Bearer header, refreshing once on 401. */
  audience?: Audience;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function performFetch(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { audience } = options;
  let token = audience ? getAccessToken(audience) : null;

  let res = await performFetch(path, options, token);

  if (res.status === 401 && audience) {
    token = await refreshAccessToken(audience);
    if (token) {
      res = await performFetch(path, options, token);
    }
  }

  let body: ApiSuccessBody<T> | ApiErrorBody | null = null;
  try {
    body = await res.json();
  } catch {
    // no body (e.g. network failure before response)
  }

  if (!res.ok || !body || body.success === false) {
    const message = body && "message" in body ? body.message : `Request failed with status ${res.status}`;
    const details = body && "details" in body ? body.details : undefined;
    throw new ApiError(res.status, message, details);
  }

  return (body as ApiSuccessBody<T>).data;
}

/** Attempts a silent session restore for the given audience using the refresh cookie. Returns the new token, or null if there's no valid session. */
export async function restoreSession(audience: Audience): Promise<string | null> {
  return refreshAccessToken(audience);
}

async function performUpload(path: string, form: FormData, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  // No Content-Type header — the browser sets multipart/form-data with the correct boundary itself.
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: form,
  });
}

/** Like apiRequest, but for multipart file uploads (FormData bodies) with the same token-refresh behavior. */
export async function uploadRequest<T>(path: string, form: FormData, audience: Audience): Promise<T> {
  let token = getAccessToken(audience);
  let res = await performUpload(path, form, token);

  if (res.status === 401) {
    token = await refreshAccessToken(audience);
    if (token) res = await performUpload(path, form, token);
  }

  let body: ApiSuccessBody<T> | ApiErrorBody | null = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }

  if (!res.ok || !body || body.success === false) {
    const message = body && "message" in body ? body.message : `Request failed with status ${res.status}`;
    const details = body && "details" in body ? body.details : undefined;
    throw new ApiError(res.status, message, details);
  }

  return (body as ApiSuccessBody<T>).data;
}
