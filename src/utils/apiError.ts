import axios from 'axios';

type BackendErrorBody = {
  error?: unknown;
  message?: unknown;
};

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<BackendErrorBody>(error)) {
    if (error.response) {
      return nonEmptyString(error.response.data?.error)
        ?? nonEmptyString(error.response.data?.message)
        ?? fallback;
    }

    return nonEmptyString(error.message) ?? fallback;
  }

  if (error instanceof Error) {
    return nonEmptyString(error.message) ?? fallback;
  }

  return fallback;
}
