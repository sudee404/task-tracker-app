/**
 * Thin fetch wrapper around the Django API.
 *
 * Requests are same-origin (Vite proxies /api), so the session cookie is sent
 * automatically. Django requires an X-CSRFToken header on unsafe methods, which
 * we read back out of the csrftoken cookie.
 */

export class ApiError extends Error {
  readonly status: number;
  /** Field name -> messages, as returned by DRF serializers. */
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    fieldErrors: Record<string, string[]> = {},
    message = "Request failed",
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** The first message worth showing at the top of a form. */
  get detail(): string {
    const nonField = this.fieldErrors.detail ?? this.fieldErrors.non_field_errors;
    if (nonField?.length) return nonField[0];
    return this.message;
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};

  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (UNSAFE.has(method)) {
    const csrf = readCookie("csrftoken");
    if (csrf) headers["X-CSRFToken"] = csrf;
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "same-origin",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const fieldErrors: Record<string, string[]> = {};
    if (payload && typeof payload === "object") {
      for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
        fieldErrors[key] = Array.isArray(value) ? value.map(String) : [String(value)];
      }
    }
    throw new ApiError(response.status, fieldErrors, `Request failed (${response.status})`);
  }

  return payload as T;
}
