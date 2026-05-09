export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "fetch failed") {
      return "Could not reach the backend data API. Check that the backend server is running and that NEXT_PUBLIC_API_BASE_URL points to it.";
    }

    return error.message;
  }

  return "The backend data request failed.";
}
