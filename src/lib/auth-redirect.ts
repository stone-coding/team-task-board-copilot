const BASE_ORIGIN = "http://localhost";

/** Returns a same-site path to send the user to after login, or "/" for anything else. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/";
  }
  // Resolve like a browser does (it strips tabs and newlines and treats "\" as "/"), then require the same origin.
  const url = new URL(value, BASE_ORIGIN);
  return url.origin === BASE_ORIGIN ? `${url.pathname}${url.search}${url.hash}` : "/";
}
