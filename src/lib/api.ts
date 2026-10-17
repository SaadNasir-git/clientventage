import axios, { AxiosError } from "axios";

/**
 * Centralized axios instance for the frontend.
 * - Uses relative `/api` base URL so requests stay same-origin (Next.js gateway friendly).
 * - Sends credentials so better-auth session cookies flow through.
 * - Normalizes error shapes into a consistent `{ message, status }` form.
 */
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const axErr = err as AxiosError<{ message?: string; details?: unknown }>;
    return {
      message: axErr.response?.data?.message ?? axErr.message ?? "Request failed",
      status: axErr.response?.status ?? 0,
      details: axErr.response?.data?.details,
    };
  }
  if (err instanceof Error) {
    return { message: err.message, status: 0 };
  }
  return { message: "Unknown error", status: 0 };
}