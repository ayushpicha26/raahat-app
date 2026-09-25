const API_BASE = "/api";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  ok: boolean;
}

export function getToken(): string | null {
  return localStorage.getItem("raahat_auth_token");
}

export function setToken(token: string): void {
  localStorage.setItem("raahat_auth_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("raahat_auth_token");
  localStorage.removeItem("raahat_latest_assessment");
}

export function getUser(): any | null {
  const raw = localStorage.getItem("raahat_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user: any): void {
  localStorage.setItem("raahat_user", JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem("raahat_user");
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    
    if (response.status === 401) {
      removeToken();
      clearUser();
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register") && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
      return { ok: false, error: "Unauthorized access." };
    }

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || `Request failed with status ${response.status}` };
    }

    return { ok: true, data };
  } catch (err: any) {
    console.error("API error:", err);
    return { ok: false, error: err.message || "Network request failed. Check server connection." };
  }
}

export const api = {
  get: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: "GET" }),
  post: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: "DELETE" }),
};
