const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Reads the message from an `{ error: { code, message } }` API response. */
export async function readApiErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "error" in body) {
      const { error } = body;
      if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
        return error.message;
      }
    }
  } catch {
    // Non-JSON body: fall through to the generic message.
  }
  return FALLBACK_MESSAGE;
}
